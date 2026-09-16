'use client';

import {useRef, useState} from 'react';
import styles from './attachmentspanel.module.css';
import {useFetch} from '@/hooks/useFetch';
import {uploadAttachment, validateAttachmentFile} from '@/lib/attachments';
import type {AttachmentItem, PendingAttachment} from '@/app/interfaces/interfaces';
import {toast} from 'sonner';
import {useConfirm} from '@/hooks/useConfirm';
import ConfirmModal from '@/app/components/ui/confirmmodal/ConfirmModal';
import {ExternalLink, File, Plus, Trash, Upload} from '@/app/components/svg';

interface AttachmentsPanelProps
{
    // Modo "entidad existente": sube/lista/elimina en vivo contra la API.
    apiBasePath?: string;
    typeOptions: Array<{value: string; label: string}>;
    // "panel" (por defecto): tarjeta con borde y título. "inline": compacto, para
    // anidar dentro de otra tarjeta (ej. comentarios de la línea de tiempo).
    variant?: 'panel' | 'inline';
    // Tinte por tipo de documento para el ícono en modo "inline".
    typeColors?: Record<string, {bg: string; color: string}>;
    // Modo "pendiente": para formularios de creación, sin ID todavía — los
    // archivos quedan en memoria y el formulario los sube tras crear la entidad.
    pendingAttachments?: PendingAttachment[];
    onPendingChange?: (attachments: PendingAttachment[]) => void;
    // Modo "live controlado": con `apiBasePath` para subir/eliminar, pero la lista
    // la provee el padre (`items`) y tras cada mutación se avisa con `onChanged`
    // en vez de hacer un GET propio. Evita un fetch extra al expandir cada tarjeta.
    items?: AttachmentItem[];
    onChanged?: () => void;
}

const formatSize = (bytes: number) =>
    bytes >= 1024 * 1024
        ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
        : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('es-ES', {day: '2-digit', month: 'short', year: 'numeric'});

