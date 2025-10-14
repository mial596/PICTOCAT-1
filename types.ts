// types.ts
import React from 'react';

export type Rarity = 'common' | 'rare' | 'epic';

export interface CatImage {
  id: number;
  url: string;
  theme: string;
  rarity: Rarity;
}

export interface Phrase {
  id: string;
  text: string;
  selectedImageId: number | null;
  isCustom: boolean;
  privacy: 'private' | 'friends' | 'public';
}

export interface PlayerStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  lastDailyPassClaim?: string;
}

export type UpgradeId = 'goldenPaw' | 'betterBait' | 'extraTime' | 'photographicMemory' | 'smartyCat' | 'xpBoost';
export type EnvelopeTypeId = 'bronze' | 'silver' | 'gold';

export interface GameUpgrade {
    id: UpgradeId;
    name: string;
    description: string;
    cost: number;
    levelRequired: number;
    icon: 'coin' | 'mouse' | 'time' | 'brain' | 'question' | 'star';
}

export interface Envelope {
    id: EnvelopeTypeId;
    name: string;
    description: string;
    baseCost: number;
    costIncreasePerLevel: number;
    currentCost?: number;
    imageCount: number;
    xp: number;
    color: string;
    rarityProbabilities: {
        common: number;
        rare: number;
        epic: number;
    };
}

export interface UserData {
    coins: number;
    phrases: Phrase[];
    unlockedImageIds: number[];
    playerStats: PlayerStats;
    purchasedUpgrades: UpgradeId[];
    bio: string;
    profilePictureId: number | null;
    friends: string[];
    friendRequestsSent: string[];
    friendRequestsReceived: string[];
    unlockedAchievements: Record<string, UserAchievement>;
    // Stats for achievements
    stats: {
      gamesPlayed: number;
      envelopesOpened: number;
      publicPhrases: number;
    }
}

export interface UserProfile {
    id: string;
    email: string; // This is used for username in frontend
    role: 'user' | 'mod' | 'admin';
    isVerified: boolean;
    lastModified: string;
    data: UserData;
}

// Game Modes
// FIX: Rename GameMode to BaseGameMode and create a union type for GameMode
export interface BaseGameMode {
  gameId: string;
  id: string;
  name: string;
  description: string;
  gameDuration: number;
}

export interface MouseHuntMode extends BaseGameMode {
    gameId: 'mouseHunt';
    gridSize: number;
    mouseDuration: number;
    maxMice: number;
    rewardMultiplier: number;
}

export interface CatMemoryMode extends BaseGameMode {
    gameId: 'catMemory';
    pairCount: number;
    rewardPerPair: number;
    minImagesRequired: number;
}

export interface SimonSaysMode extends BaseGameMode {
    gameId: 'simonSays';
    initialSequenceLength: number;
    speedMs: number;
    rewardPerRound: number;
}

export interface CatTriviaMode extends BaseGameMode {
    gameId: 'catTrivia';
    questionCount: number;
    timePerQuestion: number;
    rewardPerCorrect: number;
    minImagesRequired: number;
}

export interface FelineRhythmMode extends BaseGameMode {
    gameId: 'felineRhythm';
    noteCount: number;
    rewardMultiplier: number;
}

export type GameMode = MouseHuntMode | CatMemoryMode | SimonSaysMode | CatTriviaMode | FelineRhythmMode;


// Admin & Community
export interface AdminUserView {
    id: string;
    email: string;
    role: 'user' | 'mod' | 'admin';
    isVerified: boolean;
}

export interface PublicPhrase {
    publicPhraseId: string;
    userId: string;
    email: string; // username of creator
    text: string;
    imageUrl: string;
    imageTheme: string;
}

export interface PublicProfilePhrase {
    publicPhraseId: string;
    text: string;
    imageUrl: string;
    imageTheme: string;
    likeCount: number;
    isLikedByMe: boolean;
    username?: string;
    isUserVerified?: boolean;
    profilePictureUrl?: string | null;
}

export interface PublicProfileData {
    userId: string;
    username: string;
    role: 'user' | 'mod' | 'admin';
    isVerified: boolean;
    bio: string;
    phrases: PublicProfilePhrase[];
    profilePictureUrl: string | null;
    friendshipStatus: 'self' | 'friends' | 'sent' | 'received' | 'none';
}

export interface SearchableUser {
    username: string;
    isVerified: boolean;
}

export interface ShopData {
    envelopes: Record<EnvelopeTypeId, Envelope>;
    upgrades: Record<UpgradeId, GameUpgrade>;
}

export interface Friend {
    userId: string;
    username: string;
    isVerified: boolean;
    role: 'user' | 'mod' | 'admin';
}

export interface FriendRequest {
    userId: string;
    username: string;
}

export interface FriendData {
    friends: Friend[];
    requests: FriendRequest[];
}

export interface DailyPassStatus {
    isClaimable: boolean;
    nextPassTimestamp: number;
    rewards: {
        images: CatImage[];
        upgrade: GameUpgrade | null;
        coinReward: number;
    } | null;
}

// Achievements
export type AchievementId =
  | 'collector_1' | 'collector_2' | 'collector_3'
  | 'millionaire_1' | 'millionaire_2' | 'millionaire_3'
  | 'social_1' | 'social_2'
  | 'creator_1' | 'creator_2'
  | 'gamer_1' | 'gamer_2' | 'gamer_3'
  | 'leveled_up_1' | 'leveled_up_2' | 'leveled_up_3'
  | 'verified_user'
  // FIX: Add missing achievement ID
  | 'envelopes_1';

export interface AchievementTier {
  value: number;
  xp: number;
  coins: number;
}
export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  category: 'Colección' | 'Social' | 'Progresión' | 'Economía' | 'Juegos';
  stat: keyof UserData['stats'] | 'unlockedImageIds.length' | 'friends.length' | 'playerStats.level' | 'coins';
  tiers: AchievementTier[];
}

export interface UserAchievement {
    id: AchievementId;
    unlockedTier: number;
    progress: number;
}

export interface AchievementUnlockResponse {
    newlyUnlockedAchievements?: {
        achievement: Achievement,
        unlockedTier: AchievementTier,
        newTier: number
    }[];
}

export interface ApiRequestResponse extends AchievementUnlockResponse {
    [key: string]: any;
}