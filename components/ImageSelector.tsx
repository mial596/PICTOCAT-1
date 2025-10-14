

import React from 'react';
import { CatImage, Phrase } from '../types';
import { CloseIcon } from '../hooks/Icons';

interface ImageSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (phraseId: string, imageId: number | null) => void;
  phrase: Phrase | null;
  unlockedImages: CatImage[];
}

const ImageSelector: React.FC<ImageSelectorProps> = ({ isOpen, onClose, onSelectImage, phrase, unlockedImages }) => {
  if (!isOpen || !phrase) return null;

  const relevantImages = unlockedImages;

  return (
    <div className="modal-cartoon-overlay">
      <div className="modal-cartoon-content w-full max-w-3xl">
        <header className="flex justify-between items-center p-4 border-b-4 border-[var(--c-text)]">
          <h2 className="text-lg sm:text-2xl font-bold text-[var(--c-text)] truncate">Elige imagen para "{phrase.text}"</h2>
          <button onClick={onClose} className="text-[var(--c-text)]/70 hover:text-[var(--c-text)] flex-shrink-0 ml-4">
            <CloseIcon className="w-8 h-8" />
          </button>
        </header>
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 bg-[var(--c-bg)]/50">
          {relevantImages.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {/* Option to have no image */}
              <button
                  onClick={() => onSelectImage(phrase.id, null)}
                  className={`aspect-square rounded-lg flex items-center justify-center border-[6px] transition-all duration-200 ease-in-out ${!phrase.selectedImageId ? 'border-[var(--c-primary)] ring-4 ring-[var(--c-primary)]/50 scale-105 shadow-lg' : 'border-[var(--c-text)]/20 bg-white hover:border-[var(--c-text)]/40'}`}
              >
                  <span className="text-[var(--c-text-muted)] text-lg font-bold">Ninguna</span>
              </button>
              {relevantImages.map(image => (
                <button
                  key={image.id}
                  onClick={() => onSelectImage(phrase.id, image.id)}
                  className={`aspect-square rounded-lg overflow-hidden border-[6px] transition-all duration-200 ease-in-out ${phrase.selectedImageId === image.id ? 'border-[var(--c-primary)] ring-4 ring-offset-2 ring-[var(--c-primary)] scale-105 shadow-lg' : 'border-transparent hover:border-[var(--c-primary)]'}`}
                >
                  <img src={image.url} alt={image.theme} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-500 py-10">
              <p className="font-bold">No tienes imágenes desbloqueadas.</p>
              <p>¡Compra sobres en la tienda para conseguir más!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageSelector;