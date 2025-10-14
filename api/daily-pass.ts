// api/daily-pass.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_utils/mongodb.js';
import { verifyToken } from './_utils/auth.js';
import { UPGRADES } from './_shared/shop-data-seed.js';
import { CatImage, GameUpgrade, UpgradeId } from '../types.js';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const REWARD_IMAGE_COUNT = 2;
const COIN_REWARD_IF_ALL_UNLOCKED = 100;

async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const decodedToken = await verifyToken(req.headers.authorization);
        const userId = decodedToken.sub;

        if (req.method === 'GET') {
            return await handleGet(res, userId);
        }
        if (req.method === 'POST') {
            return await handlePost(res, userId);
        }

        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    } catch (error) {
        console.error('Daily Pass API error:', error);
        if (error instanceof Error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ message: 'Internal Server Error', error: errorMessage });
    }
}

async function handleGet(res: VercelResponse, userId: string) {
    const db = await getDb();
    const users = db.collection('users');
    const cats = db.collection('cats');
    
    const user = await users.findOne({ _id: userId as any });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    const now = Date.now();
    let dailyPass = user.dailyPass || {};

    const needsNewRewards = !dailyPass.lastGeneratedTimestamp || (now - dailyPass.lastGeneratedTimestamp > TWENTY_FOUR_HOURS_MS);

    if (needsNewRewards) {
        let rewardImageIds: number[] = [];
        let coinReward = 0;

        const lockedCatsCursor = cats.find({ numeric_id: { $nin: user.unlockedImageIds || [] } });
        const lockedCats = await lockedCatsCursor.toArray();
        
        if (lockedCats.length > 0) {
            const rewardImages: any[] = [];
            for (let i = 0; i < REWARD_IMAGE_COUNT && lockedCats.length > 0; i++) {
                const randomIndex = Math.floor(Math.random() * lockedCats.length);
                rewardImages.push(lockedCats.splice(randomIndex, 1)[0]);
            }
            rewardImageIds = rewardImages.map(img => img.numeric_id);
        } else {
            // User has all cats, give coins instead
            coinReward = COIN_REWARD_IF_ALL_UNLOCKED;
        }
        
        const upgradeIds = Object.keys(UPGRADES) as UpgradeId[];
        const randomUpgradeId = upgradeIds[Math.floor(Math.random() * upgradeIds.length)];

        const newRewards = {
            imageIds: rewardImageIds,
            upgradeId: randomUpgradeId,
            coinReward: coinReward
        };

        dailyPass = { ...dailyPass, lastGeneratedTimestamp: now, rewards: newRewards };
        await users.updateOne({ _id: userId as any }, { $set: { 
            'dailyPass.lastGeneratedTimestamp': now, 
            'dailyPass.rewards': newRewards,
            'lastModified': new Date()
        } });
    }

    const isClaimable = !dailyPass.lastClaimedTimestamp || (now - dailyPass.lastClaimedTimestamp > TWENTY_FOUR_HOURS_MS);
    
    if (!dailyPass.rewards) {
         return res.status(200).json({ isClaimable: false, nextPassTimestamp: now + TWENTY_FOUR_HOURS_MS, rewards: { images: [], upgrade: null, coinReward: 0 } });
    }

    const nextTimestamp = (dailyPass.lastClaimedTimestamp || (now - TWENTY_FOUR_HOURS_MS)) + TWENTY_FOUR_HOURS_MS;

    const [rewardImagesData, rewardUpgradeData] = await Promise.all([
        cats.find({ numeric_id: { $in: dailyPass.rewards.imageIds || [] } }).toArray(),
        Promise.resolve(UPGRADES[dailyPass.rewards.upgradeId] || null)
    ]);
    
    const finalImages: CatImage[] = rewardImagesData.map(c => ({ id: c.numeric_id, url: c.url, theme: c.theme, rarity: c.rarity || 'common' }));
    
    return res.status(200).json({
        isClaimable,
        nextPassTimestamp: nextTimestamp,
        rewards: {
            images: finalImages,
            upgrade: rewardUpgradeData,
            coinReward: dailyPass.rewards.coinReward || 0
        }
    });
}


async function handlePost(res: VercelResponse, userId: string) {
    const db = await getDb();
    const users = db.collection('users');
    const cats = db.collection('cats');
    
    const user = await users.findOne({ _id: userId as any });
    if (!user || !user.dailyPass || !user.dailyPass.rewards) {
        return res.status(404).json({ message: "User or daily pass data not found." });
    }

    const now = Date.now();
    const { lastClaimedTimestamp, rewards } = user.dailyPass;
    
    const isClaimable = !lastClaimedTimestamp || (now - lastClaimedTimestamp > TWENTY_FOUR_HOURS_MS);
    if (!isClaimable) {
        return res.status(403).json({ message: "Daily pass already claimed." });
    }

    const newImageIds = rewards.imageIds || [];
    const coinReward = rewards.coinReward || 0;
    const finalCoins = (user.coins || 0) + coinReward;
    
    await users.updateOne(
        { _id: userId as any },
        { 
            $set: { 
                'dailyPass.lastClaimedTimestamp': now,
                coins: finalCoins,
                lastModified: new Date()
            },
            $addToSet: { unlockedImageIds: { $each: newImageIds } }
        }
    );

    const unlockedImagesData = await cats.find({ numeric_id: { $in: newImageIds } }).toArray();
    const unlockedImages: CatImage[] = unlockedImagesData.map(c => ({ id: c.numeric_id, url: c.url, theme: c.theme, rarity: c.rarity || 'common' }));

    return res.status(200).json({ success: true, unlockedImages, updatedCoins: finalCoins, coinReward });
}

export default handler;