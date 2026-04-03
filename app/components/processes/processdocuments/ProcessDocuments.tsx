'use client';

import styles from './processdocuments.module.css';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useFetch} from '@/hooks/useFetch';
import {toast} from 'sonner';
import {Edit, File, Plus, Trash} from '@/app/components/svg';
import type {Document, PaginatedResponse} from '@/app/interfaces/interfaces';
import {getEditUrl} from '@/app/components/documents/generated/documentlist/DocumentList';
import AddDocumentModal from '@/app/components/processes/adddocumentmodal/AddDocumentModal';
import GenerateDocumentModal from '@/app/components/processes/generatedocumentmodal/GenerateDocumentModal';
import {formatDate} from '@/app/components/documents/generated/documentlist/DocumentList';

interface ProcessDocumentsProps
{
    processId: string;
}

const ProcessDocuments = ({processId}: ProcessDocumentsProps) =>
{
    const router = useRouter();
    const [addOpen,      setAddOpen]      = useState(false);
    const [generateOpen, setGenerateOpen] = useState(false);

    const {data: response, isLoading, execute: refetch} =
        useFetch<PaginatedResponse<Document>>(`document?processId=${processId}&limit=100`, {firmScoped: true});

    const {execute: trashDoc} =
        useFetch<void>('', {method: 'DELETE', immediate: false, firmScoped: true});

    const docs = response?.data ?? [];

    const handleTrash = async (doc: Document) =>
    {
        if (!window.confirm(`¿Mover "${doc.title}" a la papelera?`)) return;
        const result = await trashDoc({}, `document/${doc.id}`);
        if (result === null) return;
        toast.success('Documento movido a la papelera.');
        refetch();
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <File className={styles.headerIcon} />
                    <h2 className={styles.title}>Documentos del proceso</h2>
                    {!isLoading && <span className={styles.count}>{docs.length}</span>}
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.btnSecondary} onClick={() => setAddOpen(true)}>
                        <Plus /> Agregar documento
                    </button>
                    <button className={styles.btnPrimary} onClick={() => setGenerateOpen(true)}>
                        <Plus /> Generar documento
                    </button>
                </div>
            </div>

            {isLoading ? (
                <p className={styles.empty}>Cargando documentos...</p>
            ) : docs.length === 0 ? (
                <p className={styles.empty}>No hay documentos asociados a este proceso.</p>
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Documento</th>
                                <th>Tipo</th>
                                <th>Última modificación</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {docs.map(doc =>
                            {
                                const editUrl = getEditUrl(doc);
                                return (
                                    <tr key={doc.id} className={styles.row}>
                                        <td>
                                            <div className={styles.docCell}>
                                                <File className={styles.docIcon} />
                                                <span>{doc.title}</span>
                                            </div>
                                        </td>
                                        <td className={styles.typeCell}>{doc.documentType}</td>
                                        <td className={styles.dateCell}>{formatDate(doc.updatedAt)}</td>
                                        <td>
                                            <div className={styles.actions}>
                                                <button
                                                    className={styles.actionBtn}
                                                    title="Editar documento"
                                                    disabled={!editUrl}
                                                    onClick={() => editUrl && router.push(editUrl)}
                                                >
                                                    <Edit />
                                                </button>
                                                <button
                                                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                    title="Mover a papelera"
                                                    onClick={() => handleTrash(doc)}
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
            )}

            <AddDocumentModal
                open={addOpen}
                processId={processId}
                onClose={() => setAddOpen(false)}
                onAdded={() => { setAddOpen(false); refetch(); }}
            />

            <GenerateDocumentModal
                open={generateOpen}
                processId={processId}
                onClose={() => setGenerateOpen(false)}
            />
        </div>
    );
};

export default ProcessDocuments;
