// api/update-profile-picture.ts
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
        const { imageId } = req.body;

        if (typeof imageId !== 'number' && imageId !== null) {
            return res.status(400).json({ message: 'Invalid imageId format.' });
        }

        const db = await getDb();
        const usersCollection = db.collection('users');

        if (imageId !== null) {
            // Validate that the user owns the image
            const user = await usersCollection.findOne({ _id: userId as any });
            if (!user || !user.unlockedImageIds.includes(imageId)) {
                return res.status(403).json({ message: 'User does not own this image.' });
            }
        }
        
        await usersCollection.updateOne(
            { _id: userId as any },
            { $set: { 
                profilePictureId: imageId,
                lastModified: new Date()
            } }
        );

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('Update profile picture error:', error);
        if (error instanceof Error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ message: 'Internal Server Error', error: errorMessage });
    }
}