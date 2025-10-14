import React, { useState, useEffect } from 'react';
import { UserProfile, CatImage } from '../types';
import { CloseIcon, SpinnerIcon } from '../hooks/Icons';
import { DEFAULT_PIC_URL } from '../constants';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserProfile: UserProfile;
    unlockedImages: CatImage[];
    onSave: (username: string, bio: string, profilePictureId: number | null) => Promise<void>;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, currentUserProfile, unlockedImages, onSave }) => {
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [profilePictureId, setProfilePictureId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setUsername(currentUserProfile.email);
            setBio(currentUserProfile.data.bio);
            setProfilePictureId(currentUserProfile.data.profilePictureId);
            setError('');
            setIsSaving(false);
        }
    }, [isOpen, currentUserProfile]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
            setError('El nombre de usuario debe tener entre 3 y 20 caracteres y solo puede contener letras, números y guiones bajos.');
            return;
        }
        if (bio.length > 150) {
            setError('La biografía no puede exceder los 150 caracteres.');
            return;
        }
        setError('');
        setIsSaving(true);
        try {
            await onSave(username, bio, profilePictureId);
        } catch (err) {
             setError('Error al guardar. El nombre de usuario puede que ya esté en uso.');
        } finally {
            setIsSaving(false);
        }
    };
    
    const currentPicUrl = unlockedImages.find(img => img.id === profilePictureId)?.url || DEFAULT_PIC_URL;

    return (
        <div className="modal-cartoon-overlay">
            <div className="modal-cartoon-content w-full max-w-2xl">
                <header className="flex justify-between items-center p-4 border-b-4 border-[var(--c-text)]">
                    <h2 className="text-2xl font-black text-[var(--c-text)]">Editar Perfil</h2>
                    <button onClick={onClose} className="text-[var(--c-text)]/70 hover:text-[var(--c-text)]">
                        <CloseIcon className="w-8 h-8" />
                    </button>
                </header>

                <main className="flex-grow overflow-y-auto space-y-6 p-6">
                    <div>
                        <label className="font-bold text-[var(--c-text)]/80 text-lg">Foto de Perfil</label>
                        <div className="flex items-center gap-4 mt-1">
                             <img src={currentPicUrl} alt="Current profile" className="w-20 h-20 rounded-full object-cover border-4 border-[var(--c-text)]" />
                             <div className="max-h-48 overflow-y-auto bg-white p-2 rounded-lg border-2 border-[var(--c-text)]/50 flex-grow">
                                {unlockedImages.length > 0 ? (
                                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                                        {unlockedImages.map(image => (
                                            <button
                                                key={image.id}
                                                onClick={() => setProfilePictureId(image.id)}
                                                className={`aspect-square rounded-lg overflow-hidden border-4 transition-all ${profilePictureId === image.id ? 'border-[var(--c-primary)] ring-2 ring-[var(--c-primary)]' : 'border-transparent hover:border-[var(--c-primary)]'}`}
                                            >
                                                <img src={image.url} alt={image.theme} className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                ) : <p className="text-sm p-4 text-center">Desbloquea imágenes para usarlas como foto de perfil.</p>}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="username" className="font-bold text-[var(--c-text)]/80 text-lg">Nombre de usuario</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="input-cartoon mt-1 text-lg"
                        />
                         <p className="text-xs text-[var(--c-text)]/60 mt-1">De 3 a 20 caracteres (letras, números, _).</p>
                    </div>
                    <div>
                        <label htmlFor="bio" className="font-bold text-[var(--c-text)]/80 text-lg">Biografía</label>
                        <textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={3}
                            maxLength={150}
                            className="input-cartoon mt-1 text-base"
                            placeholder="Cuéntanos algo sobre ti..."
                        />
                        <p className="text-right text-xs text-[var(--c-text)]/60 mt-1">{bio.length} / 150</p>
                    </div>

                    {error && <p className="text-sm text-red-500 bg-red-100 p-2 rounded-md border border-red-300">{error}</p>}
                </main>
                
                <footer className="p-4 bg-[var(--c-bg)]/50 border-t-4 border-[var(--c-text)] flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="btn-cartoon btn-cartoon-primary flex items-center justify-center min-w-[120px]"
                    >
                        {isSaving ? <SpinnerIcon className="w-6 h-6 animate-spin"/> : 'Guardar'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default EditProfileModal;