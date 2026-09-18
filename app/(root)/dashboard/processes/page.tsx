'use client';

import styles from './page.module.css';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {Briefcase, Check, Clock, Plus} from '@/app/components/svg';
import {useFetch} from '@/hooks/useFetch';
import {toast} from 'sonner';
import {ClientType, ProcessStatus} from '@/app/interfaces/enums';
import type {ClientPickerOption, LegalBranch, LegalProcess, PaginatedResponse} from '@/app/interfaces/interfaces';
import {useConfirm} from '@/hooks/useConfirm';
import {uploadAttachment, type PendingAttachment} from '@/lib/attachments';
import ConfirmModal from '@/app/components/ui/confirmmodal/ConfirmModal';
import ProcessFilters     from '@/app/components/processes/processfilters/ProcessFilters';
import ProcessGrid        from '@/app/components/processes/processgrid/ProcessGrid';
import ProcessList        from '@/app/components/processes/processlist/ProcessList';
import CreateProcessModal from '@/app/components/processes/createprocessmodal/CreateProcessModal';
import type {CreateProcessForm} from '@/app/components/processes/createprocessmodal/CreateProcessModal';
import {PermissionGuard} from '@/app/components/auth/PermissionGuard';
import {usePermissions} from '@/context/PermissionsContext';

// Nombre del cliente embebido en el proceso — no requiere el permiso
// clients:view, a diferencia de listPickerOptions (usado solo para crear).
const processClientName = (client: LegalProcess['client']) =>
    !client ? '—' : client.type === ClientType.COMPANY
        ? (client.companyName ?? '—')
        : [client.firstName, client.lastName].filter(Boolean).join(' ') || '—';

const EMPTY_FORM: CreateProcessForm = {
    clientId:              '',
    title:                 '',
    description:           '',
    reference:             '',
    branchId:              '',
    court:                 '',
    counterpart:           '',
    startDate:             '',
    processValue:          '',
    billingType:           '',
    categoryId:            '',
    responsiblePartnerId:  '',
    originatorId:          '',
    billingResponsibleId:  '',
    assignedTo:            '',
    isProBono:             false,
    hasPartialPayment:     false,
};

