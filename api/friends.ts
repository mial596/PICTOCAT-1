// api/friends.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_utils/mongodb.js';
import { verifyToken } from './_utils/auth.js';
import { FriendData, Envelope, GameUpgrade, CatImage, EnvelopeTypeId, UpgradeId } from '../types.js';
import { ObjectId } from 'mongodb';
import { seedShopData } from './_shared/shop-data-seed.js';


async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const decodedToken = await verifyToken(req.headers.authorization);
        const userId = decodedToken.sub;
        const db = await getDb();
        const users = db.collection('users');

        const currentUser = await users.findOne({ _id: userId });
        if (!currentUser) {
            return res.status(404).json({ message: "Current user not found." });
        }

        switch (req.method) {
            case 'GET':
                 if (req.query.resource === 'shopData') {
                    return await handleGetShopData(res, db, currentUser);
                }
                return await handleGetFriends(res, users, currentUser);
            case 'POST':
                return await handlePost(req, res, db, currentUser);
            case 'PUT':
                return await handlePut(req, res, users, userId); // Accept/reject
            case 'DELETE':
                return await handleDelete(req, res, users, userId); // Remove friend
            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error('Friends API error:', error);
        if (error instanceof Error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ message: 'Internal Server Error', error: errorMessage });
    }
}

async function handleGetShopData(res: VercelResponse, db: any, currentUser: any) {
    await seedShopData(db); // Seed data if it doesn't exist
    
    const envelopesCollection = db.collection('envelopes');
    const upgradesCollection = db.collection('upgrades');

    const [envelopes, upgrades] = await Promise.all([
        envelopesCollection.find({}).toArray(),
        upgradesCollection.find({}).toArray(),
    ]);
    
    const playerLevel = currentUser.playerStats?.level || 1;

    const calculatedEnvelopes = envelopes.reduce((acc: any, envelope: any) => {
        acc[envelope._id] = {
            id: envelope._id,
            ...envelope,
            currentCost: envelope.baseCost + ((playerLevel - 1) * envelope.costIncreasePerLevel)
        };
        return acc;
    }, {});
    
    const indexedUpgrades = upgrades.reduce((acc: any, upgrade: any) => {
        acc[upgrade._id] = { id: upgrade._id, ...upgrade };
        return acc;
    }, {});

    return res.status(200).json({ envelopes: calculatedEnvelopes, upgrades: indexedUpgrades });
}


async function handleGetFriends(res: VercelResponse, users: any, currentUser: any) {
    const friendIds = currentUser.friends || [];
    const requestIds = currentUser.friendRequestsReceived || [];

    const friendsData = await users.find({ _id: { $in: friendIds } }).project({ username: 1, isVerified: 1, role: 1 }).toArray();
    const requestsData = await users.find({ _id: { $in: requestIds } }).project({ username: 1 }).toArray();

    const response: FriendData = {
        friends: friendsData.map((u: any) => ({ userId: u._id, username: u.username, isVerified: u.isVerified, role: u.role })),
        requests: requestsData.map((u: any) => ({ userId: u._id, username: u.username })),
    };
    return res.status(200).json(response);
}

async function handlePost(req: VercelRequest, res: VercelResponse, db: any, currentUser: any) {
    const { action } = req.body;
    
    switch(action) {
        case 'like':
             return handleLike(req, res, db, currentUser._id);
        case 'addFriend':
            return handleAddFriend(req, res, db, currentUser._id);
        case 'purchaseEnvelope':
            return handlePurchaseEnvelope(req, res, db, currentUser);
        case 'purchaseUpgrade':
            return handlePurchaseUpgrade(req, res, db, currentUser);
        default:
            return res.status(400).json({ message: "Invalid action." });
    }
}

async function handleLike(req: VercelRequest, res: VercelResponse, db: any, userId: string) {
    const { publicPhraseId } = req.body;
    if (!publicPhraseId) {
        return res.status(400).json({ message: "publicPhraseId is required for like action." });
    }
    const phrases = db.collection('public_phrases');
    const phrase = await phrases.findOne({ _id: new ObjectId(publicPhraseId) });

    if (!phrase) {
        return res.status(404).json({ message: "Phrase not found." });
    }
    
    const isLiked = phrase.likes?.includes(userId);
    
    const updateOperation = isLiked 
        ? { $pull: { likes: userId } }
        : { $addToSet: { likes: userId } };
    
    await phrases.updateOne({ _id: new ObjectId(publicPhraseId) }, updateOperation);
    return res.status(200).json({ success: true, liked: !isLiked });
}

