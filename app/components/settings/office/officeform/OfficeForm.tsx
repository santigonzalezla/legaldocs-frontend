'use client';

import {useEffect, useRef, useState} from 'react';
import {useRouter} from 'next/navigation';
import styles from './officeform.module.css';
import {BarChart, Building, DollarSign, Edit, File, Globe, Mail, MapPin, Phone, Plus, Tag, Trash, TriangleAlert, Upload, X} from '@/app/components/svg';
import {useFetch} from '@/hooks/useFetch';
import {API_BASE_URL} from '@/lib/constants';
import ImageUploadField from '@/app/components/shared/imageupload/ImageUploadField';
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
    const [logoVersion,    setLogoVersion]    = useState(0);

    const logoPickerRef = useRef<(() => void) | null>(null);

    const {data: firm, isLoading: loadingFirm, execute: refetchFirm} = useFetch<Firm>('firm/me', {firmScoped: true});

    const {execute: uploadLogo} = useFetch<Firm>('firm/me/logo', {
        method: 'POST', immediate: false, isFormData: true, firmScoped: true,
    });

    const {execute: deleteLogo} = useFetch<Firm>('firm/me/logo', {
        method: 'DELETE', immediate: false, firmScoped: true,
    });

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

    const handleLogoUpload = async (blob: Blob): Promise<boolean> =>
    {
        const body = new FormData();
        body.append('file', blob, 'logo.png');

        const result = await uploadLogo({body});
        if (!result) return false;

        setLogoVersion(v => v + 1);
        refetchFirm();
        window.dispatchEvent(new Event('ld:logo-updated'));
        toast.success('Logo del despacho actualizado.');
        return true;
    };

    const handleLogoRemove = async () =>
    {
        const result = await deleteLogo();
        if (!result) return;

        setLogoVersion(v => v + 1);
        refetchFirm();
        window.dispatchEvent(new Event('ld:logo-updated'));
        toast.success('Logo del despacho eliminado.');
    };

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
    if (!firm)       return <div className={styles.officeForm}><p>No se pudo cargar el despacho.</p></div>;

    const hasLogo    = Boolean(firm.logoKey || firm.logoUrl);
    const locationText = [form.city, form.country].filter(Boolean).join(', ');

    return (
        <div className={styles.officeForm}>

            <div className={`${styles.card} ${styles.headerCard}`}>
                <div className={styles.headerMain}>
                    <ImageUploadField
                        variant="logo"
                        src={`${API_BASE_URL}/files/firm-logo/${firm.id}?v=${logoVersion}`}
                        alt={form.name || 'Logo del despacho'}
                        editable
                        showActions={false}
                        hasImage={hasLogo}
                        fallback={<Building />}
                        onUpload={handleLogoUpload}
                        onRemove={handleLogoRemove}
                        cropTitle="Ajustar logo del despacho"
                        caption="PNG o JPG · máx. 2 MB"
                        pickerRef={logoPickerRef}
                    />

                    <div className={styles.headerInfo}>
                        <div className={styles.headerTitleRow}>
                            <h2 className={styles.firmName}>{form.name || 'Mi Despacho'}</h2>
                            <span className={styles.badge}>Activa</span>
                        </div>
                        <p className={styles.firmSubtitle}>Firma jurídica registrada</p>
                        <div className={styles.firmMeta}>
                            {form.nit && <span><File />NIT: {form.nit}</span>}
                            {form.website && <span><Globe />{form.website}</span>}
                            {locationText && <span><MapPin />{locationText}</span>}
                        </div>
                    </div>
                </div>

                <div className={styles.headerActions}>
                    <button type="button" className={styles.btnOutline} onClick={() => logoPickerRef.current?.()}>
                        <Upload />
                        {hasLogo ? 'Cambiar logo' : 'Subir logo'}
                    </button>
                    {hasLogo && (
                        <button type="button" className={styles.btnOutlineDanger} onClick={handleLogoRemove}>
                            <Trash />
                            Eliminar logo
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.card}>
                <div className={styles.cardHead}>
                    <div className={styles.cardHeadText}>
                        <h3 className={styles.cardTitle}><Building />Información Corporativa y Tributaria</h3>
                        <p className={styles.cardSubtitle}>
                            Datos utilizados en facturación electrónica DIAN, encabezados de minutas y poderes especiales.
                        </p>
                    </div>
                    {!isEditing ? (
                        <button className={styles.btnEdit} onClick={() => setIsEditing(true)}><Edit />Editar</button>
                    ) : (
                        <div className={styles.btnGroup}>
                            <button className={styles.btnGhost} onClick={handleCancel}>Cancelar</button>
                            <button className={styles.btnPrimary} onClick={handleSave} disabled={isSaving}>
                                {isSaving ? 'Guardando...' : 'Guardar cambios'}
                            </button>
                        </div>
                    )}
                </div>

                <div className={styles.grid2}>
                    <div className={styles.field}>
                        <label className={styles.label}>Nombre comercial <span className={styles.req}>*</span></label>
                        <div className={styles.inputWrap}>
                            <span className={styles.inputIcon}><Building /></span>
                            <input type="text" className={styles.input} value={form.name} readOnly={!isEditing}
                                onChange={e => handleField('name', e.target.value)} />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Razón social <span className={styles.req}>*</span></label>
                        <div className={styles.inputWrap}>
                            <span className={styles.inputIcon}><File /></span>
                            <input type="text" className={styles.input} value={form.legalName} readOnly={!isEditing}
                                onChange={e => handleField('legalName', e.target.value)} />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>NIT (Número de Identificación Tributaria)</label>
                        <div className={styles.inputWrap}>
                            <span className={styles.inputIcon}><File /></span>
                            <input type="text" className={styles.input} value={form.nit} readOnly={!isEditing}
                                onChange={e => handleField('nit', e.target.value)} />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Teléfono corporativo</label>
                        <div className={styles.inputWrap}>
                            <span className={styles.inputIcon}><Phone /></span>
                            <input type="tel" className={styles.input} value={form.phone} readOnly={!isEditing}
                                onChange={e => handleField('phone', e.target.value)} />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Email institucional</label>
                        <div className={styles.inputWrap}>
                            <span className={styles.inputIcon}><Mail /></span>
                            <input type="email" className={styles.input} value={form.email} readOnly={!isEditing}
                                onChange={e => handleField('email', e.target.value)} />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Sitio web oficial</label>
                        <div className={styles.inputWrap}>
                            <span className={styles.inputIcon}><Globe /></span>
                            <input type="url" className={styles.input} value={form.website} readOnly={!isEditing}
                                onChange={e => handleField('website', e.target.value)} />
                        </div>
                    </div>

                    <div className={`${styles.field} ${styles.full}`}>
                        <label className={styles.label}>Dirección física principal</label>
                        <div className={styles.inputWrap}>
                            <span className={styles.inputIcon}><MapPin /></span>
                            <input type="text" className={styles.input} value={form.address} readOnly={!isEditing}
                                onChange={e => handleField('address', e.target.value)} />
                        </div>
                    </div>

                    <div className={`${styles.field} ${styles.full}`}>
                        <div className={styles.fieldLabelRow}>
                            <label className={styles.label}>Descripción del despacho</label>
                            <span className={styles.counter}>{form.description.length} / 500</span>
                        </div>
                        <textarea className={styles.textarea} rows={4} maxLength={500} value={form.description} readOnly={!isEditing}
                            onChange={e => handleField('description', e.target.value)} />
                    </div>
                </div>
            </div>

            <div className={styles.card}>
                <div className={styles.cardHead}>
                    <div className={styles.cardHeadText}>
                        <h3 className={styles.cardTitle}><Tag />Especialidades Jurídicas del Despacho</h3>
                        <p className={styles.cardSubtitle}>
                            Áreas del derecho practicadas por la firma. Se guardan y gestionan de forma inmediata e independiente.
                        </p>
                    </div>
                    <span className={styles.pill}>Autoguardado</span>
                </div>

                <div className={styles.addRow}>
                    <div className={styles.inputWrap}>
                        <span className={styles.inputIcon}><Plus /></span>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="Ej. Derecho Tributario, Litigio Arbitral..."
                            value={newSpecialty}
                            onChange={e => setNewSpecialty(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSpecialty(); } }}
                        />
                    </div>
                    <button type="button" className={styles.btnPrimary}
                        onClick={handleAddSpecialty} disabled={isAdding || !newSpecialty.trim()}>
                        <Plus />
                        {isAdding ? 'Agregando...' : 'Agregar'}
                    </button>
                </div>

                <div className={styles.chips}>
                    {(specialties ?? []).map(s => (
                        <span key={s.id} className={styles.chip}>
                            {s.specialty}
                            <button type="button" className={styles.chipRemove} onClick={() => handleRemoveSpecialty(s.id)}>
                                <X />
                            </button>
                        </span>
                    ))}
                    {(specialties ?? []).length === 0 && (
                        <span className={styles.chipsEmpty}>Aún no hay especialidades registradas.</span>
                    )}
                </div>
            </div>

            <div className={styles.card}>
                <div className={styles.cardHead}>
                    <div className={styles.cardHeadText}>
                        <h3 className={styles.cardTitle}><BarChart />Tarifas y Metas Diarias de Rendimiento</h3>
                        <p className={styles.cardSubtitle}>
                            Objetivos de productividad para el equipo jurídico y costo horario base de la firma.
                        </p>
                    </div>
                    {!isEditingRates ? (
                        <button className={styles.btnEditGhost} onClick={() => setIsEditingRates(true)}>
                            <Edit />Editar tarifas y metas
                        </button>
                    ) : (
                        <div className={styles.btnGroup}>
                            <button className={styles.btnGhost} onClick={handleCancelRates}>Cancelar</button>
                            <button className={styles.btnPrimary} onClick={handleSaveRates} disabled={isSavingRates}>
                                {isSavingRates ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    )}
                </div>

                <div className={styles.grid3}>
                    <div className={styles.field}>
                        <label className={styles.label}>Tarifa por hora de la firma</label>
                        <div className={styles.inputWrap}>
                            <span className={styles.inputIcon}><DollarSign /></span>
                            <input type="number" min={0} step={5000}
                                className={`${styles.input} ${styles.inputWithSuffix}`}
                                placeholder="Ej. 520000"
                                value={rates.firmHourlyRate}
                                readOnly={!isEditingRates}
                                onChange={e => handleRatesField('firmHourlyRate', e.target.value)} />
                            <span className={styles.suffix}>COP / h</span>
                        </div>
                        <p className={styles.hint}>Tarifa base liquidada por socio principal.</p>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Meta diaria facturable (por abogado)</label>
                        <div className={styles.hmGrid}>
                            <div className={styles.inputWrap}>
                                <input type="number" min={0} max={24} step={1}
                                    className={`${styles.input} ${styles.inputWithSuffix}`}
                                    placeholder="h"
                                    value={rates.billableHours}
                                    readOnly={!isEditingRates}
                                    onChange={e => handleRatesField('billableHours', e.target.value)} />
                                <span className={styles.suffix}>h</span>
                            </div>
                            <div className={styles.inputWrap}>
                                <input type="number" min={0} max={59} step={5}
                                    className={`${styles.input} ${styles.inputWithSuffix}`}
                                    placeholder="min"
                                    value={rates.billableMinutes}
                                    readOnly={!isEditingRates}
                                    onChange={e => handleRatesField('billableMinutes', e.target.value)} />
                                <span className={styles.suffix}>min</span>
                            </div>
                        </div>
                        <p className={styles.hint}>Ideal: 6 h 30 min por jornada laboral.</p>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Meta diaria no facturable (gestión)</label>
                        <div className={styles.hmGrid}>
                            <div className={styles.inputWrap}>
                                <input type="number" min={0} max={24} step={1}
                                    className={`${styles.input} ${styles.inputWithSuffix}`}
                                    placeholder="h"
                                    value={rates.nonBillableHours}
                                    readOnly={!isEditingRates}
                                    onChange={e => handleRatesField('nonBillableHours', e.target.value)} />
                                <span className={styles.suffix}>h</span>
                            </div>
                            <div className={styles.inputWrap}>
                                <input type="number" min={0} max={59} step={5}
                                    className={`${styles.input} ${styles.inputWithSuffix}`}
                                    placeholder="min"
                                    value={rates.nonBillableMinutes}
                                    readOnly={!isEditingRates}
                                    onChange={e => handleRatesField('nonBillableMinutes', e.target.value)} />
                                <span className={styles.suffix}>min</span>
                            </div>
                        </div>
                        <p className={styles.hint}>Administración, estudio jurisprudencial y reuniones.</p>
                    </div>
                </div>

                <p className={styles.hint}>
                    La tarifa aplica a todos los procesos del despacho. Las metas diarias son las horas que cada abogado
                    debe registrar por día. La suma de ambas metas no puede superar las 24 horas.
                </p>
            </div>

            {canDeleteFirm && (
                <div className={styles.dangerCard}>
                    <div className={styles.dangerInfo}>
                        <div className={styles.dangerLabel}><TriangleAlert />Zona de Peligro</div>
                        <h4 className={styles.dangerTitle}>Dar de baja o eliminar firma jurídica</h4>
                        <p className={styles.dangerText}>
                            Al eliminar el despacho se revocará el acceso de todos los abogados dependientes y se
                            suspenderán los procesos activos.{' '}
                            <strong>La firma entra en papelera y se puede restaurar durante 30 días.</strong>
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
