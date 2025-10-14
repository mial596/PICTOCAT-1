import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import * as apiService from '../services/apiService';
import { AdminUserView, PublicPhrase, Envelope, EnvelopeTypeId, ShopData, Rarity } from '../types';
import { SpinnerIcon, TrashIcon } from '../hooks/Icons';

type Tab = 'users' | 'phrases' | 'shop';

const AdminShopPanel: React.FC = () => {
    const [shopData, setShopData] = useState<ShopData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<{[key: string]: boolean}>({});
    const [error, setError] = useState('');
    const { getAccessTokenSilently } = useAuth0();

    const fetchShopData = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = await getAccessTokenSilently();
            const data = await apiService.getShopData(token);
            setShopData(data);
        } catch (err) {
            setError('Error al cargar los datos de la tienda');
        } finally {
            setIsLoading(false);
        }
    }, [getAccessTokenSilently]);

    useEffect(() => {
        fetchShopData();
    }, [fetchShopData]);

    const handleEnvelopeChange = (envelopeId: EnvelopeTypeId, field: keyof Envelope, value: string) => {
        if (!shopData) return;
        const numValue = parseInt(value, 10);
        if (isNaN(numValue) || numValue < 0) return;

        setShopData(prev => {
            if (!prev) return null;
            const newEnvelopes = { ...prev.envelopes };
            newEnvelopes[envelopeId] = { ...newEnvelopes[envelopeId], [field]: numValue };
            return { ...prev, envelopes: newEnvelopes };
        });
    };
    
    const handleRarityChange = (envelopeId: EnvelopeTypeId, rarity: Rarity, value: string) => {
        if (!shopData) return;
        const numValue = parseInt(value, 10);
        if (isNaN(numValue) || numValue < 0 || numValue > 100) return;

        setShopData(prev => {
            if (!prev) return null;
            const newEnvelopes = { ...prev.envelopes };
            const newProbs = { ...newEnvelopes[envelopeId].rarityProbabilities, [rarity]: numValue };
            newEnvelopes[envelopeId] = { ...newEnvelopes[envelopeId], rarityProbabilities: newProbs };
            return { ...prev, envelopes: newEnvelopes };
        });
    }

    const handleSave = async (envelopeId: EnvelopeTypeId) => {
        if (!shopData) return;
        setIsSaving(prev => ({...prev, [envelopeId]: true}));
        try {
            const token = await getAccessTokenSilently();
            const { baseCost, rarityProbabilities } = shopData.envelopes[envelopeId];
            
            // FIX: Ensure values are treated as numbers during summation.
            const totalProb = (rarityProbabilities.common || 0) + (rarityProbabilities.rare || 0) + (rarityProbabilities.epic || 0);
            if (totalProb !== 100) {
                alert("Las probabilidades deben sumar 100%.");
                setIsSaving(prev => ({...prev, [envelopeId]: false}));
                return;
            }

            await apiService.adminUpdateEnvelope(token, envelopeId, { baseCost, rarityProbabilities });
            alert(`¡Sobre "${shopData.envelopes[envelopeId].name}" actualizado!`);
        } catch (err) {
            setError('Error al guardar el sobre.');
        } finally {
            setIsSaving(prev => ({...prev, [envelopeId]: false}));
        }
    };

    if (isLoading) return <div className="flex justify-center p-8"><SpinnerIcon className="w-8 h-8 animate-spin" /></div>;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold">Gestionar Sobres</h3>
            {shopData && Object.values(shopData.envelopes).map((envelope: Envelope) => {
                const probs = envelope.rarityProbabilities || { common: 0, rare: 0, epic: 0 };
                const totalProb = probs.common + probs.rare + probs.epic;
                const areProbsValid = totalProb === 100;

                return (
                    <div key={envelope.id} className="card-cartoon p-4 space-y-4">
                        <h4 className="text-lg font-bold">{envelope.name}</h4>
                        <div className="flex items-center gap-2">
                            <label htmlFor={`cost-${envelope.id}`} className="font-semibold">Costo Base:</label>
                            <input
                                id={`cost-${envelope.id}`}
                                type="number"
                                value={envelope.baseCost}
                                onChange={(e) => handleEnvelopeChange(envelope.id, 'baseCost', e.target.value)}
                                className="input-cartoon !py-1 !px-2 !w-24"
                            />
                        </div>
                        <div>
                            <p className="font-semibold">Probabilidades de Rareza (%):</p>
                            <div className="flex flex-col sm:flex-row gap-4 mt-2">
                                <div className="flex items-center gap-2">
                                    <label htmlFor={`common-${envelope.id}`} className="text-sm font-bold">Común:</label>
                                    <input type="number" id={`common-${envelope.id}`} value={probs.common} onChange={e => handleRarityChange(envelope.id, 'common', e.target.value)} className="input-cartoon !py-1 !px-2 !w-20"/>
                                </div>
                                <div className="flex items-center gap-2">
                                     <label htmlFor={`rare-${envelope.id}`} className="text-sm font-bold">Raro:</label>
                                     <input type="number" id={`rare-${envelope.id}`} value={probs.rare} onChange={e => handleRarityChange(envelope.id, 'rare', e.target.value)} className="input-cartoon !py-1 !px-2 !w-20"/>
                                </div>
                                 <div className="flex items-center gap-2">
                                     <label htmlFor={`epic-${envelope.id}`} className="text-sm font-bold">Épico:</label>
                                    <input type="number" id={`epic-${envelope.id}`} value={probs.epic} onChange={e => handleRarityChange(envelope.id, 'epic', e.target.value)} className="input-cartoon !py-1 !px-2 !w-20"/>
                                </div>
                            </div>
                            <p className={`mt-2 text-sm font-bold ${areProbsValid ? 'text-green-600' : 'text-red-600'}`}>
                                Total: {totalProb}%
                            </p>
                        </div>
                        <button onClick={() => handleSave(envelope.id)} disabled={isSaving[envelope.id] || !areProbsValid} className="btn-cartoon btn-cartoon-primary self-start">
                            {isSaving[envelope.id] ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : 'Guardar'}
                        </button>
                    </div>
                );
            })}
        </div>
    );
};


const AdminPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('users');
    const [users, setUsers] = useState<AdminUserView[]>([]);
    const [phrases, setPhrases] = useState<PublicPhrase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { getAccessTokenSilently } = useAuth0();

    const fetchData = useCallback(async (tab: Tab) => {
        if (tab === 'shop') {
            setIsLoading(false); // Shop panel has its own loader
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const token = await getAccessTokenSilently();
            if (tab === 'users') {
                const data = await apiService.adminGetAllUsers(token);
                setUsers(data);
            } else {
                const data = await apiService.adminGetPublicPhrases(token);
                setPhrases(data);
            }
        } catch (err) {
            setError('Error al cargar los datos.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [getAccessTokenSilently]);

    useEffect(() => {
        fetchData(activeTab);
    }, [activeTab, fetchData]);

    const handleSetVerified = async (userId: string, isVerified: boolean) => {
        try {
            const token = await getAccessTokenSilently();
            await apiService.adminSetVerifiedStatus(token, userId, isVerified);
            setUsers(users.map(u => u.id === userId ? { ...u, isVerified } : u));
        } catch (err) {
            alert('Error al actualizar el estado de verificación.');
        }
    };
    
    const handleCensorPhrase = async (publicPhraseId: string) => {
        if (!window.confirm('¿Estás seguro de que quieres censurar esta frase? Esta acción no se puede deshacer.')) return;
        try {
            const token = await getAccessTokenSilently();
            await apiService.adminCensorPhrase(token, publicPhraseId);
            setPhrases(phrases.filter(p => p.publicPhraseId !== publicPhraseId));
        } catch(err) {
            alert('Error al censurar la frase.');
        }
    };

    const renderContent = () => {
        if (activeTab === 'shop') {
            return <AdminShopPanel />;
        }
        if (isLoading) return <div className="flex justify-center p-8"><SpinnerIcon className="w-8 h-8 animate-spin" /></div>;
        if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

        if (activeTab === 'users') {
            return (
                <div className="space-y-2">
                    {users.map(user => (
                        <div key={user.id} className="card-cartoon p-3 flex justify-between items-center">
                            <div>
                                <p className="font-bold">{user.email} <span className="text-xs text-[var(--c-ink-light)]/50">({user.role})</span></p>
                                <p className="text-xs text-[var(--c-ink-light)]/70">{user.id}</p>
                            </div>
                            <button onClick={() => handleSetVerified(user.id, !user.isVerified)} className={`btn-cartoon ${user.isVerified ? 'btn-cartoon-danger' : 'btn-cartoon-primary'}`}>
                                {user.isVerified ? 'Quitar Verificación' : 'Verificar'}
                            </button>
                        </div>
                    ))}
                </div>
            );
        }

        if (activeTab === 'phrases') {
            return (
                <div className="space-y-4">
                    {phrases.map(phrase => (
                        <div key={phrase.publicPhraseId} className="card-cartoon p-3 flex justify-between items-center gap-4">
                            <img src={phrase.imageUrl} alt="" className="w-16 h-16 rounded-md object-cover border-2 border-[var(--c-ink-light)]" />
                            <div className="flex-grow">
                                <p className="font-bold text-lg">"{phrase.text}"</p>
                                <p className="text-sm text-[var(--c-ink-light)]/70">de {phrase.email}</p>
                            </div>
                            <button onClick={() => handleCensorPhrase(phrase.publicPhraseId)} className="btn-cartoon btn-cartoon-danger !p-3">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div>
            <h1 className="text-3xl sm:text-4xl font-black text-[var(--c-ink-light)] mb-6">Panel de Administración</h1>
            <div className="flex border-b-2 border-[var(--c-ink-light)]/20 mb-4">
                <button onClick={() => setActiveTab('users')} className={`px-4 py-2 font-bold ${activeTab === 'users' ? 'border-b-4 border-[var(--c-ink-light)] text-[var(--c-ink-light)]' : 'text-[var(--c-ink-light)]/60'}`}>Usuarios</button>
                <button onClick={() => setActiveTab('phrases')} className={`px-4 py-2 font-bold ${activeTab === 'phrases' ? 'border-b-4 border-[var(--c-ink-light)] text-[var(--c-ink-light)]' : 'text-[var(--c-ink-light)]/60'}`}>Frases Públicas</button>
                 <button onClick={() => setActiveTab('shop')} className={`px-4 py-2 font-bold ${activeTab === 'shop' ? 'border-b-4 border-[var(--c-ink-light)] text-[var(--c-ink-light)]' : 'text-[var(--c-ink-light)]/60'}`}>Tienda</button>
            </div>
            {renderContent()}
        </div>
    );
};

export default AdminPanel;
