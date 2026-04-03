'use client';

import styles from './trashgrid.module.css';
import {Calendar, Clock, File, RotateBack, Trash as TrashIcon, TriangleAlert} from '@/app/components/svg';
import type {Document} from '@/app/interfaces/interfaces';
import {formatDate, formatType} from '@/app/components/documents/generated/documentlist/DocumentList';
import {daysUntilExpiry, expiryStatus} from '@/app/components/documents/trash/trashlist/TrashList';

interface TrashGridProps
{
    documents:          Document[];
    onRestore?:         (doc: Document) => void;
    onPermanentDelete?: (doc: Document) => void;
}

const TrashGrid = ({documents, onRestore, onPermanentDelete}: TrashGridProps) =>
(
    <div className={styles.gridContainer}>
        {documents.map(doc =>
        {
            const days   = daysUntilExpiry(doc.trashExpiresAt);
            const status = expiryStatus(days);

            return (
                <div key={doc.id} className={styles.trashCard}>
                    <div className={styles.cardHeader}>
                        <div className={styles.documentIcon}><File /></div>
                        <div className={styles.cardActions}>
                            <button className={styles.restoreButton} title="Restaurar"
                                onClick={() => onRestore?.(doc)}>
                                <RotateBack />
                            </button>
                            <button className={styles.deleteButton} title="Eliminar permanentemente"
                                onClick={() => onPermanentDelete?.(doc)}>
                                <TrashIcon />
                            </button>
                        </div>
                    </div>

                    <div className={styles.cardContent}>
                        <h3 className={styles.cardTitle}>{doc.title}</h3>
                        <div className={styles.cardMeta}>
                            <span className={styles.documentType}>{formatType(doc.documentType)}</span>
                            <span className={`${styles.expiryBadge} ${status.urgent ? styles.urgent : ''}`}
                                style={{color: status.color, backgroundColor: `${status.color}15`}}>
                                {status.urgent && <TriangleAlert />}{status.text}
                            </span>
                        </div>

                        <div className={styles.cardFooter}>
                            <div className={styles.dateInfo}>
                                <Clock />
                                <span>Eliminado {doc.deletedAt ? formatDate(doc.deletedAt) : '—'}</span>
                            </div>
                            {doc.trashExpiresAt && (
                                <div className={styles.expiryInfo}>
                                    <Calendar />
                                    <span>Expira {formatDate(doc.trashExpiresAt)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        })}
    </div>
);

export default TrashGrid;
