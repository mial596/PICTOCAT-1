// api/index.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_utils/mongodb.js';
import { verifyToken, DecodedToken } from './_utils/auth.js';
import { seedShopData } from './_shared/shop-data-seed.js';
import { getInitialUserData } from './_shared/data.js';
import { ALL_ACHIEVEMENTS } from './_shared/achievements.js';
import { checkAndUnlockAchievements } from './_utils/achievements.js';
import { UserProfile, FriendData, Envelope, GameUpgrade, CatImage, EnvelopeTypeId, UpgradeId, Rarity, PublicProfileData } from '../types.js';
import { ObjectId } from 'mongodb';
import { GoogleGenAI, Type } from '@google/genai';

// --- MAIN HANDLER ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const action = (req.query.action as string) || req.body.action;

        // Public actions that don't require authentication
        if (action === 'getCatalog') {
            return await getCatalog(req, res);
        }

        // All other actions require authentication
        const decodedToken = await verifyToken(req.headers.authorization);
        const db = await getDb();

        // Route to the correct handler based on the action
        switch (action) {
            // User Data
            case 'getUserData':
                return await getUserData(req, res, decodedToken, db);
            case 'saveUserData':
                return await saveUserData(req, res, decodedToken, db);
            case 'sync':
                return await syncUserData(req, res, decodedToken, db);
            
            // Profile
            case 'updateProfile':
                return await updateProfile(req, res, decodedToken, db);
            case 'updateProfilePicture':
                return await updateProfilePicture(req, res, decodedToken, db);
            
            // Community & Friends
            case 'searchUsers':
                return await searchUsers(req, res, db);
            case 'getPublicProfile':
                return await getPublicProfile(req, res, decodedToken, db);
            case 'getPublicFeed':
                return await getPublicFeed(req, res, decodedToken, db);
            case 'publishPhrase':
                return await publishPhrase(req, res, decodedToken, db);
            case 'likePhrase':
                return await likePhrase(req, res, decodedToken, db);
            case 'getFriendData':
                return await getFriendData(req, res, decodedToken, db);
            case 'addFriend':
                 return await addFriend(req, res, decodedToken, db);
            case 'respondToFriendRequest':
                return await respondToFriendRequest(req, res, decodedToken, db);
            case 'removeFriend':
                return await removeFriend(req, res, decodedToken, db);

            // Shop & Daily Pass
            case 'getShopData':
                return await getShopData(req, res, decodedToken, db);
            case 'purchaseEnvelope':
                return await purchaseEnvelope(req, res, decodedToken, db);
            case 'purchaseUpgrade':
                return await purchaseUpgrade(req, res, decodedToken, db);
            case 'getDailyPassStatus':
                return await getDailyPassStatus(req, res, decodedToken, db);
            case 'claimDailyPass':
                return await claimDailyPass(req, res, decodedToken, db);
            
            // Achievements
            case 'getAchievements':
                return res.status(200).json(ALL_ACHIEVEMENTS);

            // Gemini AI
            case 'generateSuggestions':
                return await generateSuggestions(req, res);

            // Admin
            case 'adminGetAllUsers':
            case 'adminGetPublicPhrases':
                 return await handleAdminGet(req, res, decodedToken, db);
            case 'adminSetVerifiedStatus':
            case 'adminCensorPhrase':
            case 'adminUpdateEnvelope':
                return await handleAdminPost(req, res, decodedToken, db);

            default:
                return res.status(400).json({ message: 'Acción no válida especificada.' });
        }

    } catch (error) {
        console.error('API Main Handler Error:', error);
        if (error instanceof Error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
            return res.status(401).json({ message: 'No autorizado' });
        }
        const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido';
        return res.status(500).json({ message: 'Error Interno del Servidor', error: errorMessage });
    }
}


// --- HANDLER IMPLEMENTATIONS ---

// --- User Data ---
const getRoleFromToken = (token: DecodedToken): 'admin' | 'mod' | 'user' => {
    const roles = token['https://pictocat.vercel.app/roles'];
    if (Array.isArray(roles)) {
        if (roles.includes('admin')) return 'admin';
        if (roles.includes('mod')) return 'mod';
    }
    const isAdminByEmail = process.env.ADMIN_EMAIL && token.email === process.env.ADMIN_EMAIL;
    return isAdminByEmail ? 'admin' : 'user';
};

