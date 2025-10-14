import React from 'react';
import { Phrase, CatImage } from '../types';
import { EditIcon, TrashIcon, PlusIcon } from '../hooks/Icons';

interface PhraseEditorPageProps {
  phrases: Phrase[];
  allImages: CatImage[];
  onSetPhraseToEdit: (phrase: Phrase | null) => void;
  onDeletePhrase: (phraseId: string) => void;
}

const PhraseEditorPage: React.FC<PhraseEditorPageProps> = ({
  phrases,
  allImages,
  onSetPhraseToEdit,
  onDeletePhrase,
}) => {
  const customPhrases = phrases.filter(p => p.isCustom);
  const getImageForPhrase = (phrase: Phrase): CatImage | null => {
    if (!phrase.selectedImageId) return null;
    return allImages.find(img => img.id === phrase.selectedImageId) || null;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-black text-[var(--c-text)]">Mis Frases</h1>
        <button onClick={() => onSetPhraseToEdit(null)} className="btn-cartoon btn-cartoon-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Nueva Frase</span>
        </button>
      </div>

      <div className="space-y-4">
        {customPhrases.length > 0 ? (
          customPhrases.map(phrase => (
            <div key={phrase.id} className="card-cartoon p-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-grow">
                <img
                  src={getImageForPhrase(phrase)?.url}
                  alt={phrase.text}
                  className="w-16 h-16 rounded-md object-cover border-2 border-[var(--c-text)] bg-slate-200"
                />
                <span className="font-bold text-lg text-[var(--c-text)]">{phrase.text}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onSetPhraseToEdit(phrase)} className="btn-cartoon btn-cartoon-secondary !p-3">
                  <EditIcon className="w-5 h-5" />
                </button>
                <button onClick={() => onDeletePhrase(phrase.id)} className="btn-cartoon btn-cartoon-danger !p-3">
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20">
            <p className="text-xl font-bold text-[var(--c-text)]">No tienes frases personalizadas.</p>
            <p className="text-[var(--c-text-muted)]">¡Crea una para comunicarte a tu manera!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhraseEditorPage;