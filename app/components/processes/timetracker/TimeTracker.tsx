'use client';

import {useEffect, useState} from 'react';
import styles from './timetracker.module.css';
import {Clock, Plus, X, Check} from '@/app/components/svg';
import {useFetch} from '@/hooks/useFetch';
import {toast} from 'sonner';
import type {TimeEntry, User} from '@/app/interfaces/interfaces';
import {TimeEntryType} from '@/app/interfaces/enums';

interface TimeTrackerProps
{
    processId: string;
}

const formatClock = (seconds: number): string =>
{
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const formatDuration = (minutes: number): string =>
{
    if (!minutes) return '—';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const userInitials = (entry: TimeEntry): string =>
    `${entry.user?.firstName?.[0] ?? '?'}${entry.user?.lastName?.[0] ?? ''}`.toUpperCase();

const userFullName = (entry: TimeEntry): string =>
    entry.user ? `${entry.user.firstName} ${entry.user.lastName}` : entry.userId.slice(0, 8);

const TimeTracker = ({processId}: TimeTrackerProps) =>
{
    const [elapsed,         setElapsed]         = useState(0);
    const [showManualForm,  setShowManualForm]   = useState(false);
    const [manualHours,     setManualHours]      = useState('');
    const [manualMinutes,   setManualMinutes]    = useState('');
    const [manualDesc,      setManualDesc]       = useState('');
    const [manualDate,      setManualDate]       = useState(() => new Date().toISOString().split('T')[0]);
    const [manualTime,      setManualTime]       = useState(() =>
    {
        const now = new Date();
        return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    });

    // Current user (to identify own active timer)
    const {data: me} = useFetch<User>('user/me');

    // All entries for this process
    const {data: entries, execute: refetchEntries} =
        useFetch<TimeEntry[]>(`time-entry?processId=${processId}`, {firmScoped: true});

    // Start timer
    const {execute: startTimer, isLoading: isStarting} =
        useFetch<TimeEntry>('time-entry/start', {method: 'POST', immediate: false, firmScoped: true});

    // Stop timer
    const {execute: stopTimer, isLoading: isStopping} =
        useFetch<TimeEntry>('', {method: 'PATCH', immediate: false, firmScoped: true});

    // Add manual entry
    const {execute: addManual, isLoading: isAddingManual} =
        useFetch<TimeEntry>('time-entry/manual', {method: 'POST', immediate: false, firmScoped: true});

    // Delete entry
    const {execute: deleteEntry} =
        useFetch<{message: string}>('', {method: 'DELETE', immediate: false, firmScoped: true});

    // Active timer = my open entry
    const activeEntry = (entries ?? []).find(e => !e.endedAt && e.userId === me?.id) ?? null;

    // Running clock
    useEffect(() =>
    {
        if (!activeEntry) { setElapsed(0); return; }

        const update = () =>
            setElapsed(Math.floor((Date.now() - new Date(activeEntry.startedAt).getTime()) / 1000));

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [activeEntry]);

    const handleStart = async () =>
    {
        const result = await startTimer({body: {processId}});
        if (result) { await refetchEntries(); toast.success('Conteo iniciado'); }
    };

    const handleStop = async () =>
    {
        if (!activeEntry) return;
        const result = await stopTimer({}, `time-entry/${activeEntry.id}/stop`);
        if (result) { await refetchEntries(); toast.success('Conteo detenido'); }
    };

    const handleManual = async () =>
    {
        const total = (parseInt(manualHours) || 0) * 60 + (parseInt(manualMinutes) || 0);
        if (total <= 0) return;

        const startedAt = `${manualDate}T${manualTime}:00`;

        const result = await addManual({
            body: {processId, durationMinutes: total, description: manualDesc || undefined, startedAt},
        });

        if (result)
        {
            setShowManualForm(false);
            setManualHours('');
            setManualMinutes('');
            setManualDesc('');
            setManualDate(new Date().toISOString().split('T')[0]);
            setManualTime(`${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`);
            await refetchEntries();
            toast.success('Tiempo registrado');
        }
    };

    const handleDelete = async (id: string) =>
    {
        await deleteEntry({}, `time-entry/${id}`);
        await refetchEntries();
        toast.success('Registro eliminado');
    };

    // Summary per user: total minutes
    const summary: Record<string, {name: string; initials: string; totalMinutes: number}> = {};
    for (const e of (entries ?? []))
    {
        if (!e.durationMinutes) continue;
        if (!summary[e.userId])
            summary[e.userId] = {name: userFullName(e), initials: userInitials(e), totalMinutes: 0};
        summary[e.userId].totalMinutes += e.durationMinutes;
    }

    const totalMinutesAll = Object.values(summary).reduce((a, b) => a + b.totalMinutes, 0);

    return (
        <div className={styles.container}>

            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.headerIcon}><Clock /></div>
                    <div>
                        <h3 className={styles.headerTitle}>Control de Tiempo</h3>
                        {totalMinutesAll > 0 && (
                            <span className={styles.headerTotal}>Total: {formatDuration(totalMinutesAll)}</span>
                        )}
                    </div>
                </div>
                <button className={styles.manualBtn} onClick={() => setShowManualForm(v => !v)}>
                    <Plus className={styles.manualBtnIcon} />
                    Registrar manual
                </button>
            </div>

            {/* Active timer or start button */}
            <div className={styles.timerRow}>
                {activeEntry ? (
                    <div className={styles.timerActive}>
                        <span className={styles.timerDot} />
                        <span className={styles.timerClock}>{formatClock(elapsed)}</span>
                        <span className={styles.timerLabel}>en curso</span>
                        <button
                            className={styles.stopBtn}
                            onClick={handleStop}
                            disabled={isStopping}
                        >
                            Detener
                        </button>
                    </div>
                ) : (
                    <button
                        className={styles.startBtn}
                        onClick={handleStart}
                        disabled={isStarting}
                    >
                        Iniciar conteo
                    </button>
                )}
            </div>

            {/* Manual entry form */}
            {showManualForm && (
                <div className={styles.manualForm}>
                    <input
                        className={styles.manualInput}
                        placeholder="Descripción de la actividad (opcional)"
                        value={manualDesc}
                        onChange={e => setManualDesc(e.target.value)}
                    />
                    <div className={styles.dateTimeRow}>
                        <input
                            className={styles.dateInput}
                            type="date"
                            value={manualDate}
                            onChange={e => setManualDate(e.target.value)}
                        />
                        <input
                            className={styles.timeInput}
                            type="time"
                            value={manualTime}
                            onChange={e => setManualTime(e.target.value)}
                        />
                    </div>
                    <div className={styles.durationRow}>
                        <input
                            className={styles.durationInput}
                            type="number"
                            min="0"
                            placeholder="Horas"
                            value={manualHours}
                            onChange={e => setManualHours(e.target.value)}
                        />
                        <span className={styles.durationSep}>h</span>
                        <input
                            className={styles.durationInput}
                            type="number"
                            min="0"
                            max="59"
                            placeholder="Min"
                            value={manualMinutes}
                            onChange={e => setManualMinutes(e.target.value)}
                        />
                        <span className={styles.durationSep}>m</span>
                        <button
                            className={styles.manualConfirm}
                            onClick={handleManual}
                            disabled={isAddingManual || (!manualHours && !manualMinutes)}
                        >
                            <Check className={styles.actionIcon} />
                        </button>
                        <button
                            className={styles.manualCancel}
                            onClick={() => { setShowManualForm(false); setManualHours(''); setManualMinutes(''); setManualDesc(''); setManualDate(new Date().toISOString().split('T')[0]); }}
                        >
                            <X className={styles.actionIcon} />
                        </button>
                    </div>
                </div>
            )}

            {/* Per-user summary chips */}
            {Object.keys(summary).length > 0 && (
                <div className={styles.summaryRow}>
                    {Object.entries(summary).map(([uid, s]) => (
                        <div key={uid} className={styles.summaryChip}>
                            <span className={styles.summaryAvatar}>{s.initials}</span>
                            <span className={styles.summaryName}>{s.name}</span>
                            <span className={styles.summaryTime}>{formatDuration(s.totalMinutes)}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Entries table */}
            {(entries ?? []).length > 0 ? (
                <div className={styles.table}>
                    <div className={styles.tableHead}>
                        <span>Usuario</span>
                        <span>Fecha</span>
                        <span>Tipo</span>
                        <span>Descripción</span>
                        <span>Duración</span>
                        <span />
                    </div>
                    {(entries ?? []).map(entry => (
                        <div key={entry.id} className={`${styles.tableRow} ${!entry.endedAt ? styles.tableRowActive : ''}`}>
                            <div className={styles.entryUser}>
                                <span className={styles.entryAvatar}>{userInitials(entry)}</span>
                                <span className={styles.entryName}>{userFullName(entry)}</span>
                            </div>
                            <span className={styles.entryDate}>
                                {new Date(entry.startedAt).toLocaleDateString('es-ES', {day: '2-digit', month: 'short', year: 'numeric'})}
                            </span>
                            <span className={`${styles.entryType} ${entry.type === TimeEntryType.AUTO ? styles.typeAuto : styles.typeManual}`}>
                                {entry.type === TimeEntryType.AUTO ? 'Auto' : 'Manual'}
                            </span>
                            <span className={styles.entryDesc}>{entry.description ?? '—'}</span>
                            <span className={styles.entryDuration}>
                                {!entry.endedAt
                                    ? <span className={styles.durationLive}>en curso</span>
                                    : formatDuration(entry.durationMinutes ?? 0)
                                }
                            </span>
                            {entry.userId === me?.id && (
                                <button
                                    className={styles.deleteBtn}
                                    onClick={() => handleDelete(entry.id)}
                                    title="Eliminar registro"
                                >
                                    <X className={styles.actionIcon} />
                                </button>
                            )}
                            {entry.userId !== me?.id && <span />}
                        </div>
                    ))}
                </div>
            ) : (
                <p className={styles.empty}>
                    Aún no hay registros de tiempo. Inicia el conteo o añade tiempo manualmente.
                </p>
            )}
        </div>
    );
};

export default TimeTracker;
