import React from 'react';
import { Phrase, CatImage } from '../types';
import { DEFAULT_PIC_URL } from '../constants';
import { SpeakerWaveIcon } from '../hooks/Icons';

interface PhraseCardProps {
  phrase: Phrase;
  image: CatImage | null;
  onCardClick: () => void;
  onSelectImageClick: () => void;
  onSpeak: (text: string) => void;
}

const PhraseCard: React.FC<PhraseCardProps> = ({ phrase, image, onCardClick, onSelectImageClick, onSpeak }) => {
  const handleSelectImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectImageClick();
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSpeak(phrase.text);
  };

  return (
    <div
      onClick={onCardClick}
      className="card-cartoon has-tape aspect-square flex flex-col justify-between p-2"
    >
      <div className="flex-grow flex items-center justify-center rounded-md overflow-hidden mb-2 border-2 border-[var(--c-ink)] bg-gray-100">
        <img
          src={image?.url || DEFAULT_PIC_URL}
          alt={phrase.text}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex items-center justify-between gap-1">
        <p className="font-bold text-center flex-grow truncate px-1 text-sm sm:text-base">{phrase.text}</p>
        <div className="flex-shrink-0 flex gap-1">
           <button
            onClick={handleSpeak}
            className="btn-cartoon !p-2 bg-[var(--c-accent)]"
            aria-label={`Hablar frase: ${phrase.text}`}
           >
            <SpeakerWaveIcon className="w-4 h-4 text-white" />
           </button>
           <button
            onClick={handleSelectImage}
            className="btn-cartoon !p-2 bg-[var(--c-secondary)]"
            aria-label={`Cambiar imagen para ${phrase.text}`}
           >
            <span className="text-sm">🖼️</span>
           </button>
        </div>
      </div>
    </div>
  );
};

export default PhraseCard;