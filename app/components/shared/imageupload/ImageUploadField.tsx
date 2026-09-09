'use client';

import {MutableRefObject, ReactNode, useEffect, useRef, useState} from 'react';
import styles from './imageuploadfield.module.css';
import {Camera, Trash} from '@/app/components/svg';
import IdentityImage from './IdentityImage';
import CropModal from './CropModal';

const VARIANTS = {
    avatar: {
        width: 96, height: 96, radius: '50%' as const,
        aspect: 1, cropShape: 'round' as const, objectFit: 'cover' as const,
        mimeType: 'image/jpeg', fileName: 'avatar.jpg', frameClass: 'frameAvatar',
    },
    logo: {
        width: 96, height: 96, radius: 16,
        aspect: 1, cropShape: 'rect' as const, objectFit: 'contain' as const,
        mimeType: 'image/png', fileName: 'logo.png', frameClass: 'frameLogo',
    },
};

interface ImageUploadFieldProps
{
    variant:    'avatar' | 'logo';
    src:        string;
    alt:        string;
    fallback:   ReactNode;
    editable:   boolean;
    hasImage:   boolean;
    onUpload:   (blob: Blob) => Promise<boolean>;
    onRemove:   () => Promise<void>;
    cropTitle?: string;
    caption?:   string;
    showActions?: boolean;
    pickerRef?: MutableRefObject<(() => void) | null>;
}

const ImageUploadField = ({
    variant, src, alt, fallback, editable, hasImage,
    onUpload, onRemove, cropTitle, caption, showActions = true, pickerRef,
}: ImageUploadFieldProps) =>
{
    const config = VARIANTS[variant];
    const inputRef = useRef<HTMLInputElement>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [isRemoving,  setIsRemoving]  = useState(false);

    const openPicker = () => inputRef.current?.click();

    useEffect(() =>
    {
        if (!pickerRef) return;
        pickerRef.current = openPicker;
        return () => { pickerRef.current = null; };
    }, [pickerRef]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (file) setPendingFile(file);
    };

    const handleConfirm = async (blob: Blob): Promise<boolean> =>
    {
        const ok = await onUpload(blob);
        if (ok) setPendingFile(null);
        return ok;
    };

    const handleRemove = async () =>
    {
        setIsRemoving(true);
        try { await onRemove(); }
        finally { setIsRemoving(false); }
    };

    return (
        <div className={styles.wrapper}>
            <div className={`${styles.frame} ${styles[config.frameClass]}`}>
                <IdentityImage
                    src={hasImage ? src : null}
                    fallback={fallback}
                    width={config.width}
                    height={config.height}
                    radius={config.radius}
                    alt={alt}
                    objectFit={config.objectFit}
                    className={styles.preview}
                />

                {editable && (
                    <button type="button" className={styles.overlay} onClick={openPicker} disabled={isRemoving}>
                        <Camera />
                        <span>Cambiar</span>
                        {caption && <span className={styles.overlayHint}>{caption}</span>}
                    </button>
                )}
            </div>

            {editable && showActions && hasImage && (
                <button type="button" className={styles.removeButton} onClick={handleRemove} disabled={isRemoving}>
                    <Trash />
                    {isRemoving ? 'Eliminando...' : 'Eliminar'}
                </button>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={handleFileChange}
            />

            {pendingFile && (
                <CropModal
                    file={pendingFile}
                    aspect={config.aspect}
                    cropShape={config.cropShape}
                    mimeType={config.mimeType}
                    title={cropTitle}
                    onCancel={() => setPendingFile(null)}
                    onConfirm={handleConfirm}
                />
            )}
        </div>
    );
};

export default ImageUploadField;
