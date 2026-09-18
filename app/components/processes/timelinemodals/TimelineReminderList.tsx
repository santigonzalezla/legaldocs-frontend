'use client';

import {useEffect, useState} from 'react';
import styles from './timelinereminderlist.module.css';
import {useFetch} from '@/hooks/useFetch';
import {toast} from 'sonner';
import {Plus, Trash} from '@/app/components/svg';
import {
    REMINDER_OFFSET_OPTIONS,
    REMINDER_STATUS_COLORS,
    REMINDER_STATUS_LABELS,
    ReminderStatus,
} from '@/app/interfaces/enums';
import type {MemberEmailOption, PendingReminder, ProcessTimelineReminder} from '@/app/interfaces/interfaces';

interface TimelineReminderListProps
{
    memberEmails: MemberEmailOption[];
    defaultEmail?: string;
    // Modo "pendiente" (modal de creación): array en memoria.
    value?: PendingReminder[];
    onChange?: (value: PendingReminder[]) => void;
    // Modo "live" (comentario ya creado): CRUD contra la API.
    apiBasePath?: string;
    reminders?: ProcessTimelineReminder[];
    onChanged?: () => void;
    // Deshabilita "agregar" por completo.
    disabled?: boolean;
    // Fecha del evento (null si el comentario no tiene una). Un anticipo solo
    // tiene sentido si eventDate - offsetMinutes sigue quedando en el futuro;
    // "Ahora" (offset 0) siempre es válido porque no depende de eventDate.
    eventDate?: Date | null;
}

const NEW_TINT = REMINDER_STATUS_COLORS[ReminderStatus.Pending];

const offsetLabel = (minutes: number) =>
    REMINDER_OFFSET_OPTIONS.find(option => option.value === minutes)?.label ?? `${minutes} min antes`;

const fmtSentAt = (iso: string) =>
    new Date(iso).toLocaleString('es-ES', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'});

const TimelineReminderList = ({memberEmails, defaultEmail, value, onChange, apiBasePath, reminders, onChanged, disabled, eventDate}: TimelineReminderListProps) =>
{
    const isLive = !!apiBasePath;

    const offsetOptions = REMINDER_OFFSET_OPTIONS.filter(option =>
        option.value === 0 || (eventDate != null && eventDate.getTime() - option.value * 60_000 > Date.now())
    );

    const [showAdd, setShowAdd] = useState(false);
    const [offset,  setOffset]  = useState(eventDate ? 1440 : 0);
    const [email,   setEmail]   = useState(defaultEmail ?? memberEmails[0]?.email ?? '');
    const [busy,    setBusy]    = useState(false);

    // Si cambió `eventDate`, el offset guardado puede ya no estar disponible.
    const effectiveOffset = offsetOptions.some(option => option.value === offset) ? offset : offsetOptions[0].value;

    const {execute: createReminder, error: createError} = useFetch('', {method: 'POST',   immediate: false, firmScoped: true});
    const {execute: deleteReminder, error: deleteError} = useFetch('', {method: 'DELETE', immediate: false, firmScoped: true});

    useEffect(() =>
    {
        const message = createError ?? deleteError;
        if (message) toast.error(message);
    }, [createError, deleteError]);

    const nameFor = (recipientEmail: string) =>
        memberEmails.find(option => option.email === recipientEmail)?.name ?? recipientEmail;

    const handleAdd = async () =>
    {
        const recipientEmail = (email || defaultEmail || '').trim();
        if (!recipientEmail) { toast.error('Elegí un correo para el recordatorio'); return; }

        if (!isLive)
        {
            onChange?.([...(value ?? []), {offsetMinutes: effectiveOffset, recipientEmail}]);
            setShowAdd(false);
            return;
        }

        setBusy(true);
        const result = await createReminder({body: {offsetMinutes: effectiveOffset, recipientEmail}}, apiBasePath);
        setBusy(false);
        if (!result) return;
        toast.success('Recordatorio agregado.');
        setShowAdd(false);
        onChanged?.();
    };

    const handleRemovePending = (index: number) =>
        onChange?.((value ?? []).filter((_reminder, position) => position !== index));

    const handleRemoveLive = async (reminderId: string) =>
    {
        const result = await deleteReminder({}, `${apiBasePath}/${reminderId}`);
        if (!result) return;
        toast.success('Recordatorio eliminado.');
        onChanged?.();
    };

    const chip = (
        key: string,
        tint: {bg: string; color: string},
        offsetMinutes: number,
        recipient: string,
        badge: string,
        onRemove: () => void,
        extra?: string,
    ) => (
        <span key={key} className={styles.chip} style={{background: tint.bg, borderColor: tint.color, color: tint.color}}>
            <span className={styles.dot} style={{background: tint.color}} />
            <span className={styles.chipText}>
                <strong>{offsetLabel(offsetMinutes)}</strong> · {recipient}{extra && <span className={styles.extra}> {extra}</span>}
            </span>
            <span className={styles.badge} style={{background: tint.color}}>{badge}</span>
            <button type="button" className={styles.remove} onClick={onRemove} title="Quitar recordatorio">
                <Trash />
            </button>
        </span>
    );

    const chips = isLive
        ? (reminders ?? []).map(reminder =>
            chip(
                reminder.id,
                REMINDER_STATUS_COLORS[reminder.status],
                reminder.offsetMinutes,
                nameFor(reminder.recipientEmail),
                REMINDER_STATUS_LABELS[reminder.status],
                () => handleRemoveLive(reminder.id),
                reminder.status === ReminderStatus.Sent && reminder.sentAt ? `· ${fmtSentAt(reminder.sentAt)}` : undefined,
            ))
        : (value ?? []).map((reminder, index) =>
            chip(
                `pending-${index}`,
                NEW_TINT,
                reminder.offsetMinutes,
                nameFor(reminder.recipientEmail),
                'Nuevo',
                () => handleRemovePending(index),
            ));

    return (
        <div className={styles.wrapper}>
            <div className={styles.line}>
                <span className={styles.label}>Recordatorios</span>
                {chips}
                {!disabled && !showAdd && (
                    <button type="button" className={styles.addToggle} onClick={() => setShowAdd(true)}>
                        <Plus /> Agregar
                    </button>
                )}
            </div>

            {!disabled && showAdd && (
                <div className={styles.addRow}>
                    <select className={styles.select} value={effectiveOffset} onChange={event => setOffset(Number(event.target.value))}>
                        {offsetOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    <select className={styles.input} value={email} onChange={event => setEmail(event.target.value)}>
                        <option value="">Elige un destinatario</option>
                        {memberEmails.map(option => (
                            <option key={option.email} value={option.email}>{option.name} · {option.email}</option>
                        ))}
                    </select>
                    <button type="button" className={styles.addBtn} onClick={handleAdd} disabled={busy}>
                        <Plus /> Agregar
                    </button>
                    <button type="button" className={styles.cancelBtn} onClick={() => setShowAdd(false)}>
                        Cancelar
                    </button>
                </div>
            )}
        </div>
    );
};

export default TimelineReminderList;
