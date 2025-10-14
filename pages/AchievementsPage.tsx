// pages/AchievementsPage.tsx
import React from 'react';
import { UserProfile, Achievement } from '../types';
import AchievementCard from '../components/AchievementCard';
import { TrophyIcon } from '../hooks/Icons';

interface AchievementsPageProps {
  allAchievements: Achievement[];
  userProfile: UserProfile;
}

const AchievementsPage: React.FC<AchievementsPageProps> = ({ allAchievements, userProfile }) => {
    
    const groupedAchievements = allAchievements.reduce((acc, ach) => {
        const category = ach.category || 'General';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(ach);
        return acc;
    }, {} as Record<string, Achievement[]>);

  return (
    <div>
      <header className="mb-8 text-center">
        <TrophyIcon className="w-16 h-16 mx-auto text-amber-500 mb-2"/>
        <h1 className="text-3xl sm:text-4xl font-black text-[var(--c-text)]">Mis Logros</h1>
        <p className="text-lg text-[var(--c-text-muted)] mt-2">¡Sigue tu progreso y mira las recompensas que te esperan!</p>
      </header>
      
      {/* FIX: Use Object.keys() to iterate for better type safety and resolve map error. */}
      {Object.keys(groupedAchievements).map((category) => (
        <section key={category} className="mb-10">
            <h2 className="text-2xl font-bold text-[var(--c-text)] mb-4 border-b-4 border-[var(--c-text)]/20 pb-2">{category}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {groupedAchievements[category].map(ach => (
                    <AchievementCard 
                        key={ach.id}
                        achievement={ach}
                        userProfile={userProfile}
                    />
                ))}
            </div>
        </section>
      ))}
    </div>
  );
};

export default AchievementsPage;
