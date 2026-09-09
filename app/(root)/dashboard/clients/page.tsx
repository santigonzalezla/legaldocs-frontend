'use client';

import styles from './page.module.css';
import {useSearchParams} from 'next/navigation';
import {Suspense, useState} from 'react';
import {Plus} from '@/app/components/svg';
import {useFetch} from '@/hooks/useFetch';
import {toast} from 'sonner';
import {ClientType} from '@/app/interfaces/enums';
import type {Client, PaginatedResponse} from '@/app/interfaces/interfaces';
import {useConfirm} from '@/hooks/useConfirm';
import {useAuth} from '@/context/AuthContext';
import {useFirmId} from '@/hooks/useFirmId';
import {uploadAttachment, type PendingAttachment} from '@/lib/attachments';
import ConfirmModal from '@/app/components/ui/confirmmodal/ConfirmModal';
import ClientFilters       from '@/app/components/clients/clientfilters/ClientFilters';
import ClientGrid          from '@/app/components/clients/clientgrid/ClientGrid';
import ClientList          from '@/app/components/clients/clientlist/ClientList';
import CreateClientModal, {CreateClientForm} from '@/app/components/clients/createclientmodal/CreateClientModal';
import ClientDetailModal   from '@/app/components/clients/clientdetailmodal/ClientDetailModal';
import {PermissionGuard}  from '@/app/components/auth/PermissionGuard';

// Solo `type` arranca con valor — el resto queda undefined hasta que el
// usuario lo llena (evita listar cada campo con su '' por defecto).
const EMPTY_FORM: CreateClientForm = {type: ClientType.INDIVIDUAL};

const ClientsPage = () =>
{
    const [search,           setSearch]           = useState('');
    const [selectedType,     setSelectedType]     = useState('all');
    const [view,             setView]             = useState<'grid' | 'list'>('list');
    const [showCreateModal,  setShowCreateModal]  = useState(false);
    const [saving,           setSaving]           = useState(false);
    const [form,             setForm]             = useState({...EMPTY_FORM});
    const [attachments,      setAttachments]      = useState<PendingAttachment[]>([]);
    const searchParams = useSearchParams();
    const [selectedClientId, setSelectedClientId] = useState<string | null>(searchParams.get('clientId'));

    const {confirm, confirmState, handleConfirm, handleCancel} = useConfirm();
    const {accessToken} = useAuth();
    const firmId         = useFirmId();

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

    const handleChange = (field: keyof CreateClientForm, value: string | boolean) =>
        setForm(prev => ({...prev, [field]: value}));

    const handleOpenModal  = () => { setForm({...EMPTY_FORM}); setAttachments([]); setShowCreateModal(true); };
    const handleCloseModal = () => setShowCreateModal(false);

    const handleCreate = async () =>
    {
        setSaving(true);

        const shared = {
            documentType:          form.documentType || undefined,
            documentNumber:        form.documentNumber || undefined,
            email:                 form.email || undefined,
            phone:                 form.phone || undefined,
            city:                  form.city || undefined,
            address:               form.address || undefined,
            regimeType:            form.regimeType || undefined,
            sector:                form.sector || undefined,
            isBusinessGroup:       form.isBusinessGroup ?? false,
            responsiblePartnerId:  form.responsiblePartnerId || undefined,
        };

        const body = form.type === ClientType.COMPANY
            ? {type: form.type, companyName: form.companyName || undefined, ...shared}
            : {type: form.type, firstName: form.firstName || undefined, lastName: form.lastName || undefined, ...shared};

        const result = await createClient({body});
        if (!result) { setSaving(false); return; }

        if (attachments.length > 0)
        {
            const uploads = await Promise.all(
                attachments.map(attachment => uploadAttachment(`client/${result.id}/documents`, attachment.file, attachment.type, accessToken, firmId)),
            );
            if (uploads.some(ok => !ok)) toast.error('El cliente se creó, pero algunos documentos no se pudieron adjuntar.');
        }

        setSaving(false);
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
                attachments={attachments}
                onChange={handleChange}
                onAttachmentsChange={setAttachments}
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

const ClientsPageGuarded = () => (
    <PermissionGuard permission="clients:view">
        <Suspense fallback={null}>
            <ClientsPage/>
        </Suspense>
    </PermissionGuard>
);

export default ClientsPageGuarded;
