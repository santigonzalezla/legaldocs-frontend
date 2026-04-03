'use client';

import styles from './page.module.css';
import {useState} from 'react';
import {useFetch} from '@/hooks/useFetch';
import {toast} from 'sonner';
import type {Document, PaginatedResponse} from '@/app/interfaces/interfaces';
import DocumentFilters from '@/app/components/documents/shared/documentfilters/DocumentFilters';
import TrashList       from '@/app/components/documents/trash/trashlist/TrashList';
import {daysUntilExpiry} from '@/app/components/documents/trash/trashlist/TrashList';

const statusOptions = [
    {value: 'all', label: 'Todos los eliminados'},
];

const Trash = () =>
{
    const [searchTerm,   setSearchTerm]   = useState('');
    const [selectedType, setSelectedType] = useState('all');

    const {data: response, isLoading, execute: refetch} =
        useFetch<PaginatedResponse<Document>>('document?inTrash=true&limit=100', {firmScoped: true});

    const {execute: restoreDoc} =
        useFetch<Document>('', {method: 'PATCH', immediate: false, firmScoped: true});

    const {execute: permanentDelete} =
        useFetch<void>('', {method: 'DELETE', immediate: false, firmScoped: true});

    const docs = response?.data ?? [];

    const expiringSoon = docs.filter(d => daysUntilExpiry(d.trashExpiresAt) <= 7).length;

    const handleRestore = async (doc: Document) =>
    {
        await restoreDoc({}, `document/${doc.id}/restore`);
        toast.success(`"${doc.title}" restaurado correctamente.`);
        refetch();
    };

    const handlePermanentDelete = async (doc: Document) =>
    {
        if (!window.confirm(`¿Eliminar permanentemente "${doc.title}"? Esta acción no se puede deshacer.`)) return;
        await permanentDelete({}, `document/${doc.id}/permanent`);
        toast.success('Documento eliminado permanentemente.');
        refetch();
    };

    return (
        <div className={styles.trash}>
            <div className={styles.header}>
                <h1>Papelera</h1>
                <p>
                    Los documentos se eliminan automáticamente después de 30 días.
                    {expiringSoon > 0 && (
                        <strong style={{color: '#dc2626'}}> {expiringSoon} documento{expiringSoon > 1 ? 's expiran' : ' expira'} pronto.</strong>
                    )}
                </p>
            </div>

            <DocumentFilters
                searchTerm={searchTerm}     onSearchChange={setSearchTerm}
                selectedStatus="all"        onStatusChange={() => {}}
                selectedType={selectedType} onTypeChange={setSelectedType}
                statusOptions={statusOptions}
            />

            {isLoading ? (
                <p style={{textAlign: 'center', padding: '2rem', color: '#6b7280'}}>Cargando papelera...</p>
            ) : (
                <TrashList
                    documents={docs}
                    searchTerm={searchTerm}
                    selectedType={selectedType}
                    onRestore={handleRestore}
                    onPermanentDelete={handlePermanentDelete}
                />
            )}
        </div>
    );
};

export default Trash;
