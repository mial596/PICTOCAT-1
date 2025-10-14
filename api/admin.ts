// api/admin.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_utils/mongodb.js';
import { verifyToken } from './_utils/auth.js';
import { ObjectId } from 'mongodb';

async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const decodedToken = await verifyToken(req.headers.authorization);
        const db = await getDb();
        const usersCollection = db.collection('users');

        const requestingUser = await usersCollection.findOne({ _id: decodedToken.sub as any });
        if (!requestingUser || requestingUser.role !== 'admin') {
            return res.status(403).send('Forbidden: Admins only.');
        }

        if (req.method === 'GET') {
            return await handleGet(req, res, db);
        }

        if (req.method === 'POST') {
            return await handlePost(req, res, db);
        }

        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);

    } catch (error) {
        console.error('Admin API error:', error);
        if (error instanceof Error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ message: 'Internal Server Error', error: errorMessage });
    }
}

async function handleGet(req: VercelRequest, res: VercelResponse, db: any) {
    const { resource } = req.query;

    if (resource === 'users') {
        const usersCursor = db.collection('users').find({}, {
            projection: { _id: 1, username: 1, role: 1, isVerified: 1 },
            sort: { username: 1 }
        });
        const users = await usersCursor.toArray();
        const result = users.map((u: any) => ({
            id: u._id,
            email: u.username,
            role: u.role,
            isVerified: u.isVerified
        }));
        return res.status(200).json(result);
    }

    if (resource === 'phrases') {
        const phrasesCursor = db.collection('public_phrases').find({}).sort({ _id: -1 });
        const phrases = await phrasesCursor.toArray();
        const result = phrases.map((p: any) => ({
            publicPhraseId: p._id.toHexString(),
            userId: p.userId,
            email: p.username,
            text: p.text,
            imageUrl: p.imageUrl,
            imageTheme: p.imageTheme,
        }));
        return res.status(200).json(result);
    }

    return res.status(400).send('Invalid resource requested.');
}

async function handlePost(req: VercelRequest, res: VercelResponse, db: any) {
    const { action } = req.body;

    if (action === 'setVerified') {
        const { userId, isVerified } = req.body;
        if (!userId || typeof isVerified !== 'boolean') {
            return res.status(400).send('userId and isVerified status are required.');
        }
        await db.collection('users').updateOne({ _id: userId as any }, { $set: { isVerified: isVerified } });
        return res.status(200).json({ success: true });
    }

    if (action === 'censorPhrase') {
        const { publicPhraseId } = req.body;
        if (!publicPhraseId) {
            return res.status(400).send('publicPhraseId is required.');
        }
        const phraseToDelete = await db.collection('public_phrases').findOne({ _id: new ObjectId(publicPhraseId) });
        if (phraseToDelete) {
            await db.collection('public_phrases').deleteOne({ _id: new ObjectId(publicPhraseId) });
            await db.collection('users').updateOne(
                { _id: phraseToDelete.userId as any, 'phrases.id': phraseToDelete.phraseId },
                { $set: { 'phrases.$.isPublic': false } }
            );
        }
        return res.status(200).json({ success: true });
    }
    
    if (action === 'updateEnvelope') {
        const { envelopeId, updates } = req.body;
        if (!envelopeId || !updates) {
            return res.status(400).send('envelopeId and updates are required.');
        }
        
        // Sanitize updates to only allow specific fields
        const sanitizedUpdates: any = {};
        if (typeof updates.baseCost === 'number') {
            sanitizedUpdates.baseCost = updates.baseCost;
        }

        if (Object.keys(sanitizedUpdates).length === 0) {
            return res.status(400).send('No valid fields to update.');
        }
        
        await db.collection('envelopes').updateOne({ _id: envelopeId }, { $set: sanitizedUpdates });
        return res.status(200).json({ success: true });
    }


    return res.status(400).send('Invalid action requested.');
}

export default handler;