async function getUserData(req: VercelRequest, res: VercelResponse, decodedToken: DecodedToken, db: any) {
    const userId = decodedToken.sub;
    const usersCollection = db.collection('users');
    let userFromDb = await usersCollection.findOne({ _id: userId });

    const userEmail = decodedToken.email;
    const userRole = getRoleFromToken(decodedToken);

    if (!userFromDb) {
        let baseUsername = userEmail ? userEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) : `user_${userId.split('|')[1].slice(-6)}`;
        let finalUsername = baseUsername;
        let usernameCheck = await usersCollection.findOne({ username: finalUsername });
        while (usernameCheck) {
            finalUsername = `${baseUsername.slice(0, 15)}_${Math.floor(1000 + Math.random() * 9000)}`;
            usernameCheck = await usersCollection.findOne({ username: finalUsername });
        }

        const newUserDoc = {
            _id: userId,
            username: finalUsername,
            email: userEmail || null,
            role: userRole,
            isVerified: false,
            lastModified: new Date(),
            ...getInitialUserData()
        };
        await usersCollection.insertOne(newUserDoc);
        userFromDb = newUserDoc;
    } else {
        const updates: { $set: { [key: string]: any } } = { $set: {} };
        if (userFromDb.role !== userRole) updates.$set.role = userRole;
        if (!userFromDb.email && userEmail) updates.$set.email = userEmail;
        if (Object.keys(updates.$set).length > 0) {
            updates.$set.lastModified = new Date();
            await usersCollection.updateOne({ _id: userId }, updates);
            Object.assign(userFromDb, updates.$set);
        }
    }
    
    const userProfile: UserProfile = {
      id: userFromDb._id.toString(),
      email: userFromDb.username,
      role: userFromDb.role || 'user',
      isVerified: userFromDb.isVerified || false,
      lastModified: (userFromDb.lastModified || new Date()).toISOString(),
      data: {
        coins: userFromDb.coins,
        phrases: userFromDb.phrases,
        unlockedImageIds: userFromDb.unlockedImageIds,
        playerStats: userFromDb.playerStats,
        purchasedUpgrades: userFromDb.purchasedUpgrades,
        bio: userFromDb.bio,
        profilePictureId: userFromDb.profilePictureId || null,
        friends: userFromDb.friends,
        friendRequestsSent: userFromDb.friendRequestsSent,
        friendRequestsReceived: userFromDb.friendRequestsReceived,
        unlockedAchievements: userFromDb.unlockedAchievements,
        stats: userFromDb.stats
      }
    };
    return res.status(200).json(userProfile);
}

async function saveUserData(req: VercelRequest, res: VercelResponse, decodedToken: DecodedToken, db: any) {
    const userId = decodedToken.sub;
    const data = req.body?.data;
    if (!data) return res.status(400).send('Se requieren datos de usuario.');

    const dataToSave: any = {};
    const allowedFields = ['coins', 'phrases', 'unlockedImageIds', 'playerStats', 'purchasedUpgrades', 'stats'];
    for (const field of allowedFields) {
        if (data[field] !== undefined) dataToSave[field] = data[field];
    }
    if (Object.keys(dataToSave).length === 0) return res.status(400).send('No se proporcionaron campos válidos.');
    
    const usersCollection = db.collection('users');
    let user = await usersCollection.findOne({ _id: userId });
    if (!user) return res.status(404).send('Usuario no encontrado.');
    
    const updatedUserData = { ...user, ...dataToSave };
    
    const achievementResults = await checkAndUnlockAchievements(updatedUserData, db);

    const updatePayload = {
      $set: {
        ...dataToSave,
        ...achievementResults.updatedFields,
        lastModified: new Date(),
      }
    };
    await usersCollection.updateOne({ _id: userId }, updatePayload);

    return res.status(200).json({ 
        success: true, 
        lastModified: updatePayload.$set.lastModified.toISOString(),
        newlyUnlockedAchievements: achievementResults.newlyUnlockedAchievements
    });
}

async function syncUserData(req: VercelRequest, res: VercelResponse, decodedToken: DecodedToken, db: any) {
    const userId = decodedToken.sub;
    const clientLastModified = req.query.since as string;
    if (!clientLastModified) return res.status(400).send('El parámetro "since" es requerido.');

    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ _id: userId });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
    
    if ((user.lastModified || new Date(0)).getTime() > new Date(clientLastModified).getTime() + 1000) {
        const userProfile: UserProfile = {
            id: user._id.toString(), email: user.username, role: user.role, isVerified: user.isVerified,
            lastModified: (user.lastModified || new Date()).toISOString(),
            data: {
                coins: user.coins, phrases: user.phrases, unlockedImageIds: user.unlockedImageIds,
                playerStats: user.playerStats, purchasedUpgrades: user.purchasedUpgrades, bio: user.bio,
                profilePictureId: user.profilePictureId, friends: user.friends,
                friendRequestsSent: user.friendRequestsSent, friendRequestsReceived: user.friendRequestsReceived,
                unlockedAchievements: user.unlockedAchievements, stats: user.stats
            }
        };
        return res.status(200).json(userProfile);
    } else {
        return res.status(304).end();
    }
}

