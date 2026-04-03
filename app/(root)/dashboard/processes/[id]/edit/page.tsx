'use client';

import styles     from './page.module.css';
import formStyles from '@/app/components/processes/createprocessmodal/createprocessmodal.module.css';
import {useParams, useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';
import {useFetch} from '@/hooks/useFetch';
import {toast} from 'sonner';
import {ArrowLeft, Save} from '@/app/components/svg';
import type {Client, LegalBranch, LegalProcess, PaginatedResponse} from '@/app/interfaces/interfaces';
import {ClientType, ProcessStatus} from '@/app/interfaces/enums';

const clientName = (c: Client) =>
    c.type === ClientType.COMPANY
        ? (c.companyName ?? '—')
        : [c.firstName, c.lastName].filter(Boolean).join(' ') || '—';

const STATUS_OPTIONS = [
    {value: ProcessStatus.ACTIVE,    label: 'Activo'},
    {value: ProcessStatus.IN_REVIEW, label: 'En Revisión'},
    {value: ProcessStatus.CLOSED,    label: 'Cerrado'},
    {value: ProcessStatus.ARCHIVED,  label: 'Archivado'},
];

const ProcessEditPage = () =>
{
    const {id}   = useParams<{id: string}>();
    const router = useRouter();

    const {data: process, isLoading} =
        useFetch<LegalProcess>(`process/${id}`, {firmScoped: true});

    const {data: clientRes} =
        useFetch<PaginatedResponse<Client>>('client?limit=100', {firmScoped: true});

    const {data: branches} =
        useFetch<LegalBranch[]>('branch?isActive=true&limit=50', {firmScoped: true});

    const {execute: updateProcess, isLoading: saving} =
        useFetch<LegalProcess>('', {method: 'PATCH', immediate: false, firmScoped: true});

    const [form, setForm] = useState({
        clientId:    '',
        title:       '',
        description: '',
        reference:   '',
        branchId:    '',
        status:      ProcessStatus.ACTIVE as ProcessStatus,
        court:       '',
        counterpart: '',
        startDate:   '',
        endDate:     '',
    });

    useEffect(() =>
    {
        if (!process) return;
        setForm({
            clientId:    process.clientId        ?? '',
            title:       process.title           ?? '',
            description: process.description     ?? '',
            reference:   process.reference       ?? '',
            branchId:    process.branchId        ?? '',
            status:      process.status,
            court:       process.court           ?? '',
            counterpart: process.counterpart     ?? '',
            startDate:   process.startDate       ? process.startDate.slice(0, 10) : '',
            endDate:     process.endDate         ? process.endDate.slice(0, 10)   : '',
        });
    }, [process]);

    const set = (field: keyof typeof form, value: string) =>
        setForm(prev => ({...prev, [field]: value}));

    const handleSave = async () =>
    {
        const body = {
            clientId:    form.clientId    || undefined,
            title:       form.title       || undefined,
            description: form.description || undefined,
            reference:   form.reference   || undefined,
            branchId:    form.branchId    || undefined,
            status:      form.status,
            court:       form.court       || undefined,
            counterpart: form.counterpart || undefined,
            startDate:   form.startDate   || undefined,
            endDate:     form.endDate     || undefined,
        };

        const result = await updateProcess({body}, `process/${id}`);
        if (!result) return;
        toast.success('Proceso actualizado correctamente.');
        router.push(`/dashboard/processes/${id}`);
    };

    if (isLoading)
        return <div className={styles.loading}>Cargando proceso...</div>;

    if (!process)
        return <div className={styles.loading}>Proceso no encontrado.</div>;

    const clients    = clientRes?.data ?? [];
    const branchList = branches        ?? [];

    return (
        <div className={styles.page}>
            <button className={styles.backBtn} onClick={() => router.back()}>
                <ArrowLeft />
            </button>

            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h1 className={styles.cardTitle}>Editar Proceso</h1>
                </div>

                <div className={formStyles.formBody}>
                    <div className={formStyles.row}>
                        <div className={formStyles.formGroup}>
                            <label>Cliente *</label>
                            <select
                                className={formStyles.select}
                                value={form.clientId}
                                onChange={e => set('clientId', e.target.value)}
                            >
                                <option value="">Seleccionar cliente</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{clientName(c)}</option>
                                ))}
                            </select>
                        </div>
                        <div className={formStyles.formGroup}>
                            <label>Estado</label>
                            <select
                                className={formStyles.select}
                                value={form.status}
                                onChange={e => set('status', e.target.value)}
                            >
                                {STATUS_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={formStyles.formGroup}>
                        <label>Título del proceso *</label>
                        <input
                            className={formStyles.input}
                            placeholder="Ej: Proceso arrendamiento Apto 301"
                            value={form.title}
                            onChange={e => set('title', e.target.value)}
                        />
                    </div>

                    <div className={formStyles.formGroup}>
                        <label>Descripción</label>
                        <textarea
                            className={formStyles.textarea}
                            placeholder="Describe brevemente el proceso..."
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className={formStyles.row}>
                        <div className={formStyles.formGroup}>
                            <label>Radicado / Referencia</label>
                            <input
                                className={formStyles.input}
                                placeholder="11001310300120230012300"
                                value={form.reference}
                                onChange={e => set('reference', e.target.value)}
                            />
                        </div>
                        <div className={formStyles.formGroup}>
                            <label>Rama jurídica</label>
                            <select
                                className={formStyles.select}
                                value={form.branchId}
                                onChange={e => set('branchId', e.target.value)}
                            >
                                <option value="">Sin rama</option>
                                {branchList.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={formStyles.formGroup}>
                        <label>Juzgado / Entidad</label>
                        <input
                            className={formStyles.input}
                            placeholder="Ej: Juzgado 12 Civil del Circuito de Bogotá"
                            value={form.court}
                            onChange={e => set('court', e.target.value)}
                        />
                    </div>

                    <div className={formStyles.row}>
                        <div className={formStyles.formGroup}>
                            <label>Contraparte</label>
                            <input
                                className={formStyles.input}
                                placeholder="Nombre o razón social"
                                value={form.counterpart}
                                onChange={e => set('counterpart', e.target.value)}
                            />
                        </div>
                        <div className={formStyles.formGroup}>
                            <label>Fecha de inicio</label>
                            <input
                                className={formStyles.input}
                                type="date"
                                value={form.startDate}
                                onChange={e => set('startDate', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={formStyles.formGroup}>
                        <label>Fecha de cierre</label>
                        <input
                            className={formStyles.input}
                            type="date"
                            value={form.endDate}
                            onChange={e => set('endDate', e.target.value)}
                        />
                    </div>
                </div>

                <div className={styles.cardActions}>
                    <button className={formStyles.cancelButton} onClick={() => router.back()}>
                        Cancelar
                    </button>
                    <button
                        className={formStyles.saveButton}
                        onClick={handleSave}
                        disabled={saving || !form.clientId || !form.title.trim()}
                    >
                        {saving ? 'Guardando...' : <><Save /> Guardar cambios</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProcessEditPage;
