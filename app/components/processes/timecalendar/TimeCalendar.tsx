'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import styles from './timecalendar.module.css';
import {useFetch} from '@/hooks/useFetch';
import {ArrowLeft, ArrowGo, Briefcase, Clock, Plus, Trash, User, X} from '@/app/components/svg';
import type {Client, TimeEntry, LegalProcess, PaginatedResponse} from '@/app/interfaces/interfaces';
import {BillableType, ClientType} from '@/app/interfaces/enums';
import {toast} from 'sonner';

interface GoalAnalytics
{
    currentUserId?: string;
    firm?: {
        dailyBillableGoalHours:    number | null;
        dailyNonBillableGoalHours: number | null;
    };
    byUser?: Array<{
        userId:             string;
        billableMinutes:    number;
        nonBillableMinutes: number;
        daily: {
            billableMinutes:     number;
            nonBillableMinutes:  number;
            billableGoalMinutes: number;
        };
    }>;
}

const HOUR_START = 6;
const HOUR_END = 21;
const SLOT_MINS = 30;
const SLOT_H = 30; // px per slot
const TOTAL_SLOTS = (HOUR_END - HOUR_START) * (60 / SLOT_MINS); // 32

const ENTRY_COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6',
    '#EF4444', '#14B8A6', '#F97316', '#EC4899',
    '#6366F1', '#84CC16', '#06B6D4', '#A855F7'
];

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTH_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

interface MemberWithUser
{
    id: string;
    userId: string;
    status: string;
    user: {firstName: string; lastName: string};
}

interface DragState
{
    dayIdx: number;
    startSlot: number;
    endSlot: number;
}

interface CreateModal
{
    date: Date;
    startSlot: number;
    endSlot: number;
    startTime: string;
    endTime: string;
    clientId: string;
    processId: string;
    description: string;
    billableType: BillableType;
}

interface DetailModal
{
    entry: TimeEntry;
}

interface TooltipState
{
    title: string;
    user: string;
    duration: string;
    x: number;
    y: number;
}

const getMonday = (date: Date): Date =>
{
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    return d;
};

const addDays = (d: Date, n: number): Date =>
{
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
};

const toDateStr = (d: Date): string => d.toISOString().split('T')[0];

const isSameDay = (a: Date, b: Date): boolean =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

