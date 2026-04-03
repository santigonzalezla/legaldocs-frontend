'use client';

import {useRouter} from 'next/navigation';
import styles from './documentgrid.module.css';
import type {Document} from '@/app/interfaces/interfaces';
import {Calendar, File, Star, StarFilled, Trash} from '@/app/components/svg';
import {STATUS_COLOR, STATUS_LABEL, formatDate, formatType, getEditUrl} from '../documentlist/DocumentList';

interface DocumentGridProps
{
    documents:         Document[];
    onTrash?:          (doc: Document) => void;
    onToggleFavorite?: (doc: Document) => void;
}

const DocumentGrid = ({documents, onTrash, onToggleFavorite}: DocumentGridProps) =>
{
    const router = useRouter();

    return (
        <div className={styles.gridContainer}>
            {documents.map(doc =>
            {
                const editUrl = getEditUrl(doc);

                return (
                    <div
                        key={doc.id}
                        className={styles.documentCard}
                        style={{cursor: 'pointer'}}
                        onClick={() => router.push(editUrl!)}
                        title="Abrir documento"
                    >
                        <div className={styles.cardHeader}>
                            <div className={styles.documentIcon}><File /></div>
                            <div className={styles.cardActions} onClick={e => e.stopPropagation()}>
                                <button
                                    className={`${styles.actionButton} ${doc.isFavorite ? styles.favoriteActive : ''}`}
                                    title={doc.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                                    onClick={() => onToggleFavorite?.(doc)}
                                >
                                    {doc.isFavorite ? <StarFilled /> : <Star />}
                                </button>
                                <button
                                    className={`${styles.actionButton} ${styles.deleteButton}`}
                                    title="Mover a papelera"
                                    onClick={() => onTrash?.(doc)}
                                >
                                    <Trash />
                                </button>
                            </div>
                        </div>
                        <div className={styles.cardContent}>
                            <h3 className={styles.cardTitle}>{doc.title}</h3>
                            <div className={styles.cardMeta}>
                                <span className={styles.documentType}>{formatType(doc.documentType)}</span>
                                <span
                                    className={styles.statusBadge}
                                    style={{color: STATUS_COLOR[doc.status], backgroundColor: `${STATUS_COLOR[doc.status]}18`}}
                                >
                                    {STATUS_LABEL[doc.status] ?? doc.status}
                                </span>
                            </div>
                        </div>
                        <div className={styles.cardFooter}>
                            <span className={styles.dateInfo}>
                                <Calendar />{formatDate(doc.createdAt)}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default DocumentGrid;
