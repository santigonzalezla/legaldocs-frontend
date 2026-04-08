'use client';

import {useEffect, useRef, useState} from 'react';
import styles from './librarydocumentlist.module.css';
import {BookOpen, Check, Clock, ExternalLink, File, Options, Tag, Trash} from '@/app/components/svg';
import type {LegalBranch, LibraryDocument} from '@/app/interfaces/interfaces';

const TYPE_LABELS: Record<string, string> = {
    LAW: 'Ley',
    DECREE: 'Decreto',
    RESOLUTION: 'Resolución',
    CIRCULAR: 'Circular',
    RULING: 'Sentencia',
    JURISPRUDENCE: 'Jurisprudencia',
    DOCTRINE: 'Doctrina',
    CONTRACT: 'Contrato',
    OTHER: 'Otro'
};

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
    LAW: {bg: '#EFF6FF', color: '#3B82F6'},
    DECREE: {bg: '#FDF4FF', color: '#A855F7'},
    RESOLUTION: {bg: '#F0FDF4', color: '#22C55E'},
    CIRCULAR: {bg: '#FFF7ED', color: '#F97316'},
    RULING: {bg: '#FEF2F2', color: '#EF4444'},
    JURISPRUDENCE: {bg: '#FEF9C3', color: '#CA8A04'},
    DOCTRINE: {bg: '#F0F9FF', color: '#0EA5E9'},
    CONTRACT: {bg: '#FDF4FF', color: '#D946EF'},
    OTHER: {bg: '#F8FAFC', color: '#64748B'}
};

const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', {day: '2-digit', month: 'short', year: 'numeric'});

