import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FelineRhythmMode } from '../types';
import { soundService } from '../services/audioService';
import { MusicNoteIcon } from '../hooks/Icons';

interface FelineRhythmGameProps {
  mode: FelineRhythmMode;
  onGameEnd: (results: { score: number; coinsEarned: number; xpEarned: number }) => void;
}

interface Note {
    id: number;
    lane: number;
    startTime: number; // when it appears at the top
    isHit: boolean;
}

const LANES = 4;
const NOTE_SPEED = 250; // pixels per second
const TARGET_LINE_FROM_BOTTOM = 80;
const HIT_WINDOW = 150; // ms

const FelineRhythmGame: React.FC<FelineRhythmGameProps> = ({ mode, onGameEnd }) => {
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(mode.gameDuration);
    const [notes, setNotes] = useState<Note[]>([]);
    const [gameState, setGameState] = useState<'ready' | 'playing' | 'finished'>('ready');
    const [hits, setHits] = useState<{ [key: number]: string }>({});
    
    const gameAreaRef = useRef<HTMLDivElement>(null);
    const startTimeRef = useRef<number>(0);
    const gameLoopRef = useRef<number | null>(null);

    useEffect(() => {
        const gameNotes: Note[] = [];
        const songDurationMs = (mode.gameDuration - 3) * 1000;
        const noteInterval = songDurationMs / mode.noteCount;
        for (let i = 0; i < mode.noteCount; i++) {
            gameNotes.push({
                id: i,
                lane: Math.floor(Math.random() * LANES),
                startTime: i * noteInterval + 1500, // Staggered start times
                isHit: false
            });
        }
        setNotes(gameNotes);

        const startTimeout = setTimeout(() => {
            setGameState('playing');
            startTimeRef.current = performance.now();
        }, 3000); // 3-second countdown
        return () => clearTimeout(startTimeout);
    }, [mode.gameDuration, mode.noteCount]);
    
    const endGame = useCallback(() => {
        setGameState('finished');
        if (gameLoopRef.current) {
            cancelAnimationFrame(gameLoopRef.current);
        }
        soundService.play('gameOver');
        const coinsEarned = score * mode.rewardMultiplier;
        const xpEarned = Math.round(score * mode.rewardMultiplier / 2);
        onGameEnd({ score, coinsEarned, xpEarned });
    }, [score, mode.rewardMultiplier, onGameEnd]);
    
    useEffect(() => {
        if (gameState !== 'playing') return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if(prev <= 1) {
                    endGame();
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [gameState, endGame]);
    
    // Game Loop
    useEffect(() => {
        if (gameState !== 'playing') return;

        const loop = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const elapsed = timestamp - startTimeRef.current;
            
            if(gameAreaRef.current) {
                 const noteElements = gameAreaRef.current.querySelectorAll('.note');
                 noteElements.forEach(noteEl => {
                    const noteId = parseInt(noteEl.getAttribute('data-id') || '-1');
                    const noteData = notes.find(n => n.id === noteId);
                    if(noteData) {
                         const noteElapsed = elapsed - noteData.startTime;
                         if (noteElapsed > 0) {
                            const newTop = noteElapsed / 1000 * NOTE_SPEED;
                            (noteEl as HTMLDivElement).style.transform = `translateY(${newTop}px)`;
                         }
                    }
                 });
            }

            const gameAreaHeight = gameAreaRef.current?.clientHeight || 0;
            const travelTime = (gameAreaHeight - TARGET_LINE_FROM_BOTTOM) / NOTE_SPEED * 1000;
            
            setNotes(currentNotes => currentNotes.filter(note => {
                if (note.isHit) return false;
                const noteTargetTime = note.startTime + travelTime;
                if(elapsed > noteTargetTime + HIT_WINDOW) {
                    return false;
                }
                return true;
            }));

            gameLoopRef.current = requestAnimationFrame(loop);
        };

        gameLoopRef.current = requestAnimationFrame(loop);
        return () => {
            if(gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        }
    }, [gameState, notes]);

    const handleKeyPress = useCallback((lane: number) => {
        if (gameState !== 'playing') return;

        const gameAreaHeight = gameAreaRef.current?.clientHeight || 0;
        const travelTime = (gameAreaHeight - TARGET_LINE_FROM_BOTTOM) / NOTE_SPEED * 1000;
        const currentTime = performance.now() - startTimeRef.current;

        const targetNote = notes.find(note => {
            if (note.lane !== lane || note.isHit) return false;
            const noteTargetTime = note.startTime + travelTime;
            return Math.abs(currentTime - noteTargetTime) <= HIT_WINDOW;
        });
        
        if (targetNote) {
            soundService.play('catMeow');
            setScore(prev => prev + 10);
            setNotes(prev => prev.map(n => n.id === targetNote.id ? {...n, isHit: true} : n));
            setHits(prev => ({ ...prev, [lane]: 'hit' }));
        } else {
            soundService.play('favoriteOff');
            setHits(prev => ({ ...prev, [lane]: 'miss' }));
        }
        setTimeout(() => setHits(prev => ({ ...prev, [lane]: '' })), 100);
    }, [gameState, notes]);
    
    useEffect(() => {
        const keyHandler = (e: KeyboardEvent) => {
            const keyMap: { [key: string]: number } = { 'd': 0, 'f': 1, 'j': 2, 'k': 3 };
            if (keyMap[e.key] !== undefined) handleKeyPress(keyMap[e.key]);
        };
        window.addEventListener('keydown', keyHandler);
        return () => window.removeEventListener('keydown', keyHandler);
    }, [handleKeyPress]);

    const displayNotes = notes.filter(n => !n.isHit);

    return (
        <div className="w-full max-w-md mx-auto p-4 bg-[var(--c-text)] rounded-lg shadow-lg border-4 border-black text-[var(--c-surface)] select-none">
            <div className="flex justify-between items-center mb-4 font-bold">
                <div className="text-2xl">Puntuación: {score}</div>
                <div className="text-2xl">Tiempo: {timeLeft}s</div>
            </div>
            
            <div ref={gameAreaRef} className="relative w-full h-[calc(100vh-250px)] max-h-[600px] bg-black/50 overflow-hidden border-2 border-[var(--c-text)] rounded-md">
                {displayNotes.map(note => (
                    <div
                        key={note.id}
                        data-id={note.id}
                        className="note absolute"
                        style={{ left: `${(note.lane / LANES) * 100 + (100 / LANES / 2)}%`, transform: 'translateX(-50%)' }}
                    >
                       <MusicNoteIcon className="w-10 h-10 text-[var(--c-blue)] drop-shadow-[0_0_5px_#A0D7F5]" />
                    </div>
                ))}
                <div className="absolute bottom-0 left-0 right-0 h-[10px] bg-gradient-to-t from-[var(--c-blue)]/50 to-transparent" style={{bottom: `${TARGET_LINE_FROM_BOTTOM - 5}px`}}/>
                 <div className="absolute left-0 right-0 grid grid-cols-4 h-full">
                    <div className="border-r border-[var(--c-tan)]/20"></div>
                    <div className="border-r border-[var(--c-tan)]/20"></div>
                    <div className="border-r border-[var(--c-tan)]/20"></div>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2">
                {Array.from({ length: LANES }).map((_, i) => (
                    <button 
                        key={i} 
                        onMouseDown={() => handleKeyPress(i)}
                        className={`py-4 rounded-lg font-bold text-xl transition-colors duration-100 border-b-4 ${
                            hits[i] === 'hit' ? 'bg-green-500 border-green-700' : hits[i] === 'miss' ? 'bg-red-500 border-red-700' : 'bg-[var(--c-surface)]/80 hover:bg-[var(--c-surface)] text-[var(--c-text)] border-[var(--c-text)]'
                        }`}
                    >
                       {['D', 'F', 'J', 'K'][i]}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default FelineRhythmGame;