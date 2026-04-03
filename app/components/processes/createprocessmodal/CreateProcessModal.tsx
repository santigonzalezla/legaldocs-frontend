'use client';

import styles from './createprocessmodal.module.css';
import {X, Plus} from '@/app/components/svg';
import type {Client, LegalBranch} from '@/app/interfaces/interfaces';
import {ClientType} from '@/app/interfaces/enums';

const clientName = (c: Client) =>
    c.type === ClientType.COMPANY
        ? (c.companyName ?? '—')
        : [c.firstName, c.lastName].filter(Boolean).join(' ') || '—';

export interface CreateProcessForm
{
    clientId:    string;
    title:       string;
    description: string;
    reference:   string;
    branchId:    string;
    court:       string;
    counterpart: string;
    startDate:   string;
}

interface CreateProcessModalProps
{
    open:     boolean;
    saving:   boolean;
    form:     CreateProcessForm;
    clients:  Client[];
    branches: LegalBranch[];
    onChange: (field: keyof CreateProcessForm, value: string) => void;
    onClose:  () => void;
    onSave:   () => void;
}

const CreateProcessModal = ({open, saving, form, clients, branches, onChange, onClose, onSave}: CreateProcessModalProps) =>
{
    if (!open) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>Nuevo Proceso</h2>
                    <button className={styles.closeButton} onClick={onClose}><X /></button>
                </div>

                <div className={styles.formBody}>
                    <div className={styles.formGroup}>
                        <label>Cliente *</label>
                        <select
                            className={styles.select}
                            value={form.clientId}
                            onChange={e => onChange('clientId', e.target.value)}
                        >
                            <option value="">Seleccionar cliente</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{clientName(c)}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Título del proceso *</label>
                        <input
                            className={styles.input}
                            placeholder="Ej: Proceso arrendamiento Apto 301"
                            value={form.title}
                            onChange={e => onChange('title', e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Descripción</label>
                        <textarea
                            className={styles.textarea}
                            placeholder="Describe brevemente el proceso..."
                            value={form.description}
                            onChange={e => onChange('description', e.target.value)}
                            rows={2}
                        />
                    </div>

                    <div className={styles.row}>
                        <div className={styles.formGroup}>
                            <label>Radicado / Referencia</label>
                            <input
                                className={styles.input}
                                placeholder="11001310300120230012300"
                                value={form.reference}
                                onChange={e => onChange('reference', e.target.value)}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Rama jurídica</label>
                            <select
                                className={styles.select}
                                value={form.branchId}
                                onChange={e => onChange('branchId', e.target.value)}
                            >
                                <option value="">Sin rama</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Juzgado / Entidad</label>
                        <input
                            className={styles.input}
                            placeholder="Ej: Juzgado 12 Civil del Circuito de Bogotá"
                            value={form.court}
                            onChange={e => onChange('court', e.target.value)}
                        />
                    </div>

                    <div className={styles.row}>
                        <div className={styles.formGroup}>
                            <label>Contraparte</label>
                            <input
                                className={styles.input}
                                placeholder="Nombre o razón social"
                                value={form.counterpart}
                                onChange={e => onChange('counterpart', e.target.value)}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Fecha de inicio</label>
                            <input
                                className={styles.input}
                                type="date"
                                value={form.startDate}
                                onChange={e => onChange('startDate', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.modalActions}>
                    <button className={styles.cancelButton} onClick={onClose}>Cancelar</button>
                    <button
                        className={styles.saveButton}
                        onClick={onSave}
                        disabled={saving || !form.clientId || !form.title.trim()}
                        type="button"
                    >
                        {saving ? 'Guardando...' : <><Plus /> Crear Proceso</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateProcessModal;
