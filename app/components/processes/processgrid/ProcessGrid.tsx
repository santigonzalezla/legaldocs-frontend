'use client';

import styles from './processgrid.module.css';
import {Calendar, Briefcase, User} from '@/app/components/svg';
import type {LegalProcess} from '@/app/interfaces/interfaces';
import {ProcessStatus} from '@/app/interfaces/enums';
import {useRouter} from 'next/navigation';

export const STATUS_LABEL: Record<ProcessStatus, string> = {
    [ProcessStatus.ACTIVE]:    'Activo',
    [ProcessStatus.IN_REVIEW]: 'En Revisión',
    [ProcessStatus.CLOSED]:    'Cerrado',
    [ProcessStatus.ARCHIVED]:  'Archivado',
};

export const STATUS_COLOR: Record<ProcessStatus, string> = {
    [ProcessStatus.ACTIVE]:    '#10b981',
    [ProcessStatus.IN_REVIEW]: '#f59e0b',
    [ProcessStatus.CLOSED]:    '#6b7280',
    [ProcessStatus.ARCHIVED]:  '#9ca3af',
};

const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', {day: '2-digit', month: 'short', year: 'numeric'});

interface ProcessGridProps
{
    processes: LegalProcess[];
    onSelect?: (p: LegalProcess) => void;
    onDelete?: (p: LegalProcess) => void;
}

const ProcessGrid = ({processes, onSelect, onDelete}: ProcessGridProps) =>
{
    const router = useRouter();
    const handleClick = (p: LegalProcess) => onSelect ? onSelect(p) : router.push(`/dashboard/processes/${p.id}`);

    return (
    <div className={styles.grid}>
        {processes.map(p => (
            <div key={p.id} className={styles.card} onClick={() => handleClick(p)}>
                <div className={styles.cardHeader}>
                    <div className={styles.icon}><Briefcase /></div>
                    <span
                        className={styles.statusBadge}
                        style={{background: `${STATUS_COLOR[p.status]}18`, color: STATUS_COLOR[p.status]}}
                    >
                        {STATUS_LABEL[p.status]}
                    </span>
                </div>

                <div className={styles.cardBody}>
                    <h3 className={styles.title}>{p.title}</h3>
                    {p.reference && (
                        <p className={styles.reference}>Rad. {p.reference}</p>
                    )}
                    {p.court && (
                        <p className={styles.court}>{p.court}</p>
                    )}
                    {p.counterpart && (
                        <div className={styles.meta}><User /><span>Contraparte: {p.counterpart}</span></div>
                    )}
                </div>

                <div className={styles.cardFooter}>
                    <span className={styles.date}><Calendar />{formatDate(p.createdAt)}</span>
                </div>
            </div>
        ))}
    </div>
    );
};

export default ProcessGrid;
