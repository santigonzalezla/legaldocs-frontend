'use client';

import styles from './timeanalytics.module.css';
import {Clock, Users, Briefcase, BarChart} from '@/app/components/svg';
import {useFetch} from '@/hooks/useFetch';

/* ── Types ──────────────────────────────────────────────────────────────────── */

interface UserStat {
    userId:       string;
    firstName:    string;
    lastName:     string;
    totalMinutes: number;
    entryCount:   number;
    processCount: number;
}

interface ProcessStat {
    processId:    string;
    title:        string;
    totalMinutes: number;
    entryCount:   number;
    userCount:    number;
}

interface AnalyticsData {
    byUser:       UserStat[];
    byProcess:    ProcessStat[];
    totalMinutes: number;
    totalEntries: number;
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

const initials = (u: UserStat): string =>
    `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase();

/* ── Bar chart colors ───────────────────────────────────────────────────────── */

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
    const {data, isLoading} = useFetch<AnalyticsData>('time-entry/analytics', {firmScoped: true});

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

    const maxUser    = Math.max(...data.byUser.map(u => u.totalMinutes), 1);
    const maxProcess = Math.max(...data.byProcess.map(p => p.totalMinutes), 1);

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
            label: 'Usuarios con tiempo',
            value: data.byUser.length,
            sub:   'abogados y asistentes',
            icon:  <Users />,
            color: '#10b981',
            bg:    '#ecfdf5',
        },
        {
            label: 'Procesos activos',
            value: data.byProcess.length,
            sub:   'con tiempo registrado',
            icon:  <Briefcase />,
            color: '#8b5cf6',
            bg:    '#f5f3ff',
        },
        {
            label: 'Promedio por usuario',
            value: data.byUser.length
                ? fmtHoursShort(data.totalMinutes / data.byUser.length)
                : '0h',
            sub:   'horas promedio',
            icon:  <BarChart />,
            color: '#f59e0b',
            bg:    '#fffbeb',
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
                                        style={{background: `${USER_COLORS[i % USER_COLORS.length]}22`, color: USER_COLORS[i % USER_COLORS.length]}}
                                    >
                                        {initials(u)}
                                    </span>
                                    <div className={styles.barLabelText}>
                                        <span className={styles.barName}>{u.firstName} {u.lastName}</span>
                                        <span className={styles.barMeta}>{u.processCount} proceso{u.processCount !== 1 ? 's' : ''} · {u.entryCount} registro{u.entryCount !== 1 ? 's' : ''}</span>
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

                    <div className={styles.barList}>
                        {data.byProcess.map((p, i) => (
                            <div key={p.processId} className={styles.barRow}>
                                <div className={styles.barLabel}>
                                    <span
                                        className={styles.barDot}
                                        style={{background: PROCESS_COLORS[i % PROCESS_COLORS.length]}}
                                    />
                                    <div className={styles.barLabelText}>
                                        <span className={styles.barName}>{p.title}</span>
                                        <span className={styles.barMeta}>{p.userCount} usuario{p.userCount !== 1 ? 's' : ''} · {p.entryCount} registro{p.entryCount !== 1 ? 's' : ''}</span>
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
                                        style={{background: `${USER_COLORS[ui % USER_COLORS.length]}22`, color: USER_COLORS[ui % USER_COLORS.length]}}
                                    >
                                        {initials(u)}
                                    </span>
                                    <span className={styles.crossName}>{u.firstName} {u.lastName}</span>
                                </div>
                                <div className={styles.crossBars}>
                                    {data.byProcess.slice(0, 5).map((p, pi) => {
                                        // Pct of this user's time spent on this process
                                        const pct = u.totalMinutes > 0
                                            ? Math.round((Math.min(u.totalMinutes, p.totalMinutes) / u.totalMinutes) * 100)
                                            : 0;
                                        return (
                                            <div key={p.processId} className={styles.crossCell} title={`${p.title}: ~${pct}%`}>
                                                <span className={styles.crossCellLabel}>{p.title.length > 18 ? p.title.slice(0, 18) + '…' : p.title}</span>
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
