'use client';

import styles from './signaturelist.module.css';
import {PenTool, Edit, Trash, Eye} from '@/app/components/svg';
import {useFetch} from '@/hooks/useFetch';
import type {DigitalSignature} from '@/app/interfaces/interfaces';
import {SignatureType} from '@/app/interfaces/enums';
import {toast} from 'sonner';

interface SignatureListProps
{
    onCreateNew: () => void;
    onEdit:      (sig: DigitalSignature) => void;
    listKey?:    number;
}

const typeLabel: Record<string, string> = {
    [SignatureType.DRAW]:   'Dibujada',
    [SignatureType.TYPE]:   'Tipografiada',
    [SignatureType.UPLOAD]: 'Subida',
};

const SignatureList = ({onCreateNew, onEdit, listKey}: SignatureListProps) =>
{
    const {data: signatures, isLoading, execute: refetch} = useFetch<DigitalSignature[]>('signature');

    const {execute: deleteSignature} = useFetch<void>('', {method: 'DELETE', immediate: false});

    const {execute: setDefault} = useFetch<DigitalSignature>('', {method: 'PATCH', immediate: false});

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('es-ES', {day: '2-digit', month: 'short', year: 'numeric'});

    const handleDelete = async (id: string, name: string) =>
    {
        if (!window.confirm(`¿Eliminar la firma "${name}"?`)) return;
        await deleteSignature({}, `signature/${id}`);
        toast.success('Firma eliminada.');
        refetch();
    };

    const handleSetDefault = async (id: string) =>
    {
        await setDefault({}, `signature/${id}/default`);
        toast.success('Firma predeterminada actualizada.');
        refetch();
    };

    const renderPreview = (sig: DigitalSignature) =>
    {
        if (sig.type === SignatureType.TYPE)
            return (
                <div className={styles.typePreview}
                    style={{fontFamily: sig.font || 'cursive', fontSize: '1.8rem'}}>
                    {sig.content}
                </div>
            );
        return <img src={sig.content} alt={sig.name} className={styles.previewImage} />;
    };

    const list = signatures ?? [];
    const defaultCount = list.filter(s => s.isDefault).length;

    if (isLoading) return <div className={styles.signatureList}><p>Cargando firmas...</p></div>;

    return (
        <div className={styles.signatureList}>
            <div className={styles.statsSection}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}><PenTool /></div>
                    <div className={styles.statInfo}>
                        <h3 className={styles.statValue}>{list.length}</h3>
                        <p className={styles.statTitle}>Firmas Creadas</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}><Eye /></div>
                    <div className={styles.statInfo}>
                        <h3 className={styles.statValue}>{defaultCount}</h3>
                        <p className={styles.statTitle}>Firma por Defecto</p>
                    </div>
                </div>
            </div>

            <div className={styles.signaturesGrid}>
                {list.map(sig => (
                    <div key={sig.id} className={styles.signatureCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.signatureInfo}>
                                <h4 className={styles.signatureName}>{sig.name}</h4>
                                <div className={styles.signatureMeta}>
                                    <span className={styles.signatureType}>
                                        {typeLabel[sig.type] ?? sig.type}
                                    </span>
                                    {sig.isDefault && (
                                        <span className={styles.defaultBadge}>Por defecto</span>
                                    )}
                                </div>
                            </div>
                            <div className={styles.cardActions}>
                                {!sig.isDefault && (
                                    <button className={styles.actionButton} title="Establecer como predeterminada"
                                        onClick={() => handleSetDefault(sig.id)}>
                                        <Eye />
                                    </button>
                                )}
                                <button className={styles.actionButton} title="Editar"
                                    onClick={() => onEdit(sig)}>
                                    <Edit />
                                </button>
                                <button className={styles.actionButton} title="Eliminar"
                                    onClick={() => handleDelete(sig.id, sig.name)}>
                                    <Trash />
                                </button>
                            </div>
                        </div>

                        <div className={styles.signaturePreview}>
                            {renderPreview(sig)}
                        </div>

                        <div className={styles.cardFooter}>
                            <span>Creada: {formatDate(sig.createdAt)}</span>
                        </div>
                    </div>
                ))}

                <div className={styles.createCard} onClick={onCreateNew}>
                    <div className={styles.createIcon}><PenTool /></div>
                    <h4 className={styles.createTitle}>Crear Nueva Firma</h4>
                    <p className={styles.createDescription}>Dibuja, escribe o sube una nueva firma digital</p>
                </div>
            </div>
        </div>
    );
};

export default SignatureList;
