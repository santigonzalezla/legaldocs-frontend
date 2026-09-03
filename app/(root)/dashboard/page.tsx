'use client';

import styles from './page.module.css';
import StatsCard from '@/app/components/dashboard/statscard/StatsCard';
import {FileCheck, Scale, TimeAgo, Users} from '@/app/components/svg';
import RecentDocuments from '@/app/components/dashboard/recentdocuments/RecentDocuments';
import LegalUpdates from '@/app/components/dashboard/legalupdates/LegalUpdates';
import QuickActions from '@/app/components/dashboard/quickactions/QuickActions';
import {useFetch} from '@/hooks/useFetch';
import {DashboardSummary, Document, LegalUpdate, PaginatedResponse} from '@/app/interfaces/interfaces';
import {DocumentStatus} from '@/app/interfaces/enums';

const plural = (n: number, singular: string, pluralForm: string) => `${n} ${n === 1 ? singular : pluralForm}`;

const formatPct = (value: number | null): string | undefined =>
    value === null ? undefined : `${value >= 0 ? '↑' : '↓'} ${Math.abs(value)}%`;

const formatNew = (n: number): string | undefined =>
    n > 0 ? `+${plural(n, 'nuevo', 'nuevos')}` : undefined;

const Dashboard = () =>
{
    const {data: docsResponse, isLoading} = useFetch<PaginatedResponse<Document>>('document?limit=5', {firmScoped: true});
    const {data: updatesResponse} = useFetch<PaginatedResponse<LegalUpdate>>('legal-updates?limit=5');
    const {data: summary} = useFetch<DashboardSummary>('dashboard/summary', {firmScoped: true});

    const statsData = [
        {
            title:     'Documentos generados',
            value:     summary ? summary.documents.month : '—',
            delta:     summary ? formatPct(summary.documents.deltaPct) : undefined,
            deltaType: (summary?.documents.deltaPct ?? 0) >= 0 ? 'positive' : 'negative',
            subtitle:  summary ? `${summary.documents.total} en total` : undefined,
            icon:      <FileCheck />,
            color:     '#3b82f6',
        },
        {
            title:     'Horas facturables',
            value:     summary ? `${summary.billableHours.month} h` : '—',
            delta:     summary ? formatPct(summary.billableHours.deltaPct) : undefined,
            deltaType: (summary?.billableHours.deltaPct ?? 0) >= 0 ? 'positive' : 'negative',
            subtitle:  summary ? `de ${summary.billableHours.trackedMonth} h registradas este mes` : undefined,
            icon:      <TimeAgo />,
            color:     '#10b981',
        },
        {
            title:     'Procesos activos',
            value:     summary ? summary.processes.active : '—',
            delta:     summary ? formatNew(summary.processes.newThisMonth) : undefined,
            deltaType: 'positive',
            subtitle:  summary ? `${summary.processes.inReview} en revisión` : undefined,
            icon:      <Scale />,
            color:     '#f59e0b',
        },
        {
            title:     'Clientes activos',
            value:     summary ? summary.clients.active : '—',
            delta:     summary ? formatNew(summary.clients.newThisMonth) : undefined,
            deltaType: 'positive',
            subtitle:  summary
                ? (summary.clients.newThisMonth > 0
                    ? `${plural(summary.clients.newCompanies, 'empresa', 'empresas')} · ${plural(summary.clients.newIndividuals, 'p. natural', 'p. naturales')}`
                    : 'sin altas este mes')
                : undefined,
            icon:      <Users />,
            color:     '#8b5cf6',
        },
    ];

    const recentDocuments = (docsResponse?.data ?? []).map(d => ({
        id:        d.id,
        name:      d.title,
        type:      d.documentType,
        createdAt: d.createdAt,
        size:      '',
        status:    d.status === DocumentStatus.COMPLETED ? 'completed'
                 : d.status === DocumentStatus.DRAFT     ? 'drafts'
                 : 'processing',
    }));

    return (
        <div className={styles.dashboard}>
            <div className={styles.cards}>
                {statsData.map((stat, index) => (
                    <StatsCard key={index} stat={stat} />
                ))}
            </div>
            <div className={styles.infoapp}>
                <div className={styles.infoappleft}>
                    <QuickActions />
                    {isLoading
                        ? <div className={styles.loadingDocs}>Cargando documentos...</div>
                        : <RecentDocuments documents={recentDocuments} maxItems={5} showActions={true} />
                    }
                </div>
                <LegalUpdates updates={updatesResponse?.data ?? []} maxItems={5} />
            </div>
        </div>
    );
};

export default Dashboard;
