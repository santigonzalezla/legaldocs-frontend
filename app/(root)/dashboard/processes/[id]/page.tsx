'use client';

import {useState} from 'react';
import styles from './page.module.css';
import {useParams, useRouter} from 'next/navigation';
import {useFetch} from '@/hooks/useFetch';
import {toast} from 'sonner';
import {ArrowLeft, Briefcase, Building, Calendar, DollarSign, Edit, Plus, Trash, User} from '@/app/components/svg';
import type {Firm, LegalBranch, LegalProcess, ProcessClientSummary, ProcessValueEntry, TimeEntry} from '@/app/interfaces/interfaces';
import {useConfirm} from '@/hooks/useConfirm';
import ConfirmModal from '@/app/components/ui/confirmmodal/ConfirmModal';
import TimeTracker from '@/app/components/processes/timetracker/TimeTracker';
import ProcessDocuments from '@/app/components/processes/processdocuments/ProcessDocuments';
import BillingPanel from '@/app/components/processes/billingpanel/BillingPanel';
import AddValueEntryModal from '@/app/components/processes/addvalueentrymodal/AddValueEntryModal';
import {BillableType, ClientType, ProcessStatus} from '@/app/interfaces/enums';
import {STATUS_LABEL} from '@/app/components/processes/processgrid/ProcessGrid';
import {PermissionGuard} from '@/app/components/auth/PermissionGuard';
import {usePermissions} from '@/context/PermissionsContext';

const formatCOP = (value: number) =>
    new Intl.NumberFormat('es-CO', {style: 'currency', currency: 'COP', maximumFractionDigits: 0}).format(value);

const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('es-ES', {day: '2-digit', month: 'long', year: 'numeric'}) : '—';