// --- Profile ---
async function updateProfile(req: VercelRequest, res: VercelResponse, decodedToken: DecodedToken, db: any) {
    const userId = decodedToken.sub;
    const { username, bio } = req.body;
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return res.status(400).json({ message: 'Nombre de usuario no válido.' });
    if (bio.length > 150) return res.status(400).json({ message: 'Biografía no válida.' });

    const users = db.collection('users');
    const currentUser = await users.findOne({ _id: userId });
    if (!currentUser) return res.status(404).send('Usuario no encontrado.');

    if (currentUser.username !== username) {
        const existingUser = await users.findOne({ username });
        if (existingUser) return res.status(409).json({ message: 'El nombre de usuario ya está en uso.' });
    }
    
    await users.updateOne({ _id: userId }, { $set: { username, bio, lastModified: new Date() } });
    if (currentUser.username !== username) {
        await db.collection('public_phrases').updateMany({ userId }, { $set: { username } });
    }
    return res.status(200).json({ success: true });
}

async function updateProfilePicture(req: VercelRequest, res: VercelResponse, decodedToken: DecodedToken, db: any) {
    const userId = decodedToken.sub;
    const { imageId } = req.body;
    if (typeof imageId !== 'number' && imageId !== null) return res.status(400).json({ message: 'ID de imagen no válido.' });

    const users = db.collection('users');
    if (imageId !== null) {
        const user = await users.findOne({ _id: userId });
        if (!user || !user.unlockedImageIds.includes(imageId)) return res.status(403).json({ message: 'El usuario no posee esta imagen.' });
    }
    await users.updateOne({ _id: userId }, { $set: { profilePictureId: imageId, lastModified: new Date() } });
    return res.status(200).json({ success: true });
}

// --- Public / Community ---
async function getCatalog(req: VercelRequest, res: VercelResponse) {
    const db = await getDb();
    const cats = await db.collection('cats').find({}).sort({ numeric_id: 1 }).toArray();
    const catCatalog: CatImage[] = cats.map((cat: any) => ({
      id: cat.numeric_id, url: cat.url, theme: cat.theme, rarity: cat.rarity
    }));
    return res.status(200).json(catCatalog);
}

async function searchUsers(req: VercelRequest, res: VercelResponse, db: any) {
    const query = req.query.q as string;
    if (!query || query.length < 2) return res.status(200).json([]);
    const users = await db.collection('users').find(
        { username: { $regex: new RegExp(query, 'i') } },
        { projection: { username: 1, isVerified: 1 }, limit: 10 }
    ).toArray();
    return res.status(200).json(users.map((u: any) => ({ username: u.username, isVerified: u.isVerified })));
}

async function getPublicProfile(req: VercelRequest, res: VercelResponse, decodedToken: DecodedToken, db: any) {
    const requestingUserId = decodedToken.sub;
    const username = req.query.username as string;
    if (!username) return res.status(400).send('Nombre de usuario requerido');

    const [requestingUser, targetUser] = await Promise.all([
        db.collection('users').findOne({ _id: requestingUserId }),
        db.collection('users').findOne({ username })
    ]);
    if (!targetUser || !requestingUser) return res.status(404).send('Usuario no encontrado');

    let profilePictureUrl: string | null = null;
    if (targetUser.profilePictureId) {
        const pic = await db.collection('cats').findOne({ numeric_id: targetUser.profilePictureId });
        if (pic) profilePictureUrl = pic.url;
    }

    let friendshipStatus: PublicProfileData['friendshipStatus'] = 'none';
    if (requestingUserId === targetUser._id) friendshipStatus = 'self';
    else if (requestingUser.friends?.includes(targetUser._id)) friendshipStatus = 'friends';
    else if (requestingUser.friendRequestsSent?.includes(targetUser._id)) friendshipStatus = 'sent';
    else if (requestingUser.friendRequestsReceived?.includes(targetUser._id)) friendshipStatus = 'received';

    const phrasesFromDb = await db.collection('public_phrases').aggregate([
      { $match: { userId: targetUser._id, privacy: 'public' } },
      { $sort: { _id: -1 } },
      { $addFields: { likeCount: { $size: { $ifNull: ["$likes", []] } }, isLikedByMe: { $in: [requestingUserId, { $ifNull: ["$likes", []] }] } } },
      { $project: { likes: 0 } }
    ]).toArray();
    
    const profileData: PublicProfileData = {
        userId: targetUser._id.toString(), username, role: targetUser.role, isVerified: targetUser.isVerified,
        bio: targetUser.bio, phrases: phrasesFromDb.map((p: any) => ({ ...p, publicPhraseId: p._id.toHexString() })),
        profilePictureUrl, friendshipStatus
    };
    return res.status(200).json(profileData);
}

