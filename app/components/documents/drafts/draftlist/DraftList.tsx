'use client';

import type {Document} from '@/app/interfaces/interfaces';
import {formatDate, formatType} from '@/app/components/documents/generated/documentlist/DocumentList';
import DraftGrid  from '@/app/components/documents/drafts/draftgrid/DraftGrid';
import DraftTable from '@/app/components/documents/drafts/drafttable/DraftTable';

interface DraftListProps
{
    documents:    Document[];
    searchTerm?:  string;
    selectedType?: string;
    viewMode?:    'grid' | 'table';
    onTrash?:     (doc: Document) => void;
}

const DraftList = ({documents, searchTerm, selectedType, viewMode, onTrash}: DraftListProps) =>
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
                    ? 'No se encontraron borradores con los filtros aplicados.'
                    : 'No hay borradores disponibles.'}
            </div>
        );

    if (viewMode === 'table')
        return <DraftTable documents={filtered} onTrash={onTrash} />;

    return <DraftGrid documents={filtered} onTrash={onTrash} />;
};

export default DraftList;
