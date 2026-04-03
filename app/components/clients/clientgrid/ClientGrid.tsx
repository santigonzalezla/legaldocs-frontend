'use client';

import styles from './clientgrid.module.css';
import {Building, Calendar, Mail, Phone, User, Users} from '@/app/components/svg';
import type {Client} from '@/app/interfaces/interfaces';
import {ClientType} from '@/app/interfaces/enums';
import {useRouter} from 'next/navigation';

const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', {day: '2-digit', month: 'short', year: 'numeric'});

const clientName = (c: Client) =>
    c.type === ClientType.COMPANY
        ? (c.companyName ?? '—')
        : [c.firstName, c.lastName].filter(Boolean).join(' ') || '—';

interface ClientGridProps
{
    clients:   Client[];
    onSelect?: (client: Client) => void;
    onDelete?: (client: Client) => void;
}

const ClientGrid = ({clients, onSelect, onDelete}: ClientGridProps) =>
{
    const router = useRouter();
    const handleClick = (client: Client) => onSelect ? onSelect(client) : router.push(`/dashboard/clients/${client.id}`);

    return (
    <div className={styles.grid}>
        {clients.map(client => (
            <div key={client.id} className={styles.card} onClick={() => handleClick(client)}>
                <div className={styles.cardHeader}>
                    <div className={styles.avatar}>
                        {client.type === ClientType.COMPANY ? <Building /> : <User />}
                    </div>
                    <span className={`${styles.typeBadge} ${client.type === ClientType.COMPANY ? styles.company : styles.individual}`}>
                        {client.type === ClientType.COMPANY ? 'Empresa' : 'Persona Natural'}
                    </span>
                </div>

                <div className={styles.cardBody}>
                    <h3 className={styles.name}>{clientName(client)}</h3>
                    {client.documentNumber && (
                        <p className={styles.docNumber}>{client.documentType ?? 'Doc'}: {client.documentNumber}</p>
                    )}
                    <div className={styles.contactInfo}>
                        {client.email && (
                            <span className={styles.contactItem}><Mail />{client.email}</span>
                        )}
                        {client.phone && (
                            <span className={styles.contactItem}><Phone />{client.phone}</span>
                        )}
                    </div>
                </div>

                <div className={styles.cardFooter}>
                    <span className={styles.date}><Calendar />{formatDate(client.createdAt)}</span>
                </div>
            </div>
        ))}
    </div>
    );
};

export default ClientGrid;
