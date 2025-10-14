import React, { useState, useEffect } from 'react';
import { CatImage, Phrase } from '../types';
import { CloseIcon, TrashIcon, GlobeIcon, UsersIcon, LockIcon } from '../hooks/Icons';

interface CustomPhraseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { text: string; selectedImageId: number | null; privacy: Phrase['privacy'] }) => void;
    onDelete: (phraseId: string) => void;
    phraseToEdit: Phrase | null;
    unlockedImages: CatImage[];
}

const PrivacyOption: React.FC<{
    value: Phrase['privacy'];
    current: Phrase['privacy'];
    onClick: (value: Phrase['privacy']) => void;
    icon: React.ReactNode;
    label: string;
    description: string;
}> = ({ value, current, onClick, icon, label, description }) => (
    <button
        onClick={() => onClick(value)}
        className={`p-3 rounded-lg border-4 text-left flex items-center gap-3 w-full transition-all ${current === value ? 'bg-blue-100 border-[var(--c-primary)]' : 'bg-white hover:border-[var(--c-text)]/50'}`}
    >
        <div className="flex-shrink-0">{icon}</div>
        <div>
            <span className="font-bold text-[var(--c-text)]">{label}</span>
            <p className="text-xs text-[var(--c-text-muted)]">{description}</p>
        </div>
    </button>
);

const CustomPhraseModal: React.FC<CustomPhraseModalProps> = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    phraseToEdit,
    unlockedImages
}) => {
    const [text, setText] = useState('');
    const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
    const [privacy, setPrivacy] = useState<Phrase['privacy']>('private');

    useEffect(() => {
        if (phraseToEdit) {
            setText(phraseToEdit.text);
            setSelectedImageId(phraseToEdit.selectedImageId);
            setPrivacy(phraseToEdit.privacy || 'private');
        } else {
            // Reset for new phrase
            setText('');
            setSelectedImageId(null);
            setPrivacy('private');
        }
    }, [phraseToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave({ text, selectedImageId, privacy });
    };

    const handleDelete = () => {
        if (phraseToEdit) {
            onDelete(phraseToEdit.id);
        }
    };
    
    const canSave = text.trim().length > 0 && selectedImageId !== null;

    return (
        <div className="modal-cartoon-overlay">
            <div className="modal-cartoon-content w-full max-w-2xl">
                <header className="flex justify-between items-center p-4 border-b-4 border-[var(--c-text)]">
                    <h2 className="text-xl sm:text-2xl font-black text-[var(--c-text)]">{phraseToEdit ? 'Editar Frase' : 'Crear Nueva Frase'}</h2>
                    <button onClick={onClose} className="text-[var(--c-text)]/70 hover:text-[var(--c-text)]">
                        <CloseIcon className="w-8 h-8" />
                    </button>
                </header>

                <main className="flex-grow overflow-y-auto space-y-6 p-4 sm:p-6 bg-[var(--c-surface)]">
                    <div>
                        <label htmlFor="phraseText" className="font-bold text-[var(--c-text)] text-lg">Texto de la frase</label>
                        <input
                            id="phraseText"
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Ej: Quiero jugar"
                            className="input-cartoon mt-1 text-lg"
                        />
                    </div>

                    <div>
                        <label className="font-bold text-[var(--c-text)] text-lg">Elige una imagen</label>
                        <div className="mt-2 max-h-60 overflow-y-auto bg-white p-2 rounded-lg border-2 border-[var(--c-text)]">
                            {unlockedImages.length > 0 ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                    {unlockedImages.map(image => (
                                        <button
                                            key={image.id}
                                            onClick={() => setSelectedImageId(image.id)}
                                            className={`aspect-square rounded-lg overflow-hidden border-4 transition-all duration-200 ease-in-out ${selectedImageId === image.id ? 'border-[var(--c-primary)] ring-4 ring-offset-2 ring-[var(--c-primary)] scale-105 shadow-lg' : 'border-transparent hover:border-[var(--c-primary)]'}`}
                                        >
                                            <img src={image.url} alt={image.theme} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-[var(--c-text-muted)] py-4">No tienes imágenes desbloqueadas.</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="font-bold text-[var(--c-text)] text-lg">Visibilidad</label>
                        <div className="mt-2 space-y-2">
                            <PrivacyOption 
                                value="private"
                                current={privacy}
                                onClick={setPrivacy}
                                icon={<LockIcon className="w-6 h-6 text-slate-500" />}
                                label="Privado"
                                description="Solo tú puedes ver esta frase."
                            />
                            <PrivacyOption 
                                value="friends"
                                current={privacy}
                                onClick={setPrivacy}
                                icon={<UsersIcon className="w-6 h-6 text-blue-500" />}
                                label="Solo Amigos"
                                description="Solo tus amigos podrán verla."
                            />
                             <PrivacyOption 
                                value="public"
                                current={privacy}
                                onClick={setPrivacy}
                                icon={<GlobeIcon className="w-6 h-6 text-emerald-500" />}
                                label="Público"
                                description="Todos en la comunidad podrán verla."
                            />
                        </div>
                    </div>
                </main>
                
                <footer className="p-4 sm:p-6 mt-2 bg-[var(--c-bg)]/50 border-t-4 border-[var(--c-text)] flex justify-between items-center">
                    <div>
                        {phraseToEdit && phraseToEdit.isCustom && (
                            <button
                                onClick={handleDelete}
                                className="btn-cartoon btn-cartoon-danger flex items-center gap-2"
                            >
                                <TrashIcon className="w-5 h-5"/>
                                <span className="hidden sm:inline">Eliminar</span>
                            </button>
                        )}
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={!canSave}
                        className="btn-cartoon btn-cartoon-primary"
                    >
                        Guardar Cambios
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default CustomPhraseModal;