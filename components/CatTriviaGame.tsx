import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CatTriviaMode, CatImage } from '../types';
import { soundService } from '../services/audioService';

interface CatTriviaGameProps {
  mode: CatTriviaMode;
  images: CatImage[];
  onGameEnd: (results: { score: number; coinsEarned: number; xpEarned: number }) => void;
  hasSmartyCat: boolean;
}

interface TriviaQuestion {
  image: CatImage;
  options: string[];
  correctAnswer: string;
}

function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

const CatTriviaGame: React.FC<CatTriviaGameProps> = ({ mode, images, onGameEnd, hasSmartyCat }) => {
    const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(mode.timePerQuestion);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);

    useEffect(() => {
        const generateQuestions = () => {
            const allThemes: string[] = Array.from(new Set(images.map(img => img.theme)));
            const shuffledImages = shuffleArray<CatImage>(images);
            const generatedQs: TriviaQuestion[] = [];
            const wrongOptionsCount = hasSmartyCat ? 2 : 3;

            for (let i = 0; i < mode.questionCount && i < shuffledImages.length; i++) {
                const imageForQ = shuffledImages[i];
                const correctAnswer = imageForQ.theme;
                const wrongAnswers = allThemes.filter(theme => theme !== correctAnswer);
                const shuffledWrong = shuffleArray<string>(wrongAnswers).slice(0, wrongOptionsCount);
                const options = shuffleArray<string>([correctAnswer, ...shuffledWrong]);
                generatedQs.push({ image: imageForQ, options, correctAnswer });
            }
            setQuestions(generatedQs);
        };
        generateQuestions();
    }, [images, mode.questionCount, hasSmartyCat]);

    const nextQuestion = useCallback(() => {
        if (currentQuestionIndex + 1 < questions.length) {
            setCurrentQuestionIndex(prev => prev + 1);
            setTimeLeft(mode.timePerQuestion);
            setSelectedAnswer(null);
            setIsAnswered(false);
        } else {
            // Game over
            const coins = score * mode.rewardPerCorrect;
            const xp = Math.round(score * (mode.rewardPerCorrect / 2));
            soundService.play('reward');
            onGameEnd({ score, coinsEarned: coins, xpEarned: xp });
        }
    }, [currentQuestionIndex, questions.length, mode.timePerQuestion, score, mode.rewardPerCorrect, onGameEnd]);

    useEffect(() => {
        if (isAnswered) return;
        if (timeLeft <= 0) {
            setIsAnswered(true);
            soundService.play('gameOver');
            setTimeout(nextQuestion, 1500);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, isAnswered, nextQuestion]);

    const handleAnswer = (answer: string) => {
        if (isAnswered) return;
        setIsAnswered(true);
        setSelectedAnswer(answer);
        if (answer === questions[currentQuestionIndex].correctAnswer) {
            setScore(prev => prev + 1);
            soundService.play('catMeow');
        } else {
            soundService.play('favoriteOff');
        }
        setTimeout(nextQuestion, 1500);
    };

    if (questions.length === 0) {
        return <div className="text-center p-8 font-bold text-[var(--c-text)]">Cargando preguntas...</div>;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const timePercentage = (timeLeft / mode.timePerQuestion) * 100;

    return (
        <div className="w-full max-w-xl mx-auto p-4 sm:p-6 bg-[var(--c-surface)] rounded-2xl shadow-lg border-4 border-[var(--c-text)] text-[var(--c-text)]">
            <header className="flex justify-between items-center mb-4 font-bold">
                <div className="text-lg">Pregunta: {currentQuestionIndex + 1} / {questions.length}</div>
                <div className="text-lg">Puntuación: {score}</div>
            </header>
            
            <div className="w-full h-4 bg-[var(--c-bg)] rounded-full mb-4 overflow-hidden border-2 border-[var(--c-text)]/50">
                <div 
                    className="h-full bg-[var(--c-tan)] transition-all duration-1000 linear" 
                    style={{width: `${timePercentage}%`}}
                />
            </div>

            <div className="bg-[var(--c-surface)] p-4 rounded-lg mb-4">
                <p className="text-center font-semibold text-xl mb-4">¿A qué tema pertenece este gato?</p>
                <div className="w-full h-64 rounded-lg overflow-hidden flex items-center justify-center bg-[var(--c-bg)] border-2 border-[var(--c-text)]/20">
                    <img src={currentQuestion.image.url} alt="Gato misterioso" className="max-w-full max-h-full object-contain" />
                </div>
            </div>

            <div className={`grid gap-4 ${currentQuestion.options.length === 3 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                {currentQuestion.options.map(option => {
                    const isCorrect = option === currentQuestion.correctAnswer;
                    const isSelected = option === selectedAnswer;
                    
                    let stateClass = 'bg-[var(--c-surface)] hover:bg-[var(--c-bg)]';
                    if (isAnswered) {
                        if (isCorrect) {
                            stateClass = 'bg-green-400 text-white transform scale-105';
                        } else if (isSelected) {
                            stateClass = 'bg-red-400 text-white';
                        } else {
                            stateClass = 'bg-gray-300 opacity-70';
                        }
                    }
                    return (
                        <button
                            key={option}
                            onClick={() => handleAnswer(option)}
                            disabled={isAnswered}
                            className={`p-4 text-lg rounded-xl font-bold text-center transition-all duration-300 border-4 border-[var(--c-text)] disabled:cursor-not-allowed ${stateClass}`}
                        >
                            {option}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default CatTriviaGame;
