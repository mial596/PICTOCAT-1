// api/get-public-profile.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_utils/mongodb.js';
import { verifyToken } from './_utils/auth.js';
import { PublicProfileData } from '../types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const decodedToken = await verifyToken(req.headers.authorization); // Secure the endpoint
    const requestingUserId = decodedToken.sub;
    const username = req.query.username as string;

    if (!username) {
        return res.status(400).send('Username is required');
    }

    const db = await getDb();
    const usersCollection = db.collection('users');
    const publicPhrasesCollection = db.collection('public_phrases');

    const [requestingUser, targetUser] = await Promise.all([
        usersCollection.findOne({ _id: requestingUserId as any }),
        usersCollection.findOne({ username: username })
    ]);

    if (!targetUser || !requestingUser) {
        return res.status(404).send('User not found');
    }

    // Get profile picture URL
    let profilePictureUrl: string | null = null;
    if (targetUser.profilePictureId) {
        const catsCollection = db.collection('cats');
        const pic = await catsCollection.findOne({ numeric_id: targetUser.profilePictureId });
        if (pic) {
            profilePictureUrl = pic.url;
        }
    }

    // Determine friendship status
    let friendshipStatus: PublicProfileData['friendshipStatus'] = 'none';
    if (requestingUserId === targetUser._id) {
        friendshipStatus = 'self';
    } else if (requestingUser.friends?.includes(targetUser._id)) {
        friendshipStatus = 'friends';
    } else if (requestingUser.friendRequestsSent?.includes(targetUser._id)) {
        friendshipStatus = 'sent';
    } else if (requestingUser.friendRequestsReceived?.includes(targetUser._id)) {
        friendshipStatus = 'received';
    }


    const phrasesFromDb = await publicPhrasesCollection.aggregate([
      { $match: { userId: targetUser._id, privacy: 'public' } },
      { $sort: { _id: -1 } },
      {
        $addFields: {
          likeCount: { $size: { $ifNull: ["$likes", []] } },
          isLikedByMe: { $in: [requestingUserId, { $ifNull: ["$likes", []] }] }
        }
      },
      {
        $project: {
          likes: 0 // Exclude the full likes array from the response
        }
      }
    ]).toArray();
    
    const publicPhrases = phrasesFromDb.map(p => ({
        publicPhraseId: p._id.toHexString(),
        text: p.text,
        imageUrl: p.imageUrl,
        imageTheme: p.imageTheme,
        likeCount: p.likeCount,
        isLikedByMe: p.isLikedByMe,
    }));
    
    const profileData: PublicProfileData = {
        userId: targetUser._id.toString(),
        username: targetUser.username,
        role: targetUser.role || 'user',
        isVerified: targetUser.isVerified || false,
        bio: targetUser.bio || '',
        phrases: publicPhrases,
        profilePictureUrl,
        friendshipStatus
    };

    return res.status(200).json(profileData);
  } catch (error) {
    console.error('Get public profile error:', error);
    if (error instanceof Error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return res.status(500).json({ message: 'Internal Server Error', error: errorMessage });
  }
}