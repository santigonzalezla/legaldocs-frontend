'use client';

import {useMemo, useState} from 'react';
import styles from './timeanalytics.module.css';
import {BarChart, Briefcase, Calendar, Clock, DollarSign, Search, Users} from '@/app/components/svg';
import {useFetch} from '@/hooks/useFetch';
import type {LegalProcess, PaginatedResponse} from '@/app/interfaces/interfaces';

const toTitleCase = (str: string) =>
    str.toLowerCase().replace(/(?:^|\s)\S/g, c => c.toUpperCase());

const formatCOP = (value: number) =>
    new Intl.NumberFormat('es-CO', {style: 'currency', currency: 'COP', maximumFractionDigits: 0}).format(value);

/* ── Types ──────────────────────────────────────────────────────────────────── */

interface DailyStats
{
    date:                   string;
    billableMinutes:        number;
    nonBillableMinutes:     number;
    billableGoalMinutes:    number;
    nonBillableGoalMinutes: number;
    billableProgress:       number | null;
    nonBillableProgress:    number | null;
}

interface UserStat
{
    userId:             string;
    firstName:          string;
    lastName:           string;
    totalMinutes:       number;
    billableMinutes:    number;
    nonBillableMinutes: number;
    entryCount:         number;
    processCount:       number;
    daily:              DailyStats;
}

interface ProcessStat
{
    processId:       string;
    title:           string;
    totalMinutes:    number;
    billableMinutes: number;
    entryCount:      number;
    userCount:       number;
}

interface FirmGoalInfo
{
    firmHourlyRate:             number | null;
    dailyBillableGoalHours:     number | null;
    dailyNonBillableGoalHours:  number | null;
}

interface AnalyticsData
{
    byUser:                  UserStat[];
    byProcess:               ProcessStat[];
    totalMinutes:            number;
    totalBillableMinutes:    number;
    totalNonBillableMinutes: number;
    totalEntries:            number;
    firm:                    FirmGoalInfo;
    currentUserId:           string;
    isAdmin:                 boolean;
}

/* ── Helpers ────────────────────────────────────────────────────────────────── */

