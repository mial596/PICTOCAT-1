import React, { useState } from 'react';
import { GameMode, CatImage, UpgradeId, CatMemoryMode, CatTriviaMode } from '../types';
import { GAMES_DATA, GAME_MODES } from '../gameData';
import { ArrowLeftIcon, LockIcon, CatSilhouetteIcon, QuestionMarkIcon, MusicNoteIcon, StarIcon, SpeakerWaveIcon } from '../hooks/Icons';

import MouseHuntGame from './MouseHuntGame';
import CatMemoryGame from './CatMemoryGame';
import SimonSaysGame from './SimonSaysGame';
import CatTriviaGame from './CatTriviaGame';
import FelineRhythmGame from './FelineRhythmGame';

interface GameModeSelectorProps {
    unlockedImages: CatImage[];
    upgrades: UpgradeId[];
    onGameEnd: (results: { score: number; coinsEarned: number; xpEarned: number }) => void;
}

const gameIcons: { [key: string]: React.ReactNode } = {
  mouseHunt: <StarIcon className="w-12 h-12 text-amber-400" />,
  catMemory: <CatSilhouetteIcon className="w-12 h-12 text-sky-500" />,
  simonSays: <SpeakerWaveIcon className="w-12 h-12 text-rose-500" />,
  catTrivia: <QuestionMarkIcon className="w-12 h-12 text-emerald-500" />,
  felineRhythm: <MusicNoteIcon className="w-12 h-12 text-purple-500" />,
};

const GameModeSelector: React.FC<GameModeSelectorProps> = ({ unlockedImages, upgrades, onGameEnd }) => {
    const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
    const [activeGameMode, setActiveGameMode] = useState<GameMode | null>(null);
    
    const handleGameEnd = (results: { score: number; coinsEarned: number; xpEarned: number }) => {
        // Reset to mode selection after game ends
        setActiveGameMode(null);
        onGameEnd(results);
    };

    if (activeGameMode) {
        switch (activeGameMode.gameId) {
            case 'mouseHunt':
                return <MouseHuntGame mode={activeGameMode} upgrades={{ betterBait: upgrades.includes('betterBait'), extraTime: upgrades.includes('extraTime') }} onGameEnd={handleGameEnd} />;
            case 'catMemory':
                return <CatMemoryGame mode={activeGameMode} images={unlockedImages} onGameEnd={handleGameEnd} hasPhotographicMemory={upgrades.includes('photographicMemory')} />;
            case 'simonSays':
                return <SimonSaysGame mode={activeGameMode} onGameEnd={handleGameEnd} />;
            case 'catTrivia':
                return <CatTriviaGame mode={activeGameMode} images={unlockedImages} onGameEnd={handleGameEnd} hasSmartyCat={upgrades.includes('smartyCat')} />;
            case 'felineRhythm':
                return <FelineRhythmGame mode={activeGameMode} onGameEnd={handleGameEnd} />;
            default:
                setActiveGameMode(null); // Should not happen
                return null;
        }
    }

    const renderContent = () => {
        if (selectedGameId) {
            const game = GAMES_DATA[selectedGameId];
            const modes = GAME_MODES.filter(m => m.gameId === selectedGameId);

            return (
                <div>
                    <button onClick={() => setSelectedGameId(null)} className="flex items-center gap-2 font-bold mb-4 text-[var(--c-ink-light)]/80 hover:text-[var(--c-ink-light)]">
                        <ArrowLeftIcon className="w-5 h-5"/>
                        Volver a Juegos
                    </button>
                    <h2 className="text-3xl font-black text-[var(--c-ink-light)] mb-2">{game.name}</h2>
                    <p className="text-[var(--c-ink-light)]/80 mb-6">{game.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {modes.map(mode => {
                            let isLocked = false;
                            let lockReason = '';
                            if (mode.gameId === 'catMemory' || mode.gameId === 'catTrivia') {
                                const requiredImages = (mode as CatMemoryMode | CatTriviaMode).minImagesRequired;
                                if (unlockedImages.length < requiredImages) {
                                    isLocked = true;
                                    lockReason = `Requires ${requiredImages} images`;
                                }
                            }

                            return (
                                <div key={mode.id} className={`card-cartoon p-4 flex flex-col ${isLocked ? 'bg-slate-200' : ''}`}>
                                    <h3 className="font-bold text-xl">{mode.name}</h3>
                                    <p className="text-sm text-[var(--c-ink-light)]/70 flex-grow my-2">{mode.description}</p>
                                    {isLocked ? (
                                        <div className="flex items-center justify-center gap-2 mt-2 text-red-500 font-semibold text-sm bg-red-100 p-2 rounded-md">
                                            <LockIcon className="w-4 h-4"/>
                                            <span>{lockReason}</span>
                                        </div>
                                    ) : (
                                        <button onClick={() => setActiveGameMode(mode)} className="btn-cartoon btn-cartoon-primary w-full mt-2">
                                            Jugar
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        return (
            <div>
                 <h1 className="text-3xl sm:text-4xl font-black text-[var(--c-ink-light)] mb-2 text-center">Jugar Juegos</h1>
                 <p className="text-[var(--c-ink-light)]/80 text-center mb-8">¡Gana monedas y XP para ampliar tu colección de gatos!</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(GAMES_DATA).map(([id, game]) => (
                        <button key={id} onClick={() => setSelectedGameId(id)} className="card-cartoon p-6 text-left flex flex-col items-center text-center">
                            <div className="mb-4">{gameIcons[id]}</div>
                            <h2 className="text-2xl font-bold">{game.name}</h2>
                            <p className="text-[var(--c-ink-light)]/70 mt-1">{game.description}</p>
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div>
            {renderContent()}
        </div>
    );
};

export default GameModeSelector;
