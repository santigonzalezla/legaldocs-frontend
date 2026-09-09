'use client';

import {useEffect, useState} from 'react';
import styles from './timelinecommentmodal.module.css';
import {X} from '@/app/components/svg';
import type {
    FirmMember,
    MemberEmailOption,
    PendingAttachment,
    PendingReminder,
    ProcessTimelineComment,
    TimelineCommentDraft,
} from '@/app/interfaces/interfaces';
import {PROCESS_TIMELINE_ATTACHMENT_TYPE_LABELS} from '@/app/interfaces/enums';
import AttachmentsPanel from '@/app/components/shared/attachmentspanel/AttachmentsPanel';
import TimelineReminderList from './TimelineReminderList';

interface TimelineCommentModalProps
{
    open:         boolean;
    saving:       boolean;
    comment:      ProcessTimelineComment | null;
    members:      FirmMember[];
    memberEmails: MemberEmailOption[];
    onClose:      () => void;
    onSave:       (draft: TimelineCommentDraft, pendingAttachments: PendingAttachment[], pendingReminders: PendingReminder[]) => void;
}

const pad = (value: number) => String(value).padStart(2, '0');

const toLocalInput = (iso: string | Date) =>
{
    const date = typeof iso === 'string' ? new Date(iso) : iso;
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const nowLocalInput = () => toLocalInput(new Date());

const memberName = (member: FirmMember) =>
    member.user ? `${member.user.firstName} ${member.user.lastName}` : (member.inviteEmail ?? 'Miembro');

const EMPTY: TimelineCommentDraft = {body: '', isFutureEvent: false, eventDate: '', responsibleId: ''};

const TimelineCommentModal = ({open, saving, comment, members, memberEmails, onClose, onSave}: TimelineCommentModalProps) =>
{
    const isEdit = !!comment;

    const [draft,       setDraft]       = useState<TimelineCommentDraft>(EMPTY);
    const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
    const [reminders,   setReminders]   = useState<PendingReminder[]>([]);

    useEffect(() =>
    {
        if (!open) return;

        setAttachments([]);
        setReminders([]);

        if (comment)
        {
            setDraft({
                body:          comment.body,
                isFutureEvent: comment.commentDate != null,
                eventDate:     comment.commentDate ? toLocalInput(comment.commentDate) : nowLocalInput(),
                responsibleId: comment.responsibleId ?? '',
            });
        }
        else
        {
            setDraft({...EMPTY, eventDate: nowLocalInput()});
        }
    }, [open, comment]);

    if (!open) return null;

    const set = <K extends keyof TimelineCommentDraft>(field: K, value: TimelineCommentDraft[K]) =>
        setDraft(prev => ({...prev, [field]: value}));

    const responsibleEmail = members.find(member => member.id === draft.responsibleId)?.user?.email ?? '';
    const hasEventDate = draft.isFutureEvent && draft.eventDate.length > 0;
    const isValid = draft.body.trim().length > 0 && (!draft.isFutureEvent || draft.eventDate.length > 0);

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3>{isEdit ? 'Editar comentario' : 'Nuevo comentario de la etapa'}</h3>
                    <button className={styles.closeButton} onClick={onClose}><X /></button>
                </div>

                <div className={styles.body}>
                    <div className={styles.formGroup}>
                        <label>Comentarios u observaciones *</label>
                        <textarea
                            className={styles.textarea}
                            placeholder="Ej: Recibí notificación de la demanda por estado electrónico..."
                            value={draft.body}
                            onChange={e => set('body', e.target.value)}
                            rows={3}
                            autoFocus
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Responsable</label>
                        <select className={styles.select} value={draft.responsibleId} onChange={e => set('responsibleId', e.target.value)}>
                            <option value="">Sin asignar</option>
                            {members.map(member => (
                                <option key={member.id} value={member.id}>{memberName(member)}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={draft.isFutureEvent}
                                onChange={e => set('isFutureEvent', e.target.checked)}
                            />
                            ¿Es un evento futuro?
                        </label>
                        <span className={styles.hint}>
                            Si no, el evento queda con la fecha y hora de este registro.
                        </span>
                    </div>

                    {draft.isFutureEvent && (
                        <div className={styles.formGroup}>
                            <label>Fecha y hora del evento *</label>
                            <input
                                className={styles.input}
                                type="datetime-local"
                                min={nowLocalInput()}
                                value={draft.eventDate}
                                onChange={e => set('eventDate', e.target.value)}
                            />
                        </div>
                    )}

                    {!isEdit && (
                        <>
                            <AttachmentsPanel
                                typeOptions={Object.entries(PROCESS_TIMELINE_ATTACHMENT_TYPE_LABELS).map(([value, label]) => ({value, label}))}
                                pendingAttachments={attachments}
                                onPendingChange={setAttachments}
                            />
                            <TimelineReminderList
                                memberEmails={memberEmails}
                                defaultEmail={responsibleEmail}
                                value={reminders}
                                onChange={setReminders}
                                hasEventDate={hasEventDate}
                            />
                        </>
                    )}
                </div>

                <div className={styles.actions}>
                    <button className={styles.cancelButton} onClick={onClose}>Cancelar</button>
                    <button
                        className={styles.saveButton}
                        onClick={() => onSave(draft, attachments, reminders)}
                        disabled={saving || !isValid}
                        type="button"
                    >
                        {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Agregar comentario'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TimelineCommentModal;
