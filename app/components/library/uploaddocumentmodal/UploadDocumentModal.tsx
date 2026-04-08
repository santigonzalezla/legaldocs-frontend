'use client';

import {useState, useRef} from 'react';
import styles from './uploaddocumentmodal.module.css';
import {X, Upload, File, Plus, Check} from '@/app/components/svg';
import {LibraryDocumentType} from '@/app/interfaces/enums';
import {API_BASE_URL} from '@/lib/constants';
import {useAuth} from '@/context/AuthContext';
import {useFirmId} from '@/hooks/useFirmId';
import {useFetch} from '@/hooks/useFetch';
import {toast} from 'sonner';
import type {LegalBranch} from '@/app/interfaces/interfaces';

const TYPE_LABELS: Record<LibraryDocumentType, string> = {
    [LibraryDocumentType.LAW]:           'Ley',
    [LibraryDocumentType.DECREE]:        'Decreto',
    [LibraryDocumentType.RESOLUTION]:    'Resolución',
    [LibraryDocumentType.CIRCULAR]:      'Circular',
    [LibraryDocumentType.RULING]:        'Sentencia',
    [LibraryDocumentType.JURISPRUDENCE]: 'Jurisprudencia',
    [LibraryDocumentType.DOCTRINE]:      'Doctrina',
    [LibraryDocumentType.CONTRACT]:      'Contrato',
    [LibraryDocumentType.OTHER]:         'Otro',
};

const PRESET_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f97316', '#ef4444', '#f59e0b', '#0ea5e9', '#ec4899'];

interface UploadDocumentModalProps
{
    branches:  LegalBranch[];
    onClose:   () => void;
    onSuccess: () => void;
    onBranchCreated: (branch: LegalBranch) => void;
}

