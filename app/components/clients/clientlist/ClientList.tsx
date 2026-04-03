'use client';

import styles from '@/app/components/documents/generated/documenttable/documenttable.module.css';
import {Building, Mail, Phone, Trash, User} from '@/app/components/svg';
import type {Client} from '@/app/interfaces/interfaces';
import {ClientType} from '@/app/interfaces/enums';

const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', {day: '2-digit', month: 'short', year: 'numeric'});

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
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Tipo</th>
                            <th>Documento</th>
                            <th>Contacto</th>
                            <th>Ciudad</th>
                            <th>Registro</th>
                            <th>Acciones</th>
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
                                <td className={styles.dateCell}>
                                    {c.documentNumber ? `${c.documentType ?? 'Doc'}: ${c.documentNumber}` : '—'}
                                </td>
                                <td>
                                    <div style={{display: 'flex', flexDirection: 'column', gap: '0.2rem'}}>
                                        {c.email && (
                                            <span className={styles.clientCell} style={{display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem'}}>
                                                <Mail style={{width: 13, height: 13, flexShrink: 0}} />{c.email}
                                            </span>
                                        )}
                                        {c.phone && (
                                            <span className={styles.clientCell} style={{display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem'}}>
                                                <Phone style={{width: 13, height: 13, flexShrink: 0}} />{c.phone}
                                            </span>
                                        )}
                                        {!c.email && !c.phone && <span className={styles.clientCell}>—</span>}
                                    </div>
                                </td>
                                <td className={styles.dateCell}>{c.city ?? '—'}</td>
                                <td className={styles.dateCell}>{formatDate(c.createdAt)}</td>
                                <td>
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
