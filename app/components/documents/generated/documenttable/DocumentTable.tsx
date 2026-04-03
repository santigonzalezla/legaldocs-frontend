'use client';

import {useRouter} from 'next/navigation';
import styles from './documenttable.module.css';
import type {Document} from '@/app/interfaces/interfaces';
import {Edit, Star, StarFilled, Trash} from '@/app/components/svg';
import {STATUS_COLOR, STATUS_LABEL, formatDate, formatType, getEditUrl} from '../documentlist/DocumentList';

interface DocumentTableProps
{
    documents:         Document[];
    onTrash?:          (doc: Document) => void;
    onToggleFavorite?: (doc: Document) => void;
}

const DocumentTable = ({documents, onTrash, onToggleFavorite}: DocumentTableProps) =>
{
    const router = useRouter();

    return (
        <div className={styles.tableContainer}>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Documento</th>
                            <th>Tipo</th>
                            <th>Estado</th>
                            <th>Fecha</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {documents.map(doc =>
                        {
                            const editUrl = getEditUrl(doc);

                            return (
                                <tr
                                    key={doc.id}
                                    className={styles.tableRow}
                                >
                                    <td>
                                        <div className={styles.documentCell}>
                                            <span className={styles.documentName}>{doc.title}</span>
                                        </div>
                                    </td>
                                    <td className={styles.typeCell}>{formatType(doc.documentType)}</td>
                                    <td>
                                        <span
                                            className={styles.statusBadge}
                                            style={{color: STATUS_COLOR[doc.status], backgroundColor: `${STATUS_COLOR[doc.status]}18`}}
                                        >
                                            {STATUS_LABEL[doc.status] ?? doc.status}
                                        </span>
                                    </td>
                                    <td className={styles.dateCell}>{formatDate(doc.createdAt)}</td>
                                    <td>
                                        <div className={styles.tableActions}>
                                            <button
                                                    className={styles.actionButton}
                                                    title="Editar documento"
                                                    onClick={() => router.push(editUrl!)}
                                                >
                                                    <Edit />
                                                </button>
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
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DocumentTable;
