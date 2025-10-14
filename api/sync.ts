// api/sync.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_utils/mongodb.js';
import { verifyToken } from './_utils/auth.js';
import { UserProfile } from '../types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const decodedToken = await verifyToken(req.headers.authorization);
        const userId = decodedToken.sub;
        const clientLastModified = req.query.since as string;

        if (!clientLastModified) {
            return res.status(400).send('"since" query parameter is required.');
        }

        const db = await getDb();
        const usersCollection = db.collection('users');
        const user = await usersCollection.findOne({ _id: userId as any });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const serverLastModified = user.lastModified || new Date(0);
        const clientDate = new Date(clientLastModified);

        // Add a small buffer (e.g., 1 second) to account for clock skew / precision issues
        if (serverLastModified.getTime() > clientDate.getTime() + 1000) {
            // Data has changed, send the full profile back
            const userProfile: UserProfile = {
                id: user._id.toString(),
                email: user.username,
                role: user.role || 'user',
                isVerified: user.isVerified || false,
                lastModified: (user.lastModified || new Date()).toISOString(),
                data: {
                    coins: user.coins,
                    phrases: user.phrases,
                    unlockedImageIds: user.unlockedImageIds,
                    playerStats: user.playerStats,
                    purchasedUpgrades: user.purchasedUpgrades,
                    bio: user.bio,
                    profilePictureId: user.profilePictureId || null,
                    friends: user.friends,
                    friendRequestsSent: user.friendRequestsSent,
                    friendRequestsReceived: user.friendRequestsReceived,
                    // FIX: Add missing properties with fallbacks
                    unlockedAchievements: user.unlockedAchievements || {},
                    stats: user.stats || { gamesPlayed: 0, envelopesOpened: 0, publicPhrases: 0 },
                }
            };
            return res.status(200).json(userProfile);
        } else {
            // No changes, send 304 Not Modified
            return res.status(304).end();
        }
    } catch (error) {
        console.error('Sync error:', error);
        if (error instanceof Error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ message: 'Internal Server Error', error: errorMessage });
    }
}