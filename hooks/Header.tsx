import React from 'react';
// FIX: Remove unused UserIcon import and add required icons
import { CoinIcon, StarIcon, TrophyIcon, SyncIcon } from './Icons';
import { PlayerStats, CatImage } from '../types';
import { LOGO_URL, DEFAULT_PIC_URL } from '../constants';

interface HeaderProps {
  userCoins: number;
  playerStats: PlayerStats;
  username: string;
  profilePicture: CatImage | null;
  onOpenShop: () => void;
  onOpenProfile: () => void;
  onNavigate: (page: 'achievements') => void;
  isSyncing: boolean;
}

const Header: React.FC<HeaderProps> = ({ userCoins, playerStats, username, profilePicture, onOpenShop, onOpenProfile, onNavigate, isSyncing }) => {
  const xpPercentage = (playerStats.xp / playerStats.xpToNextLevel) * 100;

  return (
    <header className="sticky top-0 z-40 bg-[var(--c-paper)]/80 backdrop-blur-sm shadow-md mb-6">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <img src={LOGO_URL} alt="PictoCat" className="h-10 w-10" />
          <h1 className="text-2xl font-black text-[var(--c-text)] hidden md:block">PictoCat</h1>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 font-bold text-lg text-[var(--c-text)]">
              <span className="hidden sm:inline">Nivel {playerStats.level}</span>
              <StarIcon className="w-6 h-6 text-amber-400" />
            </div>
            <div className="w-24 sm:w-32 h-2 bg-slate-300 rounded-full mt-1 overflow-hidden border border-slate-400">
                <div className="h-full bg-amber-400" style={{ width: `${xpPercentage}%`}}></div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isSyncing && <SyncIcon className="w-5 h-5 animate-spin text-slate-400" />}
            <button onClick={onOpenShop} className="btn-cartoon !py-2 !px-3 sm:!px-4 flex items-center gap-2">
              <CoinIcon className="w-6 h-6 text-yellow-500" />
              <span className="font-bold text-lg">{userCoins}</span>
            </button>
          </div>
          
          <button onClick={() => onNavigate('achievements')} className="btn-cartoon !p-3 bg-white hidden sm:flex" aria-label="Ver Logros">
             <TrophyIcon className="w-6 h-6 text-amber-500"/>
          </button>

          <button onClick={onOpenProfile} className="flex items-center gap-2 font-bold text-lg text-[var(--c-text)]" aria-label="Editar Perfil">
             <img src={profilePicture?.url || DEFAULT_PIC_URL} alt="Perfil" className="w-10 h-10 rounded-full border-2 border-[var(--c-text)] object-cover"/>
             <span className="hidden lg:inline">{username}</span>
          </button>

        </div>
      </div>
    </header>
  );
};

export default Header;