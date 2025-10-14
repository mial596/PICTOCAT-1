

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SimonSaysMode } from '../types';
import { soundService } from '../services/audioService';
import { CoinIcon, StarIcon, CatSilhouetteIcon } from '../hooks/Icons';

interface SimonSaysGameProps {
  mode: SimonSaysMode;
  onGameEnd: (results: { score: number; coinsEarned: number; xpEarned: number }) => void;
}

const PAD_COLORS = ['bg-rose-500', 'bg-emerald-500', 'bg-sky-500', 'bg-amber-400'];
const PAD_HOVER_COLORS = ['hover:bg-rose-600', 'hover:bg-emerald-600', 'hover:bg-sky-600', 'hover:bg-amber-500'];
const PAD_GLOW_SHADOWS = [
    'shadow-[0_0_35px_8px_#f43f5e]',
    'shadow-[0_0_35px_8px_#10b981]',
    'shadow-[0_0_35px_8px_#0ea5e9]',
    'shadow-[0_0_35px_8px_#f59e0b]'
];
const SOUNDS: ('simon1' | 'simon2' | 'simon3' | 'simon4')[] = ['simon1', 'simon2', 'simon3', 'simon4'];

const Confetti: React.FC = () => {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {Array.from({ length: 70 }).map((_, i) => {
          const style = {
            left: `${Math.random() * 100}%`,
            animationDuration: `${Math.random() * 2 + 3}s`,
            animationDelay: `${Math.random() * 2}s`,
            backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
          };
          return <div key={i} className="confetti-piece" style={style}></div>;
        })}
      </div>
    );
};

