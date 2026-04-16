'use client';

import {useEffect, useState} from 'react';
import styles from './profileform.module.css';
import {Calendar, Camera, DollarSign, Mail, MapPin, Phone, User} from '@/app/components/svg';
import {useFetch} from '@/hooks/useFetch';
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

const ProfileForm = () =>
{
    const [form,      setForm]      = useState<FormState>(empty);
    const [snapshot,  setSnapshot]  = useState<FormState>(empty);
    const [isEditing, setIsEditing] = useState(false);

    const {data: user, isLoading} = useFetch<UserType>('user/me');

    const {execute: saveProfile, isLoading: isSaving} = useFetch<UserType>('user/me', {
        method:    'PATCH',
        immediate: false,
    });

    useEffect(() =>
    {
        if (!user) return;
        const loaded: FormState = {
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
        };
        setForm(loaded);
        setSnapshot(loaded);
    }, [user]);

    const handleField = (key: keyof FormState, value: string) =>
        setForm(prev => ({...prev, [key]: value}));

    const handleSave = async () =>
    {
        const payload: Record<string, any> = {};
        (Object.keys(form) as (keyof FormState)[]).forEach(k =>
        {
            if (form[k] !== snapshot[k])
            {
                if (k === 'hourlyRate')
                    payload[k] = form[k] !== '' ? parseFloat(form[k]) : null;
                else
                    payload[k] = form[k] || null;
            }
        });

        if (!Object.keys(payload).length) { setIsEditing(false); return; }

        const result = await saveProfile({body: payload});
        if (!result) return;

        const updated: FormState = {
            firstName:  result.firstName ?? '',
            lastName:   result.lastName  ?? '',
            email:      result.email     ?? '',
            phone:      result.phone     ?? '',
            address:    result.address   ?? '',
            city:       result.city      ?? '',
            country:    result.country   ?? '',
            birthDate:  result.birthDate ? result.birthDate.slice(0, 10) : '',
            bio:        result.bio       ?? '',
            hourlyRate: result.hourlyRate != null ? String(result.hourlyRate) : '',
        };
        setForm(updated);
        setSnapshot(updated);
        setIsEditing(false);
        toast.success('Perfil actualizado correctamente.');
    };

    const handleCancel = () => { setForm(snapshot); setIsEditing(false); };

    if (isLoading) return <div className={styles.profileForm}><p>Cargando perfil...</p></div>;

    return (
        <div className={styles.profileForm}>
            <div className={styles.avatarSection}>
                <div className={styles.avatarContainer}>
                    <div className={styles.avatarPlaceholder}>
                        <User />
                    </div>
                    <button className={styles.avatarButton} disabled>
                        <Camera />
                    </button>
                </div>
                <div className={styles.avatarInfo}>
                    <h3 className={styles.userName}>{form.firstName} {form.lastName}</h3>
                    <p className={styles.userRole}>Usuario</p>
                </div>
            </div>

            <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                    <h4 className={styles.sectionTitle}>Información Personal</h4>
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
                        <label className={styles.label}><User />Nombre</label>
                        <input type="text" className={styles.input} value={form.firstName} disabled={!isEditing}
                            onChange={e => handleField('firstName', e.target.value)} />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}><User />Apellido</label>
                        <input type="text" className={styles.input} value={form.lastName} disabled={!isEditing}
                            onChange={e => handleField('lastName', e.target.value)} />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}><Mail />Email</label>
                        <input type="email" className={styles.input} value={form.email} disabled={!isEditing}
                            onChange={e => handleField('email', e.target.value)} />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}><Phone />Teléfono</label>
                        <input type="tel" className={styles.input} value={form.phone} disabled={!isEditing}
                            onChange={e => handleField('phone', e.target.value)} />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}><Calendar />Fecha de Nacimiento</label>
                        <input type="date" className={styles.input} value={form.birthDate} disabled={!isEditing}
                            onChange={e => handleField('birthDate', e.target.value)} />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}><MapPin />País</label>
                        <select className={styles.input} value={form.country} disabled={!isEditing}
                            onChange={e => handleField('country', e.target.value)}>
                            <option value="">Seleccionar</option>
                            <option value="Colombia">Colombia</option>
                            <option value="México">México</option>
                            <option value="Argentina">Argentina</option>
                            <option value="Chile">Chile</option>
                            <option value="Perú">Perú</option>
                        </select>
                    </div>

                    <div className={styles.formGroupFull}>
                        <label className={styles.label}><MapPin />Dirección</label>
                        <input type="text" className={styles.input} value={form.address} disabled={!isEditing}
                            onChange={e => handleField('address', e.target.value)} />
                    </div>

                    <div className={styles.formGroupFull}>
                        <label className={styles.label}>Biografía</label>
                        <textarea className={styles.textarea} rows={4} value={form.bio} disabled={!isEditing}
                            onChange={e => handleField('bio', e.target.value)} />
                    </div>
                </div>
            </div>

            <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                    <h4 className={styles.sectionTitle}>Tarifas</h4>
                </div>
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}><DollarSign />Tarifa por hora (COP)</label>
                        <input
                            type="number"
                            min="0"
                            step="1000"
                            className={styles.input}
                            value={form.hourlyRate}
                            disabled={!isEditing}
                            placeholder="Ej: 150000"
                            onChange={e => handleField('hourlyRate', e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileForm;
