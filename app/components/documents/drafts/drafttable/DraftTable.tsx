'use client';

import {useRouter} from 'next/navigation';
import styles from './drafttable.module.css';
import {Edit, File, Trash} from '@/app/components/svg';
import type {Document} from '@/app/interfaces/interfaces';
import {formatDate, formatType, getEditUrl} from '@/app/components/documents/generated/documentlist/DocumentList';

interface DraftTableProps
{
    documents: Document[];
    onTrash?:  (doc: Document) => void;
}

const DraftTable = ({documents, onTrash}: DraftTableProps) =>
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
                            <th>Última Modificación</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {documents.map(doc =>
                        {
                            const editUrl = getEditUrl(doc);

                            return (
                                <tr key={doc.id} className={styles.tableRow}>
                                    <td>
                                        <div className={styles.documentCell}>
                                            <File />
                                            <span className={styles.documentName}>{doc.title}</span>
                                        </div>
                                    </td>
                                    <td className={styles.typeCell}>{formatType(doc.documentType)}</td>
                                    <td className={styles.dateCell}>{formatDate(doc.updatedAt)}</td>
                                    <td>
                                        <div className={styles.tableActions}>
                                            <button
                                                className={styles.actionButton}
                                                title="Continuar editando"
                                                onClick={() => router.push(editUrl!)}
                                            >
                                                <Edit />
                                            </button>
                                            <button
                                                className={styles.actionButton}
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

export default DraftTable;
