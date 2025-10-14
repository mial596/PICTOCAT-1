import React, { useState, useCallback } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import * as apiService from '../services/apiService';
import { SearchableUser } from '../types';
import { SearchIcon, SpinnerIcon, VerifiedIcon, UsersIcon } from '../hooks/Icons';
import { useAuth0 } from '@auth0/auth0-react';

interface UserSearchProps {
    onSelectUser: (username: string) => void;
}

const UserSearch: React.FC<UserSearchProps> = ({ onSelectUser }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchableUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const { getAccessTokenSilently } = useAuth0();

    const performSearch = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setResults([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        // FIX: Pass the authentication token to the searchUsers API call.
        const token = await getAccessTokenSilently();
        const users = await apiService.searchUsers(token, searchQuery);
        setResults(users);
        setIsLoading(false);
        setHasSearched(true);
    }, [getAccessTokenSilently]);

    useDebounce(() => performSearch(query), 500, [query]);

    const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        if (e.target.value.length >= 2) {
             setIsLoading(true);
        } else {
            setIsLoading(false);
            setResults([]);
            setHasSearched(false);
        }
    };
    
    const renderResults = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center p-10">
                    <SpinnerIcon className="w-8 h-8 animate-spin text-[var(--c-ink-light)]" />
                </div>
            );
        }
        
        if (results.length > 0) {
            return (
                <div className="space-y-2">
                    {results.map(user => (
                        <div
                            key={user.username}
                            onClick={() => onSelectUser(user.username)}
                            className="card-cartoon p-3 flex items-center gap-3"
                        >
                            <div className="font-bold text-lg text-[var(--c-ink-light)]">{user.username}</div>
                            {user.isVerified && <VerifiedIcon className="w-5 h-5 text-blue-500" />}
                        </div>
                    ))}
                </div>
            );
        }

        if (hasSearched) {
            return (
                 <div className="text-center py-10 text-[var(--c-ink-light)]/70">
                    <p>No se encontraron usuarios.</p>
                </div>
            )
        }
        
         return (
             <div className="text-center py-10 text-[var(--c-ink-light)]/70">
                <UsersIcon className="w-16 h-16 mx-auto mb-4" />
                <p className="font-bold">Encuentra a otros jugadores</p>
                <p>Escribe al menos 2 caracteres para buscar.</p>
            </div>
        )
    };

    return (
        <div className="max-w-2xl mx-auto p-4 sm:p-6">
            <h1 className="text-3xl font-black text-[var(--c-ink-light)] mb-2 text-center">Comunidad PictoCat</h1>
            <p className="text-[var(--c-ink-light)]/80 text-center mb-6">Busca a otros usuarios y mira sus perfiles públicos.</p>

            <div className="relative mb-6">
                <input
                    type="text"
                    value={query}
                    onChange={handleQueryChange}
                    placeholder="Buscar por @usuario..."
                    className="input-cartoon w-full pl-12 text-lg"
                />
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[var(--c-ink-light)]/40" />
            </div>

            <div className="bg-white/50 p-4 rounded-lg min-h-[200px] border-2 border-[var(--c-ink-light)]/20">
                {renderResults()}
            </div>
        </div>
    );
};

export default UserSearch;
