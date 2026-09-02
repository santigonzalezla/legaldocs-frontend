'use client';

import { useMemo, useState } from 'react';
import styles from './page.module.css';
import TimeAnalytics from '@/app/components/processes/timeanalytics/TimeAnalytics';
import TimeCalendar  from '@/app/components/processes/timecalendar/TimeCalendar';
import { BarChart, Calendar, Clock, DollarSign } from '@/app/components/svg';
import { useFetch } from '@/hooks/useFetch';
import type { Firm, User, TimeEntry } from '@/app/interfaces/interfaces';
import { BillableType } from '@/app/interfaces/enums';
import {PermissionGuard} from '@/app/components/auth/PermissionGuard';
import {usePermissions} from '@/context/PermissionsContext';

type Tab = 'analytics' | 'calendar';

/* ── Helpers ────────────────────────────────────────────────────────────────── */

const NOW      = new Date();
const CUR_YEAR = NOW.getFullYear();
const CUR_MON  = NOW.getMonth();

const fmtH = (min: number) =>
{
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ''}`.trim() : `${m}m`;
};

const goalBarColor = (pct: number) =>
    pct >= 100 ? '#10b981' : pct >= 60 ? '#3b82f6' : '#ef4444';

const workingDaysInMonth = (year: number, month: number): number =>
{
    const last = new Date(year, month + 1, 0).getDate();
    let count = 0;
    for (let d = 1; d <= last; d++)
    {
        const day = new Date(year, month, d).getDay();
        if (day !== 0 && day !== 6) count++;
    }
    return count;
};

/* ── Sub-component: one metric chip ────────────────────────────────────────── */

interface ChipProps
{
    icon:    React.ReactNode;
    iconCls: string;
    value:   number;
    goal:    number;
    label:   string;
    color:   string;
}

const GoalChip = ({icon, iconCls, value, goal, label, color}: ChipProps) =>
{
    const pct      = goal > 0 ? Math.min(Math.round(value / goal * 100), 100) : 0;
    const miss     = Math.max(0, goal - value);
    const barColor = goal > 0 ? goalBarColor(pct) : color;

    return (
        <div className={styles.statsChip}>
            <span className={`${styles.statsIcon} ${iconCls}`}>{icon}</span>
            <div className={styles.statsBody}>
                <div className={styles.statsTopRow}>
                    <span className={styles.statsValue} style={{color}}>{fmtH(value)}</span>
                    {goal > 0 && <span className={styles.statsGoal}>/ {fmtH(goal)}</span>}
                    {goal > 0 && pct >= 100
                        ? <span className={styles.statsBadgeDone}>Completo</span>
                        : goal > 0 && miss > 0
                            ? <span className={styles.statsBadgeMissing}>Faltan {fmtH(miss)}</span>
                            : null
                    }
                </div>
                <span className={styles.statsLabel}>{label}</span>
                {goal > 0 && (
                    <div className={styles.statsMiniBar}>
                        <div className={styles.statsMiniBarFill} style={{width: `${pct}%`, background: barColor}} />
                    </div>
                )}
            </div>
        </div>
    );
};

/* ── Page ───────────────────────────────────────────────────────────────────── */

const ProcessAnalyticsPage = () =>
{
    const [tab, setTab] = useState<Tab>('calendar');
    const {can} = usePermissions();
    const canViewAnalytics = can('time_entries:analytics');

    /* Same 3 fetches the process detail page uses */
    const {data: me}      = useFetch<User>('user/me');
    const {data: firm}    = useFetch<Firm>('firm/me', {firmScoped: true});
    const {data: entries, execute: refetchEntries} =
        useFetch<TimeEntry[]>('time-entry', {firmScoped: true});

    const handleEntryCreated = () => refetchEntries();

    /* Compute today + monthly using identical logic to the process detail page */
    const stats = useMemo(() =>
    {
        const userId = me?.id;
        const zero   = {todayBill: 0, todayNB: 0, monthBill: 0, monthNB: 0};
        if (!userId || !entries) return zero;

        const now      = new Date();
        const dayStart = new Date(now); dayStart.setHours(0,  0,  0,   0);
        const dayEnd   = new Date(now); dayEnd.setHours(23, 59, 59, 999);

        let todayBill = 0, todayNB = 0, monthBill = 0, monthNB = 0;

        for (const e of entries)
        {
            if (e.userId !== userId) continue;

            const start = new Date(e.startedAt);

            /* Minutes: stored value, or elapsed for running timer */
            let minutes: number;
            if (e.durationMinutes != null)
                minutes = e.durationMinutes;
            else if (!e.endedAt)
                minutes = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 60_000));
            else
                continue;

            if (minutes <= 0) continue;

            const isBill = e.billableType === BillableType.BILLABLE;

            if (start.getFullYear() === CUR_YEAR && start.getMonth() === CUR_MON)
            {
                if (isBill) monthBill += minutes;
                else        monthNB   += minutes;
            }

            if (start >= dayStart && start <= dayEnd)
            {
                if (isBill) todayBill += minutes;
                else        todayNB   += minutes;
            }
        }

        return {todayBill, todayNB, monthBill, monthNB};
    }, [entries, me?.id]);

    const workDays      = workingDaysInMonth(CUR_YEAR, CUR_MON);
    const dailyBillGoal = (firm?.dailyBillableGoalHours  ?? 0) * 60;
    const dailyNBGoal   = (firm?.dailyNonBillableGoalHours ?? 0) * 60;
    const monthBillGoal = Math.round(dailyBillGoal * workDays);
    const monthNBGoal   = Math.round(dailyNBGoal   * workDays);

    const hasGoal   = dailyBillGoal > 0;
    const hasNBGoal = dailyNBGoal   > 0;

    const monthName = NOW.toLocaleDateString('es-CO', {month: 'long'});
    const todayStr  = NOW.toLocaleDateString('es-CO', {weekday: 'long', day: 'numeric', month: 'long'});

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>Análisis de Tiempo</h1>
                    <p>Distribución de horas trabajadas por abogado y por caso en toda la firma.</p>
                </div>
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${tab === 'calendar' ? styles.tabActive : ''}`}
                        onClick={() => setTab('calendar')}
                    >
                        <Calendar className={styles.tabIcon} />
                        Calendario
                    </button>
                    {canViewAnalytics && (
                        <button
                            className={`${styles.tab} ${tab === 'analytics' ? styles.tabActive : ''}`}
                            onClick={() => setTab('analytics')}
                        >
                            <BarChart className={styles.tabIcon} />
                            Estadísticas
                        </button>
                    )}
                </div>
            </div>

            {hasGoal && firm && me && (
                <div className={styles.statsStrip}>

                    {/* ── HOY ── */}
                    <div className={styles.statsSection}>
                        <span className={styles.statsSectionTitle}>Hoy · {todayStr}</span>
                        <div className={styles.statsSectionChips}>
                            <GoalChip
                                icon={<DollarSign />}
                                iconCls={styles.statsIconBillable}
                                value={stats.todayBill}
                                goal={dailyBillGoal}
                                label="Facturables"
                                color="#10b981"
                            />
                            {hasNBGoal && (
                                <GoalChip
                                    icon={<Clock />}
                                    iconCls={styles.statsIconNonBillable}
                                    value={stats.todayNB}
                                    goal={dailyNBGoal}
                                    label="No facturables"
                                    color="#f59e0b"
                                />
                            )}
                        </div>
                    </div>

                    <div className={styles.statsSectionDivider} />

                    {/* ── ESTE MES ── */}
                    <div className={styles.statsSection}>
                        <span className={styles.statsSectionTitle}>
                            {monthName.charAt(0).toUpperCase() + monthName.slice(1)} · {workDays} días hábiles
                        </span>
                        <div className={styles.statsSectionChips}>
                            <GoalChip
                                icon={<DollarSign />}
                                iconCls={styles.statsIconBillable}
                                value={stats.monthBill}
                                goal={monthBillGoal}
                                label="Facturables"
                                color="#10b981"
                            />
                            {hasNBGoal && (
                                <GoalChip
                                    icon={<Clock />}
                                    iconCls={styles.statsIconNonBillable}
                                    value={stats.monthNB}
                                    goal={monthNBGoal}
                                    label="No facturables"
                                    color="#f59e0b"
                                />
                            )}
                        </div>
                    </div>

                </div>
            )}

            {tab === 'calendar'  && <TimeCalendar onEntryCreated={handleEntryCreated} />}
            {tab === 'analytics' && canViewAnalytics && <TimeAnalytics />}
        </div>
    );
};

const ProcessAnalyticsPageGuarded = () => (
    <PermissionGuard permission="time_entries:view">
        <ProcessAnalyticsPage/>
    </PermissionGuard>
);

export default ProcessAnalyticsPageGuarded;