const clientName = (client: ProcessClientSummary) =>
    client.type === ClientType.COMPANY
        ? (client.companyName ?? '—')
        : [client.firstName, client.lastName].filter(Boolean).join(' ') || '—';

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
    const {can}  = usePermissions();
    const [showBilling, setShowBilling] = useState(false);

    const [showAddEntry, setShowAddEntry] = useState(false);
    const [savingEntry,  setSavingEntry]  = useState(false);

    const {data: process, isLoading, execute: refetchProcess} =
        useFetch<LegalProcess>(`process/${id}`, {firmScoped: true});

    const client = process?.client ?? null;

    const {data: firm} =
        useFetch<Firm>('firm/me', {firmScoped: true});

    const {data: branches} =
        useFetch<LegalBranch[]>('branch?isActive=true&limit=50', {firmScoped: true});

    const branch = branches?.find(branchItem => branchItem.id === process?.branchId);

    const canViewTimeEntries = can('time_entries:view');

    const {data: entries, execute: refetchTimeEntries} =
        useFetch<TimeEntry[]>(`time-entry?processId=${id}`, {firmScoped: true, immediate: canViewTimeEntries});

    const {execute: deleteProcess} =
        useFetch<void>('', {method: 'DELETE', immediate: false, firmScoped: true});

    const {execute: addValueEntry} =
        useFetch<ProcessValueEntry>('', {method: 'POST', immediate: false, firmScoped: true});

    const {execute: removeValueEntry} =
        useFetch<void>('', {method: 'DELETE', immediate: false, firmScoped: true});

    const {confirm, confirmState, handleConfirm, handleCancel} = useConfirm();

    const handleDelete = async () =>
    {
        if (!process) return;
        if (!await confirm({title: 'Eliminar proceso', message: `¿Eliminar el proceso "${process.title}"?`, confirmLabel: 'Eliminar'})) return;
        await deleteProcess({}, `process/${id}`);
        toast.success('Proceso eliminado.');
        router.push('/dashboard/processes');
    };

    const handleAddValueEntry = async (amount: number, description: string) =>
    {
        setSavingEntry(true);
        const result = await addValueEntry({body: {amount, description}}, `process/${id}/value-entries`);
        setSavingEntry(false);
        if (!result) return;
        toast.success('Entrada de valor agregada.');
        setShowAddEntry(false);
        refetchProcess();
    };

    const handleRemoveValueEntry = async (entryId: string) =>
    {
        if (!await confirm({title: 'Eliminar entrada', message: '¿Eliminar esta entrada de valor?', confirmLabel: 'Eliminar'})) return;
        await removeValueEntry({}, `process/${id}/value-entries/${entryId}`);
        toast.success('Entrada eliminada.');
        refetchProcess();
    };

    const totalProcessValue  = (process?.processValue ?? 0) + (process?.valueEntries ?? []).reduce((sum, entry) => sum + entry.amount, 0);
    const billableUsedMinutes = (entries ?? []).filter(entry => entry.billableType === BillableType.BILLABLE).reduce((sum, entry) => sum + (entry.durationMinutes ?? 0), 0);
    const billableUsedHours  = billableUsedMinutes / 60;
    const maxHours           = firm?.firmHourlyRate && totalProcessValue > 0 ? totalProcessValue / firm.firmHourlyRate : null;
    const profitabilityPct   = maxHours ? Math.round(billableUsedHours / maxHours * 100) : null;
    const profitabilityColor = profitabilityPct == null ? '#6b7280' : profitabilityPct < 80 ? '#10b981' : profitabilityPct <= 100 ? '#f59e0b' : '#ef4444';

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
                    {canViewTimeEntries && (
                        <button className={styles.billingBtn} onClick={() => setShowBilling(true)}>
                            <DollarSign /> Cuenta de cobro
                        </button>
                    )}
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
                        can('clients:view') ? (
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
                            <div className={styles.clientLink} style={{cursor: 'default'}}>
                                <div className={styles.clientAvatar}>
                                    {client.type === ClientType.COMPANY ? <Building /> : <User />}
                                </div>
                                <span>{clientName(client)}</span>
                            </div>
                        )
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

            {/* Panel de valor económico del proceso */}
            <div className={styles.descCard}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1.25rem'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: 'var(--primary-color-alpha)', borderRadius: '10px', flexShrink: 0}}>
                            <DollarSign style={{width: '18px', height: '18px', color: 'var(--primary-color)'}} />
                        </div>
                        <div>
                            <h3 style={{margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)'}}>Valor del Proceso</h3>
                            <span style={{fontSize: '0.78rem', color: 'var(--text-secondary)'}}>
                                Total: {totalProcessValue > 0 ? formatCOP(totalProcessValue) : 'Sin valor registrado'}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAddEntry(true)}
                        style={{display: 'flex', alignItems: 'center', gap: '5px', padding: '0.4rem 0.8rem', border: '1px solid var(--border-color)', borderRadius: '7px', background: 'var(--content-bg)', color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', flexShrink: 0}}
                    >
                        <Plus /> Agregar entrada
                    </button>
                </div>

                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem'}}>
                    <div className={styles.infoCard}>
                        <span className={styles.infoCardLabel}>Valor inicial</span>
                        <span className={styles.infoValue}>
                            {process.processValue != null ? formatCOP(process.processValue) : '—'}
                        </span>
                    </div>

                    {maxHours != null && (
                        <div className={styles.infoCard}>
                            <span className={styles.infoCardLabel}>Máx. horas rentables</span>
                            <span className={styles.infoValue}>{maxHours.toFixed(1)} h</span>
                        </div>
                    )}

                    {maxHours != null && (
                        <div className={styles.infoCard}>
                            <span className={styles.infoCardLabel}>Horas facturadas</span>
                            <span className={styles.infoValue} style={{color: profitabilityColor, fontWeight: 600}}>
                                {billableUsedHours.toFixed(1)} h ({profitabilityPct}%)
                            </span>
                        </div>
                    )}
                </div>

                {maxHours != null && (
                    <div style={{marginBottom: '1rem'}}>
                        <div style={{height: '8px', borderRadius: '4px', background: 'var(--border-light)', overflow: 'hidden'}}>
                            <div style={{height: '100%', width: `${Math.min(profitabilityPct ?? 0, 100)}%`, background: profitabilityColor, borderRadius: '4px', transition: 'width 0.4s ease'}} />
                        </div>
                        <p style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem'}}>
                            {profitabilityPct != null && profitabilityPct > 100
                                ? `Rentabilidad superada en ${(profitabilityPct - 100).toFixed(0)}%`
                                : `${profitabilityPct ?? 0}% del límite de horas rentables consumido`}
                        </p>
                    </div>
                )}

                {(process.valueEntries ?? []).length > 0 && (
                    <div>
                        <span className={styles.infoCardLabel} style={{display: 'block', marginBottom: '0.5rem'}}>Entradas adicionales</span>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                            {(process.valueEntries ?? []).map(valueEntry => (
                                <div key={valueEntry.id} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.75rem', border: '1px solid var(--border-light)', borderRadius: '8px', gap: '1rem'}}>
                                    <div style={{flex: 1}}>
                                        <p style={{margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)'}}>{formatCOP(valueEntry.amount)}</p>
                                        <p style={{margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)'}}>{valueEntry.description}</p>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveValueEntry(valueEntry.id)}
                                        style={{display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', border: 'none', borderRadius: '6px', background: 'transparent', color: '#ef4444', cursor: 'pointer', flexShrink: 0}}
                                    >
                                        <Trash />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {canViewTimeEntries && <TimeTracker processId={process.id} onEntryCreated={refetchTimeEntries} />}

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

            {confirmState && (
                <ConfirmModal
                    title={confirmState.title}
                    message={confirmState.message}
                    confirmLabel={confirmState.confirmLabel}
                    danger={confirmState.danger}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}

            {showBilling && (
                <BillingPanel
                    process={process}
                    client={client ?? null}
                    entries={entries ?? []}
                    firmHourlyRate={firm?.firmHourlyRate ?? null}
                    onClose={() => setShowBilling(false)}
                />
            )}

            <AddValueEntryModal
                open={showAddEntry}
                saving={savingEntry}
                onClose={() => setShowAddEntry(false)}
                onSave={handleAddValueEntry}
            />
        </div>
    );
};

const ProcessDetailPageGuarded = () => (
    <PermissionGuard permission="processes:view">
        <ProcessDetailPage/>
    </PermissionGuard>
);

export default ProcessDetailPageGuarded;
