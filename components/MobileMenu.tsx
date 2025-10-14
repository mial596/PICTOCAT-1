import React from 'react';
import { HomeIcon, AlbumIcon, StoreIcon, EditIcon, GameIcon, CommunityIcon, AdminIcon, TrophyIcon } from '../hooks/Icons';

type Page = 'home' | 'album' | 'shop' | 'phrases' | 'games' | 'community' | 'admin' | 'achievements';

interface MobileMenuProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  isAdmin: boolean;
}

const NavButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex flex-col items-center justify-center pt-1 pb-2 transition-colors ${isActive ? 'text-[var(--c-primary)]' : 'text-[var(--c-text-muted)] hover:text-[var(--c-text)]'}`}
  >
    {icon}
    <span className="text-xs font-bold mt-1">{label}</span>
  </button>
);

const MobileMenu: React.FC<MobileMenuProps> = ({ currentPage, setCurrentPage, isAdmin }) => {
  const navItems = [
    { id: 'home', label: 'Inicio', icon: <HomeIcon className="w-6 h-6" /> },
    { id: 'album', label: 'Álbum', icon: <AlbumIcon className="w-6 h-6" /> },
    { id: 'games', label: 'Juegos', icon: <GameIcon className="w-6 h-6" /> },
    { id: 'community', label: 'Social', icon: <CommunityIcon className="w-6 h-6" /> },
    { id: 'achievements', label: 'Logros', icon: <TrophyIcon className="w-6 h-6" /> },
  ];

  if(isAdmin) {
      navItems.push({ id: 'admin', label: 'Admin', icon: <AdminIcon className="w-6 h-6" /> });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--c-surface)] shadow-top-hard z-50 flex justify-around border-t-4 border-[var(--c-text)]">
      {navItems.map(item => (
        <NavButton
          key={item.id}
          label={item.label}
          icon={item.icon}
          isActive={currentPage === item.id}
          onClick={() => setCurrentPage(item.id as Page)}
        />
      ))}
    </nav>
  );
};

export default MobileMenu;