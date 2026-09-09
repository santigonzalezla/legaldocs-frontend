'use client';

import styles from './clientlist.module.css';
import {Building, Mail, Phone, Trash, User} from '@/app/components/svg';
import type {Client} from '@/app/interfaces/interfaces';
import {ClientType} from '@/app/interfaces/enums';

const clientName = (c: Client) =>
    c.type === ClientType.COMPANY
        ? (c.companyName ?? '—')
        : [c.firstName, c.lastName].filter(Boolean).join(' ') || '—';

interface ClientListProps
{
    clients:   Client[];
    onSelect?: (client: Client) => void;
    onDelete?: (client: Client) => void;
}

const ClientList = ({clients, onSelect, onDelete}: ClientListProps) =>
{
    return (
        <div className={styles.tableContainer}>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <colgroup>
                        <col style={{width: '21%'}} />
                        <col style={{width: '15%'}} />
                        <col style={{width: '19%'}} />
                        <col style={{width: '22%'}} />
                        <col style={{width: '11%'}} />
                        <col style={{width: '12%'}} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Tipo</th>
                            <th>Documento</th>
                            <th>Contacto</th>
                            <th>Ciudad</th>
                            <th className={styles.actionsCell}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clients.map(c => (
                            <tr
                                key={c.id}
                                className={styles.tableRow}
                                style={{cursor: 'pointer'}}
                                onClick={() => onSelect?.(c)}
                            >
                                <td>
                                    <div className={styles.documentCell}>
                                        <div style={{color: 'var(--primary-color)', display: 'flex'}}>
                                            {c.type === ClientType.COMPANY ? <Building /> : <User />}
                                        </div>
                                        <span className={styles.documentName}>{clientName(c)}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className={styles.statusBadge}
                                        style={{
                                            backgroundColor: c.type === ClientType.COMPANY ? '#f0fdf418' : '#eff6ff',
                                            color:           c.type === ClientType.COMPANY ? '#10b981'   : '#3b82f6',
                                        }}
                                    >
                                        {c.type === ClientType.COMPANY ? 'Empresa' : 'Persona Natural'}
                                    </span>
                                </td>
                                <td className={styles.docCell}>
                                    {c.documentNumber ? (
                                        <>
                                            <span className={styles.docLabel}>{c.documentType ?? 'Doc'}:</span>{' '}
                                            <span className={styles.docValue}>{c.documentNumber}</span>
                                        </>
                                    ) : '—'}
                                </td>
                                <td>
                                    <div className={styles.contactCell}>
                                        {c.email && (
                                            <span className={styles.contactLine}>
                                                <Mail /><span className={styles.contactText}>{c.email}</span>
                                            </span>
                                        )}
                                        {c.phone && (
                                            <span className={styles.contactLine}>
                                                <Phone /><span className={styles.contactText}>{c.phone}</span>
                                            </span>
                                        )}
                                        {!c.email && !c.phone && <span className={styles.clientCell}>—</span>}
                                    </div>
                                </td>
                                <td className={styles.dateCell}>{c.city ?? '—'}</td>
                                <td className={styles.actionsCell}>
                                    <div className={styles.tableActions}>
                                        <button
                                            className={styles.actionButton}
                                            title="Eliminar cliente"
                                            onClick={e => { e.stopPropagation(); onDelete?.(c); }}
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

export default ClientList;
