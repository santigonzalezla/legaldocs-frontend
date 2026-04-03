'use client';

import styles from './adddocumentmodal.module.css';
import {useState} from 'react';
import {useFetch} from '@/hooks/useFetch';
import {toast} from 'sonner';
import {File, Search, X} from '@/app/components/svg';
import type {Document, PaginatedResponse} from '@/app/interfaces/interfaces';

interface AddDocumentModalProps
{
    open:      boolean;
    processId: string;
    onClose:   () => void;
    onAdded:   () => void;
}

const AddDocumentModal = ({open, processId, onClose, onAdded}: AddDocumentModalProps) =>
{
    const [search, setSearch] = useState('');

    const {data: response, isLoading} = useFetch<PaginatedResponse<Document>>(
        `document?limit=50${search ? `&search=${encodeURIComponent(search)}` : ''}`,
        {firmScoped: true},
    );

    const {execute: associate, isLoading: saving} =
        useFetch<Document>('', {method: 'PATCH', immediate: false, firmScoped: true});

    const docs = (response?.data ?? []).filter(d => d.processId !== processId && !d.deletedAt);

    const handleAdd = async (doc: Document) =>
    {
        const result = await associate({body: {processId}}, `document/${doc.id}`);
        if (!result) return;
        toast.success(`"${doc.title}" asociado al proceso.`);
        onAdded();
    };

    if (!open) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>Agregar documento al proceso</h2>
                    <button className={styles.closeBtn} onClick={onClose}><X /></button>
                </div>

                <div className={styles.searchRow}>
                    <div className={styles.searchWrapper}>
                        <Search className={styles.searchIcon} />
                        <input
                            className={styles.searchInput}
                            placeholder="Buscar por título..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className={styles.body}>
                    {isLoading ? (
                        <p className={styles.empty}>Buscando documentos...</p>
                    ) : docs.length === 0 ? (
                        <p className={styles.empty}>No se encontraron documentos disponibles.</p>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Documento</th>
                                    <th>Tipo</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {docs.map(doc => (
                                    <tr key={doc.id} className={styles.row}>
                                        <td>
                                            <div className={styles.docCell}>
                                                <File className={styles.docIcon} />
                                                <span>{doc.title}</span>
                                            </div>
                                        </td>
                                        <td className={styles.typeCell}>{doc.documentType}</td>
                                        <td>
                                            <button
                                                className={styles.addBtn}
                                                disabled={saving}
                                                onClick={() => handleAdd(doc)}
                                            >
                                                Agregar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className={styles.footer}>
                    <button className={styles.cancelBtn} onClick={onClose}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};

export default AddDocumentModal;
