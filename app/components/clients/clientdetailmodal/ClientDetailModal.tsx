'use client';

import styles     from './clientdetailmodal.module.css';
import formStyles from '@/app/components/clients/createclientmodal/createclientmodal.module.css';
import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {useFetch} from '@/hooks/useFetch';
import {toast} from 'sonner';
import {ArrowLeft, Briefcase, Building, Calendar, Edit, Mail, MapPin, Phone, Save, Trash, User, X} from '@/app/components/svg';
import {ClientType, ProcessStatus} from '@/app/interfaces/enums';
import type {Client, LegalProcess, PaginatedResponse} from '@/app/interfaces/interfaces';
import {STATUS_COLOR, STATUS_LABEL} from '@/app/components/processes/processgrid/ProcessGrid';
import {useConfirm} from '@/hooks/useConfirm';
import ConfirmModal from '@/app/components/ui/confirmmodal/ConfirmModal';

const DOC_TYPES = ['CC', 'NIT', 'CE', 'PP', 'TI', 'RUT'];

const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', {day: '2-digit', month: 'long', year: 'numeric'});

const clientName = (c: Client) =>
    c.type === ClientType.COMPANY
        ? (c.companyName ?? '—')
        : [c.firstName, c.lastName].filter(Boolean).join(' ') || '—';

interface ClientDetailModalProps
{
    clientId: string;
    onClose:  () => void;
    onSaved:  () => void;
    onDeleted: () => void;
}

