'use client';

import styles from './processlist.module.css';
import {Briefcase, Trash} from '@/app/components/svg';
import type {LegalProcess, ProcessClientSummary} from '@/app/interfaces/interfaces';
import {ClientType} from '@/app/interfaces/enums';
import {STATUS_COLOR, STATUS_LABEL} from '@/app/components/processes/processgrid/ProcessGrid';
import {useRouter} from 'next/navigation';

const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', {day: '2-digit', month: 'short', year: 'numeric'});

const clientName = (client: ProcessClientSummary) =>
    client.type === ClientType.COMPANY
        ? (client.companyName ?? '—')
        : [client.firstName, client.lastName].filter(Boolean).join(' ') || '—';

const assigneeName = (assignee: LegalProcess['assignee']) =>
    assignee ? `${assignee.firstName} ${assignee.lastName}` : '—';

interface ProcessListProps
{
    processes: LegalProcess[];
    onDelete?: (p: LegalProcess) => void;
}

const ProcessList = ({processes, onDelete}: ProcessListProps) =>
{
    const router = useRouter();

    return (
        <div className={styles.tableContainer}>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <colgroup>
                        <col style={{width: '24%'}} />
                        <col style={{width: '18%'}} />
                        <col style={{width: '12%'}} />
                        <col style={{width: '20%'}} />
                        <col style={{width: '14%'}} />
                        <col style={{width: '12%'}} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>Proceso</th>
                            <th>Cliente</th>
                            <th>Inicio</th>
                            <th>Abogado responsable</th>
                            <th>Estado</th>
                            <th className={styles.actionsCell}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processes.map(p => (
                            <tr
                                key={p.id}
                                className={styles.tableRow}
                                style={{cursor: 'pointer'}}
                                onClick={() => router.push(`/dashboard/processes/${p.id}`)}
                            >
                                <td>
                                    <div className={styles.processCell}>
                                        <Briefcase />
                                        <span className={styles.processName}>{p.title}</span>
                                    </div>
                                </td>
                                <td className={styles.typeCell}>{p.client ? clientName(p.client) : '—'}</td>
                                <td className={styles.dateCell}>
                                    {p.startDate ? formatDate(p.startDate) : '—'}
                                </td>
                                <td className={styles.typeCell}>{assigneeName(p.assignee)}</td>
                                <td>
                                    <span className={styles.statusBadge}
                                        style={{
                                            backgroundColor: `${STATUS_COLOR[p.status]}18`,
                                            color:           STATUS_COLOR[p.status],
                                        }}
                                    >
                                        {STATUS_LABEL[p.status]}
                                    </span>
                                </td>
                                <td className={styles.actionsCell}>
                                    <div className={styles.tableActions}>
                                        <button
                                            className={`${styles.actionButton} ${styles.deleteButton}`}
                                            title="Eliminar proceso"
                                            onClick={e => { e.stopPropagation(); onDelete?.(p); }}
                                        >
                                            <Trash />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProcessList;
