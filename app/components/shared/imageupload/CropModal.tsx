'use client';

import {useCallback, useEffect, useState} from 'react';
import Cropper from 'react-easy-crop';
import type {Area, Point} from 'react-easy-crop';
import styles from './cropmodal.module.css';
import {getCroppedBlob, getFullImageBlob} from './cropImage';

interface CropModalProps
{
    file:      File;
    aspect:    number;
    cropShape: 'round' | 'rect';
    mimeType:  string;
    title?:    string;
    onCancel:  () => void;
    onConfirm: (blob: Blob) => Promise<boolean>;
}

const CropModal = ({file, aspect, cropShape, mimeType, title = 'Ajustar imagen', onCancel, onConfirm}: CropModalProps) =>
{
    const [imageSrc,   setImageSrc]   = useState('');
    const [crop,       setCrop]       = useState<Point>({x: 0, y: 0});
    const [zoom,       setZoom]       = useState(1);
    const [areaPixels, setAreaPixels] = useState<Area | null>(null);
    const [skipCrop,   setSkipCrop]   = useState(false);
    const [isSaving,   setIsSaving]   = useState(false);

    useEffect(() =>
    {
        const url = URL.createObjectURL(file);
        setImageSrc(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const handleCropComplete = useCallback((_area: Area, pixels: Area) => setAreaPixels(pixels), []);

    const handleSave = async () =>
    {
        if (!skipCrop && !areaPixels) return;
        setIsSaving(true);
        try
        {
            const blob = skipCrop
                ? await getFullImageBlob(imageSrc, mimeType)
                : await getCroppedBlob(imageSrc, areaPixels!, mimeType, aspect);
            await onConfirm(blob);
        }
        finally
        {
            setIsSaving(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onCancel}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <h3 className={styles.title}>{title}</h3>

                <div className={`${styles.cropArea} ${skipCrop ? styles.cropAreaDisabled : ''}`}>
                    <div className={styles.cropInner}>
                        {imageSrc && (
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={aspect}
                                cropShape={cropShape}
                                showGrid={false}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={handleCropComplete}
                            />
                        )}
                    </div>
                    {skipCrop && (
                        <div className={styles.skipHint}>Se subirá la imagen completa</div>
                    )}
                </div>

                <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={zoom}
                    className={styles.zoom}
                    disabled={skipCrop}
                    onChange={e => setZoom(Number(e.target.value))}
                />

                <label className={styles.skipRow}>
                    <input type="checkbox" checked={skipCrop} onChange={e => setSkipCrop(e.target.checked)} />
                    <span>Usar la imagen original sin recortar</span>
                </label>

                <div className={styles.actions}>
                    <button className={styles.btnCancel} onClick={onCancel} disabled={isSaving}>
                        Cancelar
                    </button>
                    <button className={styles.btnConfirm} onClick={handleSave} disabled={isSaving || (!skipCrop && !areaPixels)}>
                        {isSaving ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CropModal;
