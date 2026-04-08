'use client';

import styles from './page.module.css';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {Briefcase, Check, Clock, Plus} from '@/app/components/svg';
import {useFetch} from '@/hooks/useFetch';
import {toast} from 'sonner';
import {ProcessStatus} from '@/app/interfaces/enums';
import type {Client, LegalBranch, LegalProcess, PaginatedResponse} from '@/app/interfaces/interfaces';
import {useConfirm} from '@/hooks/useConfirm';
import ConfirmModal from '@/app/components/ui/confirmmodal/ConfirmModal';
import DocumentStatCard   from '@/app/components/documents/generated/documentstatscard/DocumentStatsCard';
import ProcessFilters     from '@/app/components/processes/processfilters/ProcessFilters';
import ProcessGrid        from '@/app/components/processes/processgrid/ProcessGrid';
import ProcessList        from '@/app/components/processes/processlist/ProcessList';
import CreateProcessModal from '@/app/components/processes/createprocessmodal/CreateProcessModal';
import type {CreateProcessForm} from '@/app/components/processes/createprocessmodal/CreateProcessModal';

const EMPTY_FORM: CreateProcessForm = {
    clientId:    '',
    title:       '',
    description: '',
    reference:   '',
    branchId:    '',
    court:       '',
    counterpart: '',
    startDate:   '',
};

const ProcessesPage = () =>
{
    const router = useRouter();

    const [search,          setSearch]          = useState('');
    const [selectedStatus,  setSelectedStatus]  = useState('all');
    const [selectedClient,  setSelectedClient]  = useState('all');
    const [selectedBranch,  setSelectedBranch]  = useState('all');
    const [view,            setView]            = useState<'grid' | 'list'>('grid');
    const [showModal,       setShowModal]       = useState(false);
    const [saving,          setSaving]          = useState(false);
    const [form,            setForm]            = useState<CreateProcessForm>({...EMPTY_FORM});

    const {data: processRes, isLoading, execute: refetch} =
        useFetch<PaginatedResponse<LegalProcess>>('process?limit=100', {firmScoped: true});

    const {data: clientRes} =
        useFetch<PaginatedResponse<Client>>('client?limit=100', {firmScoped: true});

    const {data: branches} =
        useFetch<LegalBranch[]>('branch?isActive=true&limit=50', {firmScoped: true});

    const {execute: createProcess} =
        useFetch<LegalProcess>('process', {method: 'POST', immediate: false, firmScoped: true});

    const {execute: deleteProcess} =
        useFetch<void>('', {method: 'DELETE', immediate: false, firmScoped: true});

    const {confirm, confirmState, handleConfirm, handleCancel} = useConfirm();

    const processes  = processRes?.data ?? [];
    const clients    = clientRes?.data  ?? [];
    const branchList = branches         ?? [];

    const filtered = processes.filter(p =>
    {
        const term = search.trim().toLowerCase();
        const matchesSearch  = !term || p.title.toLowerCase().includes(term) || (p.reference ?? '').toLowerCase().includes(term);
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

    const handleChange = (field: keyof CreateProcessForm, value: string) =>
        setForm(prev => ({...prev, [field]: value}));

    const handleOpenModal = () => { setForm({...EMPTY_FORM}); setShowModal(true); };
    const handleCloseModal = () => setShowModal(false);

    const handleCreate = async () =>
    {
        setSaving(true);
        const body = {
            clientId:    form.clientId,
            title:       form.title,
            description: form.description || undefined,
            reference:   form.reference   || undefined,
            branchId:    form.branchId    || undefined,
            court:       form.court       || undefined,
            counterpart: form.counterpart || undefined,
            startDate:   form.startDate   || undefined,
        };
        const result = await createProcess({body});
        setSaving(false);
        if (!result) return;
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
                    <button className={styles.addButton} onClick={handleOpenModal}>
                        <Plus /> Nuevo Proceso
                    </button>
                </div>

                <div className={styles.statsContainer}>
                    {[
                        {title: 'Total',       value: stats.total,  icon: <Briefcase />, color: '#3b82f6', bgColor: '#eff6ff', percentage: null},
                        {title: 'Activos',     value: stats.active, icon: <Check />,     color: '#10b981', bgColor: '#ecfdf5', percentage: stats.total ? Math.round(stats.active / stats.total * 100) : 0},
                        {title: 'En Revisión', value: stats.review, icon: <Clock />,     color: '#f59e0b', bgColor: '#fffbeb', percentage: stats.total ? Math.round(stats.review / stats.total * 100) : 0},
                        {title: 'Cerrados',    value: stats.closed, icon: <Briefcase />, color: '#6b7280', bgColor: '#f9fafb', percentage: stats.total ? Math.round(stats.closed / stats.total * 100) : 0},
                    ].map((s, i) => (
                        <DocumentStatCard documentStat={s} key={i} />
                    ))}
                </div>
            </div>

            <ProcessFilters
                search={search}               onSearch={setSearch}
                selectedStatus={selectedStatus} onStatus={setSelectedStatus}
                selectedClient={selectedClient} onClient={setSelectedClient}
                selectedBranch={selectedBranch} onBranch={setSelectedBranch}
                clients={clients}
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
                onChange={handleChange}
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

export default ProcessesPage;
