'use client';

import styles from '@/app/components/documents/generated/documenttable/documenttable.module.css';
import {Briefcase, Trash, User} from '@/app/components/svg';
import type {LegalProcess} from '@/app/interfaces/interfaces';
import {STATUS_COLOR, STATUS_LABEL} from '@/app/components/processes/processgrid/ProcessGrid';
import {useRouter} from 'next/navigation';

const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', {day: '2-digit', month: 'short', year: 'numeric'});

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
                    <thead>
                        <tr>
                            <th>Proceso</th>
                            <th>Estado</th>
                            <th>Radicado</th>
                            <th>Juzgado</th>
                            <th>Contraparte</th>
                            <th>Inicio</th>
                            <th>Acciones</th>
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
                                    <div className={styles.documentCell}>
                                        <div style={{color: 'var(--primary-color)', display: 'flex'}}>
                                            <Briefcase />
                                        </div>
                                        <span className={styles.documentName}>{p.title}</span>
                                    </div>
                                </td>
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
                                <td className={styles.typeCell}>{p.reference ?? '—'}</td>
                                <td className={styles.dateCell}>{p.court ?? '—'}</td>
                                <td>
                                    {p.counterpart ? (
                                        <span className={styles.clientCell} style={{display: 'flex', alignItems: 'center', gap: '0.35rem'}}>
                                            <User style={{width: 13, height: 13, flexShrink: 0}} />{p.counterpart}
                                        </span>
                                    ) : <span className={styles.dateCell}>—</span>}
                                </td>
                                <td className={styles.dateCell}>
                                    {p.startDate ? formatDate(p.startDate) : '—'}
                                </td>
                                <td>
                                    <div className={styles.tableActions}>
                                        <button
                                            className={styles.actionButton}
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
