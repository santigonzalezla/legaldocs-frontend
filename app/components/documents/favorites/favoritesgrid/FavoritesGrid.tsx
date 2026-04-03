'use client';

import styles from './favoritesgrid.module.css';
import {Calendar, File, StarFilled} from '@/app/components/svg';
import type {Document} from '@/app/interfaces/interfaces';
import {STATUS_COLOR, STATUS_LABEL, formatDate, formatType} from '@/app/components/documents/generated/documentlist/DocumentList';

interface FavoritesGridProps
{
    documents:         Document[];
    onRemoveFavorite?: (doc: Document) => void;
}

const FavoritesGrid = ({documents, onRemoveFavorite}: FavoritesGridProps) =>
(
    <div className={styles.gridContainer}>
        {documents.map(doc => (
            <div key={doc.id} className={styles.favoriteCard}>
                <div className={styles.cardHeader}>
                    <div className={styles.favoriteIcon}><File /></div>
                    <div className={styles.cardActions}>
                        <button className={styles.actionButton} title="Quitar de favoritos"
                            onClick={() => onRemoveFavorite?.(doc)}
                            style={{color: '#f59e0b'}}>
                            <StarFilled />
                        </button>
                    </div>
                </div>

                <div className={styles.cardContent}>
                    <h3 className={styles.cardTitle}>{doc.title}</h3>
                    <div className={styles.cardMeta}>
                        <span className={styles.documentType}>{formatType(doc.documentType)}</span>
                        <span className={styles.statusBadge}
                            style={{backgroundColor: `${STATUS_COLOR[doc.status] ?? '#6b7280'}15`}}>
                            <span style={{color: STATUS_COLOR[doc.status] ?? '#6b7280'}}>
                                {STATUS_LABEL[doc.status] ?? doc.status}
                            </span>
                        </span>
                    </div>
                    <div className={styles.cardFooter}>
                        <div className={styles.dateInfo}>
                            <Calendar />
                            <span>{formatDate(doc.createdAt)}</span>
                        </div>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export default FavoritesGrid;
