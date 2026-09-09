'use client';

import styles from './createprocessmodal.module.css';
import {X, Plus} from '@/app/components/svg';
import type {ClientPickerOption, LegalBranch} from '@/app/interfaces/interfaces';
import ProcessExtraFields, {ProcessExtraFieldsValue} from '@/app/components/processes/processextrafields/ProcessExtraFields';
import CategoryCombobox from '@/app/components/processes/categorycombobox/CategoryCombobox';
import AttachmentsPanel from '@/app/components/shared/attachmentspanel/AttachmentsPanel';
import {PROCESS_DOCUMENT_TYPE_LABELS} from '@/app/interfaces/enums';
import type {PendingAttachment} from '@/lib/attachments';

const formatThousands = (raw: string) =>
{
    const digits = raw.replace(/\D/g, '');
    return digits ? Number(digits).toLocaleString('es-CO') : '';
};

export interface CreateProcessForm extends ProcessExtraFieldsValue
{
    clientId:     string;
    title:        string;
    categoryId:   string;
    description:  string;
    reference:    string;
    branchId:     string;
    court:        string;
    counterpart:  string;
    startDate:    string;
    processValue: string;
}

interface CreateProcessModalProps
{
    open:                boolean;
    saving:              boolean;
    form:                CreateProcessForm;
    clients:             ClientPickerOption[];
    branches:            LegalBranch[];
    attachments:         PendingAttachment[];
    onChange:            (field: keyof CreateProcessForm, value: string | boolean) => void;
    onAttachmentsChange: (attachments: PendingAttachment[]) => void;
    onClose:             () => void;
    onSave:              () => void;
}

const CreateProcessModal = ({open, saving, form, clients, branches, attachments, onChange, onAttachmentsChange, onClose, onSave}: CreateProcessModalProps) =>
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
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>{client.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Título del proceso *</label>
                        <CategoryCombobox
                            categoryId={form.categoryId}
                            categoryName={form.title}
                            placeholder="Ej: Proceso arrendamiento Apto 301"
                            onChange={(categoryId, categoryName) =>
                            {
                                onChange('categoryId', categoryId);
                                onChange('title', categoryName);
                            }}
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
                                {branches.map(branch => (
                                    <option key={branch.id} value={branch.id}>{branch.name}</option>
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

                    <div className={styles.row}>
                        <div className={styles.formGroup}>
                            <label>Valor inicial pactado (COP)</label>
                            <input
                                className={styles.input}
                                type="text"
                                inputMode="numeric"
                                placeholder="Ej: 10.000.000"
                                value={formatThousands(form.processValue)}
                                onChange={e => onChange('processValue', e.target.value.replace(/\D/g, ''))}
                            />
                        </div>
                    </div>

                    <ProcessExtraFields value={form} onChange={onChange} />

                    <AttachmentsPanel
                        typeOptions={Object.entries(PROCESS_DOCUMENT_TYPE_LABELS).map(([value, label]) => ({value, label}))}
                        pendingAttachments={attachments}
                        onPendingChange={onAttachmentsChange}
                    />
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