const AttachmentsPanel = ({apiBasePath, typeOptions, variant = 'panel', typeColors, pendingAttachments, onPendingChange, items, onChanged}: AttachmentsPanelProps) =>
{
    const isPending    = !apiBasePath;
    const isControlled = !isPending && items !== undefined;
    const isInline     = variant === 'inline';

    const fileInputRef = useRef<HTMLInputElement>(null);

    const {data: documents, isLoading, execute: refetch} =
        useFetch<AttachmentItem[]>(apiBasePath ?? '', {firmScoped: true, immediate: !isPending && !isControlled});

    const notifyChanged = () => { if (isControlled) onChanged?.(); else refetch(); };

    const {execute: uploadDoc} =
        useFetch<AttachmentItem>('', {method: 'POST', immediate: false, firmScoped: true, isFormData: true});

    const {execute: deleteDocument} =
        useFetch<{message: string}>('', {method: 'DELETE', immediate: false, firmScoped: true});

    const {execute: getFileUrl} =
        useFetch<{url: string}>('', {immediate: false, firmScoped: true});

    const {confirm, confirmState, handleConfirm, handleCancel} = useConfirm();

    const [showUpload, setShowUpload] = useState(false);
    const [file,       setFile]       = useState<File | null>(null);
    const [type,       setType]       = useState(typeOptions[0]?.value ?? '');
    const [uploading,  setUploading]  = useState(false);

    const pickFile = async (candidate: File | undefined | null) =>
    {
        if (!candidate) return;

        const error = await validateAttachmentFile(candidate);
        if (error) { toast.error(error); return; }

        setFile(candidate);
    };

    const handleDrop = (event: React.DragEvent) =>
    {
        event.preventDefault();
        void pickFile(event.dataTransfer.files[0]);
    };

    const handleUpload = async () =>
    {
        if (!file) { toast.error('Selecciona un archivo'); return; }

        if (isPending)
        {
            onPendingChange?.([...(pendingAttachments ?? []), {file, type}]);
            setFile(null);
            setShowUpload(false);
            return;
        }

        setUploading(true);
        const ok = await uploadAttachment(uploadDoc, apiBasePath, file, type);
        setUploading(false);

        if (!ok) { toast.error('Error al subir el documento'); return; }

        toast.success('Documento adjuntado correctamente.');
        setFile(null);
        setShowUpload(false);
        notifyChanged();
    };

    const handleOpen = async (doc: AttachmentItem) =>
    {
        const win = window.open('', '_blank');
        const result = await getFileUrl({}, `firm/me/storage/file-url?key=${encodeURIComponent(doc.fileKey)}`);
        if (result?.url && win) win.location.href = result.url;
        else { win?.close(); toast.error('No se pudo abrir el documento.'); }
    };

    const handleDelete = async (doc: AttachmentItem, index: number) =>
    {
        if (!await confirm({title: 'Eliminar adjunto', message: `¿Eliminar "${doc.fileName}"?`, confirmLabel: 'Eliminar'})) return;

        if (isPending)
        {
            onPendingChange?.((pendingAttachments ?? []).filter((_, i) => i !== index));
            return;
        }

        const result = await deleteDocument({}, `${apiBasePath}/${doc.id}`);
        if (!result) return;
        toast.success('Documento eliminado.');
        notifyChanged();
    };

    const docs: AttachmentItem[] = isPending
        ? (pendingAttachments ?? []).map((pending, index) => ({
            id:        `pending-${index}`,
            fileKey:   '',
            fileName:  pending.file.name,
            fileUrl:   '',
            fileSize:  pending.file.size,
            type:      pending.type,
            createdAt: '',
        }))
        : isControlled
            ? (items ?? [])
            : (documents ?? []);

    return (
        <div className={isInline ? styles.inline : styles.panel}>
            {isInline ? (
                <div className={styles.inlineHeader}>
                    <span className={styles.inlineLabel}>Adjuntos ({docs.length})</span>
                    <button className={styles.inlineAdd} onClick={() => setShowUpload(v => !v)}>
                        <Plus /> Adjuntar
                    </button>
                </div>
            ) : (
                <div className={styles.header}>
                    <h3 className={styles.title}>Documentos adjuntos</h3>
                    <button className={styles.addButton} onClick={() => setShowUpload(v => !v)}>
                        <Plus /> Adjuntar
                    </button>
                </div>
            )}

            {showUpload && (
                <div className={styles.uploadBox}>
                    <div
                        className={`${styles.dropzone} ${file ? styles.dropzoneActive : ''}`}
                        onDragOver={event => event.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.docx,.jpg,.jpeg,.png"
                            className={styles.fileInput}
                            onChange={event => void pickFile(event.target.files?.[0])}
                        />
                        {file ? (
                            <div className={styles.fileSelected}>
                                <File />
                                <span>{file.name}</span>
                                <span className={styles.fileSize}>{formatSize(file.size)}</span>
                            </div>
                        ) : (
                            <div className={styles.dropzoneEmpty}>
                                <Upload />
                                <p>Arrastra un archivo o haz clic para seleccionar</p>
                                <span>PDF, DOCX, JPG o PNG — máx. 10MB</span>
                            </div>
                        )}
                    </div>

                    <div className={styles.uploadRow}>
                        <select className={styles.select} value={type} onChange={event => setType(event.target.value)}>
                            {typeOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                        <button className={styles.cancelButton} onClick={() => { setShowUpload(false); setFile(null); }}>
                            Cancelar
                        </button>
                        <button className={styles.uploadButton} onClick={handleUpload} disabled={uploading || !file}>
                            {uploading ? 'Subiendo...' : isPending ? 'Agregar' : 'Subir'}
                        </button>
                    </div>
                </div>
            )}

            {!isPending && isLoading ? (
                <p className={styles.empty}>Cargando adjuntos...</p>
            ) : docs.length === 0 ? (
                !isInline && <p className={styles.empty}>Sin documentos adjuntos.</p>
            ) : (
                <div className={isInline ? styles.gridInline : styles.list}>
                    {docs.map((doc, index) =>
                    {
                        const typeLabel = typeOptions.find(option => option.value === doc.type)?.label ?? doc.type;
                        const tint      = typeColors?.[doc.type];

                        return (
                            <div key={doc.id} className={isInline ? styles.itemInline : styles.item}>
                                <div
                                    className={styles.itemIcon}
                                    style={tint ? {background: tint.bg, color: tint.color} : undefined}
                                >
                                    <File />
                                </div>
                                <div className={styles.itemInfo}>
                                    <span className={styles.itemName}>{doc.fileName}</span>
                                    <span className={styles.itemMeta}>
                                        {typeLabel} · {formatSize(doc.fileSize)}{!isInline && doc.createdAt && ` · ${formatDate(doc.createdAt)}`}
                                    </span>
                                </div>
                                {doc.fileKey && (
                                    <button type="button" className={styles.itemAction} title="Abrir" onClick={() => handleOpen(doc)}>
                                        <ExternalLink />
                                    </button>
                                )}
                                <button className={styles.itemDelete} onClick={() => handleDelete(doc, index)}>
                                    <Trash />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {confirmState && (
                <ConfirmModal
                    title={confirmState.title}
                    message={confirmState.message}
                    confirmLabel={confirmState.confirmLabel}
                    danger={confirmState.danger}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
        </div>
    );
};

export default AttachmentsPanel;
