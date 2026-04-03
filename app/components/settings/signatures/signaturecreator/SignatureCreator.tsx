'use client';

import {useRef, useState} from 'react';
import styles from './signaturecreator.module.css';
import {PenTool, Type, Upload, Save, X} from '@/app/components/svg';
import {useFetch} from '@/hooks/useFetch';
import type {DigitalSignature} from '@/app/interfaces/interfaces';
import {SignatureType} from '@/app/interfaces/enums';
import {toast} from 'sonner';

interface SignatureCreatorProps
{
    onClose:   () => void;
    onSaved?:  () => void;
    signature?: DigitalSignature;
}

const fonts = [
    {value: 'cursive',    label: 'Cursiva'},
    {value: 'serif',      label: 'Serif'},
    {value: 'sans-serif', label: 'Sans Serif'},
    {value: 'monospace',  label: 'Monospace'},
];

const SignatureCreator = ({onClose, onSaved, signature}: SignatureCreatorProps) =>
{
    const isEdit = !!signature;

    const initialTab = (): 'draw' | 'type' | 'upload' =>
    {
        if (!signature) return 'draw';
        if (signature.type === SignatureType.TYPE)   return 'type';
        if (signature.type === SignatureType.UPLOAD) return 'upload';
        return 'draw';
    };

    const [activeTab,       setActiveTab]       = useState<'draw' | 'type' | 'upload'>(initialTab);
    const [signatureName,   setSignatureName]   = useState(signature?.name ?? '');
    const [typedSignature,  setTypedSignature]  = useState(signature?.type === SignatureType.TYPE ? (signature.content ?? '') : '');
    const [selectedFont,    setSelectedFont]    = useState(signature?.font ?? 'cursive');
    const [uploadedPreview, setUploadedPreview] = useState<string>(
        signature?.type === SignatureType.UPLOAD ? (signature.content ?? '') : '',
    );
    const [isDrawing,       setIsDrawing]       = useState(false);
    const canvasRef   = useRef<HTMLCanvasElement>(null);
    const uploadedB64 = useRef<string>(
        signature?.type === SignatureType.UPLOAD ? (signature.content ?? '') : '',
    );

    const {execute: createSignature, isLoading: isSaving} = useFetch<DigitalSignature>('signature', {
        method:    'POST',
        immediate: false,
    });

    const {execute: updateSignature, isLoading: isUpdating} = useFetch<DigitalSignature>(
        signature ? `signature/${signature.id}` : '',
        {method: 'PATCH', immediate: false},
    );

    // ── Canvas drawing ──────────────────────────────────────────────────────
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) =>
    {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const ctx  = canvas.getContext('2d');
        ctx?.beginPath();
        ctx?.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) =>
    {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const ctx  = canvas.getContext('2d');
        if (!ctx) return;
        ctx.lineWidth   = 2;
        ctx.strokeStyle = '#000';
        ctx.lineCap     = 'round';
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
    };

    const stopDrawing = () => setIsDrawing(false);

    const clearCanvas = () =>
    {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    };

    // ── File upload ─────────────────────────────────────────────────────────
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) =>
    {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev =>
        {
            const result = ev.target?.result as string;
            uploadedB64.current = result;
            setUploadedPreview(result);
        };
        reader.readAsDataURL(file);
    };

    // ── Save ────────────────────────────────────────────────────────────────
    const handleSave = async () =>
    {
        if (!signatureName.trim())
        {
            toast.error('Ingresa un nombre para la firma.');
            return;
        }

        let content = '';
        let type: SignatureType;
        let font: string | undefined;

        if (activeTab === 'draw')
        {
            const canvas = canvasRef.current;
            if (!canvas)
            {
                toast.error('Error al capturar el canvas.');
                return;
            }
            // In edit mode keep existing content if canvas is blank
            const dataUrl = canvas.toDataURL('image/png');
            content = (isEdit && dataUrl === canvas.toDataURL('image/png') && !isDrawing && signature?.content)
                ? signature.content
                : dataUrl;
            type = SignatureType.DRAW;
        }
        else if (activeTab === 'type')
        {
            if (!typedSignature.trim())
            {
                toast.error('Escribe el texto de tu firma.');
                return;
            }
            content = typedSignature.trim();
            type    = SignatureType.TYPE;
            font    = selectedFont;
        }
        else
        {
            if (!uploadedB64.current)
            {
                toast.error('Sube una imagen de firma.');
                return;
            }
            content = uploadedB64.current;
            type    = SignatureType.UPLOAD;
        }

        const body = {name: signatureName.trim(), type, content, ...(font ? {font} : {})};

        const result = isEdit
            ? await updateSignature({body})
            : await createSignature({body});
        if (!result) return;

        toast.success(isEdit ? 'Firma actualizada correctamente.' : 'Firma guardada correctamente.');
        onSaved?.();
        onClose();
    };

    return (
        <div className={styles.signatureCreator}>
            <div className={styles.header}>
                <h3 className={styles.title}>{isEdit ? 'Editar Firma' : 'Crear Nueva Firma'}</h3>
                <button className={styles.closeButton} onClick={onClose}><X /></button>
            </div>

            <div className={styles.nameInput}>
                <label className={styles.label}>Nombre de la Firma</label>
                <input type="text" className={styles.input} value={signatureName}
                    onChange={e => setSignatureName(e.target.value)}
                    placeholder="Mi firma principal" />
            </div>

            <div className={styles.tabs}>
                {(['draw', 'type', 'upload'] as const).map(tab => (
                    <button key={tab}
                        className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
                        onClick={() => setActiveTab(tab)}>
                        {tab === 'draw' ? <><PenTool /> Dibujar</> :
                         tab === 'type' ? <><Type /> Escribir</> :
                         <><Upload /> Subir</>}
                    </button>
                ))}
            </div>

            <div className={styles.content}>
                {activeTab === 'draw' && (
                    <div className={styles.drawTab}>
                        <div className={styles.canvasContainer}>
                            <canvas ref={canvasRef} width={400} height={150} className={styles.canvas}
                                onMouseDown={startDrawing} onMouseMove={draw}
                                onMouseUp={stopDrawing} onMouseLeave={stopDrawing} />
                            <div className={styles.canvasOverlay}>Dibuja tu firma aquí</div>
                        </div>
                        <div className={styles.canvasActions}>
                            <button className={styles.clearButton} onClick={clearCanvas}>Limpiar</button>
                        </div>
                    </div>
                )}

                {activeTab === 'type' && (
                    <div className={styles.typeTab}>
                        <div className={styles.fontSelector}>
                            <label className={styles.label}>Fuente</label>
                            <select className={styles.select} value={selectedFont}
                                onChange={e => setSelectedFont(e.target.value)}>
                                {fonts.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                            </select>
                        </div>
                        <div className={styles.textInput}>
                            <input type="text" className={styles.signatureInput}
                                value={typedSignature} onChange={e => setTypedSignature(e.target.value)}
                                placeholder="Escribe tu nombre" style={{fontFamily: selectedFont}} />
                        </div>
                        <div className={styles.preview}>
                            <div className={styles.signaturePreview}
                                style={{fontFamily: selectedFont, fontSize: '2rem'}}>
                                {typedSignature || 'Vista previa'}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'upload' && (
                    <div className={styles.uploadTab}>
                        <div className={styles.uploadArea}>
                            <input type="file" accept="image/*" id="signature-upload"
                                className={styles.fileInput} onChange={handleFileUpload} />
                            <label htmlFor="signature-upload" className={styles.uploadLabel}>
                                <Upload />
                                <span>Haz clic para subir una imagen</span>
                                <span className={styles.uploadHint}>PNG, JPG hasta 5MB</span>
                            </label>
                            {uploadedPreview && (
                                <img src={uploadedPreview} alt="Vista previa" className={styles.uploadedPreview} />
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.actions}>
                <button className={styles.cancelButton} onClick={onClose}>Cancelar</button>
                <button className={styles.saveButton} onClick={handleSave} disabled={isSaving || isUpdating}>
                    <Save />
                    {(isSaving || isUpdating) ? 'Guardando...' : (isEdit ? 'Guardar Cambios' : 'Guardar Firma')}
                </button>
            </div>
        </div>
    );
};

export default SignatureCreator;