const ProcessesPage = () =>
{
    const router = useRouter();
    const {can}  = usePermissions();

    const [search,          setSearch]          = useState('');
    const [selectedStatus,  setSelectedStatus]  = useState('all');
    const [selectedClient,  setSelectedClient]  = useState('all');
    const [selectedBranch,  setSelectedBranch]  = useState('all');
    const [view,            setView]            = useState<'grid' | 'list'>('list');
    const [showModal,       setShowModal]       = useState(false);
    const [saving,          setSaving]          = useState(false);
    const [form,            setForm]            = useState<CreateProcessForm>({...EMPTY_FORM});
    const [attachments,     setAttachments]     = useState<PendingAttachment[]>([]);

    const {execute: uploadDoc} =
        useFetch('', {method: 'POST', immediate: false, firmScoped: true, isFormData: true});

    const {data: processRes, isLoading, execute: refetch} =
        useFetch<PaginatedResponse<LegalProcess>>('process?limit=100', {firmScoped: true});

    const {data: clientOptions} =
        useFetch<ClientPickerOption[]>('process/client-options', {firmScoped: true});

    const {data: branches} =
        useFetch<LegalBranch[]>('branch?isActive=true&limit=50', {firmScoped: true});

    const {execute: createProcess} =
        useFetch<LegalProcess>('process', {method: 'POST', immediate: false, firmScoped: true});

    const {execute: deleteProcess} =
        useFetch<void>('', {method: 'DELETE', immediate: false, firmScoped: true});

    const {confirm, confirmState, handleConfirm, handleCancel} = useConfirm();

    const processes  = processRes?.data ?? [];
    const clients    = clientOptions    ?? [];
    const branchList = branches         ?? [];

    // Opciones del filtro de cliente derivadas de los procesos ya cargados
    // (no de /process/client-options) para que un abogado sin clients:view
    // también pueda filtrar por cliente — solo ve los clientes de SUS procesos.
    const processClients: ClientPickerOption[] = Array.from(
        new Map(
            processes
                .filter(p => p.client)
                .map(p => [p.client!.id, {id: p.client!.id, name: processClientName(p.client)}]),
        ).values(),
    );

    const filtered = processes.filter(p =>
    {
        const term = search.trim().toLowerCase();
        const matchesSearch  = !term
            || p.title.toLowerCase().includes(term)
            || (p.reference ?? '').toLowerCase().includes(term)
            || processClientName(p.client).toLowerCase().includes(term);
        const matchesStatus  = selectedStatus === 'all' || p.status === selectedStatus;
        const matchesClient  = selectedClient === 'all' || p.clientId === selectedClient;
        const matchesBranch  = selectedBranch === 'all' || p.branchId === selectedBranch;
        return matchesSearch && matchesStatus && matchesClient && matchesBranch;
    });

    const stats = {
        total:    processes.length,
        active:   processes.filter(p => p.status === ProcessStatus.ACTIVE).length,
        review:   processes.filter(p => p.status === ProcessStatus.IN_REVIEW).length,
        closed:   processes.filter(p => p.status === ProcessStatus.CLOSED).length,
    };

    const handleChange = (field: keyof CreateProcessForm, value: string | boolean) =>
        setForm(prev => ({...prev, [field]: value}));

    const handleOpenModal = () => { setForm({...EMPTY_FORM}); setAttachments([]); setShowModal(true); };
    const handleCloseModal = () => setShowModal(false);

    const handleCreate = async () =>
    {
        setSaving(true);
        const body = {
            clientId:              form.clientId,
            title:                 form.title,
            description:           form.description  || undefined,
            reference:             form.reference    || undefined,
            branchId:              form.branchId     || undefined,
            court:                 form.court        || undefined,
            counterpart:           form.counterpart  || undefined,
            startDate:             form.startDate    || undefined,
            processValue:          form.processValue ? Number(form.processValue) : undefined,
            billingType:           form.billingType  || undefined,
            categoryId:            form.categoryId   || undefined,
            responsiblePartnerId:  form.responsiblePartnerId || undefined,
            originatorId:          form.originatorId         || undefined,
            billingResponsibleId:  form.billingResponsibleId || undefined,
            assignedTo:            form.assignedTo           || undefined,
            isProBono:             form.isProBono,
            hasPartialPayment:     form.hasPartialPayment,
        };
        const result = await createProcess({body});
        if (!result) { setSaving(false); return; }

        if (attachments.length > 0)
        {
            const uploads = await Promise.all(
                attachments.map(attachment => uploadAttachment(uploadDoc, `process/${result.id}/documents`, attachment.file, attachment.type)),
            );
            if (uploads.some(ok => !ok)) toast.error('El proceso se creó, pero algunos documentos no se pudieron adjuntar.');
        }

        setSaving(false);
        toast.success('Proceso creado correctamente.');
        handleCloseModal();
        refetch();
    };

    const handleDelete = async (p: LegalProcess) =>
    {
        if (!await confirm({title: 'Eliminar proceso', message: `¿Eliminar el proceso "${p.title}"?`, confirmLabel: 'Eliminar'})) return;
        await deleteProcess({}, `process/${p.id}`);
        toast.success('Proceso eliminado.');
        refetch();
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <div>
                        <h1>Procesos</h1>
                        <p>Gestiona los procesos legales activos en tu despacho.</p>
                    </div>
                    {can('processes:create') && (
                        <button className={styles.addButton} onClick={handleOpenModal}>
                            <Plus /> Nuevo Proceso
                        </button>
                    )}
                </div>

                <div className={styles.statsContainer}>
                    {[
                        {label: 'Total',       value: stats.total,  color: '#3b82f6', icon: <Briefcase />},
                        {label: 'Activos',     value: stats.active, color: '#10b981', icon: <Check />},
                        {label: 'En Revisión', value: stats.review, color: '#f59e0b', icon: <Clock />},
                        {label: 'Cerrados',    value: stats.closed, color: '#6b7280', icon: <Briefcase />},
                    ].map(stat => (
                        <div key={stat.label} className={styles.statCard}>
                            <div className={styles.statIcon} style={{backgroundColor: `${stat.color}15`, color: stat.color}}>
                                {stat.icon}
                            </div>
                            <div className={styles.statInfo}>
                                <h3 className={styles.statValue}>{stat.value}</h3>
                                <p className={styles.statTitle}>{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <ProcessFilters
                search={search}               onSearch={setSearch}
                selectedStatus={selectedStatus} onStatus={setSelectedStatus}
                selectedClient={selectedClient} onClient={setSelectedClient}
                selectedBranch={selectedBranch} onBranch={setSelectedBranch}
                clients={processClients}
                branches={branchList}
                view={view}                   onViewChange={setView}
            />

            {isLoading ? (
                <p className={styles.loading}>Cargando procesos...</p>
            ) : filtered.length === 0 ? (
                <div className={styles.empty}>
                    <p>{search || selectedStatus !== 'all' || selectedClient !== 'all' || selectedBranch !== 'all'
                        ? 'No se encontraron procesos con esos filtros.'
                        : 'No hay procesos registrados aún.'}</p>
                </div>
            ) : view === 'grid' ? (
                <ProcessGrid processes={filtered} onSelect={p => router.push(`/dashboard/processes/${p.id}`)} onDelete={handleDelete} />
            ) : (
                <ProcessList processes={filtered} onDelete={handleDelete} />
            )}

            <CreateProcessModal
                open={showModal}
                saving={saving}
                form={form}
                clients={clients}
                branches={branchList}
                attachments={attachments}
                onChange={handleChange}
                onAttachmentsChange={setAttachments}
                onClose={handleCloseModal}
                onSave={handleCreate}
            />

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
        </div>
    );
};

const ProcessesPageGuarded = () => (
    <PermissionGuard permission="processes:view">
        <ProcessesPage/>
    </PermissionGuard>
);

export default ProcessesPageGuarded;