async function getPublicFeed(req: VercelRequest, res: VercelResponse, decodedToken: DecodedToken, db: any) {
    const userId = decodedToken.sub;
    const user = await db.collection('users').findOne({ _id: userId });
    const friendsList = user?.friends || [];
    
    const phrasesFromDb = await db.collection('public_phrases').aggregate([
        { $match: { $or: [{ privacy: 'public' }, { privacy: 'friends', userId: { $in: friendsList } }] } },
        { $sort: { _id: -1 } }, { $limit: 50 },
        { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $lookup: { from: 'cats', localField: 'user.profilePictureId', foreignField: 'numeric_id', as: 'userCatImage' } },
        { $addFields: {
            likeCount: { $size: { $ifNull: ["$likes", []] } },
            isLikedByMe: { $in: [userId, { $ifNull: ["$likes", []] }] }
        } },
        { $project: {
            _id: 1, text: 1, imageUrl: 1, imageTheme: 1, likeCount: 1, isLikedByMe: 1,
            username: '$user.username', isUserVerified: '$user.isVerified',
            profilePictureUrl: { $ifNull: [ { $arrayElemAt: ['$userCatImage.url', 0] }, null ] }
        } }
    ]).toArray();

    return res.status(200).json(phrasesFromDb.map((p: any) => ({ ...p, publicPhraseId: p._id.toHexString() })));
}

async function publishPhrase(req: VercelRequest, res: VercelResponse, decodedToken: DecodedToken, db: any) {
    const userId = decodedToken.sub;
    const { phrase, image, privacy } = req.body;
    if (!phrase?.id || !image?.url || !['private', 'friends', 'public'].includes(privacy)) {
        return res.status(400).send('Datos de frase no válidos.');
    }
    
    const users = db.collection('users');
    const publicPhrases = db.collection('public_phrases');
    const user = await users.findOne({ _id: userId });
    if (!user) return res.status(404).send('Usuario no encontrado.');

    if (privacy === 'public' || privacy === 'friends') {
        await publicPhrases.updateOne(
            { userId, phraseId: phrase.id },
            { $set: { userId, phraseId: phrase.id, username: user.username, text: phrase.text, imageUrl: image.url, imageTheme: image.theme, privacy },
              $setOnInsert: { likes: [] } },
            { upsert: true }
        );
    } else {
        await publicPhrases.deleteOne({ userId, phraseId: phrase.id });
    }

    const updatedUserData = { ...user };
    const phraseIndex = updatedUserData.phrases.findIndex((p: any) => p.id === phrase.id);
    if(phraseIndex !== -1) {
        updatedUserData.phrases[phraseIndex].privacy = privacy;
    }
    const achievementResults = await checkAndUnlockAchievements(updatedUserData, db);

    await users.updateOne(
        { _id: userId, 'phrases.id': phrase.id },
        { $set: { 'phrases.$.privacy': privacy, lastModified: new Date(), ...achievementResults.updatedFields } }
    );

    return res.status(200).json({ 
        success: true, 
        lastModified: new Date().toISOString(),
        newlyUnlockedAchievements: achievementResults.newlyUnlockedAchievements
    });
}

async function likePhrase(req: VercelRequest, res: VercelResponse, decodedToken: DecodedToken, db: any) {
    const userId = decodedToken.sub;
    const { publicPhraseId } = req.body;
    if (!publicPhraseId) return res.status(400).json({ message: 'publicPhraseId es requerido.' });
    
    const phrases = db.collection('public_phrases');
    const phrase = await phrases.findOne({ _id: new ObjectId(publicPhraseId) });
    if (!phrase) return res.status(404).json({ message: 'Frase no encontrada.' });
    
    const update = phrase.likes?.includes(userId) ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } };
    await phrases.updateOne({ _id: new ObjectId(publicPhraseId) }, update);
    return res.status(200).json({ success: true });
}

