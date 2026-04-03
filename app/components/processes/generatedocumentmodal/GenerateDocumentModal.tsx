'use client';

import styles from './generatedocumentmodal.module.css';
import {useState, useMemo} from 'react';
import {useRouter} from 'next/navigation';
import {useFetch} from '@/hooks/useFetch';
import {File, Search, X} from '@/app/components/svg';
import type {DocumentTemplate, LegalBranch, PaginatedResponse} from '@/app/interfaces/interfaces';

interface GenerateDocumentModalProps
{
    open:      boolean;
    processId: string;
    onClose:   () => void;
}

const GenerateDocumentModal = ({open, processId, onClose}: GenerateDocumentModalProps) =>
{
    const router = useRouter();
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [search,           setSearch]           = useState('');

    const {data: branches} = useFetch<LegalBranch[]>(
        'branch?isActive=true&limit=50',
        {firmScoped: true},
    );

    const branchQuery = selectedBranchId ? `&branchId=${selectedBranchId}` : '';
    const searchQuery = search           ? `&search=${encodeURIComponent(search)}` : '';

    const {data: templateRes, isLoading} = useFetch<PaginatedResponse<DocumentTemplate>>(
        `template?isActive=true&limit=100${branchQuery}${searchQuery}`,
        {firmScoped: true},
    );

    const templates  = templateRes?.data ?? [];
    const branchList = branches ?? [];

    const branchMap = useMemo(() =>
        Object.fromEntries(branchList.map(b => [b.id, b.slug])),
        [branchList],
    );

    const handleSelect = (tpl: DocumentTemplate) =>
    {
        const branchSlug = branchMap[tpl.branchId];
        if (!branchSlug) return;
        router.push(`/dashboard/generator/${branchSlug}/${tpl.documentType}?processId=${processId}`);
        onClose();
    };

    if (!open) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>Generar documento para el proceso</h2>
                    <button className={styles.closeBtn} onClick={onClose}><X /></button>
                </div>

                <div className={styles.filtersRow}>
                    <select
                        className={styles.select}
                        value={selectedBranchId}
                        onChange={e => setSelectedBranchId(e.target.value)}
                    >
                        <option value="">Todas las ramas</option>
                        {branchList.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>

                    <div className={styles.searchWrapper}>
                        <Search className={styles.searchIcon} />
                        <input
                            className={styles.searchInput}
                            placeholder="Buscar plantilla..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className={styles.body}>
                    {isLoading ? (
                        <p className={styles.empty}>Cargando plantillas...</p>
                    ) : templates.length === 0 ? (
                        <p className={styles.empty}>No se encontraron plantillas.</p>
                    ) : (
                        <div className={styles.list}>
                            {templates.map(tpl =>
                            {
                                const branch = branchList.find(b => b.id === tpl.branchId);
                                return (
                                    <button
                                        key={tpl.id}
                                        className={styles.templateRow}
                                        onClick={() => handleSelect(tpl)}
                                        disabled={!branchMap[tpl.branchId]}
                                    >
                                        <div className={styles.templateIcon}><File /></div>
                                        <div className={styles.templateInfo}>
                                            <span className={styles.templateTitle}>{tpl.title}</span>
                                            {branch && (
                                                <span className={styles.templateBranch}>{branch.name}</span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className={styles.footer}>
                    <button className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
                </div>
            </div>
        </div>
    );
};

export default GenerateDocumentModal;
