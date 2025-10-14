// api/update-profile.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_utils/mongodb.js';
import { verifyToken } from './_utils/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const decodedToken = await verifyToken(req.headers.authorization);
        const userId = decodedToken.sub;
        const { username, bio } = req.body;

        // --- Validation ---
        if (!username || typeof username !== 'string' || !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
            return res.status(400).json({ message: 'Invalid username format.' });
        }
        if (typeof bio !== 'string' || bio.length > 150) {
            return res.status(400).json({ message: 'Invalid bio format.' });
        }

        const db = await getDb();
        const usersCollection = db.collection('users');

        const currentUser = await usersCollection.findOne({ _id: userId as any });
        if (!currentUser) {
            return res.status(404).send('User not found.');
        }

        // If username has changed, check for uniqueness
        if (currentUser.username !== username) {
            const existingUser = await usersCollection.findOne({ username: username });
            if (existingUser) {
                return res.status(409).json({ message: 'Username is already taken.' });
            }
        }
        
        // --- Update ---
        const updateData: { username: string, bio: string, lastModified: Date } = { 
            username, 
            bio,
            lastModified: new Date()
        };
        await usersCollection.updateOne({ _id: userId as any }, { $set: updateData });

        // If username changed, update public phrases as well for consistency
        if (currentUser.username !== username) {
            const publicPhrasesCollection = db.collection('public_phrases');
            await publicPhrasesCollection.updateMany(
                { userId: userId },
                { $set: { username: username } }
            );
        }

        return res.status(200).json({ success: true, message: 'Profile updated.' });

    } catch (error) {
        console.error('Update profile error:', error);
        if (error instanceof Error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ message: 'Internal Server Error', error: errorMessage });
    }
}