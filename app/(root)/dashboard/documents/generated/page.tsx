'use client';

import styles from './page.module.css';
import {useState} from 'react';
import {Clock, File, FileCheck, Star} from '@/app/components/svg';
import {useFetch} from '@/hooks/useFetch';
import {toast} from 'sonner';
import type {Document, LegalBranch, PaginatedResponse} from '@/app/interfaces/interfaces';
import {DocumentStatus} from '@/app/interfaces/enums';
import DocumentStatCard   from '@/app/components/documents/generated/documentstatscard/DocumentStatsCard';
import DocumentFilters    from '@/app/components/documents/shared/documentfilters/DocumentFilters';
import DocumentList       from '@/app/components/documents/generated/documentlist/DocumentList';

const statusOptions = [
    {value: 'all',                        label: 'Todos los estados'},
    {value: DocumentStatus.COMPLETED,     label: 'Completados'},
    {value: DocumentStatus.DRAFT,         label: 'Borradores'},
    {value: DocumentStatus.REVISION,      label: 'En Revisión'},
    {value: DocumentStatus.ARCHIVED,      label: 'Archivados'},
];

const Generated = () =>
{
    const [searchTerm,     setSearchTerm]     = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedType,   setSelectedType]   = useState('all');
    const [viewMode,       setViewMode]       = useState<'grid' | 'table'>('grid');

    const {data: response, isLoading, execute: refetch} =
        useFetch<PaginatedResponse<Document>>('document?limit=100', {firmScoped: true});

    const {data: branchList} =
        useFetch<LegalBranch[]>('branch?isActive=true&limit=50', {firmScoped: true});

    const typeOptions = [
        {value: 'all', label: 'Todas las ramas'},
        ...(branchList ?? []).map(b => ({value: b.slug, label: b.name})),
    ];

    const {execute: trashDoc} =
        useFetch<void>('', {method: 'DELETE', immediate: false, firmScoped: true});

    const {execute: toggleFav} =
        useFetch<{isFavorite: boolean}>('', {method: 'PATCH', immediate: false, firmScoped: true});

    const docs = response?.data ?? [];

    const stats = {
        total:     docs.length,
        completed: docs.filter(d => d.status === DocumentStatus.COMPLETED).length,
        revision:  docs.filter(d => d.status === DocumentStatus.REVISION).length,
        favorites: docs.filter(d => d.isFavorite).length,
    };

    const handleTrash = async (doc: Document) =>
    {
        if (!window.confirm(`¿Mover "${doc.title}" a la papelera?`)) return;
        const result = await trashDoc({}, `document/${doc.id}`);
        if (!result) return;
        toast.success('Documento movido a la papelera.');
        refetch();
    };

    const handleToggleFavorite = async (doc: Document) =>
    {
        const result = await toggleFav({}, `document/${doc.id}/favorite`);
        if (!result) return;
        toast.success(doc.isFavorite ? 'Quitado de favoritos.' : 'Agregado a favoritos.');
        refetch();
    };

    return (
        <div className={styles.generated}>
            <div className={styles.header}>
                <h1>Documentos Generados</h1>
                <p>Gestiona y organiza todos los documentos jurídicos generados en tu despacho.</p>
                <div className={styles.statsContainer}>
                    {[
                        {title: 'Generados',   value: stats.total,     percentage: 100,                                             icon: <File />,      color: '#3b82f6', bgColor: '#eff6ff'},
                        {title: 'Completados', value: stats.completed, percentage: stats.total ? Math.round(stats.completed / stats.total * 100) : 0, icon: <FileCheck />, color: '#10b981', bgColor: '#ecfdf5'},
                        {title: 'En Revisión', value: stats.revision,  percentage: stats.total ? Math.round(stats.revision  / stats.total * 100) : 0, icon: <Clock />,     color: '#f59e0b', bgColor: '#fffbeb'},
                        {title: 'Favoritos',   value: stats.favorites, percentage: stats.total ? Math.round(stats.favorites / stats.total * 100) : 0, icon: <Star />,      color: '#ef4444', bgColor: '#fef2f2'},
                    ].map((s, i) => (
                        <DocumentStatCard documentStat={s} key={i} />
                    ))}
                </div>
            </div>

            <DocumentFilters
                searchTerm={searchTerm}       onSearchChange={setSearchTerm}
                selectedStatus={selectedStatus} onStatusChange={setSelectedStatus}
                selectedType={selectedType}    onTypeChange={setSelectedType}
                viewMode={viewMode}            onViewModeChange={setViewMode}
                statusOptions={statusOptions}
                typeOptions={typeOptions}
            />

            {isLoading ? (
                <p style={{textAlign: 'center', padding: '2rem', color: '#6b7280'}}>Cargando documentos...</p>
            ) : (
                <DocumentList
                    documents={docs}
                    searchTerm={searchTerm}
                    selectedStatus={selectedStatus}
                    selectedType={selectedType}
                    viewMode={viewMode}
                    onTrash={handleTrash}
                    onToggleFavorite={handleToggleFavorite}
                />
            )}
        </div>
    );
};

export default Generated;
