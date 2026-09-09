'use client';

import {useEffect, useRef, useState} from 'react';
import styles from './profileform.module.css';
import {ArrowDown, Calendar, DollarSign, Edit, Mail, MapPin, Phone, Trash, Upload, User} from '@/app/components/svg';
import {useFetch} from '@/hooks/useFetch';
import {API_BASE_URL} from '@/lib/constants';
import ImageUploadField from '@/app/components/shared/imageupload/ImageUploadField';
import type {User as UserType} from '@/app/interfaces/interfaces';
import {toast} from 'sonner';

type FormState = {
    firstName:  string;
    lastName:   string;
    email:      string;
    phone:      string;
    address:    string;
    city:       string;
    country:    string;
    birthDate:  string;
    bio:        string;
    hourlyRate: string;
};

const empty: FormState = {
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', country: '', birthDate: '', bio: '', hourlyRate: '',
};

const toFormState = (user: UserType): FormState => ({
    firstName:  user.firstName ?? '',
    lastName:   user.lastName  ?? '',
    email:      user.email     ?? '',
    phone:      user.phone     ?? '',
    address:    user.address   ?? '',
    city:       user.city      ?? '',
    country:    user.country   ?? '',
    birthDate:  user.birthDate ? user.birthDate.slice(0, 10) : '',
    bio:        user.bio       ?? '',
    hourlyRate: user.hourlyRate != null ? String(user.hourlyRate) : '',
});