const ClientDetailModal = ({clientId, onClose, onSaved, onDeleted}: ClientDetailModalProps) =>
{
    const router = useRouter();
    const [mode, setMode] = useState<'view' | 'edit'>('view');

    const {data: client, isLoading, execute: refetchClient} =
        useFetch<Client>(`client/${clientId}`, {firmScoped: true});

    const {data: processRes} =
        useFetch<PaginatedResponse<LegalProcess>>(`process?clientId=${clientId}&limit=100`, {firmScoped: true});

    const {execute: updateClient, isLoading: saving} =
        useFetch<Client>('', {method: 'PATCH', immediate: false, firmScoped: true});

    const {execute: deleteClient} =
        useFetch<void>('', {method: 'DELETE', immediate: false, firmScoped: true});

    const {confirm, confirmState, handleConfirm, handleCancel} = useConfirm();

    const [form, setForm] = useState({
        type:           ClientType.INDIVIDUAL as ClientType,
        firstName:      '',
        lastName:       '',
        companyName:    '',
        documentType:   '',
        documentNumber: '',
        email:          '',
        phone:          '',
        city:           '',
        address:        '',
    });

    useEffect(() =>
    {
        if (!client) return;
        setForm({
            type:           client.type,
            firstName:      client.firstName      ?? '',
            lastName:       client.lastName       ?? '',
            companyName:    client.companyName    ?? '',
            documentType:   client.documentType   ?? '',
            documentNumber: client.documentNumber ?? '',
            email:          client.email          ?? '',
            phone:          client.phone          ?? '',
            city:           client.city           ?? '',
            address:        client.address        ?? '',
        });
    }, [client]);

    const set = (field: keyof typeof form, value: string) =>
        setForm(prev => ({...prev, [field]: value}));

    const handleSave = async () =>
    {
        const isCompany = form.type === ClientType.COMPANY;
        const body = isCompany
            ? {type: form.type, companyName: form.companyName || undefined, documentType: form.documentType || undefined, documentNumber: form.documentNumber || undefined, email: form.email || undefined, phone: form.phone || undefined, city: form.city || undefined, address: form.address || undefined}
            : {type: form.type, firstName: form.firstName || undefined, lastName: form.lastName || undefined, documentType: form.documentType || undefined, documentNumber: form.documentNumber || undefined, email: form.email || undefined, phone: form.phone || undefined, city: form.city || undefined, address: form.address || undefined};

        const result = await updateClient({body}, `client/${clientId}`);
        if (!result) return;
        toast.success('Cliente actualizado correctamente.');
        refetchClient();
        setMode('view');
        onSaved();
    };

    const handleDelete = async () =>
    {
        if (!client) return;
        if (!await confirm({title: 'Eliminar cliente', message: `¿Eliminar el cliente "${clientName(client)}"? Esta acción no se puede deshacer.`, confirmLabel: 'Eliminar'})) return;
        await deleteClient({}, `client/${clientId}`);
        toast.success('Cliente eliminado.');
        onDeleted();
        onClose();
    };

    const processes = processRes?.data ?? [];

    const processStats = {
        total:  processes.length,
        active: processes.filter(p => p.status === ProcessStatus.ACTIVE).length,
        closed: processes.filter(p => p.status === ProcessStatus.CLOSED).length,
    };

    const isCompany = form.type === ClientType.COMPANY;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className={styles.modalHeader}>
                    {mode === 'edit' && (
                        <button className={styles.backBtn} onClick={() => setMode('view')}>
                            <ArrowLeft />
                        </button>
                    )}
                    <span className={styles.modalTitle}>
                        {mode === 'edit' ? 'Editar Cliente' : 'Detalle del Cliente'}
                    </span>
                    <div className={styles.headerActions}>
                        {mode === 'view' && !isLoading && client && (
                            <>
                                <button className={styles.editBtn} onClick={() => setMode('edit')}>
                                    <Edit /> Editar
                                </button>
                                <button className={styles.deleteBtn} onClick={handleDelete}>
                                    <Trash />
                                </button>
                            </>
                        )}
                        <button className={styles.closeBtn} onClick={onClose}><X /></button>
                    </div>
                </div>

                {/* Body */}
                {isLoading ? (
                    <div className={styles.loading}>Cargando cliente...</div>
                ) : !client ? (
                    <div className={styles.loading}>Cliente no encontrado.</div>
                ) : mode === 'view' ? (

                    <div className={styles.viewBody}>
                        {/* Profile */}
                        <div className={styles.profileCard}>
                            <div className={styles.profileLeft}>
                                <div className={styles.avatar}>
                                    {client.type === ClientType.COMPANY ? <Building /> : <User />}
                                </div>
                                <div>
                                    <h2 className={styles.name}>{clientName(client)}</h2>
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

                        {/* Stats */}
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

                        {/* Processes */}
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h3>Procesos</h3>
                                <button
                                    className={styles.viewAllBtn}
                                    onClick={() => { onClose(); router.push(`/dashboard/processes?clientId=${clientId}`); }}
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
                                            onClick={() => { onClose(); router.push(`/dashboard/processes/${p.id}`); }}
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

                ) : (

                    /* Edit form */
                    <div className={styles.editBody}>
                        <div className={formStyles.formBody}>
                            <div className={formStyles.formGroup}>
                                <label>Tipo de cliente</label>
                                <div className={formStyles.typeToggle}>
                                    <button
                                        type="button"
                                        className={`${formStyles.typeBtn} ${!isCompany ? formStyles.typeBtnActive : ''}`}
                                        onClick={() => set('type', ClientType.INDIVIDUAL)}
                                    >
                                        Persona Natural
                                    </button>
                                    <button
                                        type="button"
                                        className={`${formStyles.typeBtn} ${isCompany ? formStyles.typeBtnActive : ''}`}
                                        onClick={() => set('type', ClientType.COMPANY)}
                                    >
                                        Empresa
                                    </button>
                                </div>
                            </div>

                            {isCompany ? (
                                <div className={formStyles.formGroup}>
                                    <label>Razón social *</label>
                                    <input
                                        className={formStyles.input}
                                        placeholder="Ej: Inversiones XYZ S.A.S."
                                        value={form.companyName}
                                        onChange={e => set('companyName', e.target.value)}
                                    />
                                </div>
                            ) : (
                                <div className={formStyles.row}>
                                    <div className={formStyles.formGroup}>
                                        <label>Nombre *</label>
                                        <input
                                            className={formStyles.input}
                                            placeholder="Juan"
                                            value={form.firstName}
                                            onChange={e => set('firstName', e.target.value)}
                                        />
                                    </div>
                                    <div className={formStyles.formGroup}>
                                        <label>Apellido *</label>
                                        <input
                                            className={formStyles.input}
                                            placeholder="Pérez"
                                            value={form.lastName}
                                            onChange={e => set('lastName', e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className={formStyles.row}>
                                <div className={formStyles.formGroup}>
                                    <label>Tipo de documento</label>
                                    <select
                                        className={formStyles.select}
                                        value={form.documentType}
                                        onChange={e => set('documentType', e.target.value)}
                                    >
                                        <option value="">Seleccionar</option>
                                        {DOC_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className={formStyles.formGroup}>
                                    <label>Número de documento</label>
                                    <input
                                        className={formStyles.input}
                                        placeholder="1234567890"
                                        value={form.documentNumber}
                                        onChange={e => set('documentNumber', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className={formStyles.row}>
                                <div className={formStyles.formGroup}>
                                    <label>Email</label>
                                    <input
                                        className={formStyles.input}
                                        type="email"
                                        placeholder="cliente@email.com"
                                        value={form.email}
                                        onChange={e => set('email', e.target.value)}
                                    />
                                </div>
                                <div className={formStyles.formGroup}>
                                    <label>Teléfono</label>
                                    <input
                                        className={formStyles.input}
                                        placeholder="+57 300 123 4567"
                                        value={form.phone}
                                        onChange={e => set('phone', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className={formStyles.row}>
                                <div className={formStyles.formGroup}>
                                    <label>Ciudad</label>
                                    <input
                                        className={formStyles.input}
                                        placeholder="Bogotá"
                                        value={form.city}
                                        onChange={e => set('city', e.target.value)}
                                    />
                                </div>
                                <div className={formStyles.formGroup}>
                                    <label>Dirección</label>
                                    <input
                                        className={formStyles.input}
                                        placeholder="Calle 123 # 45-67"
                                        value={form.address}
                                        onChange={e => set('address', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={formStyles.modalActions}>
                            <button className={formStyles.cancelButton} onClick={() => setMode('view')}>
                                Cancelar
                            </button>
                            <button
                                className={formStyles.saveButton}
                                onClick={handleSave}
                                disabled={saving || (isCompany ? !form.companyName.trim() : !form.firstName.trim())}
                            >
                                {saving ? 'Guardando...' : <><Save /> Guardar cambios</>}
                            </button>
                        </div>
                    </div>
                )}
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
        </div>
    );
};

export default ClientDetailModal;
