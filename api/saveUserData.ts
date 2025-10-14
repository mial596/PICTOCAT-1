// api/saveUserData.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_utils/mongodb.js';
import { verifyToken } from './_utils/auth.js';
import { UserData } from '../types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }
  
  try {
    const decodedToken = await verifyToken(req.headers.authorization);
    const userId = decodedToken.sub;
    const receivedData = req.body?.data;

    if (!receivedData) {
      return res.status(400).send('User data is required in the `data` field.');
    }

    // Whitelist the fields that can be updated to prevent overwriting protected fields like 'role'.
    const dataToSave: Partial<UserData> = {};
    if (receivedData.coins !== undefined) dataToSave.coins = receivedData.coins;
    if (receivedData.phrases !== undefined) dataToSave.phrases = receivedData.phrases;
    if (receivedData.unlockedImageIds !== undefined) dataToSave.unlockedImageIds = receivedData.unlockedImageIds;
    if (receivedData.playerStats !== undefined) dataToSave.playerStats = receivedData.playerStats;
    if (receivedData.purchasedUpgrades !== undefined) dataToSave.purchasedUpgrades = receivedData.purchasedUpgrades;
    
    if (Object.keys(dataToSave).length === 0) {
        return res.status(400).send('No valid user data fields provided for update.');
    }
    
    const updatePayload = {
      $set: {
        ...dataToSave,
        lastModified: new Date(),
      }
    };

    const db = await getDb();
    const usersCollection = db.collection('users');

    await usersCollection.updateOne({ _id: userId as any }, updatePayload);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Save user data error:', error);
    if (error instanceof Error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return res.status(500).json({ message: 'Internal Server Error', error: errorMessage });
  }
}