const fmtHours = (minutes: number): string =>
{
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const fmtHoursShort = (minutes: number): string =>
    `${(minutes / 60).toFixed(1)}h`;

const initials = (firstName: string, lastName: string): string =>
    `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();

const profitColor = (pct: number): string =>
    pct < 80 ? '#10b981' : pct <= 100 ? '#f59e0b' : '#ef4444';

/* ── Colors ─────────────────────────────────────────────────────────────────── */

const USER_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
    '#ef4444', '#06b6d4', '#ec4899', '#84cc16',
];

const PROCESS_COLORS = [
    '#6366f1', '#14b8a6', '#f97316', '#a855f7',
    '#e11d48', '#0ea5e9', '#d946ef', '#22c55e',
];

/* ── Component ──────────────────────────────────────────────────────────────── */

const TimeAnalytics = () =>
{
    // ── All hooks must come before any early return ──────────────────────────
    const [caseSearch, setCaseSearch] = useState('');
    const [goalDate,   setGoalDate]   = useState<string>(() => new Date().toISOString().split('T')[0]);

    const {data, isLoading, execute: refetchAnalytics} =
        useFetch<AnalyticsData>(`time-entry/analytics?date=${goalDate}`, {firmScoped: true});

    const {data: processRes} =
        useFetch<PaginatedResponse<LegalProcess>>('process?limit=100', {firmScoped: true});

    const processes = useMemo(() => processRes?.data ?? [], [processRes]);

    // Must be declared before any early return
    const profitProcesses = useMemo(() =>
    {
        const rate = data?.firm?.firmHourlyRate;
        if (!rate) return [];
        return processes
            .filter(p => (p.processValue ?? 0) > 0)
            .map(p =>
            {
                const totalValue  = (p.processValue ?? 0) + (p.valueEntries ?? []).reduce((sum, e) => sum + e.amount, 0);
                const maxHours    = totalValue / rate;
                const stat        = data!.byProcess.find(s => s.processId === p.id);
                const billableHrs = (stat?.billableMinutes ?? 0) / 60;
                const pct         = maxHours > 0 ? Math.round(billableHrs / maxHours * 100) : 0;
                return {process: p, totalValue, maxHours, billableHrs, pct, color: profitColor(pct)};
            })
            .sort((a, b) => b.pct - a.pct);
    }, [processes, data]);

    const handleGoalDateChange = (date: string) =>
    {
        setGoalDate(date);
        refetchAnalytics({}, `time-entry/analytics?date=${date}`);
    };

    // ── Early returns (after all hooks) ─────────────────────────────────────
    if (isLoading)
        return <div className={styles.loading}>Cargando analíticas...</div>;

    if (!data || (data.byUser.length === 0 && data.byProcess.length === 0))
        return (
            <div className={styles.empty}>
                <BarChart className={styles.emptyIcon} />
                <p>Aún no hay registros de tiempo en ningún proceso.</p>
                <span>Inicia el control de tiempo desde el detalle de cada proceso.</span>
            </div>
        );

    // ── Derived values (non-hook, safe after early returns) ──────────────────
    const maxUser = Math.max(...data.byUser.map(u => u.totalMinutes), 1);

    const filteredProcesses = caseSearch.trim()
        ? data.byProcess.filter(p => p.title.toLowerCase().includes(caseSearch.toLowerCase()))
        : data.byProcess;

    const maxProcess = Math.max(...filteredProcesses.map(p => p.totalMinutes), 1);

    const billablePct    = data.totalMinutes > 0 ? Math.round(data.totalBillableMinutes    / data.totalMinutes * 100) : 0;
    const nonBillablePct = data.totalMinutes > 0 ? Math.round(data.totalNonBillableMinutes / data.totalMinutes * 100) : 0;

    const hasGoals    = !!(data.firm?.dailyBillableGoalHours);
    const visibleUsers = (data.isAdmin
        ? data.byUser
        : data.byUser.filter(u => u.userId === data.currentUserId)
    ).filter(u => u.daily.billableGoalMinutes > 0 || u.daily.billableMinutes > 0);

    /* ── Summary cards ── */
    const cards = [
        {
            label: 'Total horas registradas',
            value: fmtHours(data.totalMinutes),
            sub:   `${data.totalEntries} registros`,
            icon:  <Clock />,
            color: '#3b82f6',
            bg:    '#eff6ff',
        },
        {
            label: 'Horas facturables',
            value: fmtHoursShort(data.totalBillableMinutes),
            sub:   `${billablePct}% del total`,
            icon:  <DollarSign />,
            color: '#10b981',
            bg:    '#ecfdf5',
        },
        {
            label: 'Horas no facturables',
            value: fmtHoursShort(data.totalNonBillableMinutes),
            sub:   `${nonBillablePct}% del total`,
            icon:  <Clock />,
            color: '#f59e0b',
            bg:    '#fffbeb',
        },
        {
            label: data.byUser.length > 1 ? 'Usuarios con tiempo' : 'Procesos activos',
            value: data.byUser.length > 1 ? data.byUser.length : data.byProcess.length,
            sub:   data.byUser.length > 1 ? 'abogados y asistentes' : 'con tiempo registrado',
            icon:  data.byUser.length > 1 ? <Users /> : <Briefcase />,
            color: '#8b5cf6',
            bg:    '#f5f3ff',
        },
    ];

    return (
        <div className={styles.container}>

            {/* Summary cards */}
            <div className={styles.cards}>
                {cards.map((c, i) => (
                    <div key={i} className={styles.card}>
                        <div className={styles.cardIcon} style={{background: c.bg, color: c.color}}>
                            {c.icon}
                        </div>
                        <div className={styles.cardBody}>
                            <span className={styles.cardValue}>{c.value}</span>
                            <span className={styles.cardLabel}>{c.label}</span>
                            <span className={styles.cardSub}>{c.sub}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className={styles.charts}>

                {/* By user */}
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <Users className={styles.chartHeaderIcon} />
                        <div>
                            <h3 className={styles.chartTitle}>Distribución por abogado</h3>
                            <p className={styles.chartSub}>Tiempo total acumulado por usuario</p>
                        </div>
                    </div>

                    <div className={styles.barList}>
                        {data.byUser.map((u, i) => (
                            <div key={u.userId} className={styles.barRow}>
                                <div className={styles.barLabel}>
                                    <span
                                        className={styles.barAvatar}
                                        style={{
                                            background: `${USER_COLORS[i % USER_COLORS.length]}22`,
                                            color:      USER_COLORS[i % USER_COLORS.length],
                                        }}
                                    >
                                        {initials(u.firstName, u.lastName)}
                                    </span>
                                    <div className={styles.barLabelText}>
                                        <span className={styles.barName}>{u.firstName} {u.lastName}</span>
                                        <span className={styles.barMeta}>
                                            {u.processCount} proceso{u.processCount !== 1 ? 's' : ''} · {u.entryCount} reg.
                                            {u.billableMinutes > 0 && (
                                                <> · <span style={{color: '#10b981'}}>F: {fmtHoursShort(u.billableMinutes)}</span></>
                                            )}
                                            {u.nonBillableMinutes > 0 && (
                                                <> · <span style={{color: '#f59e0b'}}>NF: {fmtHoursShort(u.nonBillableMinutes)}</span></>
                                            )}
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.barTrack}>
                                    <div
                                        className={styles.barFill}
                                        style={{
                                            width:      `${(u.totalMinutes / maxUser) * 100}%`,
                                            background: USER_COLORS[i % USER_COLORS.length],
                                        }}
                                    />
                                </div>
                                <span className={styles.barValue}>{fmtHours(u.totalMinutes)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* By process */}
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <Briefcase className={styles.chartHeaderIcon} />
                        <div>
                            <h3 className={styles.chartTitle}>Distribución por caso</h3>
                            <p className={styles.chartSub}>Tiempo total registrado por proceso</p>
                        </div>
                    </div>

                    <div className={styles.caseSearchWrap}>
                        <Search className={styles.caseSearchIcon} />
                        <input
                            className={styles.caseSearchInput}
                            type="text"
                            placeholder="Filtrar caso..."
                            value={caseSearch}
                            onChange={e => setCaseSearch(e.target.value)}
                        />
                    </div>

                    <div className={styles.barList}>
                        {filteredProcesses.length === 0 ? (
                            <p className={styles.caseSearchEmpty}>Sin resultados para "{caseSearch}"</p>
                        ) : filteredProcesses.map((p, i) => (
                            <div key={p.processId} className={styles.barRow}>
                                <div className={styles.barLabel}>
                                    <span
                                        className={styles.barDot}
                                        style={{background: PROCESS_COLORS[i % PROCESS_COLORS.length]}}
                                    />
                                    <div className={styles.barLabelText}>
                                        <span className={styles.barName}>{toTitleCase(p.title)}</span>
                                        <span className={styles.barMeta}>
                                            {p.userCount} usuario{p.userCount !== 1 ? 's' : ''} · {p.entryCount} reg.
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.barTrack}>
                                    <div
                                        className={styles.barFill}
                                        style={{
                                            width:      `${(p.totalMinutes / maxProcess) * 100}%`,
                                            background: PROCESS_COLORS[i % PROCESS_COLORS.length],
                                        }}
                                    />
                                </div>
                                <span className={styles.barValue}>{fmtHours(p.totalMinutes)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Meta diaria ── */}
            {hasGoals && visibleUsers.length > 0 && (
                <div className={styles.goalCard}>
                    <div className={styles.goalHeader}>
                        <div className={styles.goalHeaderLeft}>
                            <Calendar className={styles.chartHeaderIcon} />
                            <div>
                                <h3 className={styles.chartTitle}>Meta diaria</h3>
                                <p className={styles.chartSub}>
                                    {data.isAdmin
                                        ? 'Progreso del equipo para el día seleccionado'
                                        : 'Tu progreso de horas para el día seleccionado'}
                                </p>
                            </div>
                        </div>
                        <input
                            type="date"
                            className={styles.goalDateInput}
                            value={goalDate}
                            onChange={e => handleGoalDateChange(e.target.value)}
                        />
                    </div>

                    <div className={styles.goalList}>
                        {visibleUsers.map((user, i) =>
                        {
                            const billPct    = Math.min(user.daily.billableProgress    ?? 0, 100);
                            const nonBillPct = Math.min(user.daily.nonBillableProgress ?? 0, 100);

                            return (
                                <div key={user.userId} className={styles.goalRow}>
                                    <div className={styles.goalUser}>
                                        <span
                                            className={styles.goalAvatar}
                                            style={{
                                                background: `${USER_COLORS[i % USER_COLORS.length]}22`,
                                                color:      USER_COLORS[i % USER_COLORS.length],
                                            }}
                                        >
                                            {initials(user.firstName, user.lastName)}
                                        </span>
                                        <span className={styles.goalUserName}>{user.firstName} {user.lastName}</span>
                                    </div>

                                    <div className={styles.goalBars}>
                                        <div className={styles.goalBarGroup}>
                                            <div className={styles.goalBarMeta}>
                                                <span className={styles.goalBarLabel} style={{color: '#10b981'}}>Facturable</span>
                                                <span className={styles.goalBarValue}>
                                                    {fmtHoursShort(user.daily.billableMinutes)}
                                                    {user.daily.billableGoalMinutes > 0 && ` / ${fmtHoursShort(user.daily.billableGoalMinutes)}`}
                                                </span>
                                            </div>
                                            <div className={styles.goalTrack}>
                                                <div
                                                    className={styles.goalFill}
                                                    style={{width: `${billPct}%`, background: profitColor(user.daily.billableProgress ?? 0)}}
                                                />
                                            </div>
                                        </div>

                                        {user.daily.nonBillableGoalMinutes > 0 && (
                                            <div className={styles.goalBarGroup}>
                                                <div className={styles.goalBarMeta}>
                                                    <span className={styles.goalBarLabel} style={{color: '#f59e0b'}}>No facturable</span>
                                                    <span className={styles.goalBarValue}>
                                                        {fmtHoursShort(user.daily.nonBillableMinutes)} / {fmtHoursShort(user.daily.nonBillableGoalMinutes)}
                                                    </span>
                                                </div>
                                                <div className={styles.goalTrack}>
                                                    <div
                                                        className={styles.goalFill}
                                                        style={{width: `${nonBillPct}%`, background: '#f59e0b'}}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <p className={styles.goalNote}>
                        Meta diaria: {data.firm.dailyBillableGoalHours}h facturables
                        {data.firm.dailyNonBillableGoalHours ? ` · ${data.firm.dailyNonBillableGoalHours}h no facturables` : ''}
                    </p>
                </div>
            )}

            {/* ── Rentabilidad por proceso ── */}
            {profitProcesses.length > 0 && (
                <div className={styles.profitCard}>
                    <div className={styles.chartHeader}>
                        <DollarSign className={styles.chartHeaderIcon} />
                        <div>
                            <h3 className={styles.chartTitle}>Rentabilidad por proceso</h3>
                            <p className={styles.chartSub}>
                                Horas facturadas vs. máximo rentable (valor / tarifa por hora)
                            </p>
                        </div>
                    </div>

                    <div className={styles.profitTable}>
                        <div className={styles.profitTableHead}>
                            <span>Proceso</span>
                            <span>Valor total</span>
                            <span>Máx. horas</span>
                            <span>Horas facturadas</span>
                            <span>% consumo</span>
                        </div>
                        {profitProcesses.map(item => (
                            <div key={item.process.id} className={styles.profitRow}>
                                <span className={styles.profitProcess}>
                                    {toTitleCase(item.process.title)}
                                </span>
                                <span className={styles.profitValue}>
                                    {formatCOP(item.totalValue)}
                                </span>
                                <span className={styles.profitCell}>
                                    {item.maxHours.toFixed(1)}h
                                </span>
                                <span className={styles.profitCell}>
                                    {item.billableHrs.toFixed(1)}h
                                </span>
                                <span className={styles.profitPct} style={{color: item.color}}>
                                    <span className={styles.profitDot} style={{background: item.color}} />
                                    {item.pct}%
                                    {item.pct > 100 && (
                                        <span className={styles.profitOverTag}>Superado</span>
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className={styles.profitLegend}>
                        <span style={{color: '#10b981'}}>● &lt;80% — Rentable</span>
                        <span style={{color: '#f59e0b'}}>● 80–100% — En límite</span>
                        <span style={{color: '#ef4444'}}>● &gt;100% — Superado</span>
                    </div>
                </div>
            )}

            {/* Cross table: user × process */}
            {data.byUser.length > 0 && data.byProcess.length > 0 && (
                <div className={styles.crossCard}>
                    <div className={styles.chartHeader}>
                        <BarChart className={styles.chartHeaderIcon} />
                        <div>
                            <h3 className={styles.chartTitle}>Tiempo por usuario y caso</h3>
                            <p className={styles.chartSub}>Porcentaje de participación de cada usuario en cada proceso</p>
                        </div>
                    </div>
                    <div className={styles.crossTable}>
                        {data.byUser.map((u, ui) => (
                            <div key={u.userId} className={styles.crossRow}>
                                <div className={styles.crossUser}>
                                    <span
                                        className={styles.crossAvatar}
                                        style={{
                                            background: `${USER_COLORS[ui % USER_COLORS.length]}22`,
                                            color:      USER_COLORS[ui % USER_COLORS.length],
                                        }}
                                    >
                                        {initials(u.firstName, u.lastName)}
                                    </span>
                                    <span className={styles.crossName}>{u.firstName} {u.lastName}</span>
                                </div>
                                <div className={styles.crossBars}>
                                    {data.byProcess.slice(0, 5).map((p, pi) =>
                                    {
                                        const titleCased = toTitleCase(p.title);
                                        const pct = u.totalMinutes > 0
                                            ? Math.round((Math.min(u.totalMinutes, p.totalMinutes) / u.totalMinutes) * 100)
                                            : 0;
                                        return (
                                            <div key={p.processId} className={styles.crossCell} title={`${titleCased}: ~${pct}%`}>
                                                <span className={styles.crossCellLabel}>
                                                    {titleCased.length > 18 ? titleCased.slice(0, 18) + '…' : titleCased}
                                                </span>
                                                <div className={styles.crossCellTrack}>
                                                    <div
                                                        className={styles.crossCellFill}
                                                        style={{width: `${pct}%`, background: PROCESS_COLORS[pi % PROCESS_COLORS.length]}}
                                                    />
                                                </div>
                                                <span className={styles.crossCellPct}>{pct}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimeAnalytics;
