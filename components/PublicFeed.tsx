import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import * as apiService from '../services/apiService';
import { PublicProfilePhrase } from '../types';
import { SpinnerIcon, HeartIcon, VerifiedIcon, CatSilhouetteIcon } from '../hooks/Icons';
import { soundService } from '../services/audioService';
import { DEFAULT_PIC_URL } from '../constants';

interface PublicFeedProps {
    currentUserId: string;
    onProfileClick: (username: string) => void;
}

const rotations = ['rotate-1', '-rotate-2', 'rotate-2', '-rotate-1'];

const PublicFeed: React.FC<PublicFeedProps> = ({ currentUserId, onProfileClick }) => {
    const [feed, setFeed] = useState<PublicProfilePhrase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { getAccessTokenSilently } = useAuth0();

    const fetchFeed = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = await getAccessTokenSilently();
            const data = await apiService.getPublicFeed(token);
            setFeed(data);
        } catch (err) {
            setError('No se pudo cargar el feed de la comunidad.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [getAccessTokenSilently]);

    useEffect(() => {
        fetchFeed();
    }, [fetchFeed]);

    const handleLike = async (publicPhraseId: string) => {
        const originalFeed = [...feed];
        
        const phrase = feed.find(p => p.publicPhraseId === publicPhraseId);
        if (phrase) {
            soundService.play(phrase.isLikedByMe ? 'favoriteOff' : 'favoriteOn');
        }

        const updatedFeed = feed.map(p => {
            if (p.publicPhraseId === publicPhraseId) {
                return {
                    ...p,
                    isLikedByMe: !p.isLikedByMe,
                    likeCount: p.isLikedByMe ? p.likeCount - 1 : p.likeCount + 1,
                };
            }
            return p;
        });
        setFeed(updatedFeed);

        try {
            const token = await getAccessTokenSilently();
            await apiService.likePublicPhrase(token, publicPhraseId);
        } catch (err) {
            setFeed(originalFeed);
            console.error("Failed to like phrase", err);
        }
    };


    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-10">
                <SpinnerIcon className="w-10 h-10 animate-spin text-[var(--c-ink-light)]" />
            </div>
        );
    }

    if (error) {
        return <div className="text-center py-10 text-red-500">{error}</div>;
    }

    return (
        <div className="max-w-xl mx-auto">
            <h1 className="text-3xl font-black text-[var(--c-ink-light)] text-center mb-8">Feed de la Comunidad</h1>
            {feed.length > 0 ? (
                <div className="space-y-12">
                    {feed.map((phrase, index) => {
                        const rotationClass = rotations[index % rotations.length];
                        return (
                            <div key={phrase.publicPhraseId} className={rotationClass}>
                                <div className="card-cartoon has-tape p-4">
                                    <header className="flex items-center gap-3 mb-3">
                                        <img src={phrase.profilePictureUrl || DEFAULT_PIC_URL} alt={phrase.username} className="w-10 h-10 rounded-full border-2 border-[var(--c-ink-light)]/50"/>
                                        <button onClick={() => onProfileClick(phrase.username!)} className="font-bold text-lg text-[var(--c-ink-light)] hover:underline">
                                            @{phrase.username}
                                        </button>
                                        {phrase.isUserVerified && <VerifiedIcon className="w-5 h-5 text-blue-500" title="Verified User" />}
                                    </header>
                                    <div className="aspect-square bg-slate-200 rounded-lg overflow-hidden border-2 border-[var(--c-ink-light)]/20 mb-3">
                                        <img src={phrase.imageUrl} alt={phrase.text} className="w-full h-full object-cover"/>
                                    </div>
                                    <p className="font-bold text-xl mb-3">{phrase.text}</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <button
                                            onClick={() => handleLike(phrase.publicPhraseId)}
                                            className="btn-cartoon !p-2 bg-white hover:bg-rose-100 active:bg-rose-200"
                                            aria-label="Dar me gusta a la frase"
                                        >
                                            <HeartIcon className={`w-6 h-6 ${phrase.isLikedByMe ? 'text-rose-500' : 'text-[var(--c-ink-light)]/50'}`} solid={phrase.isLikedByMe} />
                                        </button>
                                        <span className="font-black text-lg text-[var(--c-ink-light)]/90">{phrase.likeCount}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                 <div className="text-center py-12 bg-white/50 rounded-lg border-2 border-[var(--c-ink-light)]/20">
                    <CatSilhouetteIcon className="w-16 h-16 mx-auto mb-4 text-[var(--c-ink-light)]/30" />
                    <p className="font-bold text-[var(--c-ink-light)]">El feed está tranquilo...</p>
                    <p className="text-[var(--c-ink-light)]/70">¡Sé el primero en compartir una frase pública!</p>
                </div>
            )}
        </div>
    );
};

export default PublicFeed;