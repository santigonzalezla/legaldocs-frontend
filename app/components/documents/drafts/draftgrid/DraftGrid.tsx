'use client';

import {useRouter} from 'next/navigation';
import styles from './draftgrid.module.css';
import {Clock, File, Trash} from '@/app/components/svg';
import type {Document} from '@/app/interfaces/interfaces';
import {formatDate, formatType, getEditUrl} from '@/app/components/documents/generated/documentlist/DocumentList';

interface DraftGridProps
{
    documents: Document[];
    onTrash?:  (doc: Document) => void;
}

const DraftGrid = ({documents, onTrash}: DraftGridProps) =>
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
                        className={styles.draftCard}
                        style={{cursor: 'pointer'}}
                        onClick={() => router.push(editUrl!)}
                        title="Continuar editando"
                    >
                        <div className={styles.cardHeader}>
                            <div className={styles.documentIcon}><File /></div>
                            <div className={styles.cardActions} onClick={e => e.stopPropagation()}>
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
                            </div>
                            <div className={styles.cardFooter}>
                                <div className={styles.dateInfo}>
                                    <Clock />
                                    <span>Modificado {formatDate(doc.updatedAt)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default DraftGrid;
