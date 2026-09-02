'use client';

import {useEffect, useRef, useState} from 'react';
import {useRouter} from 'next/navigation';
import styles from './officeform.module.css';
import {Building, File, Globe, Mail, MapPin, Phone, Trash, Upload} from '@/app/components/svg';
import {useFetch} from '@/hooks/useFetch';
import {useAuth} from '@/context/AuthContext';
import {usePermissions} from '@/context/PermissionsContext';
import {useConfirm} from '@/hooks/useConfirm';
import ConfirmModal from '@/app/components/ui/confirmmodal/ConfirmModal';
import type {Firm, FirmSpecialty, User} from '@/app/interfaces/interfaces';
import {toast} from 'sonner';

type FormState = {
    name:        string;
    legalName:   string;
    nit:         string;
    address:     string;
    city:        string;
    country:     string;
    phone:       string;
    email:       string;
    website:     string;
    description: string;
};

type RatesForm = {
    firmHourlyRate:     string;
    billableHours:      string;
    billableMinutes:    string;
    nonBillableHours:   string;
    nonBillableMinutes: string;
};

const decimalToHM = (val: number | null): {hours: string; minutes: string} => {
    if (val == null) return {hours: '', minutes: ''};
    const hours   = Math.floor(val);
    const minutes = Math.round((val - hours) * 60);
    return {hours: String(hours), minutes: minutes > 0 ? String(minutes) : ''};
};

const hmToDecimal = (h: string, m: string): number | null => {
    if (h.trim() === '' && m.trim() === '') return null;
    return (Number(h) || 0) + (Number(m) || 0) / 60;
};

const toTotalMinutes = (h: string, m: string) => (Number(h) || 0) * 60 + (Number(m) || 0);

const empty: FormState = {
    name: '', legalName: '', nit: '', address: '', city: '',
    country: '', phone: '', email: '', website: '', description: '',
};

const emptyRates: RatesForm = {
    firmHourlyRate: '', billableHours: '', billableMinutes: '',
    nonBillableHours: '', nonBillableMinutes: '',
};

