'use client';

import styles from './page.module.css';
import StatsCard from '@/app/components/dashboard/statscard/StatsCard';
import {Briefcase, File, FileCheck, TimeAgo} from '@/app/components/svg';
import RecentDocuments from '@/app/components/dashboard/recentdocuments/RecentDocuments';
import LegalUpdates from '@/app/components/dashboard/legalupdates/LegalUpdates';
import QuickActions from '@/app/components/dashboard/quickactions/QuickActions';
import {useFetch} from '@/hooks/useFetch';
import {Document, PaginatedResponse} from '@/app/interfaces/interfaces';
import {DocumentStatus} from '@/app/interfaces/enums';

const defaultUpdates = [
    {
        id:       '1',
        title:    'Nueva Ley de Protección de Datos Personales',
        summary:  'Modificaciones importantes en el tratamiento de datos personales que afectan contratos comerciales.',
        date:     '2024-01-15',
        category: 'Derecho Digital',
        priority: 'high',
        source:   'Congreso de la República',
        url:      '#',
    },
    {
        id:       '2',
        title:    'Actualización Código Sustantivo del Trabajo',
        summary:  'Nuevas disposiciones sobre teletrabajo y modalidades de contratación laboral.',
        date:     '2024-01-12',
        category: 'Derecho Laboral',
        priority: 'medium',
        source:   'Ministerio del Trabajo',
        url:      '#',
    },
    {
        id:       '3',
        title:    'Reforma Tributaria 2024',
        summary:  'Cambios en las tarifas del impuesto de renta para personas jurídicas.',
        date:     '2024-01-10',
        category: 'Derecho Tributario',
        priority: 'high',
        source:   'DIAN',
        url:      '#',
    },
    {
        id:       '4',
        title:    'Circular Superintendencia de Sociedades',
        summary:  'Nuevos requisitos para la constitución de sociedades por acciones simplificadas.',
        date:     '2024-01-08',
        category: 'Derecho Comercial',
        priority: 'medium',
        source:   'Supersociedades',
        url:      '#',
    },
];

const Dashboard = () =>
{
    const {data: docsResponse, isLoading} = useFetch<PaginatedResponse<Document>>('document?limit=5', {firmScoped: true});

    const total     = docsResponse?.total ?? 0;
    const completed = docsResponse?.data.filter(d => d.status === DocumentStatus.COMPLETED).length ?? 0;
    const drafts    = docsResponse?.data.filter(d => d.status === DocumentStatus.DRAFT).length ?? 0;
    const hoursaved = Math.round(total * 0.63);

    const statsData = [
        {
            title:      'Documentos Generados',
            value:      String(total),
            change:     '+12%',
            changeType: 'positive',
            icon:       <FileCheck />,
            color:      '#10b981',
        },
        {
            title:      'Tiempo Ahorrado',
            value:      `${hoursaved}h`,
            change:     '+8%',
            changeType: 'positive',
            icon:       <TimeAgo />,
            color:      '#3b82f6',
        },
        {
            title:      'Completados',
            value:      String(completed),
            change:     '+3%',
            changeType: 'positive',
            icon:       <File />,
            color:      '#f59e0b',
        },
        {
            title:      'Borradores',
            value:      String(drafts),
            change:     '',
            changeType: 'neutral',
            icon:       <Briefcase />,
            color:      '#8b5cf6',
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
                <LegalUpdates updates={defaultUpdates} maxItems={5} showPriority={true} />
            </div>
        </div>
    );
};

export default Dashboard;
