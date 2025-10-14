import axios from 'axios';
import { UserProfile, CatImage, SearchableUser, PublicProfileData, EnvelopeTypeId, UpgradeId, FriendData, DailyPassStatus, Envelope, GameUpgrade, Phrase, Achievement, ApiRequestResponse } from '../types';

const getAuthHeader = (token: string) => ({
    headers: { Authorization: `Bearer ${token}` }
});

const API_ENDPOINT = '/api/index';

// User Data
export const getUserData = async (token: string): Promise<UserProfile> => {
    const response = await axios.get(`${API_ENDPOINT}?action=getUserData`, getAuthHeader(token));
    return response.data;
};

export const saveUserData = async (token: string, data: Partial<UserProfile['data']>): Promise<ApiRequestResponse & {lastModified: string}> => {
    const response = await axios.post(`${API_ENDPOINT}?action=saveUserData`, { data }, getAuthHeader(token));
    return response.data;
};

export const syncUserData = async (token: string, lastModified: string): Promise<UserProfile | null> => {
  try {
    const response = await axios.get(`${API_ENDPOINT}?action=sync&since=${encodeURIComponent(lastModified)}`, getAuthHeader(token));
    return response.status === 200 ? response.data : null;
  } catch (error: any) {
    if (error.response && error.response.status === 304) {
      return null; // Not Modified
    }
    throw error;
  }
};

// Catalog
export const getCatalog = async (): Promise<CatImage[]> => {
    const response = await axios.get(`${API_ENDPOINT}?action=getCatalog`);
    return response.data;
};

// Shop
export const getShopData = async (token: string): Promise<{envelopes: Record<EnvelopeTypeId, Envelope>, upgrades: Record<UpgradeId, GameUpgrade>}> => {
    const response = await axios.get(`${API_ENDPOINT}?action=getShopData`, getAuthHeader(token));
    return response.data;
};

export const purchaseEnvelope = async (token: string, envelopeId: EnvelopeTypeId): Promise<ApiRequestResponse & { updatedCoins: number; newImages: CatImage[], lastModified: string }> => {
    const response = await axios.post(API_ENDPOINT, { action: 'purchaseEnvelope', envelopeId }, getAuthHeader(token));
    return response.data;
};

export const purchaseUpgrade = async (token: string, upgradeId: UpgradeId): Promise<ApiRequestResponse & { updatedCoins: number }> => {
    const response = await axios.post(API_ENDPOINT, { action: 'purchaseUpgrade', upgradeId }, getAuthHeader(token));
    return response.data;
};

// Profile
export const updateProfile = async (token: string, username: string, bio: string): Promise<void> => {
    await axios.post(API_ENDPOINT, { action: 'updateProfile', username, bio }, getAuthHeader(token));
};

export const updateProfilePicture = async (token: string, imageId: number | null): Promise<void> => {
    await axios.post(API_ENDPOINT, { action: 'updateProfilePicture', imageId }, getAuthHeader(token));
};

// Community
export const searchUsers = async (token: string, query: string): Promise<SearchableUser[]> => {
    const response = await axios.get(`${API_ENDPOINT}?action=searchUsers&q=${query}`, getAuthHeader(token));
    return response.data;
};

export const getPublicProfile = async (token: string, username: string): Promise<PublicProfileData> => {
    const response = await axios.get(`${API_ENDPOINT}?action=getPublicProfile&username=${username}`, getAuthHeader(token));
    return response.data;
};

export const getPublicFeed = async (token: string): Promise<PublicProfileData['phrases']> => {
    const response = await axios.get(`${API_ENDPOINT}?action=getPublicFeed`, getAuthHeader(token));
    return response.data;
};

export const publishPhrase = async (token: string, phrase: Phrase, image: CatImage, privacy: Phrase['privacy']): Promise<ApiRequestResponse & {lastModified: string}> => {
    const response = await axios.post(API_ENDPOINT, { action: 'publishPhrase', phrase, image, privacy }, getAuthHeader(token));
    return response.data;
};

export const likePublicPhrase = async (token: string, publicPhraseId: string): Promise<void> => {
    await axios.post(API_ENDPOINT, { action: 'likePhrase', publicPhraseId }, getAuthHeader(token));
};

// Friends
export const getFriendData = async (token: string): Promise<FriendData> => {
    const response = await axios.get(`${API_ENDPOINT}?action=getFriendData`, getAuthHeader(token));
    return response.data;
};

export const sendFriendRequest = async (token: string, targetUserId: string): Promise<ApiRequestResponse> => {
    const response = await axios.post(API_ENDPOINT, { action: 'addFriend', targetUserId }, getAuthHeader(token));
    return response.data;
};

export const respondToFriendRequest = async (token: string, targetUserId: string, responseAction: 'accept' | 'reject'): Promise<ApiRequestResponse> => {
    const response = await axios.put(API_ENDPOINT, { action: 'respondToFriendRequest', targetUserId, responseAction }, getAuthHeader(token));
    return response.data;
};

export const removeFriend = async (token: string, targetUserId: string): Promise<void> => {
    await axios.post(API_ENDPOINT, { action: 'removeFriend', targetUserId }, getAuthHeader(token));
};

// Daily Pass
export const getDailyPassStatus = async (token: string): Promise<DailyPassStatus> => {
    const response = await axios.get(`${API_ENDPOINT}?action=getDailyPassStatus`, getAuthHeader(token));
    return response.data;
};

export const claimDailyPass = async (token: string): Promise<ApiRequestResponse & { unlockedImages: CatImage[], updatedCoins: number }> => {
    const response = await axios.post(API_ENDPOINT, { action: 'claimDailyPass' }, getAuthHeader(token));
    return response.data;
};

// Admin
export const adminGetAllUsers = async (token: string): Promise<any[]> => {
    const response = await axios.get(`${API_ENDPOINT}?action=adminGetAllUsers`, getAuthHeader(token));
    return response.data;
};

export const adminGetPublicPhrases = async (token: string): Promise<any[]> => {
    const response = await axios.get(`${API_ENDPOINT}?action=adminGetPublicPhrases`, getAuthHeader(token));
    return response.data;
};

export const adminSetVerifiedStatus = async (token: string, userId: string, isVerified: boolean): Promise<void> => {
    await axios.post(API_ENDPOINT, { action: 'adminSetVerifiedStatus', userId, isVerified }, getAuthHeader(token));
};

export const adminCensorPhrase = async (token: string, publicPhraseId: string): Promise<void> => {
    await axios.post(API_ENDPOINT, { action: 'adminCensorPhrase', publicPhraseId }, getAuthHeader(token));
};

export const adminUpdateEnvelope = async (token: string, envelopeId: EnvelopeTypeId, updates: Partial<Pick<Envelope, 'baseCost' | 'rarityProbabilities'>>): Promise<void> => {
    await axios.post(API_ENDPOINT, { action: 'adminUpdateEnvelope', envelopeId, updates }, getAuthHeader(token));
};

// Achievements
export const getAchievementsData = async (token: string): Promise<Achievement[]> => {
    const response = await axios.get(`${API_ENDPOINT}?action=getAchievements`, getAuthHeader(token));
    return response.data;
};
