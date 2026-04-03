'use client';

import type {Document} from '@/app/interfaces/interfaces';
import TrashGrid from '@/app/components/documents/trash/trashgrid/TrashGrid';

export const daysUntilExpiry = (trashExpiresAt: string | null): number =>
{
    if (!trashExpiresAt) return 30;
    const ms = new Date(trashExpiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
};

export const expiryStatus = (days: number) =>
{
    if (days <= 7)  return {text: 'Expira pronto',    color: '#dc2626', urgent: true};
    if (days <= 14) return {text: 'Pronto a expirar', color: '#f59e0b', urgent: false};
    return              {text: `${days} días`,         color: '#10b981', urgent: false};
};

interface TrashListProps
{
    documents:          Document[];
    searchTerm?:        string;
    selectedType?:      string;
    onRestore?:         (doc: Document) => void;
    onPermanentDelete?: (doc: Document) => void;
}

const TrashList = ({documents, searchTerm, selectedType, onRestore, onPermanentDelete}: TrashListProps) =>
{
    const filtered = documents.filter(doc =>
    {
        const term = searchTerm?.trim().toLowerCase() ?? '';
        const matchesSearch = !term || doc.title.toLowerCase().includes(term);
        const matchesType   = !selectedType || selectedType === 'all' || doc.documentType === selectedType;
        return matchesSearch && matchesType;
    });

    if (filtered.length === 0)
        return (
            <div style={{textAlign: 'center', padding: '32px', color: '#6b7280', fontSize: '18px'}}>
                {searchTerm || (selectedType && selectedType !== 'all')
                    ? 'No se encontraron elementos con los filtros aplicados.'
                    : 'La papelera está vacía.'}
            </div>
        );

    return <TrashGrid documents={filtered} onRestore={onRestore} onPermanentDelete={onPermanentDelete} />;
};

export default TrashList;
