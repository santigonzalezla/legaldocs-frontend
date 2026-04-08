'use client';

import styles from '../addbranch/addbranch.module.css';
import {X, Check} from '@/app/components/svg';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

interface EditBranchModalProps
{
    open:    boolean;
    saving:  boolean;
    name:    string;
    desc:    string;
    color:   string;
    onClose: () => void;
    onSave:  () => void;
    onName:  (v: string) => void;
    onDesc:  (v: string) => void;
    onColor: (v: string) => void;
}

const EditBranchModal = ({open, saving, name, desc, color, onClose, onSave, onName, onDesc, onColor}: EditBranchModalProps) =>
{
    if (!open) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>Editar Rama Jurídica</h2>
                    <button className={styles.closeButton} onClick={onClose}><X /></button>
                </div>

                <div className={styles.formGroup}>
                    <label>Nombre *</label>
                    <input
                        className={styles.input}
                        value={name}
                        onChange={e => onName(e.target.value)}
                        placeholder="Ej: Derecho Marítimo"
                        autoFocus
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Descripción</label>
                    <textarea
                        className={styles.textarea}
                        value={desc}
                        onChange={e => onDesc(e.target.value)}
                        placeholder="Describe brevemente el área del derecho"
                        rows={3}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Color</label>
                    <div className={styles.colorPicker}>
                        {COLORS.map(c => (
                            <button
                                key={c}
                                className={`${styles.colorSwatch} ${color === c ? styles.colorSwatchActive : ''}`}
                                style={{background: c}}
                                onClick={() => onColor(c)}
                                type="button"
                            />
                        ))}
                    </div>
                    <div className={styles.colorPreview}>
                        <span className={styles.colorDot} style={{background: color}} />
                        <span className={styles.colorHex}>{color}</span>
                    </div>
                </div>

                <div className={styles.modalActions}>
                    <button className={styles.cancelButton} onClick={onClose}>Cancelar</button>
                    <button
                        className={styles.saveButton}
                        onClick={onSave}
                        disabled={!name.trim() || saving}
                        type="button"
                    >
                        {saving ? 'Guardando...' : <><Check /> Guardar cambios</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditBranchModal;
