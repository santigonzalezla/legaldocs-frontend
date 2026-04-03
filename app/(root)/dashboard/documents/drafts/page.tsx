'use client';

import styles from './page.module.css';
import {useState} from 'react';
import {Clock, FileClock, FilePen} from '@/app/components/svg';
import {useFetch} from '@/hooks/useFetch';
import {toast} from 'sonner';
import type {Document, LegalBranch, PaginatedResponse} from '@/app/interfaces/interfaces';
import {DocumentStatus} from '@/app/interfaces/enums';
import StatsCard       from '@/app/components/documents/shared/statscard/StatsCard';
import DocumentFilters from '@/app/components/documents/shared/documentfilters/DocumentFilters';
import DraftList       from '@/app/components/documents/drafts/draftlist/DraftList';

const statusOptions = [
    {value: 'all', label: 'Todos los borradores'},
];

const Drafts = () =>
{
    const [searchTerm,   setSearchTerm]   = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [viewMode,     setViewMode]     = useState<'grid' | 'table'>('grid');

    const {data: response, isLoading, execute: refetch} =
        useFetch<PaginatedResponse<Document>>(`document?status=${DocumentStatus.DRAFT}&limit=100`, {firmScoped: true});

    const {data: branchList} =
        useFetch<LegalBranch[]>('branch?isActive=true&limit=50', {firmScoped: true});

    const typeOptions = [
        {value: 'all', label: 'Todas las ramas'},
        ...(branchList ?? []).map(b => ({value: b.slug, label: b.name})),
    ];

    const {execute: trashDoc} =
        useFetch<void>('', {method: 'DELETE', immediate: false, firmScoped: true});

    const docs = response?.data ?? [];

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const stats = {
        total:   docs.length,
        recent:  docs.filter(d => new Date(d.updatedAt).getTime() > sevenDaysAgo).length,
        older:   docs.filter(d => new Date(d.updatedAt).getTime() <= sevenDaysAgo).length,
    };

    const handleTrash = async (doc: Document) =>
    {
        if (!window.confirm(`¿Mover "${doc.title}" a la papelera?`)) return;
        await trashDoc({}, `document/${doc.id}`);
        toast.success('Borrador movido a la papelera.');
        refetch();
    };

    return (
        <div className={styles.drafts}>
            <div className={styles.header}>
                <h1>Borradores</h1>
                <p>Aquí puedes gestionar todos tus borradores de documentos legales.</p>
                <div className={styles.statsContainer}>
                    {[
                        {title: 'Total Borradores', value: stats.total,  icon: <FilePen />,  color: '#3b82f6', bgColor: '#eff6ff'},
                        {title: 'Recientes (7d)',   value: stats.recent, icon: <Clock />,    color: '#10b981', bgColor: '#ecfdf5'},
                        {title: 'Anteriores',       value: stats.older,  icon: <FileClock />, color: '#f59e0b', bgColor: '#fffbeb'},
                    ].map((s, i) => (
                        <StatsCard statCrad={s} key={i} />
                    ))}
                </div>
            </div>

            <DocumentFilters
                searchTerm={searchTerm}     onSearchChange={setSearchTerm}
                selectedStatus="all"        onStatusChange={() => {}}
                selectedType={selectedType} onTypeChange={setSelectedType}
                viewMode={viewMode}         onViewModeChange={setViewMode}
                statusOptions={statusOptions}
                typeOptions={typeOptions}
            />

            {isLoading ? (
                <p style={{textAlign: 'center', padding: '2rem', color: '#6b7280'}}>Cargando borradores...</p>
            ) : (
                <DraftList
                    documents={docs}
                    searchTerm={searchTerm}
                    selectedType={selectedType}
                    viewMode={viewMode}
                    onTrash={handleTrash}
                />
            )}
        </div>
    );
};

export default Drafts;
