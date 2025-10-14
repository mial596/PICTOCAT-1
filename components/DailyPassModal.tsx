import React, { useState, useEffect } from 'react';
import { DailyPassStatus } from '../types';
import { CloseIcon, GiftIcon, CoinIcon, TimeIcon } from '../hooks/Icons';

interface DailyPassModalProps {
    isOpen: boolean;
    onClose: () => void;
    onClaim: () => void;
    status: DailyPassStatus | null;
    onRefreshStatus: () => void;
}

const CountdownTimer: React.FC<{ nextPassTimestamp: number; onRefresh: () => void }> = ({ nextPassTimestamp, onRefresh }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = Date.now();
            const remaining = Math.max(0, nextPassTimestamp - now);
            
            if (remaining === 0) {
                onRefresh();
                return '¡Listo para reclamar!';
            }

            const hours = String(Math.floor(remaining / (1000 * 60 * 60))).padStart(2, '0');
            const minutes = String(Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
            const seconds = String(Math.floor((remaining % (1000 * 60)) / 1000)).padStart(2, '0');
            
            return `${hours}:${minutes}:${seconds}`;
        };

        setTimeLeft(calculateTimeLeft());
        const interval = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);

        return () => clearInterval(interval);
    }, [nextPassTimestamp, onRefresh]);

    return <span className="font-mono text-lg">{timeLeft}</span>;
};

const DailyPassModal: React.FC<DailyPassModalProps> = ({ isOpen, onClose, onClaim, status, onRefreshStatus }) => {
    if (!isOpen) return null;

    const { rewards, isClaimable, nextPassTimestamp } = status || {};
    const upgradeIcon = rewards?.upgrade?.icon === 'coin' ? <CoinIcon className="w-8 h-8 text-yellow-500" /> : <TimeIcon className="w-8 h-8 text-blue-500" />;

    const hasImages = rewards && rewards.images.length > 0;
    const hasCoinReward = rewards && rewards.coinReward && rewards.coinReward > 0;

    return (
        <div className="modal-cartoon-overlay">
            <div className="modal-cartoon-content w-full max-w-lg">
                <header className="flex justify-between items-center p-4 border-b-4 border-[var(--c-text)]">
                    <div className="flex items-center gap-3">
                        <GiftIcon className="w-8 h-8 text-purple-600" />
                        <h2 className="text-2xl font-black text-[var(--c-text)]">Pase Gatuno Diario</h2>
                    </div>
                    <button onClick={onClose} className="text-[var(--c-text)]/70 hover:text-[var(--c-text)]">
                        <CloseIcon className="w-8 h-8" />
                    </button>
                </header>

                <main className="flex-grow overflow-y-auto p-6 space-y-6">
                    {rewards ? (
                        <>
                            {hasImages && (
                                <div>
                                    <h3 className="font-bold text-lg text-slate-700 mb-2">Imágenes de Gato del Día</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {rewards.images.map(image => (
                                            <div key={image.id} className="text-center">
                                                <div className="bg-white p-1 rounded-lg shadow-md aspect-square w-full border-2 border-slate-800">
                                                    <img src={image.url} alt={image.theme} className="w-full h-full object-cover rounded-md" />
                                                </div>
                                                <p className="mt-2 text-sm font-bold capitalize">{image.theme}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                             {hasCoinReward && !hasImages && (
                                <div>
                                    <h3 className="font-bold text-lg text-slate-700 mb-2">Recompensa de Bonificación</h3>
                                    <div className="bg-amber-100 p-4 rounded-lg border-2 border-amber-400 flex flex-col items-center text-center">
                                        <CoinIcon className="w-12 h-12 text-amber-500 mb-2" />
                                        <p className="font-bold text-lg text-amber-700">¡Has ganado {rewards.coinReward} monedas!</p>
                                        <p className="text-sm text-amber-600">¡Ya has coleccionado todos los gatos!</p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <h3 className="font-bold text-lg text-slate-700 mb-2">Mejora del Día</h3>
                                {rewards.upgrade ? (
                                    <div className="bg-white p-4 rounded-lg border-2 border-slate-800 flex items-center gap-4">
                                        <div className="flex-shrink-0 bg-slate-100 p-2 rounded-full">{upgradeIcon}</div>
                                        <div>
                                            <h4 className="font-bold">{rewards.upgrade.name}</h4>
                                            <p className="text-sm text-slate-600">{rewards.upgrade.description}</p>
                                        </div>
                                    </div>
                                ) : <p>No hay mejora hoy.</p>}
                            </div>
                        </>
                    ) : (
                        <p>Cargando recompensas...</p>
                    )}
                </main>
                
                <footer className="p-4 bg-[var(--c-bg)]/50 border-t-4 border-[var(--c-text)]">
                    {isClaimable ? (
                        <button onClick={onClaim} className="btn-cartoon btn-cartoon-primary w-full text-lg">
                            ¡Reclamar Recompensa!
                        </button>
                    ) : (
                        <div className="text-center font-bold text-slate-700">
                            <p>Próximo pase en:</p>
                            <CountdownTimer nextPassTimestamp={nextPassTimestamp || 0} onRefresh={onRefreshStatus} />
                        </div>
                    )}
                </footer>
            </div>
        </div>
    );
};

export default DailyPassModal;