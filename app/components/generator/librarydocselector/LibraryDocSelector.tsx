'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import styles from './librarydocselector.module.css';
import {useFetch} from '@/hooks/useFetch';
import type {LegalBranch, LibraryDocument, PaginatedResponse} from '@/app/interfaces/interfaces';
import {LibraryDocumentType, LIBRARY_DOCUMENT_TYPE_LABELS, LIBRARY_DOCUMENT_TYPE_COLORS} from '@/app/interfaces/enums';
import {BookOpen, Search, X} from '@/app/components/svg';

interface Props
{
    onChange?: (docs: LibraryDocument[]) => void;
}

const LibraryDocSelector = ({onChange}: Props) =>
{
    const [selected,  setSelected]  = useState<LibraryDocument[]>([]);
    const [search,    setSearch]    = useState('');
    const [branchId,  setBranchId]  = useState('');
    const [open,      setOpen]      = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);

    const {data: libRes}     = useFetch<PaginatedResponse<LibraryDocument>>('library/documents?limit=200', {firmScoped: true});
    const {data: branchData} = useFetch<LegalBranch[]>('branch', {firmScoped: true});

    const docs     = libRes?.data ?? [];
    const branches = branchData  ?? [];

    const filtered = useMemo(() =>
        docs.filter(d =>
        {
            const matchBranch  = !branchId || d.branchId === branchId;
            const matchSearch  = !search   || d.title.toLowerCase().includes(search.toLowerCase());
            const notSelected  = !selected.some(s => s.id === d.id);
            return matchBranch && matchSearch && notSelected && d.isIndexed;
        }),
        [docs, search, branchId, selected],
    );

    useEffect(() =>
    {
        const onDown = (e: MouseEvent) =>
        {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
                setOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, []);

    const add = (doc: LibraryDocument) =>
    {
        const next = [...selected, doc];
        setSelected(next);
        onChange?.(next);
        setSearch('');
    };

    const remove = (id: string) =>
    {
        const next = selected.filter(d => d.id !== id);
        setSelected(next);
        onChange?.(next);
    };

    return (
        <div className={styles.root}>

            <p className={styles.label}>
                <BookOpen className={styles.labelIcon}/>
                Fuentes de biblioteca jurídica:
            </p>

            {/* Chips de documentos seleccionados */}
            {selected.length > 0 && (
                <div className={styles.chips}>
                    {selected.map(doc => (
                        <span key={doc.id} className={styles.chip}>
                            {doc.branch && (
                                <span
                                    className={styles.chipDot}
                                    style={{background: doc.branch.color ?? '#64748b'}}
                                />
                            )}
                            {doc.title}
                            <button
                                className={styles.chipRemove}
                                onClick={() => remove(doc.id)}
                                title="Quitar"
                            >
                                <X className={styles.chipX}/>
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Selector */}
            <div ref={wrapRef} className={styles.selectorWrap}>
                <div className={styles.inputRow}>
                    <Search className={styles.searchIcon}/>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Buscar documento en biblioteca..."
                        value={search}
                        onFocus={() => setOpen(true)}
                        onChange={e => { setSearch(e.target.value); setOpen(true); }}
                    />
                    <select
                        className={styles.branchSelect}
                        value={branchId}
                        onChange={e => setBranchId(e.target.value)}
                    >
                        <option value="">Todas las ramas</option>
                        {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                </div>

                {open && (
                    <div className={styles.dropdown}>
                        {docs.length === 0 ? (
                            <p className={styles.empty}>
                                No hay documentos indexados en la biblioteca
                            </p>
                        ) : filtered.length === 0 ? (
                            <p className={styles.empty}>Sin resultados</p>
                        ) : (
                            <ul className={styles.list}>
                                {filtered.map(doc => (
                                    <li
                                        key={doc.id}
                                        className={styles.item}
                                        onMouseDown={e => { e.preventDefault(); add(doc); }}
                                    >
                                        <div className={styles.itemMain}>
                                            <span className={styles.itemTitle}>{doc.title}</span>
                                            <span
                                className={styles.itemType}
                                style={{
                                    backgroundColor: (LIBRARY_DOCUMENT_TYPE_COLORS[doc.type as LibraryDocumentType] ?? LIBRARY_DOCUMENT_TYPE_COLORS[LibraryDocumentType.OTHER]).bg,
                                    color:           (LIBRARY_DOCUMENT_TYPE_COLORS[doc.type as LibraryDocumentType] ?? LIBRARY_DOCUMENT_TYPE_COLORS[LibraryDocumentType.OTHER]).color,
                                }}
                            >
                                {LIBRARY_DOCUMENT_TYPE_LABELS[doc.type as LibraryDocumentType] ?? doc.type}
                            </span>
                                        </div>
                                        {doc.branch && (
                                            <span
                                                className={styles.itemBranch}
                                                style={{
                                                    background: `${doc.branch.color ?? '#64748b'}18`,
                                                    color:       doc.branch.color ?? '#64748b',
                                                }}
                                            >
                                                {doc.branch.name}
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LibraryDocSelector;
