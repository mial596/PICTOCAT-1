// api/_shared/data.ts
import { Phrase, PlayerStats, UpgradeId, UserData } from '../../types.js';

// Backend constants
const INITIAL_PHRASES: Phrase[] = [
  { id: 'yes', text: 'Sí', selectedImageId: null, isCustom: false, privacy: 'private' },
  { id: 'no', text: 'No', selectedImageId: null, isCustom: false, privacy: 'private' },
  { id: 'happy', text: 'Me siento feliz', selectedImageId: null, isCustom: false, privacy: 'private' },
  { id: 'sad', text: 'Me siento triste', selectedImageId: null, isCustom: false, privacy: 'private' },
  { id: 'help', text: 'Necesito ayuda', selectedImageId: null, isCustom: false, privacy: 'private' }
];

const INITIAL_UNLOCKED_IMAGE_IDS: number[] = [];

// Backend function to generate initial user data
// FIX: Add missing properties to align with UserData type
export const getInitialUserData = (): UserData => ({
    phrases: INITIAL_PHRASES.map(p => ({ ...p })), // Ensure a fresh copy is returned
    coins: 500,
    unlockedImageIds: [...INITIAL_UNLOCKED_IMAGE_IDS],
    playerStats: { level: 1, xp: 0, xpToNextLevel: 100 },
    purchasedUpgrades: [],
    bio: "¡Hola! Soy nuevo en PictoCat.",
    profilePictureId: null,
    friends: [],
    friendRequestsSent: [],
    friendRequestsReceived: [],
    unlockedAchievements: {},
    stats: {
      gamesPlayed: 0,
      envelopesOpened: 0,
      publicPhrases: 0,
    },
});