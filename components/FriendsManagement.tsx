import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import * as apiService from '../services/apiService';
import { Friend, FriendRequest } from '../types';
import { SpinnerIcon, UserCheckIcon, CloseIcon, UserMinusIcon, UsersIcon } from '../hooks/Icons';

interface FriendsManagementProps {
    onProfileClick: (username: string) => void;
}

const FriendsManagement: React.FC<FriendsManagementProps> = ({ onProfileClick }) => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { getAccessTokenSilently } = useAuth0();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getAccessTokenSilently();
            const data = await apiService.getFriendData(token);
            setFriends(data.friends);
            setRequests(data.requests);
        } catch (err) {
            setError("No se pudieron cargar los datos de amigos.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [getAccessTokenSilently]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRespondRequest = async (targetUserId: string, action: 'accept' | 'reject') => {
        try {
            const token = await getAccessTokenSilently();
            await apiService.respondToFriendRequest(token, targetUserId, action);
            fetchData(); // Refresh data
        } catch (err) {
            alert('No se pudo responder a la solicitud.');
        }
    };

    const handleRemoveFriend = async (targetUserId: string, username: string) => {
        if(window.confirm(`¿Estás seguro de que quieres eliminar a ${username} de tus amigos?`)) {
            try {
                const token = await getAccessTokenSilently();
                await apiService.removeFriend(token, targetUserId);
                fetchData(); // Refresh data
            } catch (err) {
                alert('No se pudo eliminar al amigo.');
            }
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><SpinnerIcon className="w-8 h-8 animate-spin" /></div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-500">{error}</div>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <section>
                <h2 className="text-2xl font-bold text-[var(--c-ink-light)] mb-4">Solicitudes de Amistad ({requests.length})</h2>
                {requests.length > 0 ? (
                    <div className="space-y-2">
                        {requests.map(req => (
                            <div key={req.userId} className="card-cartoon p-3 flex justify-between items-center">
                                <span className="font-bold cursor-pointer hover:underline" onClick={() => onProfileClick(req.username)}>@{req.username}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => handleRespondRequest(req.userId, 'accept')} className="btn-cartoon btn-cartoon-primary !p-2" title="Aceptar"><UserCheckIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleRespondRequest(req.userId, 'reject')} className="btn-cartoon btn-cartoon-danger !p-2" title="Rechazar"><CloseIcon className="w-5 h-5"/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-[var(--c-ink-light)]/70">No tienes solicitudes pendientes.</p>
                )}
            </section>
             <section>
                <h2 className="text-2xl font-bold text-[var(--c-ink-light)] mb-4">Mis Amigos ({friends.length})</h2>
                {friends.length > 0 ? (
                    <div className="space-y-2">
                        {friends.map(friend => (
                            <div key={friend.userId} className="card-cartoon p-3 flex justify-between items-center">
                                <span className="font-bold cursor-pointer hover:underline" onClick={() => onProfileClick(friend.username)}>@{friend.username}</span>
                                 <button onClick={() => handleRemoveFriend(friend.userId, friend.username)} className="btn-cartoon btn-cartoon-danger !p-2" title="Eliminar Amigo"><UserMinusIcon className="w-5 h-5"/></button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-[var(--c-ink-light)]/70">
                        <UsersIcon className="w-16 h-16 mx-auto mb-4" />
                        <p className="font-bold">¡Aún no tienes amigos!</p>
                        <p>Usa la pestaña de búsqueda para encontrar a otros jugadores.</p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default FriendsManagement;