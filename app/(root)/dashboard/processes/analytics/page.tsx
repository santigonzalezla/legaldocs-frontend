'use client';

import { useState } from 'react';
import styles from './page.module.css';
import TimeAnalytics from '@/app/components/processes/timeanalytics/TimeAnalytics';
import TimeCalendar  from '@/app/components/processes/timecalendar/TimeCalendar';
import { BarChart, Calendar } from '@/app/components/svg';

type Tab = 'analytics' | 'calendar';

const ProcessAnalyticsPage = () =>
{
    const [tab, setTab] = useState<Tab>('calendar');

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
                    <button
                        className={`${styles.tab} ${tab === 'analytics' ? styles.tabActive : ''}`}
                        onClick={() => setTab('analytics')}
                    >
                        <BarChart className={styles.tabIcon} />
                        Estadísticas
                    </button>
                </div>
            </div>

            {tab === 'calendar'  && <TimeCalendar />}
            {tab === 'analytics' && <TimeAnalytics />}
        </div>
    );
};

export default ProcessAnalyticsPage;
