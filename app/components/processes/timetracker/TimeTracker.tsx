'use client';

import {useEffect, useState} from 'react';
import styles from './timetracker.module.css';
import {Clock, Plus, X, Check, Users} from '@/app/components/svg';
import {useFetch} from '@/hooks/useFetch';
import {toast} from 'sonner';
import type {TimeEntry, User} from '@/app/interfaces/interfaces';
import {BillableType, FirmMemberStatus, TimeEntryType} from '@/app/interfaces/enums';

interface TimeTrackerProps
{
    processId:       string;
    onEntryCreated?: () => void;
}

interface MemberWithUser
{
    id:     string;
    userId: string;
    status: FirmMemberStatus;
    user:   {firstName: string; lastName: string};
}

const formatClock = (seconds: number): string =>
{
    const hours   = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs    = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const formatDuration = (minutes: number): string =>
{
    if (!minutes) return '—';
    const hours = Math.floor(minutes / 60);
    const mins  = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

const userInitials = (entry: TimeEntry): string =>
    `${entry.user?.firstName?.[0] ?? '?'}${entry.user?.lastName?.[0] ?? ''}`.toUpperCase();

const userFullName = (entry: TimeEntry): string =>
    entry.user ? `${entry.user.firstName} ${entry.user.lastName}` : entry.userId.slice(0, 8);

const TimeTracker = ({processId, onEntryCreated}: TimeTrackerProps) =>
{
    const [elapsed,        setElapsed]        = useState(0);
    const [showManualForm, setShowManualForm]  = useState(false);
    const [manualHours,    setManualHours]    = useState('');
    const [manualMinutes,  setManualMinutes]  = useState('');
    const [manualDesc,     setManualDesc]     = useState('');
    const [manualDate,     setManualDate]     = useState(() => new Date().toISOString().split('T')[0]);
    const [manualTime,     setManualTime]     = useState(() =>
    {
        const now = new Date();
        return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    });
    const [billableType,      setBillableType]      = useState<BillableType>(BillableType.BILLABLE);
    const [showStartConfirm, setShowStartConfirm]  = useState(false);
    const [shareEnabled,     setShareEnabled]      = useState(false);
    const [sharedUserIds,    setSharedUserIds]     = useState<string[]>([]);

    const {data: me} = useFetch<User>('user/me');

    const {data: entries, execute: refetchEntries} =
        useFetch<TimeEntry[]>(`time-entry?processId=${processId}`, {firmScoped: true});

    const {data: members} =
        useFetch<MemberWithUser[]>('firm/me/members?status=ACTIVE&limit=100', {firmScoped: true});

    const {execute: startTimer, isLoading: isStarting} =
        useFetch<TimeEntry>('time-entry/start', {method: 'POST', immediate: false, firmScoped: true});

    const {execute: stopTimer, isLoading: isStopping} =
        useFetch<TimeEntry>('', {method: 'PATCH', immediate: false, firmScoped: true});

    const {execute: addManual, isLoading: isAddingManual} =
        useFetch<TimeEntry>('time-entry/manual', {method: 'POST', immediate: false, firmScoped: true});

    const {execute: deleteEntry} =
        useFetch<{message: string}>('', {method: 'DELETE', immediate: false, firmScoped: true});

    const activeEntry = (entries ?? []).find(entry => !entry.endedAt && entry.userId === me?.id) ?? null;

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
        const result = await startTimer({body: {processId, billableType}});
        if (result)
        {
            setShowStartConfirm(false);
            await refetchEntries();
            onEntryCreated?.();
            toast.success('Conteo iniciado');
        }
    };

    const handleStop = async () =>
    {
        if (!activeEntry) return;
        const result = await stopTimer({}, `time-entry/${activeEntry.id}/stop`);
        if (result) { await refetchEntries(); onEntryCreated?.(); toast.success('Conteo detenido'); }
    };

    const handleManual = async () =>
    {
        const totalMinutes = (parseInt(manualHours) || 0) * 60 + (parseInt(manualMinutes) || 0);
        if (totalMinutes <= 0) return;

        const startedAt = `${manualDate}T${manualTime}:00`;
        const body: Record<string, unknown> = {
            processId,
            durationMinutes: totalMinutes,
            billableType,
            description: manualDesc || undefined,
            startedAt,
        };
        if (shareEnabled && sharedUserIds.length > 0)
            body.sharedWithUserIds = sharedUserIds;

        const result = await addManual({body});

        if (result)
        {
            setShowManualForm(false);
            setManualHours('');
            setManualMinutes('');
            setManualDesc('');
            setManualDate(new Date().toISOString().split('T')[0]);
            setManualTime(`${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`);
            setShareEnabled(false);
            setSharedUserIds([]);
            await refetchEntries();
            onEntryCreated?.();
            toast.success('Tiempo registrado');
        }
    };

    const handleDelete = async (id: string) =>
    {
        await deleteEntry({}, `time-entry/${id}`);
        await refetchEntries();
        onEntryCreated?.();
        toast.success('Registro eliminado');
    };

    const toggleSharedUser = (userId: string) =>
        setSharedUserIds(prev =>
            prev.includes(userId) ? prev.filter(uid => uid !== userId) : [...prev, userId]
        );

    const resetManualForm = () =>
    {
        setShowManualForm(false);
        setManualHours('');
        setManualMinutes('');
        setManualDesc('');
        setManualDate(new Date().toISOString().split('T')[0]);
        setShareEnabled(false);
        setSharedUserIds([]);
    };

    const selectableMembers = (members ?? []).filter(member =>
        member.status === FirmMemberStatus.ACTIVE && member.userId && member.userId !== me?.id
    );

    // Summary per user (creator + participants), billable split
    const summary: Record<string, {name: string; initials: string; billableMinutes: number; nonBillableMinutes: number}> = {};

    const accrue = (userId: string, name: string, initials: string, minutes: number, isBillable: boolean) =>
    {
        if (!summary[userId])
            summary[userId] = {name, initials, billableMinutes: 0, nonBillableMinutes: 0};
        if (isBillable) summary[userId].billableMinutes    += minutes;
        else            summary[userId].nonBillableMinutes += minutes;
    };

    for (const entry of (entries ?? []))
    {
        if (!entry.durationMinutes) continue;
        const isBillable = entry.billableType === BillableType.BILLABLE;
        accrue(entry.userId, userFullName(entry), userInitials(entry), entry.durationMinutes, isBillable);

        for (const participant of (entry.participants ?? []))
        {
            if (participant.userId === entry.userId) continue;
            const participantInitials = `${participant.user.firstName[0] ?? '?'}${participant.user.lastName[0] ?? ''}`.toUpperCase();
            accrue(participant.userId, `${participant.user.firstName} ${participant.user.lastName}`, participantInitials, entry.durationMinutes, isBillable);
        }
    }

    const totalMinutesAll = (entries ?? [])
        .filter(entry => !!entry.durationMinutes)
        .reduce((sum, entry) => sum + (entry.durationMinutes ?? 0), 0);

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

            {/* Active timer, start button, or pre-start confirmation */}
            <div className={styles.timerRow}>
                {activeEntry ? (
                    <div className={styles.timerActive}>
                        <span className={styles.timerDot} />
                        <span className={styles.timerClock}>{formatClock(elapsed)}</span>
                        <span className={styles.timerLabel}>en curso</span>
                        <button className={styles.stopBtn} onClick={handleStop} disabled={isStopping}>
                            Detener
                        </button>
                    </div>
                ) : showStartConfirm ? (
                    <div className={styles.startConfirm}>
                        <span className={styles.startConfirmLabel}>¿Este tiempo es facturable?</span>
                        <div className={styles.billableToggle}>
                            <button
                                type="button"
                                className={`${styles.billableBtn} ${billableType === BillableType.BILLABLE ? styles.billableBtnActive : ''}`}
                                onClick={() => setBillableType(BillableType.BILLABLE)}
                            >
                                Facturable
                            </button>
                            <button
                                type="button"
                                className={`${styles.billableBtn} ${billableType === BillableType.NON_BILLABLE ? styles.nonBillableBtnActive : ''}`}
                                onClick={() => setBillableType(BillableType.NON_BILLABLE)}
                            >
                                No facturable
                            </button>
                        </div>
                        <button className={styles.startBtn} onClick={handleStart} disabled={isStarting}>
                            {isStarting ? 'Iniciando...' : 'Confirmar'}
                        </button>
                        <button className={styles.manualCancel} onClick={() => setShowStartConfirm(false)}>
                            <X className={styles.actionIcon} />
                        </button>
                    </div>
                ) : (
                    <button className={styles.startBtn} onClick={() => setShowStartConfirm(true)}>
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
                    <div className={styles.billableToggle}>
                        <button
                            type="button"
                            className={`${styles.billableBtn} ${billableType === BillableType.BILLABLE ? styles.billableBtnActive : ''}`}
                            onClick={() => setBillableType(BillableType.BILLABLE)}
                        >
                            Facturable
                        </button>
                        <button
                            type="button"
                            className={`${styles.billableBtn} ${billableType === BillableType.NON_BILLABLE ? styles.nonBillableBtnActive : ''}`}
                            onClick={() => setBillableType(BillableType.NON_BILLABLE)}
                        >
                            No facturable
                        </button>
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
                        <button className={styles.manualCancel} onClick={resetManualForm}>
                            <X className={styles.actionIcon} />
                        </button>
                    </div>

                    {/* Shared hours */}
                    {selectableMembers.length > 0 && (
                        <div className={styles.shareSection}>
                            <button
                                className={`${styles.shareToggle} ${shareEnabled ? styles.shareToggleActive : ''}`}
                                onClick={() => { setShareEnabled(v => !v); setSharedUserIds([]); }}
                                type="button"
                            >
                                <Users className={styles.actionIcon} />
                                Compartir horas con otros abogados
                            </button>

                            {shareEnabled && (
                                <div className={styles.memberGrid}>
                                    {selectableMembers.map(member => {
                                        const isSelected = sharedUserIds.includes(member.userId!);
                                        return (
                                            <button
                                                key={member.id}
                                                className={`${styles.memberChip} ${isSelected ? styles.memberChipSelected : ''}`}
                                                onClick={() => toggleSharedUser(member.userId!)}
                                                type="button"
                                            >
                                                <span className={styles.memberInitial}>
                                                    {member.user.firstName[0]}{member.user.lastName[0]}
                                                </span>
                                                {member.user.firstName} {member.user.lastName}
                                                {isSelected && <X className={styles.memberChipX} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Per-user summary chips */}
            {Object.keys(summary).length > 0 && (
                <div className={styles.summaryRow}>
                    {Object.entries(summary).map(([userId, userData]) => (
                        <div key={userId} className={styles.summaryChip}>
                            <span className={styles.summaryAvatar}>{userData.initials}</span>
                            <span className={styles.summaryName}>{userData.name}</span>
                            <span className={styles.summaryTime}>
                                {formatDuration(userData.billableMinutes + userData.nonBillableMinutes)}
                            </span>
                            {userData.nonBillableMinutes > 0 && (
                                <span className={styles.summaryNonBillable}>
                                    {formatDuration(userData.nonBillableMinutes)} NF
                                </span>
                            )}
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
                                {entry.isShared && (
                                    <Users className={styles.sharedIcon} title={`Compartido con ${entry.participants?.length ?? 0} abogado(s)`} />
                                )}
                            </div>
                            <span className={styles.entryDate}>
                                {new Date(entry.startedAt).toLocaleDateString('es-ES', {day: '2-digit', month: 'short', year: 'numeric'})}
                            </span>
                            <div className={styles.entryBadges}>
                                <span className={`${styles.entryType} ${entry.type === TimeEntryType.AUTO ? styles.typeAuto : styles.typeManual}`}>
                                    {entry.type === TimeEntryType.AUTO ? 'Auto' : 'Manual'}
                                </span>
                                <span className={`${styles.billableBadge} ${entry.billableType === BillableType.BILLABLE ? styles.billableBadgeYes : styles.billableBadgeNo}`}>
                                    {entry.billableType === BillableType.BILLABLE ? 'Fact.' : 'No fact.'}
                                </span>
                            </div>
                            <span className={styles.entryDesc}>{entry.description ?? '—'}</span>
                            <span className={styles.entryDuration}>
                                {!entry.endedAt
                                    ? <span className={styles.durationLive}>en curso</span>
                                    : formatDuration(entry.durationMinutes ?? 0)
                                }
                            </span>
                            {entry.userId === me?.id ? (
                                <button
                                    className={styles.deleteBtn}
                                    onClick={() => handleDelete(entry.id)}
                                    title="Eliminar registro"
                                >
                                    <X className={styles.actionIcon} />
                                </button>
                            ) : (
                                <span />
                            )}
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
