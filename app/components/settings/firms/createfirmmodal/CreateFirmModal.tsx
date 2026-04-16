'use client';

import styles from './createfirmmodal.module.css';
import {X, Plus} from '@/app/components/svg';

interface CreateFirmModalProps {
    open:        boolean;
    saving:      boolean;
    name:        string;
    legalName:   string;
    city:        string;
    onClose:     () => void;
    onSave:      () => void;
    onName:      (v: string) => void;
    onLegalName: (v: string) => void;
    onCity:      (v: string) => void;
}

const CreateFirmModal = ({open, saving, name, legalName, city, onClose, onSave, onName, onLegalName, onCity}: CreateFirmModalProps) =>
{
    if (!open) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>Nueva Firma</h2>
                    <button className={styles.closeButton} onClick={onClose}><X /></button>
                </div>

                <div className={styles.formGroup}>
                    <label>Nombre de la firma *</label>
                    <input
                        className={styles.input}
                        value={name}
                        onChange={e => onName(e.target.value)}
                        placeholder="Ej: García & Asociados"
                        autoFocus
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Razón social</label>
                    <input
                        className={styles.input}
                        value={legalName}
                        onChange={e => onLegalName(e.target.value)}
                        placeholder="Ej: García & Asociados S.A.S."
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Ciudad</label>
                    <input
                        className={styles.input}
                        value={city}
                        onChange={e => onCity(e.target.value)}
                        placeholder="Ej: Bogotá"
                    />
                </div>

                <div className={styles.modalActions}>
                    <button className={styles.cancelButton} onClick={onClose}>Cancelar</button>
                    <button
                        className={styles.saveButton}
                        onClick={onSave}
                        disabled={!name.trim() || saving}
                        type="button"
                    >
                        {saving ? 'Creando...' : <><Plus /> Crear Firma</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateFirmModal;
