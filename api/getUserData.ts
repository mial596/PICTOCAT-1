// api/getUserData.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_utils/mongodb.js';
import { getInitialUserData } from './_shared/data.js';
import { verifyToken, DecodedToken } from './_utils/auth.js';
import { UserProfile } from '../types.js';

/**
 * Determines the user's role based on the JWT access token.
 * It prioritizes roles defined in the token (from Auth0) and uses
 * the ADMIN_EMAIL environment variable as a fallback.
 * @param token The decoded JWT access token.
 * @returns 'admin', 'mod', or 'user'.
 */
const getRoleFromToken = (token: DecodedToken): 'admin' | 'mod' | 'user' => {
    const roles = token['https://pictocat.vercel.app/roles'];
    if (Array.isArray(roles)) {
        if (roles.includes('admin')) return 'admin';
        if (roles.includes('mod')) return 'mod';
    }
    // Fallback to email check for convenience during development/setup
    const isAdminByEmail = process.env.ADMIN_EMAIL && token.email === process.env.ADMIN_EMAIL;
    return isAdminByEmail ? 'admin' : 'user';
};


export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }
  
  try {
    const decodedToken = await verifyToken(req.headers.authorization);
    const userId = decodedToken.sub;
    
    const db = await getDb();
    const usersCollection = db.collection('users');
    let userFromDb = await usersCollection.findOne({ _id: userId as any });

    const userEmail = decodedToken.email;
    const userRole = getRoleFromToken(decodedToken);

    if (!userFromDb) {
      console.log(`Profile not found for user ${userId}. Attempting JIT creation.`);
      
      const initialData = getInitialUserData();
      
      let baseUsername: string;
      if (userEmail) {
          baseUsername = userEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20);
      } else {
          // Fallback username generation if email is not available
          const userIdPart = userId.split('|')[1] || userId;
          baseUsername = `user_${userIdPart.slice(-8)}`;
      }

      let finalUsername = baseUsername;
      
      let usernameCheck = await usersCollection.findOne({ username: finalUsername });
      while (usernameCheck) {
        const suffix = Math.floor(1000 + Math.random() * 9000);
        // Ensure username length doesn't exceed a reasonable limit with suffix
        finalUsername = `${baseUsername.slice(0, 15)}_${suffix}`;
        usernameCheck = await usersCollection.findOne({ username: finalUsername });
      }

      const newUserDoc = {
        _id: userId,
        username: finalUsername,
        email: userEmail || null, // The actual email, can be private
        role: userRole,
        isVerified: false,
        lastModified: new Date(),
        ...initialData
      };
      
      await usersCollection.insertOne(newUserDoc);
      userFromDb = newUserDoc;
    } else {
        // For existing users, check if their role or email needs to be updated.
        const updates: { $set: { [key: string]: any } } = { $set: {} };
        if (userFromDb.role !== userRole) {
            updates.$set.role = userRole;
        }
        if (!userFromDb.email && userEmail) {
             updates.$set.email = userEmail;
        }

        if (Object.keys(updates.$set).length > 0) {
            updates.$set.lastModified = new Date();
            await usersCollection.updateOne({ _id: userId as any }, updates);
            // Update in-memory object for the current response
            Object.assign(userFromDb, updates.$set);
        }
    }
    
    // Reconstruct the nested 'data' object for the frontend
    const userProfile: UserProfile = {
      id: userFromDb._id.toString(),
      email: userFromDb.username, // Frontend uses 'email' field for the username
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
        // FIX: Add missing properties with fallbacks
        unlockedAchievements: userFromDb.unlockedAchievements || {},
        stats: userFromDb.stats || { gamesPlayed: 0, envelopesOpened: 0, publicPhrases: 0 },
      }
    };

    return res.status(200).json(userProfile);

  } catch (error) {
    console.error('Get/Create user data error:', error);
    if (error instanceof Error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return res.status(500).json({ message: 'Internal Server Error', error: errorMessage });
  }
}