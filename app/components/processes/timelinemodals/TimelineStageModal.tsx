'use client';

import {useEffect, useState} from 'react';
import styles from './timelinecommentmodal.module.css';
import {X} from '@/app/components/svg';
import {
    PROCESS_TIMELINE_ATTACHMENT_TYPE_COLORS,
    PROCESS_TIMELINE_ATTACHMENT_TYPE_LABELS,
    TIMELINE_STAGE_LABELS,
    TimelineStage,
} from '@/app/interfaces/enums';
import type {PendingAttachment, StageAdvanceDraft} from '@/app/interfaces/interfaces';
import AttachmentsPanel from '@/app/components/shared/attachmentspanel/AttachmentsPanel';

interface TimelineStageModalProps
{
    open:          boolean;
    saving:        boolean;
    allowedStages: TimelineStage[];
    onClose:       () => void;
    onSave:        (stage: TimelineStage, microStageLabel: string, advance: StageAdvanceDraft | null) => void;
}

const TimelineStageModal = ({open, saving, allowedStages, onClose, onSave}: TimelineStageModalProps) =>
{
    const firstStage = allowedStages.length === 6;

    const [stage,           setStage]           = useState<TimelineStage | ''>('');
    const [microStageLabel, setMicroStageLabel] = useState('');
    const [body,            setBody]            = useState('');
    const [attachments,     setAttachments]     = useState<PendingAttachment[]>([]);

    useEffect(() =>
    {
        if (!open) return;
        setStage(allowedStages[0] ?? '');
        setMicroStageLabel('');
        setBody('');
        setAttachments([]);
    }, [open, allowedStages]);

    if (!open) return null;

    const advanceValid = body.trim().length > 0 || attachments.length > 0;
    const isValid      = !!stage && (firstStage || advanceValid);

    const handleSave = () =>
    {
        if (!stage) return;
        onSave(stage, microStageLabel, firstStage ? null : {body, attachments});
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3>{firstStage ? 'Registrar primera etapa' : 'Avanzar a la siguiente etapa'}</h3>
                    <button className={styles.closeButton} onClick={onClose}><X /></button>
                </div>

                <div className={styles.body}>
                    <div className={styles.formGroup}>
                        <label>Etapa *</label>
                        <select className={styles.select} value={stage} onChange={e => setStage(e.target.value as TimelineStage)}>
                            {allowedStages.map(option => (
                                <option key={option} value={option}>{TIMELINE_STAGE_LABELS[option]}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Micro etapa <span className={styles.optional}>(opcional)</span></label>
                        <input
                            className={styles.input}
                            placeholder="Ej: Notificación por estado"
                            value={microStageLabel}
                            onChange={e => setMicroStageLabel(e.target.value)}
                        />
                    </div>

                    {!firstStage && (
                        <>
                            <div className={styles.formGroup}>
                                <label>Comentarios u observaciones del avance</label>
                                <textarea
                                    className={styles.textarea}
                                    placeholder="Ej: Se corrió traslado y se avanzó a la audiencia inicial..."
                                    value={body}
                                    onChange={e => setBody(e.target.value)}
                                    rows={3}
                                />
                                <span className={styles.hint}>Registrá un comentario o adjuntá un documento — al menos uno de los dos.</span>
                            </div>

                            <AttachmentsPanel
                                typeOptions={Object.entries(PROCESS_TIMELINE_ATTACHMENT_TYPE_LABELS).map(([value, label]) => ({value, label}))}
                                typeColors={PROCESS_TIMELINE_ATTACHMENT_TYPE_COLORS}
                                pendingAttachments={attachments}
                                onPendingChange={setAttachments}
                            />
                        </>
                    )}
                </div>

                <div className={styles.actions}>
                    <button className={styles.cancelButton} onClick={onClose}>Cancelar</button>
                    <button
                        className={styles.saveButton}
                        onClick={handleSave}
                        disabled={saving || !isValid}
                        type="button"
                    >
                        {saving ? 'Guardando...' : firstStage ? 'Registrar etapa' : 'Avanzar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TimelineStageModal;
