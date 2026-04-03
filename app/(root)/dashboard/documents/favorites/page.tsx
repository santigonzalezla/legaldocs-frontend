'use client';

import styles from './page.module.css';
import {useState} from 'react';
import {useFetch} from '@/hooks/useFetch';
import {toast} from 'sonner';
import type {Document, PaginatedResponse} from '@/app/interfaces/interfaces';
import DocumentFilters from '@/app/components/documents/shared/documentfilters/DocumentFilters';
import FavoritesList   from '@/app/components/documents/favorites/favoriteslist/FavoritesList';

const statusOptions = [
    {value: 'all', label: 'Todos los favoritos'},
];

const Favorites = () =>
{
    const [searchTerm,   setSearchTerm]   = useState('');
    const [selectedType, setSelectedType] = useState('all');

    const {data: response, isLoading, execute: refetch} =
        useFetch<PaginatedResponse<Document>>('document?isFavorite=true&limit=100', {firmScoped: true});

    const {execute: toggleFav} =
        useFetch<{isFavorite: boolean}>('', {method: 'PATCH', immediate: false, firmScoped: true});

    const docs = response?.data ?? [];

    const handleRemoveFavorite = async (doc: Document) =>
    {
        await toggleFav({}, `document/${doc.id}/favorite`);
        toast.success('Quitado de favoritos.');
        refetch();
    };

    return (
        <div className={styles.favorites}>
            <div className={styles.header}>
                <h1>Documentos Favoritos</h1>
                <p>Tus documentos más importantes y frecuentemente utilizados.</p>
            </div>

            <DocumentFilters
                searchTerm={searchTerm}     onSearchChange={setSearchTerm}
                selectedStatus="all"        onStatusChange={() => {}}
                selectedType={selectedType} onTypeChange={setSelectedType}
                statusOptions={statusOptions}
            />

            {isLoading ? (
                <p style={{textAlign: 'center', padding: '2rem', color: '#6b7280'}}>Cargando favoritos...</p>
            ) : (
                <FavoritesList
                    documents={docs}
                    searchTerm={searchTerm}
                    selectedType={selectedType}
                    onRemoveFavorite={handleRemoveFavorite}
                />
            )}
        </div>
    );
};

export default Favorites;