const formatSize = (bytes: number) =>
{
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

interface CardProps
{
    doc: LibraryDocument;
    branches: LegalBranch[];
    onDelete: (doc: LibraryDocument) => void;
    onAssign: (doc: LibraryDocument, branchId: string | null) => Promise<void>;
}

interface LibraryDocumentListProps
{
    documents: LibraryDocument[];
    branches: LegalBranch[];
    grouped: boolean;
    onDelete: (doc: LibraryDocument) => void;
    onAssign: (doc: LibraryDocument, branchId: string | null) => Promise<void>;
}

interface OptionsMenuProps
{
    doc: LibraryDocument;
    branches: LegalBranch[];
    onDelete: (doc: LibraryDocument) => void;
    onAssign: (doc: LibraryDocument, branchId: string | null) => Promise<void>;
}

const OptionsMenu = ({doc, branches, onDelete, onAssign}: OptionsMenuProps) =>
{
    const [open, setOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const [assignLoading, setAssignLoading] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() =>
    {
        if (!open) return;
        const handler = (e: MouseEvent) =>
        {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
                setAssignOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const handleAssign = async (branchId: string | null) =>
    {
        setAssignLoading(true);
        await onAssign(doc, branchId);
        setAssignLoading(false);
        setOpen(false);
        setAssignOpen(false);
    };

    return (
        <div className={styles.optionsWrap} ref={menuRef}>
            <button
                className={`${styles.optionsBtn} ${open ? styles.optionsBtnActive : ''}`}
                onClick={() =>
                {
                    setOpen(v => !v);
                    setAssignOpen(false);
                }}
                title="Opciones"
            >
                <Options/>
            </button>

            {open && (
                <div className={styles.optionsDropdown}>
                    {/* Assign branch */}
                    <button
                        className={styles.optionsItem}
                        onClick={() => setAssignOpen(v => !v)}
                    >
                        <Tag className={styles.optionsItemIcon}/>
                        Asignar rama
                    </button>

                    {assignOpen && (
                        <div className={styles.assignSubmenu}>
                            <button
                                className={`${styles.assignOption} ${!doc.branchId ? styles.assignOptionActive : ''}`}
                                onClick={() => handleAssign(null)}
                                disabled={assignLoading}
                            >
                                {!doc.branchId && <Check className={styles.assignCheck}/>}
                                Sin rama
                            </button>
                            {branches.map(b => (
                                <button
                                    key={b.id}
                                    className={`${styles.assignOption} ${doc.branchId === b.id ? styles.assignOptionActive : ''}`}
                                    onClick={() => handleAssign(b.id)}
                                    disabled={assignLoading}
                                >
                                    {doc.branchId === b.id && <Check className={styles.assignCheck}/>}
                                    <span className={styles.assignDot} style={{backgroundColor: b.color ?? '#94A3B8'}}/>
                                    {b.name}
                                </button>
                            ))}
                        </div>
                    )}

                    <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.optionsItem}
                        onClick={() => setOpen(false)}
                    >
                        <ExternalLink className={styles.optionsItemIcon}/>
                        Ver documento
                    </a>

                    <div className={styles.optionsDivider}/>

                    <button
                        className={`${styles.optionsItem} ${styles.optionsItemDanger}`}
                        onClick={() =>
                        {
                            setOpen(false);
                            onDelete(doc);
                        }}
                    >
                        <Trash className={styles.optionsItemIcon}/>
                        Eliminar
                    </button>
                </div>
            )}
        </div>
    );
};

const DocumentCard = ({doc, branches, onDelete, onAssign}: CardProps) =>
{
    const typeStyle = TYPE_COLORS[doc.type] ?? TYPE_COLORS.OTHER;

    return (
        <div className={styles.card}>
            {/* top: [icon + title/badges] [options] */}
            <div className={styles.cardTop}>
                <div className={styles.cardLeft}>
                    <div className={styles.cardIconWrap}>
                        <File className={styles.cardFileIcon}/>
                    </div>
                    <div className={styles.cardTitleGroup}>
                        <p className={styles.cardTitle} title={doc.title}>{doc.title}</p>
                        <div className={styles.cardBadges}>
                            <span
                                className={styles.typeBadge}
                                style={{backgroundColor: typeStyle.bg, color: typeStyle.color}}
                            >
                                {TYPE_LABELS[doc.type] ?? doc.type}
                            </span>
                            {doc.branch && (
                                <span
                                    className={styles.branchBadge}
                                    style={{
                                        backgroundColor: doc.branch.color ? `${doc.branch.color}18` : '#F1F5F9',
                                        color: doc.branch.color ?? '#64748B'
                                    }}
                                >
                                    {doc.branch.name}
                                </span>
                            )}
                            <span
                                className={styles.indexDot}
                                title={doc.isIndexed ? 'Indexado por IA' : 'Indexando...'}
                                style={doc.isIndexed
                                    ? {backgroundColor: '#F0FDF4', color: '#22C55E'}
                                    : {backgroundColor: '#FEF9C3', color: '#CA8A04'}
                                }
                            >
                                {doc.isIndexed
                                    ? <Check className={styles.indexDotIcon}/>
                                    : <Clock className={styles.indexDotIcon}/>}
                            </span>
                        </div>
                    </div>
                </div>
                <div className={styles.cardRight}>
                    <OptionsMenu doc={doc} branches={branches} onDelete={onDelete} onAssign={onAssign}/>
                </div>
            </div>

            {/* bottom: filename · size · date — alineado al icon */}
            <div className={styles.cardBottom}>
                <span className={styles.metaFilename} title={doc.fileName}>{doc.fileName}</span>
                <span className={styles.dot}>·</span>
                <span>{formatSize(doc.fileSize)}</span>
                <span className={styles.dot}>·</span>
                <span>{formatDate(doc.createdAt)}</span>
            </div>
        </div>
    );
};

const LibraryDocumentList = ({documents, branches, grouped, onDelete, onAssign}: LibraryDocumentListProps) =>
{
    const renderGrid = (docs: LibraryDocument[]) => (
        <div className={styles.grid}>
            {docs.map(doc => (
                <DocumentCard key={doc.id} doc={doc} branches={branches} onDelete={onDelete} onAssign={onAssign}/>
            ))}
        </div>
    );

    if (!grouped) return renderGrid(documents);

    const branchMap = new Map<string, { branch: LegalBranch; docs: LibraryDocument[] }>();
    const unassigned: LibraryDocument[] = [];

    for (const doc of documents) {
        if (doc.branch) {
            const key = doc.branch.id;
            if (!branchMap.has(key)) branchMap.set(key, {branch: doc.branch as LegalBranch, docs: []});
            branchMap.get(key)!.docs.push(doc);
        } else {
            unassigned.push(doc);
        }
    }

    const groups = [...branchMap.values()].sort((a, b) => a.branch.name.localeCompare(b.branch.name));

    return (
        <div className={styles.grouped}>
            {groups.map(({branch, docs}) => (
                <div key={branch.id} className={styles.group}>
                    <div className={styles.groupHeader}>
                        <span className={styles.groupDot} style={{backgroundColor: branch.color ?? '#94A3B8'}}/>
                        <span className={styles.groupName}>{branch.name}</span>
                        <span className={styles.groupCount}>{docs.length}</span>
                    </div>
                    {renderGrid(docs)}
                </div>
            ))}

            {unassigned.length > 0 && (
                <div className={styles.group}>
                    <div className={styles.groupHeader}>
                        <BookOpen className={styles.groupIcon}/>
                        <span className={styles.groupName}>Sin categorizar</span>
                        <span className={styles.groupCount}>{unassigned.length}</span>
                    </div>
                    {renderGrid(unassigned)}
                </div>
            )}
        </div>
    );
};

export default LibraryDocumentList;