const UploadDocumentModal = ({branches, onClose, onSuccess, onBranchCreated}: UploadDocumentModalProps) =>
{
    const {accessToken}    = useAuth();
    const firmId           = useFirmId();
    const fileInputRef     = useRef<HTMLInputElement>(null);

    const [title,        setTitle]        = useState('');
    const [description,  setDescription]  = useState('');
    const [type,         setType]         = useState<LibraryDocumentType>(LibraryDocumentType.LAW);
    const [branchId,     setBranchId]     = useState<string>('');
    const [file,         setFile]         = useState<File | null>(null);
    const [saving,       setSaving]       = useState(false);

    // Quick-create branch
    const [showNewBranch,  setShowNewBranch]  = useState(false);
    const [newBranchName,  setNewBranchName]  = useState('');
    const [newBranchColor, setNewBranchColor] = useState(PRESET_COLORS[0]);
    const [creatingBranch, setCreatingBranch] = useState(false);

    const {execute: createBranch} = useFetch<LegalBranch>('branch', {method: 'POST', immediate: false, firmScoped: true});

    const handleFileDrop = (e: React.DragEvent) =>
    {
        e.preventDefault();
        const dropped = e.dataTransfer.files[0];
        if (dropped) setFile(dropped);
    };

    const handleCreateBranch = async () =>
    {
        if (!newBranchName.trim()) return;
        setCreatingBranch(true);
        const slug   = newBranchName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const result = await createBranch({body: {name: newBranchName.trim(), slug, color: newBranchColor}});
        if (result) {
            onBranchCreated(result);
            setBranchId(result.id);
            setShowNewBranch(false);
            setNewBranchName('');
            toast.success(`Rama "${result.name}" creada`);
        }
        setCreatingBranch(false);
    };

    const handleSubmit = async (e: React.FormEvent) =>
    {
        e.preventDefault();
        if (!file) return toast.error('Selecciona un archivo');
        if (!title.trim()) return toast.error('Ingresa un título');

        setSaving(true);
        try
        {
            const formData = new FormData();
            formData.append('file',  file);
            formData.append('title', title.trim());
            formData.append('type',  type);
            if (description.trim()) formData.append('description', description.trim());
            if (branchId)           formData.append('branchId', branchId);

            const res = await fetch(`${API_BASE_URL}/library/documents`, {
                method:  'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'X-Firm-Id':   firmId ?? '',
                },
                body: formData,
            });

            if (!res.ok) throw new Error();

            toast.success('Documento subido correctamente. Indexando en segundo plano...');
            onSuccess();
        }
        catch
        {
            toast.error('Error al subir el documento');
        }
        finally
        {
            setSaving(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Subir documento jurídico</h2>
                    <button className={styles.closeBtn} onClick={onClose}><X /></button>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    {/* File drop zone */}
                    <div
                        className={`${styles.dropzone} ${file ? styles.dropzoneActive : ''}`}
                        onDragOver={e => e.preventDefault()}
                        onDrop={handleFileDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.docx,.txt"
                            className={styles.fileInput}
                            onChange={e => setFile(e.target.files?.[0] ?? null)}
                        />
                        {file ? (
                            <div className={styles.fileSelected}>
                                <File className={styles.fileIcon} />
                                <span className={styles.fileName}>{file.name}</span>
                                <span className={styles.fileSize}>
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                            </div>
                        ) : (
                            <div className={styles.dropzoneEmpty}>
                                <Upload className={styles.uploadIcon} />
                                <p>Arrastra un archivo o haz clic para seleccionar</p>
                                <span>PDF, DOCX o TXT — máx. 20MB</span>
                            </div>
                        )}
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Título</label>
                        <input
                            className={styles.input}
                            type="text"
                            placeholder="Ej: Ley 820 de 2003"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label className={styles.label}>Tipo de documento</label>
                            <select
                                className={styles.input}
                                value={type}
                                onChange={e => setType(e.target.value as LibraryDocumentType)}
                            >
                                {Object.entries(TYPE_LABELS).map(([val, label]) => (
                                    <option key={val} value={val}>{label}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>
                                Rama jurídica <span className={styles.optional}>(opcional)</span>
                            </label>
                            <select
                                className={styles.input}
                                value={branchId}
                                onChange={e => {
                                    if (e.target.value === '__new__') { setShowNewBranch(true); }
                                    else setBranchId(e.target.value);
                                }}
                            >
                                <option value="">Sin rama</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                                <option value="__new__">+ Nueva rama...</option>
                            </select>
                        </div>
                    </div>

                    {/* Quick-create branch inline */}
                    {showNewBranch && (
                        <div className={styles.newBranchBox}>
                            <p className={styles.newBranchTitle}>Nueva rama</p>
                            <div className={styles.newBranchRow}>
                                <input
                                    className={styles.input}
                                    placeholder="Nombre de la rama"
                                    value={newBranchName}
                                    onChange={e => setNewBranchName(e.target.value)}
                                    autoFocus
                                />
                                <div className={styles.colorPicker}>
                                    {PRESET_COLORS.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            className={`${styles.colorDot} ${newBranchColor === c ? styles.colorDotActive : ''}`}
                                            style={{backgroundColor: c}}
                                            onClick={() => setNewBranchColor(c)}
                                        >
                                            {newBranchColor === c && <Check className={styles.colorCheck} />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className={styles.newBranchActions}>
                                <button
                                    type="button"
                                    className={styles.btnCancelSmall}
                                    onClick={() => { setShowNewBranch(false); setNewBranchName(''); }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className={styles.btnCreateBranch}
                                    disabled={!newBranchName.trim() || creatingBranch}
                                    onClick={handleCreateBranch}
                                >
                                    <Plus /> {creatingBranch ? 'Creando...' : 'Crear rama'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className={styles.field}>
                        <label className={styles.label}>Descripción <span className={styles.optional}>(opcional)</span></label>
                        <textarea
                            className={styles.textarea}
                            placeholder="Breve descripción del contenido..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className={styles.actions}>
                        <button type="button" className={styles.btnCancel} onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className={styles.btnSubmit} disabled={saving}>
                            {saving ? 'Subiendo...' : 'Subir documento'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UploadDocumentModal;
