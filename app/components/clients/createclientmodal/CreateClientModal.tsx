'use client';

import styles from './createclientmodal.module.css';
import {X, Plus} from '@/app/components/svg';
import {ClientType} from '@/app/interfaces/enums';

interface CreateClientForm
{
    type:           ClientType;
    firstName:      string;
    lastName:       string;
    companyName:    string;
    documentType:   string;
    documentNumber: string;
    email:          string;
    phone:          string;
    city:           string;
}

interface CreateClientModalProps
{
    open:     boolean;
    saving:   boolean;
    form:     CreateClientForm;
    onChange: (field: keyof CreateClientForm, value: string) => void;
    onClose:  () => void;
    onSave:   () => void;
}

const DOC_TYPES = ['CC', 'NIT', 'CE', 'PP', 'TI', 'RUT'];

const CreateClientModal = ({open, saving, form, onChange, onClose, onSave}: CreateClientModalProps) =>
{
    if (!open) return null;

    const isCompany = form.type === ClientType.COMPANY;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>Nuevo Cliente</h2>
                    <button className={styles.closeButton} onClick={onClose}><X /></button>
                </div>

                <div className={styles.formBody}>
                    <div className={styles.formGroup}>
                        <label>Tipo de cliente *</label>
                        <div className={styles.typeToggle}>
                            <button
                                type="button"
                                className={`${styles.typeBtn} ${!isCompany ? styles.typeBtnActive : ''}`}
                                onClick={() => onChange('type', ClientType.INDIVIDUAL)}
                            >
                                Persona Natural
                            </button>
                            <button
                                type="button"
                                className={`${styles.typeBtn} ${isCompany ? styles.typeBtnActive : ''}`}
                                onClick={() => onChange('type', ClientType.COMPANY)}
                            >
                                Empresa
                            </button>
                        </div>
                    </div>

                    {isCompany ? (
                        <div className={styles.formGroup}>
                            <label>Razón social *</label>
                            <input
                                className={styles.input}
                                placeholder="Ej: Inversiones XYZ S.A.S."
                                value={form.companyName}
                                onChange={e => onChange('companyName', e.target.value)}
                                autoFocus
                            />
                        </div>
                    ) : (
                        <div className={styles.row}>
                            <div className={styles.formGroup}>
                                <label>Nombre *</label>
                                <input
                                    className={styles.input}
                                    placeholder="Juan"
                                    value={form.firstName}
                                    onChange={e => onChange('firstName', e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Apellido *</label>
                                <input
                                    className={styles.input}
                                    placeholder="Pérez"
                                    value={form.lastName}
                                    onChange={e => onChange('lastName', e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <div className={styles.row}>
                        <div className={styles.formGroup}>
                            <label>Tipo de documento</label>
                            <select
                                className={styles.select}
                                value={form.documentType}
                                onChange={e => onChange('documentType', e.target.value)}
                            >
                                <option value="">Seleccionar</option>
                                {DOC_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Número de documento</label>
                            <input
                                className={styles.input}
                                placeholder="1234567890"
                                value={form.documentNumber}
                                onChange={e => onChange('documentNumber', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.formGroup}>
                            <label>Email</label>
                            <input
                                className={styles.input}
                                type="email"
                                placeholder="cliente@email.com"
                                value={form.email}
                                onChange={e => onChange('email', e.target.value)}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Teléfono</label>
                            <input
                                className={styles.input}
                                placeholder="+57 300 123 4567"
                                value={form.phone}
                                onChange={e => onChange('phone', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Ciudad</label>
                        <input
                            className={styles.input}
                            placeholder="Bogotá"
                            value={form.city}
                            onChange={e => onChange('city', e.target.value)}
                        />
                    </div>
                </div>

                <div className={styles.modalActions}>
                    <button className={styles.cancelButton} onClick={onClose}>Cancelar</button>
                    <button
                        className={styles.saveButton}
                        onClick={onSave}
                        disabled={saving || (isCompany ? !form.companyName.trim() : !form.firstName.trim())}
                        type="button"
                    >
                        {saving ? 'Guardando...' : <><Plus /> Crear Cliente</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateClientModal;
