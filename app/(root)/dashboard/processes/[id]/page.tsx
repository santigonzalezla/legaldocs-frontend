'use client';

import styles from './page.module.css';
import {useParams, useRouter} from 'next/navigation';
import {useFetch} from '@/hooks/useFetch';
import {toast} from 'sonner';
import {ArrowLeft, Briefcase, Building, Calendar, Edit, Trash, User} from '@/app/components/svg';
import type {Client, LegalBranch, LegalProcess} from '@/app/interfaces/interfaces';
import TimeTracker from '@/app/components/processes/timetracker/TimeTracker';
import ProcessDocuments from '@/app/components/processes/processdocuments/ProcessDocuments';
import {ClientType, ProcessStatus} from '@/app/interfaces/enums';
import {STATUS_COLOR, STATUS_LABEL} from '@/app/components/processes/processgrid/ProcessGrid';

const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('es-ES', {day: '2-digit', month: 'long', year: 'numeric'}) : '—';

const clientName = (c: Client) =>
    c.type === ClientType.COMPANY
        ? (c.companyName ?? '—')
        : [c.firstName, c.lastName].filter(Boolean).join(' ') || '—';

const STATUS_DOT: Record<ProcessStatus, string> = {
    [ProcessStatus.ACTIVE]:    '#10b981',
    [ProcessStatus.IN_REVIEW]: '#f59e0b',
    [ProcessStatus.CLOSED]:    '#6b7280',
    [ProcessStatus.ARCHIVED]:  '#9ca3af',
};

const ProcessDetailPage = () =>
{
    const {id}   = useParams<{id: string}>();
    const router = useRouter();

    const {data: process, isLoading} =
        useFetch<LegalProcess>(`process/${id}`, {firmScoped: true});

    const {data: client} =
        useFetch<Client>(process ? `client/${process.clientId}` : '', {
            firmScoped: true,
            immediate:  !!process,
        });

    const {data: branches} =
        useFetch<LegalBranch[]>('branch?isActive=true&limit=50', {firmScoped: true});

    const branch = branches?.find(b => b.id === process?.branchId);

    const {execute: deleteProcess} =
        useFetch<void>('', {method: 'DELETE', immediate: false, firmScoped: true});

    const handleDelete = async () =>
    {
        if (!process) return;
        if (!window.confirm(`¿Eliminar el proceso "${process.title}"?`)) return;
        await deleteProcess({}, `process/${id}`);
        toast.success('Proceso eliminado.');
        router.push('/dashboard/processes');
    };

    if (isLoading)
        return <div className={styles.loading}>Cargando proceso...</div>;

    if (!process)
        return <div className={styles.loading}>Proceso no encontrado.</div>;

    return (
        <div className={styles.page}>
            {/* Back button */}
            <button className={styles.backBtn} onClick={() => router.back()}>
                <ArrowLeft />
            </button>

            {/* Title box — incluye ícono, nombre, dot de estado, acciones */}
            <div className={styles.titleRow}>
                <div className={styles.processIcon}><Briefcase /></div>

                <div className={styles.titleInfo}>
                    <div className={styles.titleLine}>
                        <h1 className={styles.title}>{process.title}</h1>
                        <span
                            className={styles.statusDot}
                            title={STATUS_LABEL[process.status]}
                            style={{background: STATUS_DOT[process.status]}}
                        />
                    </div>
                    {process.reference && <span className={styles.reference}>Rad. {process.reference}</span>}
                </div>

                <div className={styles.titleActions}>
                    <button className={styles.editBtn} onClick={() => router.push(`/dashboard/processes/${id}/edit`)}>
                        <Edit /> Editar
                    </button>
                    <button className={styles.deleteBtn} onClick={handleDelete}>
                        <Trash /> Eliminar
                    </button>
                </div>
            </div>

            {/* Info grid */}
            <div className={styles.infoGrid}>
                <div className={styles.infoCard}>
                    <span className={styles.infoCardLabel}>Cliente</span>
                    {client ? (
                        <button
                            className={styles.clientLink}
                            onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                        >
                            <div className={styles.clientAvatar}>
                                {client.type === ClientType.COMPANY ? <Building /> : <User />}
                            </div>
                            <span>{clientName(client)}</span>
                        </button>
                    ) : (
                        <span className={styles.infoValue}>—</span>
                    )}
                </div>

                <div className={styles.infoCard}>
                    <span className={styles.infoCardLabel}>Rama del derecho</span>
                    <span className={styles.infoValue}>{branch?.name ?? '—'}</span>
                </div>

                <div className={styles.infoCard}>
                    <span className={styles.infoCardLabel}>Juzgado / Entidad</span>
                    <span className={styles.infoValue}>{process.court ?? '—'}</span>
                </div>

                <div className={styles.infoCard}>
                    <span className={styles.infoCardLabel}>Contraparte</span>
                    <span className={styles.infoValue}>{process.counterpart ?? '—'}</span>
                </div>

                <div className={styles.infoCard}>
                    <span className={styles.infoCardLabel}>Fecha de inicio</span>
                    <span className={styles.infoValue}>{formatDate(process.startDate)}</span>
                </div>

                <div className={styles.infoCard}>
                    <span className={styles.infoCardLabel}>Fecha de cierre</span>
                    <span className={styles.infoValue}>{formatDate(process.endDate)}</span>
                </div>
            </div>

            {process.description && (
                <div className={styles.descCard}>
                    <span className={styles.infoCardLabel}>Descripción</span>
                    <p className={styles.description}>{process.description}</p>
                </div>
            )}

            <TimeTracker processId={process.id} />

            <ProcessDocuments processId={process.id} />

            <div className={styles.placeholderGrid}>
                <div className={styles.placeholderCard}>
                    <div className={styles.placeholderHeader}>
                        <Calendar />
                        <h3>Términos y Vencimientos</h3>
                    </div>
                    <p className={styles.placeholderText}>
                        Próximamente: registro de fechas críticas, términos judiciales y alertas de vencimiento.
                    </p>
                </div>

                <div className={styles.placeholderCard}>
                    <div className={styles.placeholderHeader}>
                        <Edit />
                        <h3>Actuaciones</h3>
                    </div>
                    <p className={styles.placeholderText}>
                        Próximamente: bitácora cronológica de actuaciones, notas y diligencias del proceso.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ProcessDetailPage;