// --- Friends ---
async function getFriendData(req: VercelRequest, res: VercelResponse, decodedToken: DecodedToken, db: any) {
    const user = await db.collection('users').findOne({ _id: decodedToken.sub });
    if (!user) return res.status(404).json({ message: 'Usuario actual no encontrado.' });
    
    const [friendsData, requestsData] = await Promise.all([
        db.collection('users').find({ _id: { $in: user.friends || [] } }).project({ username: 1, isVerified: 1, role: 1 }).toArray(),
        db.collection('users').find({ _id: { $in: user.friendRequestsReceived || [] } }).project({ username: 1 }).toArray()
    ]);

    const response: FriendData = {
        friends: friendsData.map((u: any) => ({ userId: u._id, username: u.username, isVerified: u.isVerified, role: u.role })),
        requests: requestsData.map((u: any) => ({ userId: u._id, username: u.username })),
    };
    return res.status(200).json(response);
}

async function addFriend(req: VercelRequest, res: VercelResponse, decodedToken: DecodedToken, db: any) {
    const userId = decodedToken.sub;
    const { targetUserId } = req.body;
    if (!targetUserId || userId === targetUserId) return res.status(400).json({ message: "Usuario objetivo no válido." });

    const users = db.collection('users');
    const targetUser = await users.findOne({ _id: targetUserId });
    if (!targetUser) return res.status(404).json({ message: "Usuario objetivo no encontrado." });
    
    if (targetUser.friends?.includes(userId) || targetUser.friendRequestsReceived?.includes(userId)) {
        return res.status(409).json({ message: "Ya son amigos o la solicitud fue enviada." });
    }
    
    const now = new Date();
    await users.updateOne({ _id: userId }, { $addToSet: { friendRequestsSent: targetUserId }, $set: { lastModified: now } });
    await users.updateOne({ _id: targetUserId }, { $addToSet: { friendRequestsReceived: userId }, $set: { lastModified: now } });

    return res.status(200).json({ success: true });
}

async function respondToFriendRequest(req: VercelRequest, res: VercelResponse, decodedToken: DecodedToken, db: any) {
    const userId = decodedToken.sub;
    const { targetUserId, responseAction } = req.body;
    if (!targetUserId || !['accept', 'reject'].includes(responseAction)) return res.status(400).json({ message: "Datos no válidos." });
    
    const users = db.collection('users');
    const now = new Date();
    await users.updateOne({ _id: userId }, { $pull: { friendRequestsReceived: targetUserId }, $set: { lastModified: now } });
    await users.updateOne({ _id: targetUserId }, { $pull: { friendRequestsSent: userId }, $set: { lastModified: now } });
    
    if (responseAction === 'accept') {
        await users.updateOne({ _id: userId }, { $addToSet: { friends: targetUserId }, $set: { lastModified: now } });
        await users.updateOne({ _id: targetUserId }, { $addToSet: { friends: userId }, $set: { lastModified: now } });
    }

    const currentUser = await users.findOne({ _id: userId });
    const achievementResults = await checkAndUnlockAchievements(currentUser, db);

    if (Object.keys(achievementResults.updatedFields).length > 0) {
        await users.updateOne({ _id: userId }, { $set: { ...achievementResults.updatedFields, lastModified: new Date() } });
    }

    return res.status(200).json({ success: true, newlyUnlockedAchievements: achievementResults.newlyUnlockedAchievements });
}

async function removeFriend(req: VercelRequest, res: VercelResponse, decodedToken: DecodedToken, db: any) {
    const userId = decodedToken.sub;
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ message: "Usuario objetivo no válido." });
    
    const users = db.collection('users');
    const now = new Date();
    await users.updateOne({ _id: userId }, { $pull: { friends: targetUserId }, $set: { lastModified: now } });
    await users.updateOne({ _id: targetUserId }, { $pull: { friends: userId }, $set: { lastModified: now } });

    return res.status(200).json({ success: true });
}

