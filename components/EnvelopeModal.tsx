import React from 'react';
import { CatImage } from '../types';
import { CloseIcon } from '../hooks/Icons';

const Confetti: React.FC = () => {
  const confettiCount = 70;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {Array.from({ length: confettiCount }).map((_, i) => {
        const style = {
          left: `${Math.random() * 100}%`,
          animationDuration: `${Math.random() * 2 + 3}s`, // 3s to 5s
          animationDelay: `${Math.random() * 2}s`,
          backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
        };
        return <div key={i} className="confetti-piece" style={style}></div>;
      })}
    </div>
  );
};

interface EnvelopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  newImages: CatImage[];
  envelopeName: string;
}

const EnvelopeModal: React.FC<EnvelopeModalProps> = ({ isOpen, onClose, newImages, envelopeName }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-cartoon-overlay">
      <div className="modal-cartoon-content w-full max-w-2xl text-center relative overflow-hidden">
        <Confetti />
        
        <div className="relative z-10 p-4 sm:p-6">
            <button onClick={onClose} className="absolute top-2 right-2 text-slate-600 p-2 rounded-full hover:bg-slate-100 z-20 transition-colors">
              <CloseIcon className="w-6 h-6" />
            </button>
            <h2 className="text-2xl sm:text-4xl font-black text-[var(--c-text)] mb-2">¡Has abierto un {envelopeName}!</h2>
            <p className="text-[var(--c-text-muted)] mb-6 text-lg">¡Nuevos gatos se unen a tu colección!</p>
            <div className="overflow-y-auto max-h-[50vh] bg-[var(--c-bg)] p-2 rounded-lg border-2 border-[var(--c-text)]">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-2">
                {newImages.map((image, index) => (
                  <div key={image.id} className="flex flex-col items-center animate-popIn" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="bg-white p-1 rounded-lg shadow-md aspect-square w-full border-2 border-[var(--c-text)]">
                        <img src={image.url} alt={image.theme} className="w-full h-full object-cover rounded-md" />
                    </div>
                    <p className="mt-2 text-sm font-bold text-[var(--c-text)] capitalize">{image.theme}</p>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={onClose}
              className="mt-6 btn-cartoon btn-cartoon-primary text-lg"
            >
              ¡Genial!
            </button>
        </div>
      </div>
    </div>
  );
};

export default EnvelopeModal;