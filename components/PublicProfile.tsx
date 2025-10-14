import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import * as apiService from '../services/apiService';
import { PublicProfileData } from '../types';
import { SpinnerIcon, VerifiedIcon, ModIcon, AdminIcon, HeartIcon, UserPlusIcon, UserCheckIcon, UserMinusIcon } from '../hooks/Icons';
import { soundService } from '../services/audioService';
import { DEFAULT_PIC_URL } from '../constants';

interface PublicProfileProps {
    username: string;
    currentUserId: string;
}

const PublicProfile: React.FC<PublicProfileProps> = ({ username, currentUserId }) => {
    const [profile, setProfile] = useState<PublicProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const { getAccessTokenSilently } = useAuth0();

    const fetchProfile = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getAccessTokenSilently();
            const data = await apiService.getPublicProfile(token, username);
            setProfile(data);
        } catch (err) {
            setError('No se pudo cargar el perfil. Este usuario puede que no exista.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [username, getAccessTokenSilently]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);
    
    const handleLike = async (publicPhraseId: string) => {
        if (!profile) return;
        
        const phrase = profile.phrases.find(p => p.publicPhraseId === publicPhraseId);
        if (phrase) {
            soundService.play(phrase.isLikedByMe ? 'favoriteOff' : 'favoriteOn');
        }

        // Optimistic update
        const updatedPhrases = profile.phrases.map(p => {
            if (p.publicPhraseId === publicPhraseId) {
                return {
                    ...p,
                    isLikedByMe: !p.isLikedByMe,
                    likeCount: p.isLikedByMe ? p.likeCount - 1 : p.likeCount + 1,
                };
            }
            return p;
        });
        setProfile({ ...profile, phrases: updatedPhrases });

        try {
            const token = await getAccessTokenSilently();
            await apiService.likePublicPhrase(token, publicPhraseId);
        } catch (err) {
            fetchProfile(); 
            console.error("Failed to like phrase", err);
        }
    };
    
    const handleFriendAction = async (action: 'add' | 'accept' | 'remove') => {
        if (!profile || isActionLoading) return;
        setIsActionLoading(true);
        try {
            const token = await getAccessTokenSilently();
            switch (action) {
                case 'add':
                    await apiService.sendFriendRequest(token, profile.userId);
                    setProfile({ ...profile, friendshipStatus: 'sent' });
                    break;
                case 'accept':
                    await apiService.respondToFriendRequest(token, profile.userId, 'accept');
                    setProfile({ ...profile, friendshipStatus: 'friends' });
                    break;
                case 'remove':
                    if(window.confirm(`¿Estás seguro de que quieres eliminar a ${profile.username} de tus amigos?`)) {
                        await apiService.removeFriend(token, profile.userId);
                        setProfile({ ...profile, friendshipStatus: 'none' });
                    }
                    break;
            }
        } catch (err) {
            console.error("Friend action failed", err);
        } finally {
            setIsActionLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-10">
                <SpinnerIcon className="w-10 h-10 animate-spin text-[var(--c-ink-light)]" />
            </div>
        );
    }

    if (error || !profile) {
        return <div className="text-center py-10 text-red-500">{error || 'Perfil no encontrado.'}</div>;
    }

    const roleIcons = {
        admin: <AdminIcon className="w-5 h-5 text-red-600" title="Admin"/>,
        mod: <ModIcon className="w-5 h-5 text-blue-600" title="Moderator" />,
        user: null
    };

    const renderFriendButton = () => {
        if (profile.friendshipStatus === 'self') return null;
        
        switch (profile.friendshipStatus) {
            case 'friends':
                return <button onClick={() => handleFriendAction('remove')} disabled={isActionLoading} className="btn-cartoon btn-cartoon-danger !py-2 !px-4"><UserMinusIcon className="w-5 h-5 mr-2" />Amigos</button>;
            case 'sent':
                return <button disabled className="btn-cartoon btn-cartoon-secondary !py-2 !px-4 opacity-70">Solicitud Enviada</button>;
            case 'received':
                return <button onClick={() => handleFriendAction('accept')} disabled={isActionLoading} className="btn-cartoon btn-cartoon-primary !py-2 !px-4"><UserCheckIcon className="w-5 h-5 mr-2" />Aceptar Solicitud</button>;
            case 'none':
                return <button onClick={() => handleFriendAction('add')} disabled={isActionLoading} className="btn-cartoon btn-cartoon-primary !py-2 !px-4"><UserPlusIcon className="w-5 h-5 mr-2"/>Añadir Amigo</button>;
            default:
                return null;
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <header className="text-center mb-8 p-6 bg-white rounded-xl border-4 border-[var(--c-text)] shadow-lg">
                <img src={profile.profilePictureUrl || DEFAULT_PIC_URL} alt={profile.username} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-[var(--c-text)]/50" />
                <div className="flex justify-center items-center gap-2">
                    <h1 className="text-4xl font-black text-[var(--c-ink-light)]">{profile.username}</h1>
                    {profile.isVerified && <VerifiedIcon className="w-7 h-7 text-blue-500" title="Verified"/>}
                    {roleIcons[profile.role]}
                </div>
                <p className="text-[var(--c-ink-light)]/80 mt-2 max-w-xl mx-auto">{profile.bio}</p>
                <div className="mt-4">{renderFriendButton()}</div>
            </header>
            
            <h2 className="text-2xl font-bold text-[var(--c-ink-light)] mb-4">Frases Públicas</h2>
            {profile.phrases.length > 0 ? (
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {profile.phrases.map(phrase => (
                        <div key={phrase.publicPhraseId} className="card-cartoon p-2 flex flex-col">
                            <div className="aspect-square bg-slate-200 rounded-md overflow-hidden mb-2">
                                <img src={phrase.imageUrl} alt={phrase.text} className="w-full h-full object-cover"/>
                            </div>
                            <p className="font-bold text-center flex-grow mb-2">{phrase.text}</p>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleLike(phrase.publicPhraseId)} className="p-1 rounded-full hover:bg-rose-100">
                                   <HeartIcon className={`w-6 h-6 ${phrase.isLikedByMe ? 'text-rose-500' : 'text-[var(--c-ink-light)]/50'}`} solid={phrase.isLikedByMe} />
                                </button>
                                 <span className="font-bold text-sm text-[var(--c-ink-light)]/80">{phrase.likeCount}</span>
                            </div>
                        </div>
                    ))}
                 </div>
            ) : (
                <div className="text-center py-12 bg-white/50 rounded-lg border-2 border-[var(--c-ink-light)]/20">
                    <p className="font-bold text-[var(--c-ink-light)]">Este usuario aún no ha compartido ninguna frase.</p>
                </div>
            )}
        </div>
    );
};

export default PublicProfile;