// --- Shop & Daily Pass ---
async function getShopData(req: VercelRequest, res: VercelResponse, decodedToken: DecodedToken, db: any) {
    await seedShopData(db);
    const user = await db.collection('users').findOne({ _id: decodedToken.sub });
    if (!user) return res.status(404).json({ message: "Usuario no encontrado." });

    const [envelopes, upgrades] = await Promise.all([
        db.collection('envelopes').find({}).toArray(),
        db.collection('upgrades').find({}).toArray(),
    ]);
    
    const playerLevel = user.playerStats?.level || 1;

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


function selectRarity(probabilities: { common: number; rare: number; epic: number }): Rarity {
    const rand = Math.random() * 100;
    let cumulative = 0;
    if (rand < (cumulative += probabilities.common)) return 'common';
    if (rand < (cumulative += probabilities.rare)) return 'rare';
    return 'epic';
}

async function findACat(unlockedIds: number[], rarity: Rarity, catsCollection: any): Promise<any> {
    const searchOrder: Rarity[] = [];
    if (rarity === 'epic') searchOrder.push('epic', 'rare', 'common');
    else if (rarity === 'rare') searchOrder.push('rare', 'common', 'epic');
    else searchOrder.push('common', 'rare', 'epic');

    for (const r of searchOrder) {
        const potentialCats = await catsCollection.find({
            rarity: r,
            numeric_id: { $nin: unlockedIds }
        }).toArray();

        if (potentialCats.length > 0) {
            return potentialCats[Math.floor(Math.random() * potentialCats.length)];
        }
    }
    return null; // No cat found
}

async function purchaseEnvelope(req: VercelRequest, res: VercelResponse, decodedToken: DecodedToken, db: any) {
    const userId = decodedToken.sub;
    const { envelopeId } = req.body as { envelopeId: EnvelopeTypeId };
    const users = db.collection('users');

    const currentUser = await users.findOne({ _id: userId });
    if (!currentUser) return res.status(404).json({ message: "Usuario no encontrado." });
    
    const envelope: Envelope | null = await db.collection('envelopes').findOne({ _id: envelopeId });
    if (!envelope) return res.status(404).json({ message: 'Sobre no encontrado.' });

    const cost = envelope.baseCost + ((currentUser.playerStats.level - 1) * envelope.costIncreasePerLevel);
    if (currentUser.coins < cost) return res.status(400).json({ message: 'No tienes suficientes monedas.' });
    
    const catsCollection = db.collection('cats');
    const newImages: any[] = [];
    const mutableUnlockedIds = [...currentUser.unlockedImageIds];

    for (let i = 0; i < envelope.imageCount; i++) {
        const selectedRarity = selectRarity(envelope.rarityProbabilities);
        const foundCat = await findACat(mutableUnlockedIds, selectedRarity, catsCollection);
        if (foundCat) {
            newImages.push(foundCat);
            mutableUnlockedIds.push(foundCat.numeric_id);
        }
    }
    
    const allCatsCount = await catsCollection.countDocuments();
    if (currentUser.unlockedImageIds.length >= allCatsCount && newImages.length === 0) {
         return res.status(400).json({ message: '¡Ya tienes todos los gatos!' });
    }
    
    const newImageIds = newImages.map(img => img.numeric_id);
    const updatedCoins = currentUser.coins - cost;
    const updatedUserData = { ...currentUser, coins: updatedCoins, unlockedImageIds: mutableUnlockedIds };
    updatedUserData.stats.envelopesOpened = (updatedUserData.stats.envelopesOpened || 0) + 1;

    const achievementResults = await checkAndUnlockAchievements(updatedUserData, db);

    await users.updateOne(
        { _id: userId },
        { 
            $set: { 
                coins: updatedCoins,
                'stats.envelopesOpened': updatedUserData.stats.envelopesOpened,
                lastModified: new Date(),
                ...achievementResults.updatedFields
            },
            $addToSet: { unlockedImageIds: { $each: newImageIds } }
        }
    );

    const newImagesForClient: CatImage[] = newImages.map(img => ({
        id: img.numeric_id, url: img.url, theme: img.theme, rarity: img.rarity || 'common'
    }));

    return res.status(200).json({ 
        updatedCoins, 
        newImages: newImagesForClient, 
        lastModified: new Date().toISOString(),
        newlyUnlockedAchievements: achievementResults.newlyUnlockedAchievements
    });
}


async function purchaseUpgrade(req: VercelRequest, res: VercelResponse, decodedToken: DecodedToken, db: any) {
    const userId = decodedToken.sub;
    const { upgradeId } = req.body as { upgradeId: UpgradeId };
    
    const users = db.collection('users');
    const currentUser = await users.findOne({ _id: userId });
    if (!currentUser) return res.status(404).json({ message: 'Usuario no encontrado.' });

    const upgrade: GameUpgrade | null = await db.collection('upgrades').findOne({ _id: upgradeId });
    if (!upgrade) return res.status(404).json({ message: 'Mejora no encontrada.' });

    if (currentUser.coins < upgrade.cost) return res.status(400).json({ message: '¡No tienes suficientes monedas!' });
    if (currentUser.playerStats.level < upgrade.levelRequired) return res.status(400).json({ message: `¡Requiere nivel ${upgrade.levelRequired}!` });
    if (currentUser.purchasedUpgrades.includes(upgradeId)) return res.status(400).json({ message: '¡Mejora ya comprada!' });

    const updatedCoins = currentUser.coins - upgrade.cost;
    
    await users.updateOne(
        { _id: userId },
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

async function getDailyPassStatus(req: VercelRequest, res: VercelResponse, decodedToken: DecodedToken, db: any) {
    // This logic is complex and seems correct, no changes needed for now.
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    const REWARD_IMAGE_COUNT = 2;
    const COIN_REWARD_IF_ALL_UNLOCKED = 100;
    
    const userId = decodedToken.sub;
    const users = db.collection('users');
    const cats = db.collection('cats');
    
    const user = await users.findOne({ _id: userId });
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const now = Date.now();
    let dailyPass = user.dailyPass || {};

    const needsNewRewards = !dailyPass.lastGeneratedTimestamp || (now - dailyPass.lastGeneratedTimestamp > TWENTY_FOUR_HOURS_MS);

    if (needsNewRewards) {
        let rewardImageIds: number[] = [];
        let coinReward = 0;

        const lockedCats = await cats.find({ numeric_id: { $nin: user.unlockedImageIds || [] } }).toArray();
        
        if (lockedCats.length > 0) {
            const rewardImages: any[] = [];
            for (let i = 0; i < REWARD_IMAGE_COUNT && lockedCats.length > 0; i++) {
                const randomIndex = Math.floor(Math.random() * lockedCats.length);
                rewardImages.push(lockedCats.splice(randomIndex, 1)[0]);
            }
            rewardImageIds = rewardImages.map(img => img.numeric_id);
        } else {
            coinReward = COIN_REWARD_IF_ALL_UNLOCKED;
        }
        
        const allUpgrades = await db.collection('upgrades').find({}).toArray();
        const randomUpgrade = allUpgrades[Math.floor(Math.random() * allUpgrades.length)];

        const newRewards = { imageIds: rewardImageIds, upgradeId: randomUpgrade._id, coinReward };
        dailyPass = { ...dailyPass, lastGeneratedTimestamp: now, rewards: newRewards };
        await users.updateOne({ _id: userId }, { $set: { 'dailyPass.lastGeneratedTimestamp': now, 'dailyPass.rewards': newRewards, 'lastModified': new Date() } });
    }

    const isClaimable = !dailyPass.lastClaimedTimestamp || (now - dailyPass.lastClaimedTimestamp > TWENTY_FOUR_HOURS_MS);
    if (!dailyPass.rewards) return res.status(200).json({ isClaimable: false, nextPassTimestamp: now + TWENTY_FOUR_HOURS_MS, rewards: null });

    // FIX: Rename variable to avoid confusing the compiler and fix the error.
    const nextClaimTimestamp = (dailyPass.lastClaimedTimestamp || (now - TWENTY_FOUR_HOURS_MS)) + TWENTY_FOUR_HOURS_MS;
    const [rewardImagesData, rewardUpgradeData] = await Promise.all([
        cats.find({ numeric_id: { $in: dailyPass.rewards.imageIds || [] } }).toArray(),
        db.collection('upgrades').findOne({ _id: dailyPass.rewards.upgradeId })
    ]);
    
    return res.status(200).json({
        isClaimable,
        nextPassTimestamp: nextClaimTimestamp,
        rewards: {
            images: rewardImagesData.map((c: any) => ({ id: c.numeric_id, url: c.url, theme: c.theme, rarity: c.rarity })),
            upgrade: rewardUpgradeData ? { ...rewardUpgradeData, id: rewardUpgradeData._id } : null,
            coinReward: dailyPass.rewards.coinReward || 0
        }
    });
}

async function claimDailyPass(req: VercelRequest, res: VercelResponse, decodedToken: DecodedToken, db: any) {
     const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
     const userId = decodedToken.sub;
     const users = db.collection('users');
     const user = await users.findOne({ _id: userId });
     if (!user || !user.dailyPass || !user.dailyPass.rewards) return res.status(404).json({ message: "Datos del pase diario no encontrados." });

     const now = Date.now();
     const isClaimable = !user.dailyPass.lastClaimedTimestamp || (now - user.dailyPass.lastClaimedTimestamp > TWENTY_FOUR_HOURS_MS);
     if (!isClaimable) return res.status(403).json({ message: "Pase diario ya reclamado." });

     const { imageIds, coinReward } = user.dailyPass.rewards;
     const finalCoins = (user.coins || 0) + (coinReward || 0);

     await users.updateOne(
         { _id: userId },
         { 
             $set: { 'dailyPass.lastClaimedTimestamp': now, coins: finalCoins, lastModified: new Date() },
             $addToSet: { unlockedImageIds: { $each: imageIds || [] } }
         }
     );
     
     const unlockedImagesData = await db.collection('cats').find({ numeric_id: { $in: imageIds || [] } }).toArray();
     return res.status(200).json({ 
         success: true, 
         unlockedImages: unlockedImagesData.map((c: any) => ({ id: c.numeric_id, url: c.url, theme: c.theme, rarity: c.rarity })), 
         updatedCoins: finalCoins 
     });
}

// --- Gemini ---
async function generateSuggestions(req: VercelRequest, res: VercelResponse) {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ message: 'Se requiere un tema.' });
    
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ message: 'La clave API de IA no está configurada en el servidor.' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Genera 5 frases cortas, divertidas y creativas en español sobre el tema: "${topic}".`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestions: {
                            type: Type.ARRAY,
                            description: "Una lista de 5 frases sugeridas.",
                            items: { type: Type.STRING }
                        }
                    },
                    required: ['suggestions']
                }
            }
        });

        const jsonText = response.text.trim();
        const suggestionsData = JSON.parse(jsonText);
        
        if (suggestionsData && Array.isArray(suggestionsData.suggestions)) {
             return res.status(200).json({ suggestions: suggestionsData.suggestions });
        } else {
             throw new Error("Respuesta de IA con formato inesperado.");
        }

    } catch (error) {
        console.error("Error de la API de Gemini:", error);
        return res.status(500).json({ message: 'No se pudieron generar sugerencias.' });
    }
}

// --- Admin ---
async function handleAdminGet(req: VercelRequest, res: VercelResponse, decodedToken: DecodedToken, db: any) {
    const requestingUser = await db.collection('users').findOne({ _id: decodedToken.sub });
    if (!requestingUser || requestingUser.role !== 'admin') return res.status(403).send('Prohibido: Solo administradores.');
    
    const action = req.query.action as string;
    if (action === 'adminGetAllUsers') {
        const users = await db.collection('users').find({}, { projection: { _id: 1, username: 1, role: 1, isVerified: 1 } }).sort({ username: 1 }).toArray();
        return res.status(200).json(users.map((u: any) => ({ id: u._id, email: u.username, role: u.role, isVerified: u.isVerified })));
    }
    if (action === 'adminGetPublicPhrases') {
        const phrases = await db.collection('public_phrases').find({}).sort({ _id: -1 }).toArray();
        return res.status(200).json(phrases.map((p: any) => ({ ...p, publicPhraseId: p._id.toHexString() })));
    }
    return res.status(400).send('Recurso de administrador no válido.');
}

async function handleAdminPost(req: VercelRequest, res: VercelResponse, decodedToken: DecodedToken, db: any) {
    const requestingUser = await db.collection('users').findOne({ _id: decodedToken.sub });
    if (!requestingUser || requestingUser.role !== 'admin') return res.status(403).send('Prohibido: Solo administradores.');

    const { action } = req.body;
    if (action === 'adminSetVerifiedStatus') {
        const { userId, isVerified } = req.body;
        await db.collection('users').updateOne({ _id: userId }, { $set: { isVerified } });
        return res.status(200).json({ success: true });
    }
    if (action === 'adminCensorPhrase') {
        const { publicPhraseId } = req.body;
        const phrase = await db.collection('public_phrases').findOneAndDelete({ _id: new ObjectId(publicPhraseId) });
        if (phrase) {
            await db.collection('users').updateOne({ _id: phrase.userId, 'phrases.id': phrase.phraseId }, { $set: { 'phrases.$.privacy': 'private' } });
        }
        return res.status(200).json({ success: true });
    }
    if (action === 'adminUpdateEnvelope') {
        const { envelopeId, updates } = req.body;
        const sanitizedUpdates: any = {};
        if (typeof updates.baseCost === 'number') sanitizedUpdates.baseCost = updates.baseCost;
        if (updates.rarityProbabilities) {
            const { common, rare, epic } = updates.rarityProbabilities;
            if (typeof common === 'number' && typeof rare === 'number' && typeof epic === 'number' && (common + rare + epic) === 100) {
                sanitizedUpdates.rarityProbabilities = { common, rare, epic };
            } else {
                return res.status(400).send('Las probabilidades de rareza deben sumar 100.');
            }
        }
        if (Object.keys(sanitizedUpdates).length === 0) return res.status(400).send('No hay campos válidos para actualizar.');
        await db.collection('envelopes').updateOne({ _id: envelopeId }, { $set: sanitizedUpdates });
        return res.status(200).json({ success: true });
    }
    return res.status(400).send('Acción de administrador no válida.');
}