const OfficeForm = () =>
{
    const [form,           setForm]           = useState<FormState>(empty);
    const [snapshot,       setSnapshot]       = useState<FormState>(empty);
    const [isEditing,      setIsEditing]      = useState(false);
    const [newSpecialty,   setNewSpecialty]   = useState('');
    const [rates,          setRates]          = useState<RatesForm>(emptyRates);
    const [ratesSnapshot,  setRatesSnapshot]  = useState<RatesForm>(emptyRates);
    const [isEditingRates, setIsEditingRates] = useState(false);

    const {data: firm, isLoading: loadingFirm} = useFetch<Firm>('firm/me', {firmScoped: true});

    const {data: me} = useFetch<User>('user/me');

    const {data: specialties, execute: refetchSpecialties} = useFetch<FirmSpecialty[]>(
        'firm/me/specialties', {firmScoped: true},
    );

    const {execute: saveFirm, isLoading: isSaving} = useFetch<Firm>('firm/me', {
        method:    'PATCH',
        immediate: false,
        firmScoped: true,
    });

    const {execute: saveRates, isLoading: isSavingRates} = useFetch<Firm>('firm/me', {
        method:     'PATCH',
        immediate:  false,
        firmScoped: true,
    });

    const {execute: addSpecialty, isLoading: isAdding} = useFetch<FirmSpecialty>(
        'firm/me/specialties', {method: 'POST', immediate: false, firmScoped: true},
    );

    const {execute: removeSpecialty} = useFetch<void>(
        '', {method: 'DELETE', immediate: false, firmScoped: true},
    );

    const router = useRouter();
    const {setActiveFirm} = useAuth();
    const {can} = usePermissions();
    const {confirm, confirmState, handleConfirm: confirmYes, handleCancel: confirmNo} = useConfirm();
    // El backend (assertCanManage) permite eliminar al admin RBAC o al dueño de la firma.
    const isOwner = !!me && !!firm && firm.createdBy === me.id;
    // TEMP: sin gate mientras se hacen pruebas de eliminación.
    // Restaurar a: const canDeleteFirm = can('firm_settings:delete') || isOwner;
    void isOwner; void can;
    const canDeleteFirm = true;

    const {execute: deleteFirm, isLoading: isDeletingFirm} = useFetch<{message: string; purgeAt: string}>(
        'firm/me', {method: 'DELETE', immediate: false, firmScoped: true},
    );

    useEffect(() =>
    {
        if (!firm) return;
        const loaded: FormState = {
            name:        firm.name        ?? '',
            legalName:   firm.legalName   ?? '',
            nit:         firm.nit         ?? '',
            address:     firm.address     ?? '',
            city:        firm.city        ?? '',
            country:     firm.country     ?? '',
            phone:       firm.phone       ?? '',
            email:       firm.email       ?? '',
            website:     firm.website     ?? '',
            description: firm.description ?? '',
        };
        setForm(loaded);
        setSnapshot(loaded);

        const billable    = decimalToHM(firm.dailyBillableGoalHours);
        const nonBillable = decimalToHM(firm.dailyNonBillableGoalHours);
        const loadedRates: RatesForm = {
            firmHourlyRate:     firm.firmHourlyRate != null ? String(firm.firmHourlyRate) : '',
            billableHours:      billable.hours,
            billableMinutes:    billable.minutes,
            nonBillableHours:   nonBillable.hours,
            nonBillableMinutes: nonBillable.minutes,
        };
        setRates(loadedRates);
        setRatesSnapshot(loadedRates);
    }, [firm]);

    const handleField = (key: keyof FormState, value: string) =>
        setForm(prev => ({...prev, [key]: value}));

    const handleSave = async () =>
    {
        const payload: Partial<FormState> = {};
        (Object.keys(form) as (keyof FormState)[]).forEach(k =>
        {
            if (form[k] !== snapshot[k]) (payload as any)[k] = form[k] || null;
        });

        if (!Object.keys(payload).length) { setIsEditing(false); return; }

        const result = await saveFirm({body: payload});
        if (!result) return;

        const updated: FormState = {
            name:        result.name        ?? '',
            legalName:   result.legalName   ?? '',
            nit:         result.nit         ?? '',
            address:     result.address     ?? '',
            city:        result.city        ?? '',
            country:     result.country     ?? '',
            phone:       result.phone       ?? '',
            email:       result.email       ?? '',
            website:     result.website     ?? '',
            description: result.description ?? '',
        };
        setForm(updated);
        setSnapshot(updated);
        setIsEditing(false);
        toast.success('Datos del despacho actualizados.');
    };

    const handleCancel = () => { setForm(snapshot); setIsEditing(false); };

    const handleRatesField = (key: keyof RatesForm, value: string) =>
        setRates(prev => ({...prev, [key]: value}));

    const handleSaveRates = async () =>
    {
        const billTotal    = toTotalMinutes(rates.billableHours,    rates.billableMinutes);
        const nonBillTotal = toTotalMinutes(rates.nonBillableHours, rates.nonBillableMinutes);

        if (billTotal + nonBillTotal > 24 * 60)
        {
            toast.error('La suma de horas facturables y no facturables no puede superar las 24 horas diarias.');
            return;
        }

        const minutesInRange = (m: string) => {
            const n = Number(m);
            return m.trim() === '' || (Number.isInteger(n) && n >= 0 && n <= 59);
        };

        if (!minutesInRange(rates.billableMinutes) || !minutesInRange(rates.nonBillableMinutes))
        {
            toast.error('Los minutos deben ser un valor entre 0 y 59.');
            return;
        }

        const payload = {
            firmHourlyRate:            rates.firmHourlyRate.trim() === '' ? null : Number(rates.firmHourlyRate),
            dailyBillableGoalHours:    hmToDecimal(rates.billableHours,    rates.billableMinutes),
            dailyNonBillableGoalHours: hmToDecimal(rates.nonBillableHours, rates.nonBillableMinutes),
        };

        const result = await saveRates({body: payload});
        if (!result) return;

        const billable    = decimalToHM(result.dailyBillableGoalHours);
        const nonBillable = decimalToHM(result.dailyNonBillableGoalHours);
        const updated: RatesForm = {
            firmHourlyRate:     result.firmHourlyRate != null ? String(result.firmHourlyRate) : '',
            billableHours:      billable.hours,
            billableMinutes:    billable.minutes,
            nonBillableHours:   nonBillable.hours,
            nonBillableMinutes: nonBillable.minutes,
        };
        setRates(updated);
        setRatesSnapshot(updated);
        setIsEditingRates(false);
        toast.success('Tarifas y metas actualizadas.');
    };

    const handleCancelRates = () => { setRates(ratesSnapshot); setIsEditingRates(false); };

    const handleAddSpecialty = async () =>
    {
        const trimmed = newSpecialty.trim();
        if (!trimmed) return;
        if (specialties?.some(s => s.specialty === trimmed))
        {
            toast.error('Esa especialidad ya existe.');
            return;
        }
        const result = await addSpecialty({body: {specialty: trimmed}});
        if (!result) return;
        setNewSpecialty('');
        refetchSpecialties();
    };

    const handleRemoveSpecialty = async (id: string) =>
    {
        await removeSpecialty({}, `firm/me/specialties/${id}`);
        refetchSpecialties();
    };

    const handleDeleteFirm = async () =>
    {
        const ok = await confirm({
            title:        'Eliminar firma',
            message:      `Se eliminará "${form.name || 'esta firma'}" junto con todos sus documentos, plantillas, clientes, procesos y registros de tiempo. Podrás recuperarla dentro de los próximos 30 días; pasado ese plazo se borrará de forma permanente.`,
            confirmLabel: 'Eliminar firma',
            danger:       true,
        });
        if (!ok) return;

        const result = await deleteFirm({});
        if (!result) return;

        toast.success('Firma eliminada. Tenés 30 días para recuperarla.');
        setActiveFirm(null);
        // FirmGuard resuelve: si quedan firmas asociadas muestra "Mis Firmas";
        // si no queda ninguna, redirige a la vista de "sin despacho asignado".
        router.push('/dashboard/settings/firms');
    };

    if (loadingFirm) return <div className={styles.officeForm}><p>Cargando datos del despacho...</p></div>;

    return (
        <div className={styles.officeForm}>
            <div className={styles.logoSection}>
                <div className={styles.logoContainer}>
                    <div className={styles.logoPlaceholder}>
                        <Building />
                    </div>
                    <button className={styles.logoButton} disabled>
                        <Upload />
                        Cambiar Logo
                    </button>
                </div>
                <div className={styles.logoInfo}>
                    <h3 className={styles.officeName}>{form.name || 'Mi Despacho'}</h3>
                    <p className={styles.officeType}>Firma Legal</p>
                </div>
            </div>

            <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                    <h4 className={styles.sectionTitle}>Información del Despacho</h4>
                    {!isEditing ? (
                        <button className={styles.editButton} onClick={() => setIsEditing(true)}>Editar</button>
                    ) : (
                        <div className={styles.actionButtons}>
                            <button className={styles.cancelButton} onClick={handleCancel}>Cancelar</button>
                            <button className={styles.saveButton} onClick={handleSave} disabled={isSaving}>
                                {isSaving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    )}
                </div>

                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}><Building />Nombre Comercial</label>
                        <input type="text" className={styles.input} value={form.name} disabled={!isEditing}
                            onChange={e => handleField('name', e.target.value)} />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}><File />Razón Social</label>
                        <input type="text" className={styles.input} value={form.legalName} disabled={!isEditing}
                            onChange={e => handleField('legalName', e.target.value)} />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}><File />NIT</label>
                        <input type="text" className={styles.input} value={form.nit} disabled={!isEditing}
                            onChange={e => handleField('nit', e.target.value)} />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}><Phone />Teléfono</label>
                        <input type="tel" className={styles.input} value={form.phone} disabled={!isEditing}
                            onChange={e => handleField('phone', e.target.value)} />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}><Mail />Email</label>
                        <input type="email" className={styles.input} value={form.email} disabled={!isEditing}
                            onChange={e => handleField('email', e.target.value)} />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}><Globe />Sitio Web</label>
                        <input type="url" className={styles.input} value={form.website} disabled={!isEditing}
                            onChange={e => handleField('website', e.target.value)} />
                    </div>

                    <div className={styles.formGroupFull}>
                        <label className={styles.label}><MapPin />Dirección</label>
                        <input type="text" className={styles.input} value={form.address} disabled={!isEditing}
                            onChange={e => handleField('address', e.target.value)} />
                    </div>

                    <div className={styles.formGroupFull}>
                        <label className={styles.label}>Descripción</label>
                        <textarea className={styles.textarea} rows={4} value={form.description} disabled={!isEditing}
                            onChange={e => handleField('description', e.target.value)} />
                    </div>

                    <div className={styles.formGroupFull}>
                        <label className={styles.label}>Especialidades</label>
                        <div className={styles.specialtiesContainer}>
                            <div className={styles.specialtiesList}>
                                {(specialties ?? []).map(s => (
                                    <div key={s.id} className={styles.specialtyTag}>
                                        <span>{s.specialty}</span>
                                        <button type="button" className={styles.removeSpecialty}
                                            onClick={() => handleRemoveSpecialty(s.id)}>×</button>
                                    </div>
                                ))}
                            </div>
                            <div className={styles.addSpecialtyRow}>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="Nueva especialidad..."
                                    value={newSpecialty}
                                    onChange={e => setNewSpecialty(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddSpecialty()}
                                />
                                <button type="button" className={styles.addSpecialty}
                                    onClick={handleAddSpecialty} disabled={isAdding || !newSpecialty.trim()}>
                                    {isAdding ? '...' : '+ Agregar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                    <h4 className={styles.sectionTitle}>Tarifas y Metas</h4>
                    {!isEditingRates ? (
                        <button className={styles.editButton} onClick={() => setIsEditingRates(true)}>Editar</button>
                    ) : (
                        <div className={styles.actionButtons}>
                            <button className={styles.cancelButton} onClick={handleCancelRates}>Cancelar</button>
                            <button className={styles.saveButton} onClick={handleSaveRates} disabled={isSavingRates}>
                                {isSavingRates ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    )}
                </div>

                <div className={styles.formGrid} style={{gridTemplateColumns: 'repeat(3, 1fr)'}}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Tarifa por hora (COP)</label>
                        <input
                            type="number" min={0} step={1000}
                            className={styles.input}
                            placeholder="Ej: 250000"
                            value={rates.firmHourlyRate}
                            disabled={!isEditingRates}
                            onChange={e => handleRatesField('firmHourlyRate', e.target.value)}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Meta diaria — facturables</label>
                        <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                            <input
                                type="number" min={0} max={24} step={1}
                                className={styles.input}
                                placeholder="h"
                                value={rates.billableHours}
                                disabled={!isEditingRates}
                                onChange={e => handleRatesField('billableHours', e.target.value)}
                            />
                            <span style={{color: 'var(--text-muted)', flexShrink: 0}}>h</span>
                            <input
                                type="number" min={0} max={59} step={1}
                                className={styles.input}
                                placeholder="min"
                                value={rates.billableMinutes}
                                disabled={!isEditingRates}
                                onChange={e => handleRatesField('billableMinutes', e.target.value)}
                            />
                            <span style={{color: 'var(--text-muted)', flexShrink: 0}}>min</span>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Meta diaria — no facturables</label>
                        <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                            <input
                                type="number" min={0} max={24} step={1}
                                className={styles.input}
                                placeholder="h"
                                value={rates.nonBillableHours}
                                disabled={!isEditingRates}
                                onChange={e => handleRatesField('nonBillableHours', e.target.value)}
                            />
                            <span style={{color: 'var(--text-muted)', flexShrink: 0}}>h</span>
                            <input
                                type="number" min={0} max={59} step={1}
                                className={styles.input}
                                placeholder="min"
                                value={rates.nonBillableMinutes}
                                disabled={!isEditingRates}
                                onChange={e => handleRatesField('nonBillableMinutes', e.target.value)}
                            />
                            <span style={{color: 'var(--text-muted)', flexShrink: 0}}>min</span>
                        </div>
                    </div>
                </div>
                <p style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem'}}>
                    La tarifa aplica a todos los procesos del despacho. Las metas diarias son las horas que cada abogado debe registrar por día. La suma de ambas metas no puede superar las 24 horas.
                </p>
            </div>

            {canDeleteFirm && (
                <div className={styles.dangerZone}>
                    <div className={styles.dangerInfo}>
                        <h4 className={styles.dangerTitle}>Eliminar firma</h4>
                        <p className={styles.dangerText}>
                            Elimina la firma y todos sus datos asociados (documentos, plantillas, clientes, procesos y registros de tiempo).
                            Es recuperable durante 30 días; después se borra de forma permanente.
                        </p>
                    </div>
                    <button
                        type="button"
                        className={styles.dangerButton}
                        onClick={handleDeleteFirm}
                        disabled={isDeletingFirm}
                    >
                        <Trash />
                        {isDeletingFirm ? 'Eliminando...' : 'Eliminar firma'}
                    </button>
                </div>
            )}

            {confirmState && (
                <ConfirmModal
                    title={confirmState.title}
                    message={confirmState.message}
                    confirmLabel={confirmState.confirmLabel}
                    danger={confirmState.danger}
                    onConfirm={confirmYes}
                    onCancel={confirmNo}
                />
            )}
        </div>
    );
};

export default OfficeForm;
