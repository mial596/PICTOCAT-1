// components/AchievementCard.tsx
import React from 'react';
import { Achievement, UserProfile, AchievementTier } from '../types';
import { CoinIcon, StarIcon, TrophyIcon, CheckCircleIcon } from '../hooks/Icons';

interface AchievementCardProps {
  achievement: Achievement;
  userProfile: UserProfile;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, userProfile }) => {
    const userAchievement = userProfile.data.unlockedAchievements?.[achievement.id];
    const currentTierIndex = userAchievement?.unlockedTier || 0;
    const isCompleted = currentTierIndex >= achievement.tiers.length;
    const nextTier = isCompleted ? null : achievement.tiers[currentTierIndex];
    
    let currentProgress = 0;
    if (achievement.stat.includes('.')) {
        const [obj, prop] = achievement.stat.split('.');
        currentProgress = (userProfile.data as any)[obj]?.[prop]?.length || 0;
    } else if (achievement.stat === 'coins') {
        currentProgress = userProfile.data.coins;
    } else if (achievement.stat === 'playerStats.level') {
        currentProgress = userProfile.data.playerStats.level;
    } else {
        currentProgress = userProfile.data.stats?.[achievement.stat as keyof typeof userProfile.data.stats] || 0;
    }

    const progressPercentage = nextTier ? Math.min(100, (currentProgress / nextTier.value) * 100) : 100;

    return (
        <div className={`card-cartoon p-4 flex flex-col transition-all ${isCompleted ? 'bg-amber-50 border-amber-300' : 'bg-white'}`}>
            <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 p-2 rounded-full ${isCompleted ? 'bg-amber-200' : 'bg-slate-100'}`}>
                    <TrophyIcon className={`w-8 h-8 ${isCompleted ? 'text-amber-500' : 'text-slate-400'}`} />
                </div>
                <div className="flex-grow">
                    <h3 className="font-bold text-lg text-[var(--c-text)]">{achievement.name}</h3>
                    <p className="text-sm text-[var(--c-text-muted)]">{achievement.description}</p>
                </div>
                {isCompleted && <CheckCircleIcon className="w-8 h-8 text-green-500 flex-shrink-0" />}
            </div>

            <div className="mt-4">
                <div className="flex justify-between font-bold text-sm text-[var(--c-text)] mb-1">
                    <span>{isCompleted ? 'Completado' : `Progreso: ${currentProgress} / ${nextTier?.value}`}</span>
                    <span>Nivel {currentTierIndex} / {achievement.tiers.length}</span>
                </div>
                <div className="w-full h-4 bg-[var(--c-bg)] rounded-full overflow-hidden border-2 border-[var(--c-text)]/20">
                    <div
                        className="h-full bg-[var(--c-primary)] transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
            </div>

            {nextTier && (
                 <div className="mt-3 text-sm text-[var(--c-text-muted)]">
                    <span className="font-bold">Próxima Recompensa:</span>
                    <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1 font-semibold">
                            <CoinIcon className="w-4 h-4 text-yellow-500" />
                            <span>{nextTier.coins}</span>
                        </div>
                         <div className="flex items-center gap-1 font-semibold">
                            <StarIcon className="w-4 h-4 text-amber-400" />
                            <span>{nextTier.xp} XP</span>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default AchievementCard;
