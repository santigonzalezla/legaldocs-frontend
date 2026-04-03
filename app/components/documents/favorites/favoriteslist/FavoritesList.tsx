'use client';

import type {Document} from '@/app/interfaces/interfaces';
import {formatType} from '@/app/components/documents/generated/documentlist/DocumentList';
import FavoritesGrid from '@/app/components/documents/favorites/favoritesgrid/FavoritesGrid';

interface FavoritesListProps
{
    documents:         Document[];
    searchTerm?:       string;
    selectedType?:     string;
    onRemoveFavorite?: (doc: Document) => void;
}

const FavoritesList = ({documents, searchTerm, selectedType, onRemoveFavorite}: FavoritesListProps) =>
{
    const filtered = documents.filter(doc =>
    {
        const term = searchTerm?.trim().toLowerCase() ?? '';
        const matchesSearch = !term || doc.title.toLowerCase().includes(term);
        const matchesType   = !selectedType || selectedType === 'all' || doc.branchSlug === selectedType;
        return matchesSearch && matchesType;
    });

    if (filtered.length === 0)
        return (
            <div style={{textAlign: 'center', padding: '32px', color: '#6b7280', fontSize: '18px'}}>
                {searchTerm || (selectedType && selectedType !== 'all')
                    ? 'No se encontraron favoritos con los filtros aplicados.'
                    : 'No hay documentos favoritos.'}
            </div>
        );

    return <FavoritesGrid documents={filtered} onRemoveFavorite={onRemoveFavorite} />;
};

export default FavoritesList;
