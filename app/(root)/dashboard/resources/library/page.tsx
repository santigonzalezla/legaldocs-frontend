'use client';

import styles from './page.module.css';
import {useState, useEffect} from 'react';
import {BookOpen, FileCheck, Plus} from '@/app/components/svg';
import {useFetch} from '@/hooks/useFetch';
import {toast} from 'sonner';
import type {LegalBranch, LibraryDocument, PaginatedResponse} from '@/app/interfaces/interfaces';
import {useConfirm} from '@/hooks/useConfirm';
import ConfirmModal        from '@/app/components/ui/confirmmodal/ConfirmModal';
import DocumentStatCard    from '@/app/components/documents/generated/documentstatscard/DocumentStatsCard';
import DocumentFilters     from '@/app/components/documents/shared/documentfilters/DocumentFilters';
import LibraryDocumentList from '@/app/components/library/librarydocumentlist/LibraryDocumentList';
import UploadDocumentModal from '@/app/components/library/uploaddocumentmodal/UploadDocumentModal';

const typeOptions = [
    {value: 'all',           label: 'Todos los tipos'},
    {value: 'LAW',           label: 'Ley'},
    {value: 'DECREE',        label: 'Decreto'},
    {value: 'RESOLUTION',    label: 'Resolución'},
    {value: 'CIRCULAR',      label: 'Circular'},
    {value: 'RULING',        label: 'Sentencia'},
    {value: 'JURISPRUDENCE', label: 'Jurisprudencia'},
    {value: 'DOCTRINE',      label: 'Doctrina'},
    {value: 'CONTRACT',      label: 'Contrato'},
    {value: 'OTHER',         label: 'Otro'},
];

const indexOptions = [
    {value: 'all',   label: 'Estado IA'},
    {value: 'true',  label: 'Indexados'},
    {value: 'false', label: 'Pendientes'},
];

