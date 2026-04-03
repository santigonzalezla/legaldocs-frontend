'use client';

import styles    from './page.module.css';
import formStyles from '@/app/components/clients/createclientmodal/createclientmodal.module.css';
import {useParams, useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';
import {useFetch} from '@/hooks/useFetch';
import {toast} from 'sonner';
import {ArrowLeft, Save} from '@/app/components/svg';
import type {Client} from '@/app/interfaces/interfaces';
import {ClientType} from '@/app/interfaces/enums';

const DOC_TYPES = ['CC', 'NIT', 'CE', 'PP', 'TI', 'RUT'];

const ClientEditPage = () =>
{
    const {id}   = useParams<{id: string}>();
    const router = useRouter();

    const {data: client, isLoading} =
        useFetch<Client>(`client/${id}`, {firmScoped: true});

    const {execute: updateClient, isLoading: saving} =
        useFetch<Client>('', {method: 'PATCH', immediate: false, firmScoped: true});

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

        const result = await updateClient({body}, `client/${id}`);
        if (!result) return;
        toast.success('Cliente actualizado correctamente.');
        router.push(`/dashboard/clients/${id}`);
    };

    if (isLoading)
        return <div className={styles.loading}>Cargando cliente...</div>;

    if (!client)
        return <div className={styles.loading}>Cliente no encontrado.</div>;

    const isCompany = form.type === ClientType.COMPANY;

    return (
        <div className={styles.page}>
            <button className={styles.backBtn} onClick={() => router.back()}>
                <ArrowLeft />
            </button>

            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h1 className={styles.cardTitle}>Editar Cliente</h1>
                </div>

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

                <div className={styles.cardActions}>
                    <button className={formStyles.cancelButton} onClick={() => router.back()}>
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
        </div>
    );
};

export default ClientEditPage;