const SimonSaysGame: React.FC<SimonSaysGameProps> = ({ mode, onGameEnd }) => {
    const [sequence, setSequence] = useState<number[]>([]);
    const [playerSequence, setPlayerSequence] = useState<number[]>([]);
    const [gameState, setGameState] = useState<'starting' | 'watching' | 'playing' | 'gameover'>('starting');
    const [activePad, setActivePad] = useState<number | null>(null);
    const [round, setRound] = useState(0);
    const timeoutsRef = useRef<number[]>([]);

    const clearTimeouts = () => {
        timeoutsRef.current.forEach(clearTimeout);
        timeoutsRef.current = [];
    };

    const addTimeout = (callback: () => void, delay: number) => {
        const id = window.setTimeout(callback, delay);
        timeoutsRef.current.push(id);
        return id;
    };
    
    const nextRound = useCallback(() => {
        setGameState('watching');
        setPlayerSequence([]);
        
        setSequence(prevSequence => {
            const nextInSequence = Math.floor(Math.random() * 4);
            const newSequence = [...prevSequence, nextInSequence];
            
            newSequence.forEach((padIndex, index) => {
                addTimeout(() => {
                    setActivePad(padIndex);
                    soundService.play(SOUNDS[padIndex]);
                    addTimeout(() => setActivePad(null), mode.speedMs / 2);
                }, (index + 1) * mode.speedMs);
            });

            addTimeout(() => {
                setGameState('playing');
            }, (newSequence.length + 1) * mode.speedMs);

            return newSequence;
        });
    }, [mode.speedMs]);

    useEffect(() => {
        soundService.play('favoriteOn');
        addTimeout(nextRound, 1500);
        return clearTimeouts;
    }, [nextRound]);
    
    const handleGameOver = useCallback(() => {
        clearTimeouts();
        setGameState('gameover');
        soundService.play('simonError');
    }, []);

    const handlePadClick = (padIndex: number) => {
        if (gameState !== 'playing') return;

        soundService.play(SOUNDS[padIndex]);
        const newPlayerSequence = [...playerSequence, padIndex];
        
        setActivePad(padIndex);
        setTimeout(() => setActivePad(null), 150);

        if (newPlayerSequence[newPlayerSequence.length - 1] !== sequence[newPlayerSequence.length - 1]) {
            handleGameOver();
            return;
        }

        setPlayerSequence(newPlayerSequence);

        if (newPlayerSequence.length === sequence.length) {
            setGameState('watching');
            setRound(prev => prev + 1);
            soundService.play('reward');
            addTimeout(nextRound, 1200);
        }
    };
    
    let statusMessage = '';
    if (gameState === 'starting') statusMessage = '¡Prepárate!';
    if (gameState === 'watching') statusMessage = '¡Observa!';
    if (gameState === 'playing') statusMessage = '¡Tu turno!';

    const score = round;
    const coinsEarned = score * mode.rewardPerRound;
    const xpEarned = score * Math.ceil(mode.rewardPerRound / 2);

    return (
        <div className="w-full max-w-md mx-auto p-4 bg-[var(--c-text)] rounded-2xl shadow-2xl border-4 border-black text-[var(--c-surface)] select-none flex flex-col items-center relative">
            
            {gameState === 'gameover' && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10 p-4 animate-popIn">
                    <Confetti />
                    <div className="relative card-cartoon p-6 w-full max-w-sm text-center bg-[var(--c-surface)]">
                        <CatSilhouetteIcon className="w-16 h-16 mx-auto text-[var(--c-text)]/50 mb-4"/>
                        <h2 className="text-3xl font-black text-[var(--c-text)]">¡Fin del Juego!</h2>
                        <p className="text-xl my-4 text-[var(--c-text)]/80">
                            Alcanzaste la ronda <span className="font-bold text-[var(--c-text)]">{score}</span>
                        </p>
                        <div className="flex justify-center items-center gap-6 my-6 bg-[var(--c-bg)] p-3 rounded-xl border-2 border-[var(--c-text)]/20">
                            <div className="flex items-center gap-2 font-bold text-[var(--c-text)]">
                                <CoinIcon className="w-6 h-6 text-yellow-500" />
                                <span className="text-lg">+{coinsEarned}</span>
                            </div>
                            <div className="flex items-center gap-2 font-bold text-[var(--c-text)]">
                                <StarIcon className="w-6 h-6 text-yellow-400" />
                                <span className="text-lg">+{xpEarned} XP</span>
                            </div>
                        </div>
                        <button
                            onClick={() => onGameEnd({ score, coinsEarned, xpEarned })}
                            className="btn-cartoon btn-cartoon-primary w-full"
                        >
                            Volver
                        </button>
                    </div>
                </div>
            )}

            <header className="w-full flex justify-between items-center mb-4 font-bold text-lg px-2">
                <h2 className="w-24">Ronda: {round + 1}</h2>
                <h2 className="text-[var(--c-tan)] min-h-[1.75rem] text-center flex-grow">{statusMessage}</h2>
                <div className="w-24"></div>
            </header>
            
            <div className="relative w-full max-w-[350px] aspect-square">
                <div className="absolute inset-0 grid grid-cols-2 gap-2 transform -rotate-45">
                    {[0, 1, 3, 2].map((padPos, i) => {
                         const colorIndex = i;
                         return (
                            <button
                                key={colorIndex}
                                onClick={() => handlePadClick(colorIndex)}
                                disabled={gameState !== 'playing'}
                                className={`w-full h-full transition-all duration-150 transform active:scale-95 disabled:cursor-not-allowed
                                    ${i === 0 ? 'rounded-tl-full' : ''}
                                    ${i === 1 ? 'rounded-tr-full' : ''}
                                    ${i === 2 ? 'rounded-bl-full' : ''}
                                    ${i === 3 ? 'rounded-br-full' : ''}
                                    ${PAD_COLORS[colorIndex]}
                                    ${gameState === 'playing' ? PAD_HOVER_COLORS[colorIndex] : ''}
                                    ${activePad === colorIndex ? `${PAD_GLOW_SHADOWS[colorIndex]} scale-105 brightness-125` : ''}`
                                }
                                aria-label={`Pad ${colorIndex + 1}`}
                            />
                        )
                    })}
                </div>
                 <div className="absolute inset-[30%] bg-[var(--c-text)] rounded-full flex flex-col items-center justify-center border-8 border-black/50">
                    <span className="text-4xl font-black text-[var(--c-surface)] drop-shadow-lg">{round + 1}</span>
                    <span className="text-xs tracking-widest uppercase text-[var(--c-surface)]/60">Ronda</span>
                 </div>
            </div>
        </div>
    );
};

export default SimonSaysGame;