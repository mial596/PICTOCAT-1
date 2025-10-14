import React from 'react';
import { Phrase, CatImage } from '../types';
import PhraseCard from '../components/PhraseCard';
import { PlusIcon } from '../hooks/Icons';

interface HomePageProps {
  phrases: Phrase[];
  allImages: CatImage[];
  onPhraseClick: (phrase: Phrase, image: CatImage | null) => void;
  onSelectImageClick: (phrase: Phrase) => void;
  onSpeak: (text: string) => void;
  onOpenPhraseEditor: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ phrases, allImages, onPhraseClick, onSelectImageClick, onSpeak, onOpenPhraseEditor }) => {
  const getImageForPhrase = (phrase: Phrase): CatImage | null => {
    if (!phrase.selectedImageId) return null;
    return allImages.find(img => img.id === phrase.selectedImageId) || null;
  };

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {phrases.map(phrase => (
          <PhraseCard
            key={phrase.id}
            phrase={phrase}
            image={getImageForPhrase(phrase)}
            onCardClick={() => onPhraseClick(phrase, getImageForPhrase(phrase))}
            onSelectImageClick={() => onSelectImageClick(phrase)}
            onSpeak={onSpeak}
          />
        ))}
      </div>
      <button
        onClick={onOpenPhraseEditor}
        className="fixed bottom-28 lg:bottom-8 right-4 lg:right-8 btn-cartoon btn-cartoon-primary !rounded-full !p-4 z-30 shadow-lg"
        aria-label="Crear nueva frase"
      >
        <PlusIcon className="w-8 h-8 text-white" />
      </button>
    </div>
  );
};

export default HomePage;
