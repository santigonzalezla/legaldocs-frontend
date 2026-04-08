'use client';

import styles from './page.module.css';
import {useState} from 'react';
import {Building, Plus, User, Users} from '@/app/components/svg';
import {useFetch} from '@/hooks/useFetch';
import {toast} from 'sonner';
import {ClientType} from '@/app/interfaces/enums';
import type {Client, PaginatedResponse} from '@/app/interfaces/interfaces';
import {useConfirm} from '@/hooks/useConfirm';
import ConfirmModal from '@/app/components/ui/confirmmodal/ConfirmModal';
import DocumentStatCard    from '@/app/components/documents/generated/documentstatscard/DocumentStatsCard';
import ClientFilters       from '@/app/components/clients/clientfilters/ClientFilters';
import ClientGrid          from '@/app/components/clients/clientgrid/ClientGrid';
import ClientList          from '@/app/components/clients/clientlist/ClientList';
import CreateClientModal   from '@/app/components/clients/createclientmodal/CreateClientModal';
import ClientDetailModal   from '@/app/components/clients/clientdetailmodal/ClientDetailModal';

const EMPTY_FORM = {
    type:           ClientType.INDIVIDUAL,
    firstName:      '',
    lastName:       '',
    companyName:    '',
    documentType:   '',
    documentNumber: '',
    email:          '',
    phone:          '',
    city:           '',
};

const ClientsPage = () =>
{
    const [search,           setSearch]           = useState('');
    const [selectedType,     setSelectedType]     = useState('all');
    const [view,             setView]             = useState<'grid' | 'list'>('grid');
    const [showCreateModal,  setShowCreateModal]  = useState(false);
    const [saving,           setSaving]           = useState(false);
    const [form,             setForm]             = useState({...EMPTY_FORM});
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

    const {confirm, confirmState, handleConfirm, handleCancel} = useConfirm();

    const {data: response, isLoading, execute: refetch} =
        useFetch<PaginatedResponse<Client>>('client?limit=100', {firmScoped: true});

    const {execute: createClient} =
        useFetch<Client>('client', {method: 'POST', immediate: false, firmScoped: true});

    const {execute: deleteClient} =
        useFetch<void>('', {method: 'DELETE', immediate: false, firmScoped: true});

    const clients = response?.data ?? [];

    const filtered = clients.filter(c =>
    {
        const term = search.trim().toLowerCase();
        const name = c.type === ClientType.COMPANY
            ? (c.companyName ?? '')
            : `${c.firstName ?? ''} ${c.lastName ?? ''}`;

        const matchesSearch = !term ||
            name.toLowerCase().includes(term) ||
            (c.documentNumber ?? '').toLowerCase().includes(term) ||
            (c.email ?? '').toLowerCase().includes(term);

        const matchesType = selectedType === 'all' || c.type === selectedType;

        return matchesSearch && matchesType;
    });

    const stats = {
        total:      clients.length,
        individual: clients.filter(c => c.type === ClientType.INDIVIDUAL).length,
        company:    clients.filter(c => c.type === ClientType.COMPANY).length,
    };

    const handleChange = (field: keyof typeof EMPTY_FORM, value: string) =>
        setForm(prev => ({...prev, [field]: value}));

    const handleOpenModal  = () => { setForm({...EMPTY_FORM}); setShowCreateModal(true); };
    const handleCloseModal = () => setShowCreateModal(false);

    const handleCreate = async () =>
    {
        setSaving(true);
        const body = form.type === ClientType.COMPANY
            ? {type: form.type, companyName: form.companyName || undefined, documentType: form.documentType || undefined, documentNumber: form.documentNumber || undefined, email: form.email || undefined, phone: form.phone || undefined, city: form.city || undefined}
            : {type: form.type, firstName: form.firstName || undefined, lastName: form.lastName || undefined, documentType: form.documentType || undefined, documentNumber: form.documentNumber || undefined, email: form.email || undefined, phone: form.phone || undefined, city: form.city || undefined};

        const result = await createClient({body});
        setSaving(false);
        if (!result) return;
        toast.success('Cliente registrado correctamente.');
        setShowCreateModal(false);
        refetch();
    };

    const handleDelete = async (client: Client) =>
    {
        const name = client.type === ClientType.COMPANY
            ? client.companyName
            : `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim();
        if (!await confirm({title: 'Eliminar cliente', message: `¿Eliminar cliente "${name}"? Esta acción no se puede deshacer.`, confirmLabel: 'Eliminar'})) return;
        await deleteClient({}, `client/${client.id}`);
        toast.success('Cliente eliminado.');
        refetch();
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <div>
                        <h1>Clientes</h1>
                        <p>Gestiona los clientes vinculados a tu despacho.</p>
                    </div>
                    <button className={styles.addButton} onClick={handleOpenModal}>
                        <Plus /> Nuevo Cliente
                    </button>
                </div>

                <div className={styles.statsContainer}>
                    {[
                        {title: 'Total clientes',     value: stats.total,      icon: <Users />,    color: '#3b82f6', bgColor: '#eff6ff', percentage: null},
                        {title: 'Personas naturales', value: stats.individual, icon: <User />,     color: '#10b981', bgColor: '#ecfdf5', percentage: stats.total ? Math.round(stats.individual / stats.total * 100) : 0},
                        {title: 'Empresas',           value: stats.company,    icon: <Building />, color: '#f59e0b', bgColor: '#fffbeb', percentage: stats.total ? Math.round(stats.company    / stats.total * 100) : 0},
                    ].map((s, i) => (
                        <DocumentStatCard documentStat={s} key={i} />
                    ))}
                </div>
            </div>

            <ClientFilters
                search={search}             onSearch={setSearch}
                selectedType={selectedType} onTypeChange={setSelectedType}
                view={view}                 onViewChange={setView}
            />

            {isLoading ? (
                <p className={styles.loading}>Cargando clientes...</p>
            ) : filtered.length === 0 ? (
                <div className={styles.empty}>
                    <p>{search || selectedType !== 'all' ? 'No se encontraron clientes con esos filtros.' : 'No hay clientes registrados aún.'}</p>
                </div>
            ) : view === 'grid' ? (
                <ClientGrid clients={filtered} onSelect={c => setSelectedClientId(c.id)} onDelete={handleDelete} />
            ) : (
                <ClientList clients={filtered} onSelect={c => setSelectedClientId(c.id)} onDelete={handleDelete} />
            )}

            <CreateClientModal
                open={showCreateModal}
                saving={saving}
                form={form}
                onChange={handleChange}
                onClose={handleCloseModal}
                onSave={handleCreate}
            />

            {selectedClientId && (
                <ClientDetailModal
                    clientId={selectedClientId}
                    onClose={() => setSelectedClientId(null)}
                    onSaved={refetch}
                    onDeleted={refetch}
                />
            )}

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

export default ClientsPage;
