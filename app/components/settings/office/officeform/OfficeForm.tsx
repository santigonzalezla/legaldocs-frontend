'use client';

import {useEffect, useRef, useState} from 'react';
import styles from './officeform.module.css';
import {Building, File, Globe, Mail, MapPin, Phone, Upload} from '@/app/components/svg';
import {useFetch} from '@/hooks/useFetch';
import type {Firm, FirmSpecialty} from '@/app/interfaces/interfaces';
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

const empty: FormState = {
    name: '', legalName: '', nit: '', address: '', city: '',
    country: '', phone: '', email: '', website: '', description: '',
};

const OfficeForm = () =>
{
    const [form,         setForm]         = useState<FormState>(empty);
    const [snapshot,     setSnapshot]     = useState<FormState>(empty);
    const [isEditing,    setIsEditing]    = useState(false);
    const [newSpecialty, setNewSpecialty] = useState('');

    const {data: firm, isLoading: loadingFirm} = useFetch<Firm>('firm/me', {firmScoped: true});

    const {data: specialties, execute: refetchSpecialties} = useFetch<FirmSpecialty[]>(
        'firm/me/specialties', {firmScoped: true},
    );

    const {execute: saveFirm, isLoading: isSaving} = useFetch<Firm>('firm/me', {
        method:    'PATCH',
        immediate: false,
        firmScoped: true,
    });

    const {execute: addSpecialty, isLoading: isAdding} = useFetch<FirmSpecialty>(
        'firm/me/specialties', {method: 'POST', immediate: false, firmScoped: true},
    );

    const {execute: removeSpecialty} = useFetch<void>(
        '', {method: 'DELETE', immediate: false, firmScoped: true},
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
        </div>
    );
};

export default OfficeForm;