const slotToTime = (slot: number): string =>
{
    const mins = HOUR_START * 60 + slot * SLOT_MINS;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const isoToSlot = (iso: string): number =>
{
    const d = new Date(iso);
    const mins = d.getHours() * 60 + d.getMinutes() - HOUR_START * 60;
    return mins / SLOT_MINS;
};

const fmtDuration = (mins: number): string =>
{
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
};

const calcDuration = (start: string, end: string): number =>
{
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
};

const clientLabel = (c: Client) =>
    c.type === ClientType.COMPANY
        ? (c.companyName ?? '—')
        : [c.firstName, c.lastName].filter(Boolean).join(' ') || '—';

const memberInitials = (firstName: string, lastName: string) =>
    `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();

interface EntryLayout
{
    entry: TimeEntry;
    startSlot: number;
    endSlot: number;
    col: number;
    totalCols: number;
}

const layoutDayEntries = (dayEntries: TimeEntry[]): EntryLayout[] =>
{
    if (!dayEntries.length) return [];

    const items: EntryLayout[] = dayEntries.map(e =>
    {
        const s = Math.max(0, isoToSlot(e.startedAt));
        const d = e.durationMinutes ?? SLOT_MINS;
        return {entry: e, startSlot: s, endSlot: Math.min(TOTAL_SLOTS, s + d / SLOT_MINS), col: 0, totalCols: 1};
    }).sort((a, b) => a.startSlot - b.startSlot);

    const colEnds: number[] = [];
    for (const item of items) {
        const c = colEnds.findIndex(end => item.startSlot >= end);
        if (c === -1) {
            item.col = colEnds.length;
            colEnds.push(item.endSlot);
        } else {
            item.col = c;
            colEnds[c] = item.endSlot;
        }
    }

    for (const item of items) {
        let maxCol = item.col;
        for (const other of items)
            if (other !== item && other.startSlot < item.endSlot && other.endSlot > item.startSlot)
                maxCol = Math.max(maxCol, other.col);
        item.totalCols = maxCol + 1;
    }

    return items;
};

const toTitleCase = (str: string) =>
    str.toLowerCase().replace(/(?:^|\s)\S/g, c => c.toUpperCase());

const EMPTY_MODAL_BASE = {
    clientId:    '',
    processId:   '',
    description: '',
    billableType: BillableType.BILLABLE as BillableType,
};

const TimeCalendar = ({onEntryCreated}: {onEntryCreated?: () => void}) =>
{
    const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
    const [drag, setDrag] = useState<DragState | null>(null);
    const [createModal, setCreateModal] = useState<CreateModal | null>(null);
    const [detailModal, setDetailModal] = useState<DetailModal | null>(null);
    const [tooltip, setTooltip] = useState<TooltipState | null>(null);

    const [caseSearch, setCaseSearch] = useState('');
    const [caseOpen, setCaseOpen] = useState(false);
    const caseRef = useRef<HTMLDivElement>(null);

    const [clientSearch, setClientSearch] = useState('');
    const [clientOpen, setClientOpen] = useState(false);
    const clientRef = useRef<HTMLDivElement>(null);

    const [shareEnabled, setShareEnabled] = useState(false);
    const [sharedUserIds, setSharedUserIds] = useState<string[]>([]);

    const isDragging = useRef(false);

    const [todayStr] = useState<string>(() => new Date().toISOString().split('T')[0]);

    const {data: rawEntries, execute: refetch} = useFetch<TimeEntry[]>('time-entry', {firmScoped: true});
    const {data: goalData} = useFetch<GoalAnalytics>(`time-entry/analytics?date=${todayStr}`, {firmScoped: true});
    const {data: processRes} = useFetch<PaginatedResponse<LegalProcess>>('process?limit=100', {firmScoped: true});
    const {data: clientRes} = useFetch<PaginatedResponse<Client>>('client?limit=100', {firmScoped: true});
    const {data: membersData} = useFetch<MemberWithUser[]>('firm/me/members?status=ACTIVE&limit=100', {firmScoped: true});
    const {execute: saveEntry, isLoading: isSaving} = useFetch<TimeEntry>('time-entry/manual', {
        method: 'POST',
        immediate: false,
        firmScoped: true
    });
    const {execute: doDelete} = useFetch<void>('', {method: 'DELETE', immediate: false, firmScoped: true});

    const processes = useMemo(() => processRes?.data ?? [], [processRes]);
    const clients   = useMemo(() => clientRes?.data ?? [], [clientRes]);
    const members   = useMemo(() => membersData ?? [], [membersData]);
    const entries   = useMemo(() => rawEntries ?? [], [rawEntries]);

    const processColor = useMemo(() =>
    {
        const map: Record<string, string> = {};
        processes.forEach((p, i) => { map[p.id] = ENTRY_COLORS[i % ENTRY_COLORS.length]; });
        return map;
    }, [processes]);

    const processTitle = useMemo(() =>
    {
        const map: Record<string, string> = {};
        processes.forEach(p => { map[p.id] = p.title; });
        return map;
    }, [processes]);

    const weekDays = useMemo(
        () => Array.from({length: 7}, (_, i) => addDays(weekStart, i)),
        [weekStart]
    );

    const entriesPerDay = useMemo(() =>
    {
        const map: Record<string, TimeEntry[]> = {};
        weekDays.forEach(d => { map[toDateStr(d)] = []; });
        entries.forEach(e =>
        {
            const ds = e.startedAt.split('T')[0];
            if (map[ds]) map[ds].push(e);
        });
        return map;
    }, [entries, weekDays]);

    const weekLabel = useMemo(() =>
    {
        const s = weekStart;
        const e = addDays(weekStart, 6);
        if (s.getMonth() === e.getMonth())
            return `${s.getDate()} – ${e.getDate()} de ${MONTH_NAMES[s.getMonth()]} ${s.getFullYear()}`;
        return `${s.getDate()} ${MONTH_SHORT[s.getMonth()]} – ${e.getDate()} ${MONTH_SHORT[e.getMonth()]} ${e.getFullYear()}`;
    }, [weekStart]);

    // Reset state when modal closes
    useEffect(() =>
    {
        if (!createModal) {
            setCaseSearch(''); setCaseOpen(false);
            setClientSearch(''); setClientOpen(false);
            setShareEnabled(false); setSharedUserIds([]);
        }
    }, [createModal]);

    // Close comboboxes on outside click
    useEffect(() =>
    {
        const handler = (e: MouseEvent) =>
        {
            if (caseRef.current && !caseRef.current.contains(e.target as Node))
                setCaseOpen(false);
            if (clientRef.current && !clientRef.current.contains(e.target as Node))
                setClientOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const slotFromY = (e: React.MouseEvent<HTMLDivElement>): number =>
    {
        const rect = e.currentTarget.getBoundingClientRect();
        return Math.max(0, Math.min(TOTAL_SLOTS - 1, Math.floor((e.clientY - rect.top) / SLOT_H)));
    };

    const onColMouseDown = (dayIdx: number, e: React.MouseEvent<HTMLDivElement>) =>
    {
        if ((e.target as HTMLElement).closest('[data-entry]')) return;
        e.preventDefault();
        const slot = slotFromY(e);
        isDragging.current = true;
        setDrag({dayIdx, startSlot: slot, endSlot: slot});
    };

    const onColMouseMove = (dayIdx: number, e: React.MouseEvent<HTMLDivElement>) =>
    {
        if (!isDragging.current || !drag || drag.dayIdx !== dayIdx) return;
        const slot = slotFromY(e);
        setDrag(prev => prev?.dayIdx === dayIdx ? {...prev, endSlot: slot} : prev);
    };

    useEffect(() =>
    {
        const onUp = () =>
        {
            if (!isDragging.current || !drag) {
                isDragging.current = false;
                return;
            }
            isDragging.current = false;

            const startSlot = Math.min(drag.startSlot, drag.endSlot);
            const endSlot = Math.max(drag.startSlot, drag.endSlot) + 1;

            setCreateModal({
                date: weekDays[drag.dayIdx],
                startSlot,
                endSlot,
                startTime: slotToTime(startSlot),
                endTime: slotToTime(endSlot),
                ...EMPTY_MODAL_BASE,
            });
            setDrag(null);
        };

        window.addEventListener('mouseup', onUp);
        return () => window.removeEventListener('mouseup', onUp);
    }, [drag, weekDays]);

    const handleCreate = async () =>
    {
        if (!createModal?.processId) return;

        const duration = calcDuration(createModal.startTime, createModal.endTime);
        if (duration <= 0) {
            toast.error('La hora de fin debe ser posterior a la de inicio');
            return;
        }

        const startedAt = `${toDateStr(createModal.date)}T${createModal.startTime}:00`;

        const body: Record<string, unknown> = {
            processId:      createModal.processId,
            durationMinutes: duration,
            description:    createModal.description || undefined,
            startedAt,
            billableType:   createModal.billableType,
        };
        if (shareEnabled && sharedUserIds.length > 0)
            body.sharedWithUserIds = sharedUserIds;

        const result = await saveEntry({body});

        if (result) {
            toast.success('Tiempo registrado');
            setCreateModal(null);
            refetch();
            onEntryCreated?.();
        }
    };

    const handleDelete = async (entryId: string) =>
    {
        const ok = await doDelete({}, `time-entry/${entryId}`);
        if (ok !== null) {
            toast.success('Registro eliminado');
            setDetailModal(null);
            refetch();
            onEntryCreated?.();
        }
    };

    const isSelected = (dayIdx: number, slot: number) =>
        !!drag &&
        drag.dayIdx === dayIdx &&
        slot >= Math.min(drag.startSlot, drag.endSlot) &&
        slot <= Math.max(drag.startSlot, drag.endSlot);

    const entryStyle = (layout: EntryLayout, color: string): React.CSSProperties =>
    {
        const GAP = 2;
        const pct = 100 / layout.totalCols;
        return {
            top: `${layout.startSlot * SLOT_H}px`,
            height: `${Math.max(SLOT_H * 0.6, (layout.endSlot - layout.startSlot) * SLOT_H - 2)}px`,
            left: `calc(${layout.col * pct}% + ${GAP}px)`,
            right: `calc(${(layout.totalCols - layout.col - 1) * pct}% + ${GAP}px)`,
            width: 'auto',
            backgroundColor: color
        };
    };

    const showTooltip = (e: React.MouseEvent, item: EntryLayout) =>
    {
        if (isDragging.current) return;
        const user = item.entry.user
            ? `${item.entry.user.firstName} ${item.entry.user.lastName}`
            : '—';
        setTooltip({
            title: processTitle[item.entry.processId] ?? '—',
            user,
            duration: fmtDuration(item.entry.durationMinutes ?? 0),
            x: e.clientX,
            y: e.clientY
        });
    };

    const moveTooltip = (e: React.MouseEvent) =>
        setTooltip(prev => prev ? {...prev, x: e.clientX, y: e.clientY} : null);

    const hideTooltip = () => setTooltip(null);

    const toggleSharedUser = (userId: string) =>
        setSharedUserIds(ids =>
            ids.includes(userId) ? ids.filter(id => id !== userId) : [...ids, userId]
        );

    const today = new Date();
    const nowSlot = (today.getHours() - HOUR_START) * (60 / SLOT_MINS) + today.getMinutes() / SLOT_MINS;
    const nowVisible = nowSlot >= 0 && nowSlot < TOTAL_SLOTS;

    const selectedClient  = clients.find(c => c.id === createModal?.clientId) ?? null;
    const selectedProcess = processes.find(p => p.id === createModal?.processId) ?? null;

    const filteredClients = clientSearch.trim()
        ? clients.filter(c => clientLabel(c).toLowerCase().includes(clientSearch.toLowerCase()))
        : clients;

    const clientFilteredProcesses = createModal?.clientId
        ? processes.filter(p => p.clientId === createModal.clientId)
        : processes;

    const filteredCases = caseSearch.trim()
        ? clientFilteredProcesses.filter(p => p.title.toLowerCase().includes(caseSearch.toLowerCase()))
        : clientFilteredProcesses;

    /* ── Goal summary (my stats) ─────────────────────────────────────────────── */

    const myStats = useMemo(() =>
    {
        const uid = goalData?.currentUserId;
        if (!uid || !goalData?.byUser) return null;
        return goalData.byUser.find(u => u.userId === uid) ?? null;
    }, [goalData]);

    const monthlyStats = useMemo(() =>
    {
        const uid = goalData?.currentUserId;
        if (!uid) return null;
        const now   = new Date();
        const year  = now.getFullYear();
        const month = now.getMonth();
        const myEntries = entries.filter(e =>
        {
            const d = new Date(e.startedAt);
            return e.userId === uid && d.getFullYear() === year && d.getMonth() === month;
        });
        const billableMinutes    = myEntries.filter(e => e.billableType === BillableType.BILLABLE).reduce((sum, e)    => sum + (e.durationMinutes ?? 0), 0);
        const nonBillableMinutes = myEntries.filter(e => e.billableType === BillableType.NON_BILLABLE).reduce((sum, e) => sum + (e.durationMinutes ?? 0), 0);
        return {billableMinutes, nonBillableMinutes};
    }, [entries, goalData?.currentUserId]);

    const monthlyGoalMinutes = useMemo(() =>
    {
        const dailyBillable    = goalData?.firm?.dailyBillableGoalHours;
        const dailyNonBillable = goalData?.firm?.dailyNonBillableGoalHours;
        if (!dailyBillable) return null;
        const now  = new Date();
        const year = now.getFullYear();
        const mon  = now.getMonth();
        const daysInMonth = new Date(year, mon + 1, 0).getDate();
        let workingDays = 0;
        for (let d = 1; d <= daysInMonth; d++)
        {
            const dow = new Date(year, mon, d).getDay();
            if (dow !== 0 && dow !== 6) workingDays++;
        }
        return {
            billable:    dailyBillable    * workingDays * 60,
            nonBillable: (dailyNonBillable ?? 0) * workingDays * 60,
        };
    }, [goalData]);

    const hasGoal = !!(goalData?.firm?.dailyBillableGoalHours);

    const fmtGoalHours = (minutes: number) =>
    {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
    };

    const goalColor = (done: number, goal: number) =>
        goal <= 0 ? '#3b82f6' : done / goal < 0.8 ? '#10b981' : done / goal <= 1 ? '#f59e0b' : '#ef4444';

    const openQuickEntry = () =>
    {
        const now = new Date();
        const rawSlot   = (now.getHours() - HOUR_START) * (60 / SLOT_MINS) + Math.floor(now.getMinutes() / SLOT_MINS);
        const startSlot = Math.max(0, Math.min(TOTAL_SLOTS - 2, rawSlot));
        const endSlot   = Math.min(TOTAL_SLOTS, startSlot + 2);
        setCreateModal({
            date: now,
            startSlot,
            endSlot,
            startTime:   slotToTime(startSlot),
            endTime:     slotToTime(endSlot),
            ...EMPTY_MODAL_BASE,
        });
    };

    return (
        <div className={styles.root}>

            {/* Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.navGroup}>
                    <button className={styles.navBtn} onClick={() => setWeekStart(d => addDays(d, -7))}>
                        <ArrowLeft className={styles.navIcon}/>
                    </button>
                    <span className={styles.weekLabel}>{weekLabel}</span>
                    <button className={styles.navBtn} onClick={() => setWeekStart(d => addDays(d, +7))}>
                        <ArrowGo className={styles.navIcon}/>
                    </button>
                </div>
                <div className={styles.toolbarRight}>
                    <button className={styles.todayBtn} onClick={() => setWeekStart(getMonday(new Date()))}>
                        Hoy
                    </button>
                    <button className={styles.addEntryBtn} onClick={openQuickEntry}>
                        <Plus className={styles.addEntryIcon}/>
                        Registrar tiempo
                    </button>
                </div>
            </div>

            {/* ── Goal summary cards ── */}
            {hasGoal && myStats && (
                <div className={styles.goalSummary}>
                    {/* Daily billable */}
                    <div className={styles.goalSummaryCard}>
                        <span className={styles.goalSummaryPeriod}>Hoy — Facturable</span>
                        <span className={styles.goalSummaryValue} style={{color: goalColor(myStats.daily.billableMinutes, myStats.daily.billableGoalMinutes)}}>
                            {fmtGoalHours(myStats.daily.billableMinutes)}
                            <span className={styles.goalSummaryMax}> / {fmtGoalHours(myStats.daily.billableGoalMinutes)}</span>
                        </span>
                        <div className={styles.goalSummaryTrack}>
                            <div
                                className={styles.goalSummaryFill}
                                style={{
                                    width:      `${Math.min(100, myStats.daily.billableGoalMinutes > 0 ? myStats.daily.billableMinutes / myStats.daily.billableGoalMinutes * 100 : 0)}%`,
                                    background: goalColor(myStats.daily.billableMinutes, myStats.daily.billableGoalMinutes),
                                }}
                            />
                        </div>
                    </div>

                    {/* Daily non-billable (if configured) */}
                    {(goalData?.firm?.dailyNonBillableGoalHours ?? 0) > 0 && (
                        <div className={styles.goalSummaryCard}>
                            <span className={styles.goalSummaryPeriod}>Hoy — No facturable</span>
                            <span className={styles.goalSummaryValue} style={{color: '#f59e0b'}}>
                                {fmtGoalHours(myStats.daily.nonBillableMinutes)}
                                <span className={styles.goalSummaryMax}> / {fmtGoalHours((goalData?.firm?.dailyNonBillableGoalHours ?? 0) * 60)}</span>
                            </span>
                            <div className={styles.goalSummaryTrack}>
                                <div
                                    className={styles.goalSummaryFill}
                                    style={{
                                        width:      `${Math.min(100, (goalData?.firm?.dailyNonBillableGoalHours ?? 0) > 0 ? myStats.daily.nonBillableMinutes / ((goalData?.firm?.dailyNonBillableGoalHours ?? 0) * 60) * 100 : 0)}%`,
                                        background: '#f59e0b',
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Monthly billable */}
                    {monthlyStats && monthlyGoalMinutes && (
                        <div className={styles.goalSummaryCard}>
                            <span className={styles.goalSummaryPeriod}>Este mes — Facturable</span>
                            <span className={styles.goalSummaryValue} style={{color: goalColor(monthlyStats.billableMinutes, monthlyGoalMinutes.billable)}}>
                                {fmtGoalHours(monthlyStats.billableMinutes)}
                                <span className={styles.goalSummaryMax}> / {fmtGoalHours(monthlyGoalMinutes.billable)}</span>
                            </span>
                            <div className={styles.goalSummaryTrack}>
                                <div
                                    className={styles.goalSummaryFill}
                                    style={{
                                        width:      `${Math.min(100, monthlyGoalMinutes.billable > 0 ? monthlyStats.billableMinutes / monthlyGoalMinutes.billable * 100 : 0)}%`,
                                        background: goalColor(monthlyStats.billableMinutes, monthlyGoalMinutes.billable),
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Monthly non-billable */}
                    {monthlyStats && monthlyGoalMinutes && monthlyGoalMinutes.nonBillable > 0 && (
                        <div className={styles.goalSummaryCard}>
                            <span className={styles.goalSummaryPeriod}>Este mes — No facturable</span>
                            <span className={styles.goalSummaryValue} style={{color: '#f59e0b'}}>
                                {fmtGoalHours(monthlyStats.nonBillableMinutes)}
                                <span className={styles.goalSummaryMax}> / {fmtGoalHours(monthlyGoalMinutes.nonBillable)}</span>
                            </span>
                            <div className={styles.goalSummaryTrack}>
                                <div
                                    className={styles.goalSummaryFill}
                                    style={{
                                        width:      `${Math.min(100, monthlyGoalMinutes.nonBillable > 0 ? monthlyStats.nonBillableMinutes / monthlyGoalMinutes.nonBillable * 100 : 0)}%`,
                                        background: '#f59e0b',
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Calendar */}
            <div className={styles.calendarCard}>

                {/* Sticky header */}
                <div className={styles.headerRow}>
                    <div className={styles.gutterCorner}/>
                    {weekDays.map((day, i) =>
                    {
                        const isToday = isSameDay(day, today);
                        return (
                            <div key={i} className={`${styles.dayHeader} ${isToday ? styles.dayHeaderToday : ''}`}>
                                <span className={styles.dayName}>{DAY_NAMES[i]}</span>
                                <span className={`${styles.dayNum} ${isToday ? styles.dayNumToday : ''}`}>
                                    {day.getDate()}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Scrollable body */}
                <div className={styles.bodyScroll}>
                    <div className={styles.body} style={{height: TOTAL_SLOTS * SLOT_H}}>

                        {/* Time gutter */}
                        <div className={styles.gutter}>
                            {Array.from({length: TOTAL_SLOTS}, (_, slot) =>
                            {
                                const isHour = slot % 2 === 0;
                                const hour = HOUR_START + Math.floor(slot / 2);
                                return (
                                    <div key={slot} className={styles.gutterSlot} style={{height: SLOT_H}}>
                                        {isHour && (
                                            <span className={styles.hourLabel}>
                                                {`${String(hour).padStart(2, '0')}:00`}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Day columns */}
                        {weekDays.map((day, dayIdx) =>
                        {
                            const ds = toDateStr(day);
                            const dayEntries = entriesPerDay[ds] ?? [];
                            const isToday = isSameDay(day, today);
                            const layout = layoutDayEntries(dayEntries);

                            return (
                                <div
                                    key={dayIdx}
                                    className={`${styles.dayCol} ${isToday ? styles.dayColToday : ''}`}
                                    onMouseDown={e => onColMouseDown(dayIdx, e)}
                                    onMouseMove={e => onColMouseMove(dayIdx, e)}
                                >
                                    {Array.from({length: TOTAL_SLOTS}, (_, slot) => (
                                        <div
                                            key={slot}
                                            className={`${styles.slot}
                                                ${slot % 2 === 0 ? styles.slotHour : ''}
                                                ${isSelected(dayIdx, slot) ? styles.slotSelected : ''}`}
                                            style={{height: SLOT_H}}
                                        />
                                    ))}

                                    {isToday && nowVisible && (
                                        <div className={styles.nowLine} style={{top: nowSlot * SLOT_H}}/>
                                    )}

                                    {layout.map(item => (
                                        <div
                                            key={item.entry.id}
                                            data-entry="true"
                                            className={styles.entry}
                                            style={entryStyle(item, processColor[item.entry.processId] ?? '#3B82F6')}
                                            onClick={e =>
                                            {
                                                e.stopPropagation();
                                                hideTooltip();
                                                setDetailModal({entry: item.entry});
                                            }}
                                            onMouseEnter={e => showTooltip(e, item)}
                                            onMouseMove={moveTooltip}
                                            onMouseLeave={hideTooltip}
                                        >
                                            <span className={styles.entryTitle}>
                                                {processTitle[item.entry.processId] ?? '—'}
                                            </span>
                                            {item.entry.description && (
                                                <span className={styles.entryDesc}>{item.entry.description}</span>
                                            )}
                                            <div className={styles.entryFooter}>
                                                <span className={styles.entryDur}>
                                                    {fmtDuration(item.entry.durationMinutes ?? 0)}
                                                </span>
                                                {item.entry.billableType === BillableType.NON_BILLABLE && (
                                                    <span className={styles.entryNFBadge}>NF</span>
                                                )}
                                                {item.entry.isShared && (
                                                    <span className={styles.entrySharedDot} title="Entrada compartida">●</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Create modal ── */}
            {createModal && (
                <div className={styles.overlay} onClick={() => setCreateModal(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>

                        <div className={styles.modalHead}>
                            <div className={styles.modalHeadLeft}>
                                <div className={styles.modalIcon}>
                                    <Clock className={styles.modalIconSvg}/>
                                </div>
                                <div>
                                    <h3 className={styles.modalTitle}>Registrar tiempo</h3>
                                    <p className={styles.modalSub}>
                                        {`${DAY_NAMES[(createModal.date.getDay() + 6) % 7]},
                                          ${createModal.date.getDate()} de
                                          ${MONTH_NAMES[createModal.date.getMonth()]}`}
                                    </p>
                                </div>
                            </div>
                            <button className={styles.modalCloseBtn} onClick={() => setCreateModal(null)}>
                                <X className={styles.modalCloseIcon}/>
                            </button>
                        </div>

                        <div className={styles.modalBody}>

                            {/* Date */}
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Fecha</label>
                                <input
                                    type="date"
                                    className={styles.timeInput}
                                    value={toDateStr(createModal.date)}
                                    onChange={e =>
                                    {
                                        const d = new Date(e.target.value + 'T12:00:00');
                                        setCreateModal(m => m ? {...m, date: d} : m);
                                    }}
                                />
                            </div>

                            {/* Time range */}
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Rango de tiempo</label>
                                <div className={styles.timeRow}>
                                    <input
                                        type="time"
                                        className={styles.timeInput}
                                        value={createModal.startTime}
                                        onChange={e => setCreateModal(m => m ? {...m, startTime: e.target.value} : m)}
                                    />
                                    <span className={styles.timeSep}>—</span>
                                    <input
                                        type="time"
                                        className={styles.timeInput}
                                        value={createModal.endTime}
                                        onChange={e => setCreateModal(m => m ? {...m, endTime: e.target.value} : m)}
                                    />
                                    <span className={styles.timeDur}>
                                        {(() =>
                                        {
                                            const d = calcDuration(createModal.startTime, createModal.endTime);
                                            return d > 0 ? fmtDuration(d) : '—';
                                        })()}
                                    </span>
                                </div>
                            </div>

                            {/* Client selector */}
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>
                                    Cliente <span className={styles.optional}>(filtra los casos)</span>
                                </label>
                                <div className={styles.caseCombo} ref={clientRef}>
                                    <div className={styles.selectWrap}>
                                        <User className={styles.selectLeadIcon}/>
                                        <input
                                            className={`${styles.select} ${styles.caseInput}`}
                                            type="text"
                                            placeholder="— Todos los casos —"
                                            value={clientOpen ? clientSearch : (selectedClient ? clientLabel(selectedClient) : '')}
                                            onChange={e => { setClientSearch(e.target.value); setClientOpen(true); }}
                                            onFocus={() => { setClientSearch(''); setClientOpen(true); }}
                                        />
                                    </div>
                                    {clientOpen && (
                                        <div className={styles.caseDropdown}>
                                            <div
                                                className={`${styles.caseOption} ${!createModal.clientId ? styles.caseOptionSelected : ''}`}
                                                onMouseDown={e =>
                                                {
                                                    e.preventDefault();
                                                    setCreateModal(m => m ? {...m, clientId: '', processId: ''} : m);
                                                    setClientSearch('');
                                                    setClientOpen(false);
                                                }}
                                            >
                                                Todos los casos
                                            </div>
                                            {filteredClients.length === 0 ? (
                                                <div className={styles.caseEmpty}>Sin resultados</div>
                                            ) : filteredClients.map(c => (
                                                <div
                                                    key={c.id}
                                                    className={`${styles.caseOption} ${createModal.clientId === c.id ? styles.caseOptionSelected : ''}`}
                                                    onMouseDown={e =>
                                                    {
                                                        e.preventDefault();
                                                        setCreateModal(m => m ? {...m, clientId: c.id, processId: ''} : m);
                                                        setClientSearch('');
                                                        setClientOpen(false);
                                                    }}
                                                >
                                                    {clientLabel(c)}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Process */}
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>
                                    Caso <span className={styles.required}>*</span>
                                </label>
                                <div className={styles.caseCombo} ref={caseRef}>
                                    <div className={styles.selectWrap}>
                                        <Briefcase className={styles.selectLeadIcon}/>
                                        <input
                                            className={`${styles.select} ${styles.caseInput}`}
                                            type="text"
                                            placeholder="— Seleccionar caso —"
                                            value={caseOpen ? caseSearch : (selectedProcess ? toTitleCase(selectedProcess.title) : '')}
                                            onChange={e => { setCaseSearch(e.target.value); setCaseOpen(true); }}
                                            onFocus={() => { setCaseSearch(''); setCaseOpen(true); }}
                                        />
                                    </div>
                                    {caseOpen && (
                                        <div className={styles.caseDropdown}>
                                            {filteredCases.length === 0 ? (
                                                <div className={styles.caseEmpty}>Sin resultados</div>
                                            ) : filteredCases.map(p => (
                                                <div
                                                    key={p.id}
                                                    className={`${styles.caseOption} ${createModal.processId === p.id ? styles.caseOptionSelected : ''}`}
                                                    onMouseDown={e =>
                                                    {
                                                        e.preventDefault();
                                                        setCreateModal(m => m ? {...m, processId: p.id} : m);
                                                        setCaseSearch('');
                                                        setCaseOpen(false);
                                                    }}
                                                >
                                                    {toTitleCase(p.title)}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Billable type */}
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Tipo de tiempo</label>
                                <div className={styles.billableToggle}>
                                    <button
                                        type="button"
                                        className={`${styles.billableBtn} ${createModal.billableType === BillableType.BILLABLE ? styles.billableBtnActive : ''}`}
                                        onClick={() => setCreateModal(m => m ? {...m, billableType: BillableType.BILLABLE} : m)}
                                    >
                                        Facturable
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles.billableBtn} ${createModal.billableType === BillableType.NON_BILLABLE ? styles.nonBillableBtnActive : ''}`}
                                        onClick={() => setCreateModal(m => m ? {...m, billableType: BillableType.NON_BILLABLE} : m)}
                                    >
                                        No facturable
                                    </button>
                                </div>
                            </div>

                            {/* Description */}
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>
                                    Descripción <span className={styles.optional}>(opcional)</span>
                                </label>
                                <textarea
                                    className={styles.textarea}
                                    rows={3}
                                    placeholder="¿Qué actividad realizaste en este tiempo?"
                                    value={createModal.description}
                                    onChange={e => setCreateModal(m => m ? {...m, description: e.target.value} : m)}
                                />
                            </div>

                            {/* Shared hours */}
                            {members.length > 0 && (
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Compartir con</label>
                                    <div className={styles.shareSection}>
                                        <button
                                            type="button"
                                            className={`${styles.shareToggle} ${shareEnabled ? styles.shareToggleActive : ''}`}
                                            onClick={() => { setShareEnabled(enabled => !enabled); setSharedUserIds([]); }}
                                        >
                                            {shareEnabled ? 'Compartiendo con otros abogados' : 'Compartir con otros abogados'}
                                        </button>
                                        {shareEnabled && (
                                            <div className={styles.memberGrid}>
                                                {members.map(member => (
                                                    <button
                                                        key={member.id}
                                                        type="button"
                                                        className={`${styles.memberChip} ${sharedUserIds.includes(member.userId) ? styles.memberChipSelected : ''}`}
                                                        onClick={() => toggleSharedUser(member.userId)}
                                                    >
                                                        <span className={styles.memberInitial}>
                                                            {memberInitials(member.user.firstName, member.user.lastName)}
                                                        </span>
                                                        {member.user.firstName} {member.user.lastName}
                                                        {sharedUserIds.includes(member.userId) && (
                                                            <span className={styles.memberChipX}>✕</span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.modalFoot}>
                            <button className={styles.cancelBtn} onClick={() => setCreateModal(null)}>
                                Cancelar
                            </button>
                            <button
                                className={styles.submitBtn}
                                onClick={handleCreate}
                                disabled={!createModal.processId || isSaving}
                            >
                                {isSaving ? 'Guardando…' : 'Registrar tiempo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Detail modal ── */}
            {detailModal && (
                <div className={styles.overlay} onClick={() => setDetailModal(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>

                        <div className={styles.modalHead}>
                            <div className={styles.modalHeadLeft}>
                                <div
                                    className={styles.modalIcon}
                                    style={{
                                        background: `${processColor[detailModal.entry.processId]}22`,
                                        borderColor: processColor[detailModal.entry.processId]
                                    }}
                                >
                                    <Clock className={styles.modalIconSvg}
                                           style={{color: processColor[detailModal.entry.processId]}}/>
                                </div>
                                <div>
                                    <h3 className={styles.modalTitle}>Detalle de registro</h3>
                                    <p className={styles.modalSub}>
                                        {detailModal.entry.startedAt.split('T')[0]}
                                    </p>
                                </div>
                            </div>
                            <button className={styles.modalCloseBtn} onClick={() => setDetailModal(null)}>
                                <X className={styles.modalCloseIcon}/>
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.detailGrid}>
                                {(() => {
                                    const entryProcess = processes.find(p => p.id === detailModal.entry.processId);
                                    const entryClient  = entryProcess ? clients.find(c => c.id === entryProcess.clientId) : null;
                                    const entryClientName = entryClient
                                        ? entryClient.type === ClientType.COMPANY
                                            ? (entryClient.companyName ?? '—')
                                            : [entryClient.firstName, entryClient.lastName].filter(Boolean).join(' ') || '—'
                                        : null;
                                    return (
                                        <>
                                            <div className={styles.detailItem}>
                                                <span className={styles.detailLabel}>Caso</span>
                                                <span className={styles.detailValue}>
                                                    {processTitle[detailModal.entry.processId] ?? '—'}
                                                </span>
                                            </div>
                                            {entryClientName && (
                                                <div className={styles.detailItem}>
                                                    <span className={styles.detailLabel}>Cliente</span>
                                                    <span className={styles.detailValue}>{entryClientName}</span>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Duración</span>
                                    <span className={styles.detailValue}>
                                        {fmtDuration(detailModal.entry.durationMinutes ?? 0)}
                                    </span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Inicio</span>
                                    <span className={styles.detailValue}>
                                        {new Date(detailModal.entry.startedAt).toLocaleTimeString('es-CO',
                                            {hour: '2-digit', minute: '2-digit'})}
                                    </span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Tipo</span>
                                    <span
                                        className={styles.detailValue}
                                        style={{color: detailModal.entry.billableType === BillableType.BILLABLE ? '#059669' : '#d97706', fontWeight: 600}}
                                    >
                                        {detailModal.entry.billableType === BillableType.BILLABLE ? 'Facturable' : 'No facturable'}
                                    </span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Usuario</span>
                                    <span className={styles.detailValue}>
                                        {detailModal.entry.user
                                            ? `${detailModal.entry.user.firstName} ${detailModal.entry.user.lastName}`
                                            : '—'}
                                    </span>
                                </div>
                                {detailModal.entry.isShared && detailModal.entry.participants.length > 0 && (
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Compartida con</span>
                                        <span className={styles.detailValue}>
                                            {detailModal.entry.participants
                                                .map(p => `${p.user.firstName} ${p.user.lastName}`)
                                                .join(', ')}
                                        </span>
                                    </div>
                                )}
                                {detailModal.entry.description && (
                                    <div className={`${styles.detailItem} ${styles.detailItemFull}`}>
                                        <span className={styles.detailLabel}>Descripción</span>
                                        <span className={styles.detailValue}>{detailModal.entry.description}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles.modalFoot}>
                            <button
                                className={styles.deleteBtn}
                                onClick={() => handleDelete(detailModal.entry.id)}
                            >
                                <Trash className={styles.deleteBtnIcon}/>
                                Eliminar registro
                            </button>
                            <button className={styles.cancelBtn} onClick={() => setDetailModal(null)}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Tooltip portal ── */}
            {tooltip && typeof document !== 'undefined' && createPortal(
                <div
                    className={styles.tooltip}
                    style={{
                        top: tooltip.y + 16,
                        left: tooltip.x + 12
                    }}
                >
                    <span className={styles.tooltipTitle}>{tooltip.title}</span>
                    <span className={styles.tooltipUser}>{tooltip.user}</span>
                    <span className={styles.tooltipDur}>{tooltip.duration}</span>
                </div>,
                document.body
            )}
        </div>
    );
};

export default TimeCalendar;
