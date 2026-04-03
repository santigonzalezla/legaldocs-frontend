'use client';

import type {Document} from '@/app/interfaces/interfaces';
import {DocumentStatus} from '@/app/interfaces/enums';
import DocumentTable from '@/app/components/documents/generated/documenttable/DocumentTable';
import DocumentGrid from '@/app/components/documents/generated/documentgrid/DocumentGrid';

// ── Helpers ─────────────────────────────────────────────────────────────────

export const STATUS_LABEL: Record<string, string> = {
    [DocumentStatus.DRAFT]: 'Borrador',
    [DocumentStatus.COMPLETED]: 'Completado',
    [DocumentStatus.REVISION]: 'En Revisión',
    [DocumentStatus.ARCHIVED]: 'Archivado'
};

export const STATUS_COLOR: Record<string, string> = {
    [DocumentStatus.DRAFT]: '#F59E0B',
    [DocumentStatus.COMPLETED]: '#10B981',
    [DocumentStatus.REVISION]: '#3B82F6',
    [DocumentStatus.ARCHIVED]: '#6B7280'
};

export const formatType = (t: string) =>
    t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', {day: '2-digit', month: 'short', year: 'numeric'});


export const getEditUrl = (doc: Document): string | null =>
{
    const meta = doc.formData as Record<string, any> | null;
    const branchSlug = meta?._branchSlug ?? doc.branchSlug ?? null;
    const docTypeSlug = meta?._docTypeSlug ?? doc.documentType;

    if (!branchSlug) return null;

    return `/dashboard/generator/${branchSlug}/${docTypeSlug}?documentId=${doc.id}`;
};

interface DocumentListProps
{
    documents: Document[];
    searchTerm?: string;
    selectedStatus?: string;
    selectedType?: string;
    viewMode?: 'grid' | 'table';
    onTrash?: (doc: Document) => void;
    onToggleFavorite?: (doc: Document) => void;
}

const DocumentList = ({
                          documents,
                          searchTerm,
                          selectedStatus,
                          selectedType,
                          viewMode,
                          onTrash,
                          onToggleFavorite
                      }: DocumentListProps) =>
{
    const filtered = documents.filter(doc =>
    {
        const term = searchTerm?.trim().toLowerCase() ?? '';
        const matchesSearch = !term || doc.title.toLowerCase().includes(term);
        const matchesStatus = !selectedStatus || selectedStatus === 'all' || doc.status === selectedStatus;
        const matchesType = !selectedType || selectedType === 'all' || doc.branchSlug === selectedType;
        return matchesSearch && matchesStatus && matchesType;
    });

    if (filtered.length === 0)
        return (
            <div style={{textAlign: 'center', padding: '32px', color: '#6B7280', fontSize: '18px'}}>
                {searchTerm || (selectedStatus && selectedStatus !== 'all') || (selectedType && selectedType !== 'all')
                    ? 'No se encontraron documentos que coincidan con los filtros.'
                    : 'No hay documentos disponibles.'}
            </div>
        );

    if (viewMode === 'table')
        return <DocumentTable documents={filtered} onTrash={onTrash} onToggleFavorite={onToggleFavorite}/>;

    return <DocumentGrid documents={filtered} onTrash={onTrash} onToggleFavorite={onToggleFavorite}/>;
};

export default DocumentList;
