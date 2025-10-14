// api/get-public-feed.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_utils/mongodb.js';
import { verifyToken } from './_utils/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const decodedToken = await verifyToken(req.headers.authorization);
        const requestingUserId = decodedToken.sub;
        
        const db = await getDb();
        const usersCollection = db.collection('users');
        const publicPhrasesCollection = db.collection('public_phrases');

        const requestingUser = await usersCollection.findOne({ _id: requestingUserId as any });
        const friendsList = requestingUser?.friends || [];
        
        const phrasesFromDb = await publicPhrasesCollection.aggregate([
            { 
                $match: {
                    $or: [
                        { privacy: 'public' },
                        { privacy: 'friends', userId: { $in: friendsList } }
                    ]
                }
            },
            { $sort: { _id: -1 } },
            { $limit: 50 },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                 $lookup: {
                    from: 'cats',
                    localField: 'user.profilePictureId',
                    foreignField: 'numeric_id',
                    as: 'userCatImage'
                }
            },
            {
                $addFields: {
                    likeCount: { $size: { $ifNull: ["$likes", []] } },
                    isLikedByMe: { $in: [requestingUserId, { $ifNull: ["$likes", []] }] }
                }
            },
            {
                $project: {
                    _id: 1,
                    text: 1,
                    imageUrl: 1,
                    imageTheme: 1,
                    likeCount: 1,
                    isLikedByMe: 1,
                    username: '$user.username',
                    isUserVerified: '$user.isVerified',
                    profilePictureUrl: { $ifNull: [ { $arrayElemAt: ['$userCatImage.url', 0] }, null ] }
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
            username: p.username,
            isUserVerified: p.isUserVerified,
            profilePictureUrl: p.profilePictureUrl
        }));

        return res.status(200).json(publicPhrases);

    } catch (error) {
        console.error('Get public feed error:', error);
        if (error instanceof Error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ message: 'Internal Server Error', error: errorMessage });
    }
}