async function handleAddFriend(req: VercelRequest, res: VercelResponse, db: any, userId: string) {
    const { targetUserId } = req.body;
    const users = db.collection('users');

    if (!targetUserId || userId === targetUserId) {
        return res.status(400).json({ message: "Invalid target user." });
    }

    const targetUser = await users.findOne({ _id: targetUserId });
    if (!targetUser) {
        return res.status(404).json({ message: "Target user not found." });
    }
    
    const isAlreadyFriends = targetUser.friends?.includes(userId);
    const hasSentRequest = targetUser.friendRequestsReceived?.includes(userId);
    if(isAlreadyFriends || hasSentRequest) {
        return res.status(409).json({message: "Already friends or request sent."});
    }
    
    const now = new Date();
    await users.updateOne({ _id: userId }, { $addToSet: { friendRequestsSent: targetUserId }, $set: { lastModified: now } });
    await users.updateOne({ _id: targetUserId }, { $addToSet: { friendRequestsReceived: userId }, $set: { lastModified: now } });

    return res.status(200).json({ success: true });
}

async function handlePurchaseEnvelope(req: VercelRequest, res: VercelResponse, db: any, currentUser: any) {
    const { envelopeId } = req.body as { envelopeId: EnvelopeTypeId };
    
    const envelopesCollection = db.collection('envelopes');
    const envelope: Envelope | null = await envelopesCollection.findOne({ _id: envelopeId });
    if (!envelope) return res.status(404).json({ message: 'Envelope not found.' });

    const cost = envelope.baseCost + ((currentUser.playerStats.level - 1) * envelope.costIncreasePerLevel);
    if (currentUser.coins < cost) return res.status(400).json({ message: 'Not enough coins.' });
    
    const catsCollection = db.collection('cats');
    const lockedCats = await catsCollection.find({ numeric_id: { $nin: currentUser.unlockedImageIds } }).toArray();
    
    const newImages: any[] = [];
    if (lockedCats.length > 0) {
        for (let i = 0; i < envelope.imageCount; i++) {
            if (lockedCats.length === 0) break;
            const randomIndex = Math.floor(Math.random() * lockedCats.length);
            newImages.push(lockedCats.splice(randomIndex, 1)[0]);
        }
    }
    
    const newImageIds = newImages.map(img => img.numeric_id);
    const updatedCoins = currentUser.coins - cost;

    await db.collection('users').updateOne(
        { _id: currentUser._id },
        { 
            $set: { 
                coins: updatedCoins,
                lastModified: new Date()
            },
            $addToSet: { unlockedImageIds: { $each: newImageIds } }
        }
    );

    const newImagesForClient: CatImage[] = newImages.map(img => ({
        id: img.numeric_id, url: img.url, theme: img.theme, rarity: img.rarity || 'common'
    }));

    return res.status(200).json({ updatedCoins, newImages: newImagesForClient });
}


async function handlePurchaseUpgrade(req: VercelRequest, res: VercelResponse, db: any, currentUser: any) {
    const { upgradeId } = req.body as { upgradeId: UpgradeId };
    
    const upgradesCollection = db.collection('upgrades');
    const upgrade: GameUpgrade | null = await upgradesCollection.findOne({ _id: upgradeId });
    if (!upgrade) return res.status(404).json({ message: 'Upgrade not found.' });

    if (currentUser.coins < upgrade.cost) return res.status(400).json({ message: 'Not enough coins!' });
    if (currentUser.playerStats.level < upgrade.levelRequired) return res.status(400).json({ message: `Requires level ${upgrade.levelRequired}!` });
    if (currentUser.purchasedUpgrades.includes(upgradeId)) return res.status(400).json({ message: 'Upgrade already purchased!' });

    const updatedCoins = currentUser.coins - upgrade.cost;
    
    await db.collection('users').updateOne(
        { _id: currentUser._id },
        {
            $set: { 
                coins: updatedCoins,
                lastModified: new Date()
            },
            $addToSet: { purchasedUpgrades: upgradeId }
        }
    );
    
    return res.status(200).json({ success: true, updatedCoins });
}


async function handlePut(req: VercelRequest, res: VercelResponse, users: any, userId: string) {
    const { targetUserId, action } = req.body;
    if (!targetUserId || !['accept', 'reject'].includes(action)) {
        return res.status(400).json({ message: "Invalid data." });
    }
    
    const now = new Date();
    const updateQuery = { $set: { lastModified: now } };

    await users.updateOne({ _id: userId }, { $pull: { friendRequestsReceived: targetUserId }, ...updateQuery });
    await users.updateOne({ _id: targetUserId }, { $pull: { friendRequestsSent: userId }, ...updateQuery });
    
    if (action === 'accept') {
        await users.updateOne({ _id: userId }, { $addToSet: { friends: targetUserId }, ...updateQuery });
        await users.updateOne({ _id: targetUserId }, { $addToSet: { friends: userId }, ...updateQuery });
    }

    return res.status(200).json({ success: true });
}

async function handleDelete(req: VercelRequest, res: VercelResponse, users: any, userId: string) {
    const { targetUserId } = req.body;
    if (!targetUserId) {
        return res.status(400).json({ message: "Invalid target user." });
    }

    const now = new Date();
    const updateQuery = { $set: { lastModified: now } };

    await users.updateOne({ _id: userId }, { $pull: { friends: targetUserId }, ...updateQuery });
    await users.updateOne({ _id: targetUserId }, { $pull: { friends: userId }, ...updateQuery });

    return res.status(200).json({ success: true });
}

export default handler;