const ProfileForm = () =>
{
    const [form,           setForm]           = useState<FormState>(empty);
    const [snapshot,       setSnapshot]       = useState<FormState>(empty);
    const [isEditing,      setIsEditing]      = useState(false);
    const [isEditingRate,  setIsEditingRate]  = useState(false);
    const [avatarVersion,  setAvatarVersion]  = useState(0);

    const avatarPickerRef = useRef<(() => void) | null>(null);

    const {data: user, isLoading, execute: refetchUser} = useFetch<UserType>('user/me');

    const {execute: saveProfile, isLoading: isSaving} = useFetch<UserType>('user/me', {
        method: 'PATCH', immediate: false,
    });

    const {execute: saveRate, isLoading: isSavingRate} = useFetch<UserType>('user/me', {
        method: 'PATCH', immediate: false,
    });

    const {execute: uploadAvatar} = useFetch<UserType>('user/me/avatar', {
        method: 'POST', immediate: false, isFormData: true,
    });

    const {execute: deleteAvatar} = useFetch<UserType>('user/me/avatar', {
        method: 'DELETE', immediate: false,
    });

    useEffect(() =>
    {
        if (!user) return;
        const loaded = toFormState(user);
        setForm(loaded);
        setSnapshot(loaded);
    }, [user]);

    const handleField = (key: keyof FormState, value: string) =>
        setForm(prev => ({...prev, [key]: value}));

    const handleSave = async () =>
    {
        const payload: Record<string, unknown> = {};
        (Object.keys(form) as (keyof FormState)[]).forEach(key =>
        {
            if (key === 'hourlyRate' || key === 'email') return;
            if (form[key] !== snapshot[key]) payload[key] = form[key] || null;
        });

        if (!Object.keys(payload).length) { setIsEditing(false); return; }

        const result = await saveProfile({body: payload});
        if (!result) return;

        const updated = toFormState(result);
        setForm(updated);
        setSnapshot(updated);
        setIsEditing(false);
        toast.success('Perfil actualizado correctamente.');
    };

    const handleCancel = () => { setForm(snapshot); setIsEditing(false); };

    const handleSaveRate = async () =>
    {
        const value = form.hourlyRate.trim() === '' ? null : parseFloat(form.hourlyRate);

        const result = await saveRate({body: {hourlyRate: value}});
        if (!result) return;

        const next = result.hourlyRate != null ? String(result.hourlyRate) : '';
        setForm(prev => ({...prev, hourlyRate: next}));
        setSnapshot(prev => ({...prev, hourlyRate: next}));
        setIsEditingRate(false);
        toast.success('Tarifa actualizada.');
    };

    const handleCancelRate = () =>
    {
        setForm(prev => ({...prev, hourlyRate: snapshot.hourlyRate}));
        setIsEditingRate(false);
    };

    const handleAvatarUpload = async (blob: Blob): Promise<boolean> =>
    {
        const body = new FormData();
        body.append('file', blob, 'avatar.jpg');

        const result = await uploadAvatar({body});
        if (!result) return false;

        setAvatarVersion(v => v + 1);
        refetchUser();
        window.dispatchEvent(new Event('ld:avatar-updated'));
        toast.success('Foto de perfil actualizada.');
        return true;
    };

    const handleAvatarRemove = async () =>
    {
        const result = await deleteAvatar();
        if (!result) return;

        setAvatarVersion(v => v + 1);
        refetchUser();
        window.dispatchEvent(new Event('ld:avatar-updated'));
        toast.success('Foto de perfil eliminada.');
    };

    if (isLoading) return <div className={styles.profileForm}><p>Cargando perfil...</p></div>;
    if (!user)     return <div className={styles.profileForm}><p>No se pudo cargar el perfil.</p></div>;

    const hasAvatar    = Boolean(user.avatarKey || user.avatarUrl);
    const fullName     = `${form.firstName} ${form.lastName}`.trim() || 'Mi perfil';
    const locationText = [form.city, form.country].filter(Boolean).join(', ');

    return (
        <div className={styles.profileForm}>

            <div className={`${styles.card} ${styles.headerCard}`}>
                <div className={styles.headerMain}>
                    <ImageUploadField
                        variant="avatar"
                        src={`${API_BASE_URL}/files/user-avatar/${user.id}?v=${avatarVersion}`}
                        alt={fullName}
                        editable
                        showActions={false}
                        hasImage={hasAvatar}
                        fallback={<User />}
                        onUpload={handleAvatarUpload}
                        onRemove={handleAvatarRemove}
                        cropTitle="Ajustar foto de perfil"
                        caption="PNG o JPG · máx. 2 MB"
                        pickerRef={avatarPickerRef}
                    />

                    <div className={styles.headerInfo}>
                        <div className={styles.headerTitleRow}>
                            <h2 className={styles.name}>{fullName}</h2>
                        </div>
                        <p className={styles.subtitle}>Usuario</p>
                        <div className={styles.meta}>
                            {form.email && <span><Mail />{form.email}</span>}
                            {locationText && <span><MapPin />{locationText}</span>}
                        </div>
                    </div>
                </div>

                <div className={styles.headerActions}>
                    <button type="button" className={styles.btnOutline} onClick={() => avatarPickerRef.current?.()}>
                        <Upload />
                        {hasAvatar ? 'Cambiar foto' : 'Subir foto'}
                    </button>
                    {hasAvatar && (
                        <button type="button" className={styles.btnOutlineDanger} onClick={handleAvatarRemove}>
                            <Trash />
                            Eliminar foto
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.card}>
                <div className={styles.cardHead}>
                    <div className={styles.cardHeadText}>
                        <h3 className={styles.cardTitle}><User />Datos de Identificación y Contacto</h3>
                        <p className={styles.cardSubtitle}>
                            Información visible en minutas contractuales, poderes y memoriales judiciales.
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
                        <label className={styles.label}>Nombre <span className={styles.req}>*</span></label>
                        <div className={styles.inputWrap}>
                            <span className={styles.inputIcon}><User /></span>
                            <input type="text" className={styles.input} value={form.firstName} readOnly={!isEditing}
                                onChange={e => handleField('firstName', e.target.value)} />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Apellido <span className={styles.req}>*</span></label>
                        <div className={styles.inputWrap}>
                            <span className={styles.inputIcon}><User /></span>
                            <input type="text" className={styles.input} value={form.lastName} readOnly={!isEditing}
                                onChange={e => handleField('lastName', e.target.value)} />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <div className={styles.fieldLabelRow}>
                            <label className={styles.label}>Correo electrónico</label>
                            <span className={styles.roBadge}>Solo lectura</span>
                        </div>
                        <div className={styles.inputWrap}>
                            <span className={styles.inputIcon}><Mail /></span>
                            <input type="email" className={styles.input} value={form.email} readOnly disabled />
                        </div>
                        <p className={styles.hint}>El correo está vinculado a tu cuenta y no se edita aquí.</p>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Teléfono móvil</label>
                        <div className={styles.inputWrap}>
                            <span className={styles.inputIcon}><Phone /></span>
                            <input type="tel" className={styles.input} value={form.phone} readOnly={!isEditing}
                                onChange={e => handleField('phone', e.target.value)} />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Fecha de nacimiento</label>
                        <div className={styles.inputWrap}>
                            <span className={styles.inputIcon}><Calendar /></span>
                            <input type="date" className={styles.input} value={form.birthDate} readOnly={!isEditing}
                                onChange={e => handleField('birthDate', e.target.value)} />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>País de radicación</label>
                        <div className={styles.inputWrap}>
                            <span className={styles.inputIcon}><MapPin /></span>
                            <select className={`${styles.input} ${styles.select}`} value={form.country} disabled={!isEditing}
                                onChange={e => handleField('country', e.target.value)}>
                                <option value="">Seleccionar</option>
                                <option value="Colombia">Colombia</option>
                                <option value="México">México</option>
                                <option value="Argentina">Argentina</option>
                                <option value="Chile">Chile</option>
                                <option value="Perú">Perú</option>
                            </select>
                            <span className={styles.selectChevron}><ArrowDown /></span>
                        </div>
                    </div>

                    <div className={`${styles.field} ${styles.full}`}>
                        <label className={styles.label}>Dirección de notificaciones</label>
                        <div className={styles.inputWrap}>
                            <span className={styles.inputIcon}><MapPin /></span>
                            <input type="text" className={styles.input} value={form.address} readOnly={!isEditing}
                                onChange={e => handleField('address', e.target.value)} />
                        </div>
                    </div>

                    <div className={`${styles.field} ${styles.full}`}>
                        <div className={styles.fieldLabelRow}>
                            <label className={styles.label}>Resumen y perfil profesional</label>
                            <span className={styles.counter}>{form.bio.length} / 500</span>
                        </div>
                        <textarea className={styles.textarea} rows={4} maxLength={500} value={form.bio} readOnly={!isEditing}
                            onChange={e => handleField('bio', e.target.value)} />
                    </div>
                </div>
            </div>

            <div className={styles.card}>
                <div className={styles.cardHead}>
                    <div className={styles.cardHeadText}>
                        <h3 className={styles.cardTitle}><DollarSign />Tarifas y Honorarios Individuales</h3>
                        <p className={styles.cardSubtitle}>
                            Costo horario usado automáticamente para la liquidación de horas facturables en litigios.
                        </p>
                    </div>
                    {!isEditingRate ? (
                        <button className={styles.btnEditGhost} onClick={() => setIsEditingRate(true)}>
                            <Edit />Editar tarifa
                        </button>
                    ) : (
                        <div className={styles.btnGroup}>
                            <button className={styles.btnGhost} onClick={handleCancelRate}>Cancelar</button>
                            <button className={styles.btnPrimary} onClick={handleSaveRate} disabled={isSavingRate}>
                                {isSavingRate ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    )}
                </div>

                <div className={styles.rateField}>
                    <label className={styles.label}>Tarifa estándar por hora (COP)</label>
                    <div className={styles.inputWrap}>
                        <span className={styles.inputIcon}><DollarSign /></span>
                        <input type="number" min={0} step={1000}
                            className={`${styles.input} ${styles.inputWithSuffix}`}
                            placeholder="Ej. 380000"
                            value={form.hourlyRate}
                            readOnly={!isEditingRate}
                            onChange={e => handleField('hourlyRate', e.target.value)} />
                        <span className={styles.suffix}>COP / h</span>
                    </div>
                    <p className={styles.hint}>Monto sugerido para peritajes y audiencias laborales: $350.000 – $450.000 COP.</p>
                </div>
            </div>
        </div>
    );
};

export default ProfileForm;
