// api/_utils/achievements.ts
import { UserProfile, Achievement, AchievementUnlockResponse } from '../../types.js';
import { ALL_ACHIEVEMENTS } from '../_shared/achievements.js';

export const checkAndUnlockAchievements = async (userProfile: any, db: any): Promise<{
    updatedFields: Partial<UserProfile['data']>;
    newlyUnlockedAchievements: AchievementUnlockResponse['newlyUnlockedAchievements'];
}> => {
    const newlyUnlockedAchievements: AchievementUnlockResponse['newlyUnlockedAchievements'] = [];
    const updatedFields: any = {};
    const userAchievements = userProfile.unlockedAchievements || {};

    for (const achievement of ALL_ACHIEVEMENTS) {
        const userAchievement = userAchievements[achievement.id] || { id: achievement.id, unlockedTier: 0, progress: 0 };
        const currentTierIndex = userAchievement.unlockedTier;

        if (currentTierIndex >= achievement.tiers.length) {
            continue; // Achievement maxed out
        }

        let currentProgress = 0;
        if (achievement.stat.includes('.')) {
            const [obj, prop] = achievement.stat.split('.');
            currentProgress = userProfile[obj]?.[prop]?.length || 0;
        } else if (achievement.stat === 'coins') {
             currentProgress = userProfile.coins || 0;
        } else if (achievement.stat === 'playerStats.level') {
            currentProgress = userProfile.playerStats?.level || 1;
        } else {
            currentProgress = userProfile.stats?.[achievement.stat as keyof typeof userProfile.stats] || 0;
        }

        const nextTierIndex = currentTierIndex;
        const nextTier = achievement.tiers[nextTierIndex];

        if (currentProgress >= nextTier.value) {
            const newUnlockedTier = nextTierIndex + 1;
            userAchievements[achievement.id] = { ...userAchievement, unlockedTier: newUnlockedTier, progress: currentProgress };
            
            // Add rewards
            if (!updatedFields.coins) updatedFields.coins = userProfile.coins;
            if (!updatedFields.playerStats) updatedFields.playerStats = { ...userProfile.playerStats };
            
            updatedFields.coins += nextTier.coins;
            updatedFields.playerStats.xp += nextTier.xp;
            
            // Check for level up from achievement XP
            while (updatedFields.playerStats.xp >= updatedFields.playerStats.xpToNextLevel) {
                 updatedFields.playerStats.level += 1;
                 updatedFields.playerStats.xp -= updatedFields.playerStats.xpToNextLevel;
                 updatedFields.playerStats.xpToNextLevel = Math.floor(updatedFields.playerStats.xpToNextLevel * 1.5);
            }
            
            newlyUnlockedAchievements.push({
                achievement,
                unlockedTier: nextTier,
                newTier: newUnlockedTier
            });
        }
    }

    if (newlyUnlockedAchievements.length > 0) {
        updatedFields.unlockedAchievements = userAchievements;
    }

    return { updatedFields, newlyUnlockedAchievements };
};
