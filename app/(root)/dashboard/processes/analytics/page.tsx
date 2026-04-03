'use client';

import styles from './page.module.css';
import TimeAnalytics from '@/app/components/processes/timeanalytics/TimeAnalytics';

const ProcessAnalyticsPage = () =>
{
    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1>Análisis de Tiempo</h1>
                <p>Distribución de horas trabajadas por abogado y por caso en toda la firma.</p>
            </div>
            <TimeAnalytics />
        </div>
    );
};

export default ProcessAnalyticsPage;
