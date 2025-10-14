import React, { useState } from 'react';
import { UserProfile } from '../types';
import UserSearch from './UserSearch';
import PublicProfile from './PublicProfile';
import PublicFeed from './PublicFeed';
import FriendsManagement from './FriendsManagement';
import { ArrowLeftIcon, UserIcon } from '../hooks/Icons';

type View = 'feed' | 'friends' | 'search' | 'profile';

interface CommunityViewProps {
  currentUserProfile: UserProfile;
}

const CommunityView: React.FC<CommunityViewProps> = ({ currentUserProfile }) => {
    const [view, setView] = useState<View>('feed');
    // Keep track of the previous view to return to it
    const [previousView, setPreviousView] = useState<View>('feed');
    const [selectedUsername, setSelectedUsername] = useState<string | null>(null);

    const handleSelectUser = (username: string) => {
        setSelectedUsername(username);
        setPreviousView(view); // Save the current tab
        setView('profile');
    };

    const handleBack = () => {
        setSelectedUsername(null);
        setView(previousView); // Return to the previous tab
    };
    
    const handleSetView = (newView: View) => {
        if (newView !== 'profile') {
            setView(newView);
        }
    }

    const renderContent = () => {
        if (view === 'profile' && selectedUsername) {
            return (
                <div>
                    <button onClick={handleBack} className="flex items-center gap-2 font-bold mb-4 text-[var(--c-ink-light)]/80 hover:text-[var(--c-ink-light)]">
                        <ArrowLeftIcon className="w-5 h-5"/>
                        Volver
                    </button>
                    <PublicProfile username={selectedUsername} currentUserId={currentUserProfile.id} />
                </div>
            );
        }
        switch (view) {
            case 'feed':
                return <PublicFeed currentUserId={currentUserProfile.id} onProfileClick={handleSelectUser} />;
            case 'friends':
                return <FriendsManagement onProfileClick={handleSelectUser} />;
            case 'search':
                return <UserSearch onSelectUser={handleSelectUser} />;
            default:
                 return <PublicFeed currentUserId={currentUserProfile.id} onProfileClick={handleSelectUser} />;
        }
    };
    
    const isProfileView = view === 'profile';

    return (
        <div>
            {!isProfileView && (
                <div className="flex justify-between items-center border-b-2 border-[var(--c-ink-light)]/20 mb-6">
                    <div className="flex">
                        <button onClick={() => handleSetView('feed')} className={`px-4 py-2 font-bold ${view === 'feed' ? 'border-b-4 border-[var(--c-ink-light)] text-[var(--c-ink-light)]' : 'text-[var(--c-ink-light)]/60'}`}>
                            Feed
                        </button>
                         <button onClick={() => handleSetView('friends')} className={`px-4 py-2 font-bold ${view === 'friends' ? 'border-b-4 border-[var(--c-ink-light)] text-[var(--c-ink-light)]' : 'text-[var(--c-ink-light)]/60'}`}>
                            Amigos
                        </button>
                        <button onClick={() => handleSetView('search')} className={`px-4 py-2 font-bold ${view === 'search' ? 'border-b-4 border-[var(--c-ink-light)] text-[var(--c-ink-light)]' : 'text-[var(--c-ink-light)]/60'}`}>
                            Buscar
                        </button>
                    </div>
                    <button 
                        onClick={() => handleSelectUser(currentUserProfile.email)}
                        className="btn-cartoon btn-cartoon-secondary !py-1.5 !px-3 text-sm hidden sm:flex items-center gap-2"
                    >
                        <UserIcon className="w-4 h-4" />
                        Mi Perfil
                    </button>
                </div>
            )}
            {renderContent()}
        </div>
    );
};

export default CommunityView;