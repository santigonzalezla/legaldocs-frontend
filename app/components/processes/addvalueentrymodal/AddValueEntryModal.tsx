'use client';

import {useState} from 'react';
import styles from './addvalueentrymodal.module.css';
import {X} from '@/app/components/svg';

interface AddValueEntryModalProps
{
    open:    boolean;
    saving:  boolean;
    onClose: () => void;
    onSave:  (amount: number, description: string) => void;
}

const formatThousands = (raw: string) =>
{
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    return Number(digits).toLocaleString('es-CO');
};

const parseRawDigits = (formatted: string) => formatted.replace(/\D/g, '');

const AddValueEntryModal = ({open, saving, onClose, onSave}: AddValueEntryModalProps) =>
{
    const [amountRaw,   setAmountRaw]   = useState('');
    const [description, setDescription] = useState('');

    if (!open) return null;

    const handleAmountChange = (value: string) =>
        setAmountRaw(parseRawDigits(value));

    const handleSave = () =>
    {
        const amount = Number(amountRaw);
        if (!amount || amount <= 0 || !description.trim()) return;
        onSave(amount, description.trim());
        setAmountRaw('');
        setDescription('');
    };

    const isValid = Number(amountRaw) > 0 && description.trim().length > 0;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3>Agregar entrada de valor</h3>
                    <button className={styles.closeButton} onClick={onClose}><X /></button>
                </div>

                <div className={styles.body}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Monto (COP)</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            className={styles.input}
                            placeholder="Ej: 2.000.000"
                            value={formatThousands(amountRaw)}
                            onChange={e => handleAmountChange(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Descripción / razón</label>
                        <textarea
                            className={styles.textarea}
                            rows={3}
                            placeholder="Ej: Audiencia extraordinaria, honorarios adicionales..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>
                </div>

                <div className={styles.actions}>
                    <button className={styles.cancelButton} onClick={onClose}>Cancelar</button>
                    <button
                        className={styles.saveButton}
                        onClick={handleSave}
                        disabled={saving || !isValid}
                    >
                        {saving ? 'Guardando...' : 'Agregar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddValueEntryModal;