const LibraryPage = () =>
{
    const [search,        setSearch]        = useState('');
    const [selectedType,  setSelectedType]  = useState('all');
    const [selectedIdx,   setSelectedIdx]   = useState('all');
    const [selectedBranch, setSelectedBranch] = useState('all');
    const [showUpload,    setShowUpload]    = useState(false);
    const [branches,      setBranches]      = useState<LegalBranch[]>([]);

    const {data: response, isLoading, execute: refetch} =
        useFetch<PaginatedResponse<LibraryDocument>>('library/documents?limit=100', {firmScoped: true});

    const {data: branchesData, execute: refetchBranches} =
        useFetch<LegalBranch[]>('branch', {firmScoped: true});

    const {execute: deleteDoc} =
        useFetch<{message: string}>('', {method: 'DELETE', immediate: false, firmScoped: true});

    const {execute: patchBranch} =
        useFetch<LibraryDocument>('', {method: 'PATCH', immediate: false, firmScoped: true});

    const {confirm, confirmState, handleConfirm, handleCancel} = useConfirm();

    useEffect(() => { if (branchesData) setBranches(branchesData); }, [branchesData]);

    const documents = response?.data ?? [];

    // Polling automático mientras haya documentos pendientes de indexar
    useEffect(() =>
    {
        const pending = documents.some(d => !d.isIndexed);
        if (!pending) return;
        const interval = setInterval(refetch, 4000);
        return () => clearInterval(interval);
    }, [documents]);

    const branchOptions = [
        {value: 'all', label: 'Todas las ramas'},
        ...branches.map(b => ({value: b.id, label: b.name})),
        {value: '__none__', label: 'Sin categorizar'},
    ];

    const filtered = documents.filter(doc =>
    {
        const term         = search.trim().toLowerCase();
        const matchSearch  = !term || doc.title.toLowerCase().includes(term) || (doc.description ?? '').toLowerCase().includes(term);
        const matchType    = selectedType   === 'all'      || doc.type === selectedType;
        const matchIdx     = selectedIdx    === 'all'      || String(doc.isIndexed) === selectedIdx;
        const matchBranch  = selectedBranch === 'all'      ? true
                           : selectedBranch === '__none__' ? !doc.branchId
                           : doc.branchId === selectedBranch;
        return matchSearch && matchType && matchIdx && matchBranch;
    });

    const stats = {
        total:   documents.length,
        indexed: documents.filter(d => d.isIndexed).length,
    };

    // When a specific branch is selected, show flat; otherwise group
    const showGrouped = selectedBranch === 'all' || selectedBranch === '__none__';

    const handleDelete = async (doc: LibraryDocument) =>
    {
        if (!await confirm({
            title:        'Eliminar documento',
            message:      `¿Eliminar "${doc.title}" de la biblioteca? El archivo también se eliminará del repositorio.`,
            confirmLabel: 'Eliminar',
        })) return;

        const result = await deleteDoc({}, `library/documents/${doc.id}`);
        if (result !== null) { toast.success('Documento eliminado.'); refetch(); }
    };

    const handleAssign = async (doc: LibraryDocument, branchId: string | null) =>
    {
        const result = await patchBranch({body: {branchId}}, `library/documents/${doc.id}/branch`);
        if (result !== null)
        {
            toast.success(branchId ? 'Rama asignada.' : 'Rama removida.');
            refetch();
        }
    };

    const handleBranchCreated = (branch: LegalBranch) =>
    {
        setBranches(prev => [...prev, branch]);
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <div>
                        <h1>Biblioteca Jurídica</h1>
                        <p>Sube documentos para que Legalito pueda consultarlos en sus respuestas.</p>
                    </div>
                    <button className={styles.addButton} onClick={() => setShowUpload(true)}>
                        <Plus /> Subir documento
                    </button>
                </div>

                <div className={styles.statsContainer}>
                    {[
                        {title: 'Documentos totales', value: stats.total,   icon: <BookOpen />,  color: '#3b82f6', bgColor: '#eff6ff', percentage: null},
                        {title: 'Indexados por IA',   value: stats.indexed, icon: <FileCheck />, color: '#10b981', bgColor: '#ecfdf5', percentage: stats.total ? Math.round(stats.indexed / stats.total * 100) : 0},
                    ].map((s, i) => (
                        <DocumentStatCard documentStat={s} key={i} />
                    ))}
                </div>
            </div>

            <DocumentFilters
                searchTerm={search}           onSearchChange={setSearch}
                selectedStatus={selectedType}  onStatusChange={setSelectedType}
                selectedType={selectedBranch}  onTypeChange={setSelectedBranch}
                selectedExtra={selectedIdx}    onExtraChange={setSelectedIdx}
                statusOptions={typeOptions}
                typeOptions={branchOptions}
                extraOptions={indexOptions}
            />

            {isLoading ? (
                <p className={styles.loading}>Cargando biblioteca...</p>
            ) : filtered.length === 0 ? (
                <div className={styles.empty}>
                    {search || selectedType !== 'all' || selectedIdx !== 'all' || selectedBranch !== 'all'
                        ? 'No se encontraron documentos con esos filtros.'
                        : 'No hay documentos en la biblioteca aún. Sube uno para empezar.'}
                </div>
            ) : (
                <LibraryDocumentList
                    documents={filtered}
                    branches={branches}
                    grouped={showGrouped}
                    onDelete={handleDelete}
                    onAssign={handleAssign}
                />
            )}

            {showUpload && (
                <UploadDocumentModal
                    branches={branches}
                    onClose={() => setShowUpload(false)}
                    onSuccess={() => { setShowUpload(false); refetch(); }}
                    onBranchCreated={handleBranchCreated}
                />
            )}

            {confirmState && (
                <ConfirmModal
                    title={confirmState.title}
                    message={confirmState.message}
                    confirmLabel={confirmState.confirmLabel}
                    danger={confirmState.danger}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
        </div>
    );
};

export default LibraryPage;
