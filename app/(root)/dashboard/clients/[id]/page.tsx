'use client';

import styles from './page.module.css';
import {useParams, useRouter} from 'next/navigation';
import {useState} from 'react';
import {useFetch} from '@/hooks/useFetch';
import {toast} from 'sonner';
import {ArrowLeft, Briefcase, Building, Calendar, Edit, Mail, MapPin, Phone, Trash, User} from '@/app/components/svg';
import type {Client, LegalProcess, PaginatedResponse} from '@/app/interfaces/interfaces';
import {ClientType, ProcessStatus} from '@/app/interfaces/enums';
import {STATUS_COLOR, STATUS_LABEL} from '@/app/components/processes/processgrid/ProcessGrid';

const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', {day: '2-digit', month: 'long', year: 'numeric'});

const clientName = (c: Client) =>
    c.type === ClientType.COMPANY
        ? (c.companyName ?? '—')
        : [c.firstName, c.lastName].filter(Boolean).join(' ') || '—';

const ClientDetailPage = () =>
{
    const {id}   = useParams<{id: string}>();
    const router = useRouter();

    const {data: client, isLoading} =
        useFetch<Client>(`client/${id}`, {firmScoped: true});

    const {data: processRes} =
        useFetch<PaginatedResponse<LegalProcess>>(`process?clientId=${id}&limit=100`, {firmScoped: true});

    const {execute: deleteClient} =
        useFetch<void>('', {method: 'DELETE', immediate: false, firmScoped: true});

    const processes = processRes?.data ?? [];

    const handleDelete = async () =>
    {
        if (!client) return;
        if (!window.confirm(`¿Eliminar el cliente "${clientName(client)}"? Esta acción no se puede deshacer.`)) return;
        await deleteClient({}, `client/${id}`);
        toast.success('Cliente eliminado.');
        router.push('/dashboard/clients');
    };

    if (isLoading)
        return <div className={styles.loading}>Cargando cliente...</div>;

    if (!client)
        return <div className={styles.loading}>Cliente no encontrado.</div>;

    const processStats = {
        total:  processes.length,
        active: processes.filter(p => p.status === ProcessStatus.ACTIVE).length,
        closed: processes.filter(p => p.status === ProcessStatus.CLOSED).length,
    };

    return (
        <div className={styles.page}>
            {/* Back button */}
            <button className={styles.backBtn} onClick={() => router.back()}>
                <ArrowLeft />
            </button>

            {/* Profile card */}
            <div className={styles.profileCard}>
                <div className={styles.profileLeft}>
                    <div className={styles.avatar}>
                        {client.type === ClientType.COMPANY ? <Building /> : <User />}
                    </div>
                    <div>
                        <h1 className={styles.name}>{clientName(client)}</h1>
                        <span className={`${styles.typeBadge} ${client.type === ClientType.COMPANY ? styles.company : styles.individual}`}>
                            {client.type === ClientType.COMPANY ? 'Empresa' : 'Persona Natural'}
                        </span>
                    </div>
                </div>

                <div className={styles.profileInfo}>
                    {client.documentNumber && (
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>{client.documentType ?? 'Documento'}</span>
                            <span className={styles.infoValue}>{client.documentNumber}</span>
                        </div>
                    )}
                    {client.email && (
                        <div className={styles.infoItem}>
                            <Mail />
                            <span className={styles.infoValue}>{client.email}</span>
                        </div>
                    )}
                    {client.phone && (
                        <div className={styles.infoItem}>
                            <Phone />
                            <span className={styles.infoValue}>{client.phone}</span>
                        </div>
                    )}
                    {client.city && (
                        <div className={styles.infoItem}>
                            <MapPin />
                            <span className={styles.infoValue}>{client.city}</span>
                        </div>
                    )}
                    {client.address && (
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Dirección</span>
                            <span className={styles.infoValue}>{client.address}</span>
                        </div>
                    )}
                    <div className={styles.infoItem}>
                        <Calendar />
                        <span className={styles.infoValue}>Registrado el {formatDate(client.createdAt)}</span>
                    </div>
                </div>
            </div>

            {/* Process stats */}
            <div className={styles.statsRow}>
                {[
                    {label: 'Total procesos', value: processStats.total},
                    {label: 'Activos',         value: processStats.active},
                    {label: 'Cerrados',        value: processStats.closed},
                ].map(s => (
                    <div key={s.label} className={styles.statCard}>
                        <span className={styles.statValue}>{s.value}</span>
                        <span className={styles.statLabel}>{s.label}</span>
                    </div>
                ))}
            </div>

            {/* Processes section */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>Procesos</h2>
                    <button
                        className={styles.newProcessBtn}
                        onClick={() => router.push(`/dashboard/processes?clientId=${id}`)}
                    >
                        <Briefcase /> Ver todos
                    </button>
                </div>

                {processes.length === 0 ? (
                    <div className={styles.empty}>Este cliente no tiene procesos registrados aún.</div>
                ) : (
                    <div className={styles.processList}>
                        {processes.map(p => (
                            <div
                                key={p.id}
                                className={styles.processItem}
                                onClick={() => router.push(`/dashboard/processes/${p.id}`)}
                            >
                                <div className={styles.processIcon}><Briefcase /></div>
                                <div className={styles.processInfo}>
                                    <span className={styles.processTitle}>{p.title}</span>
                                    {p.reference && <span className={styles.processRef}>Rad. {p.reference}</span>}
                                </div>
                                <span
                                    className={styles.processBadge}
                                    style={{background: `${STATUS_COLOR[p.status]}18`, color: STATUS_COLOR[p.status]}}
                                >
                                    {STATUS_LABEL[p.status]}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientDetailPage;
