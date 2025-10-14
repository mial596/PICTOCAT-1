import React, { useState, useEffect, useMemo } from 'react';
import { CatMemoryMode, CatImage } from '../types';
import { soundService } from '../services/audioService';
import { CatSilhouetteIcon } from '../hooks/Icons';

interface CatMemoryGameProps {
  mode: CatMemoryMode;
  images: CatImage[];
  onGameEnd: (results: { score: number; coinsEarned: number; xpEarned: number }) => void;
  hasPhotographicMemory: boolean;
}

interface Card {
  id: number;
  imageId: string;
  url: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const CatMemoryGame: React.FC<CatMemoryGameProps> = ({ mode, images, onGameEnd, hasPhotographicMemory }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(mode.gameDuration);
  const [pairsFound, setPairsFound] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [isRevealing, setIsRevealing] = useState(hasPhotographicMemory);

  const gameImages = useMemo(() => {
    // Shuffle images and pick required number for pairs
    return images.sort(() => 0.5 - Math.random()).slice(0, mode.pairCount);
  }, [images, mode.pairCount]);

  useEffect(() => {
    const gameCards = [...gameImages, ...gameImages]
      .sort(() => 0.5 - Math.random())
      .map((image, index) => ({
        id: index,
        imageId: String(image.id),
        url: image.url,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(gameCards);

    if (hasPhotographicMemory) {
        setIsRevealing(true);
        // Reveal all cards
        setCards(allCards => allCards.map(c => ({...c, isFlipped: true})));
        setTimeout(() => {
            // Hide them again
            setCards(allCards => allCards.map(c => ({...c, isFlipped: false})));
            setIsRevealing(false);
        }, 1500);
    }
  }, [gameImages, hasPhotographicMemory]);
  
  useEffect(() => {
    if (isRevealing) return;

    if (timeLeft <= 0 || pairsFound === mode.pairCount) {
        const coins = pairsFound * mode.rewardPerPair;
        const xp = pairsFound * 10;
        if(pairsFound > 0 && pairsFound < mode.pairCount) soundService.play('gameOver');
        if(pairsFound === mode.pairCount) soundService.play('reward');
        onGameEnd({score: pairsFound, coinsEarned: coins, xpEarned: xp});
        return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, pairsFound, mode.pairCount, onGameEnd, mode.rewardPerPair, isRevealing]);

  useEffect(() => {
    if (flippedIndices.length === 2) {
      setIsChecking(true);
      const [firstIndex, secondIndex] = flippedIndices;
      const firstCard = cards[firstIndex];
      const secondCard = cards[secondIndex];

      if (firstCard.imageId === secondCard.imageId) {
        // Match found
        soundService.play('catMeow');
        setCards(prevCards =>
          prevCards.map(card =>
            card.imageId === firstCard.imageId ? { ...card, isMatched: true, isFlipped: true } : card
          )
        );
        setPairsFound(prev => prev + 1);
        setFlippedIndices([]);
        setIsChecking(false);
      } else {
        // No match
        setTimeout(() => {
          setCards(prevCards =>
            prevCards.map((card, index) =>
              index === firstIndex || index === secondIndex ? { ...card, isFlipped: false } : card
            )
          );
          setFlippedIndices([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  }, [flippedIndices, cards]);

  const handleCardClick = (index: number) => {
    if (isChecking || cards[index].isFlipped || cards[index].isMatched || isRevealing) {
      return;
    }
    soundService.play('select');
    setCards(prevCards =>
      prevCards.map((card, i) =>
        i === index ? { ...card, isFlipped: true } : card
      )
    );
    setFlippedIndices(prev => [...prev, index]);
  };
  
  const gridCols = mode.pairCount === 4 ? 4 : (mode.pairCount === 6 ? 4 : 4);
  const gridTemplateColumns = `repeat(${gridCols}, minmax(0, 1fr))`;

  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-[var(--c-bg)] rounded-lg shadow-lg border-4 border-[var(--c-text)]">
        <div className="flex justify-between items-center mb-4 text-[var(--c-text)] font-bold">
            <div className="text-xl">Pares: {pairsFound} / {mode.pairCount}</div>
            <div className="text-xl">Tiempo: {timeLeft}s</div>
        </div>
        <div className="grid gap-2 md:gap-4" style={{ gridTemplateColumns }}>
            {cards.map((card, index) => (
                <div key={card.id} className="aspect-square perspective cursor-pointer" onClick={() => handleCardClick(index)}>
                    <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${card.isFlipped || card.isMatched ? 'rotate-y-180' : ''}`}>
                        {/* Card Back */}
                        <div className="absolute w-full h-full backface-hidden bg-[var(--c-blue)] rounded-lg flex items-center justify-center shadow-md border-2 border-[var(--c-text)] bg-[url('https://www.transparenttextures.com/patterns/pinstripe.png')]">
                            <CatSilhouetteIcon className="w-3/4 h-3/4 text-[var(--c-surface)]/70" />
                        </div>
                        {/* Card Front */}
                        <div className={`absolute w-full h-full backface-hidden rotate-y-180 bg-[var(--c-surface)] rounded-lg overflow-hidden shadow-md border-4 ${card.isMatched ? 'border-green-500' : 'border-[var(--c-text)]'}`}>
                           <img src={card.url} alt="Gato" className="w-full h-full object-cover" />
                           {card.isMatched && <div className="absolute inset-0 bg-green-500/30"></div>}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

export default CatMemoryGame;
