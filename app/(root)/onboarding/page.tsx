'use client';

import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import Image from 'next/image';
import {toast} from 'sonner';
import {useFetch} from '@/hooks/useFetch';
import {useAuth} from '@/context/AuthContext';
import {ThemeProvider} from '@/context/ThemeContext';
import {Building, MapPin, Phone, Scale} from '@/app/components/svg';
import styles from './page.module.css';

interface FirmResponse { id: string; name: string; }

const OnboardingPage = () =>
{
    const router = useRouter();
    const {isAuthenticated, isHydrated, activeFirmId, setActiveFirm} = useAuth();

    const [name,        setName]        = useState('');
    const [city,        setCity]        = useState('');
    const [phone,       setPhone]       = useState('');
    const [description, setDescription] = useState('');

    const {execute, isLoading, error} = useFetch<FirmResponse>('firm', {
        method:    'POST',
        immediate: false,
    });

    useEffect(() =>
    {
        if (isHydrated && isAuthenticated && activeFirmId)
            router.replace('/dashboard');
    }, [isHydrated, isAuthenticated, activeFirmId, router]);

    useEffect(() =>
    {
        if (isHydrated && !isAuthenticated)
            router.replace('/signin');
    }, [isHydrated, isAuthenticated, router]);

    useEffect(() => { if (error) toast.error(error); }, [error]);

    const handleSubmit = async (e: React.FormEvent) =>
    {
        e.preventDefault();
        const result = await execute({
            body: {
                name,
                ...(city        && {city}),
                ...(phone       && {phone}),
                ...(description && {description}),
            },
        });
        if (!result) return;

        setActiveFirm(result.id);
        toast.success(`¡Despacho "${result.name}" creado correctamente!`);
        router.push('/dashboard');
    };

    return (
        <ThemeProvider>
            <div className={styles.page}>
                <div className={styles.card}>
                    {/* Header */}
                    <div className={styles.header}>
                        <Image
                            src="/logo.png"
                            alt="LegalDocs"
                            width={200}
                            height={50}
                            className={styles.logo}
                            style={{objectFit: 'cover'}}
                            priority
                        />
                        <div className={styles.iconWrapper}>
                            <Scale />
                        </div>
                        <h1 className={styles.title}>Configura tu despacho</h1>
                        <p className={styles.subtitle}>
                            Para empezar a generar documentos necesitas crear tu firma legal.
                            Solo el nombre es obligatorio.
                        </p>
                    </div>

                    <form className={styles.form} onSubmit={handleSubmit}>
                        {/* Nombre — requerido */}
                        <div className={styles.field}>
                            <label className={styles.label}>
                                Nombre del despacho <span className={styles.required}>*</span>
                            </label>
                            <div className={styles.inputWrapper}>
                                <span className={styles.inputIcon}><Building /></span>
                                <input
                                    className={styles.input}
                                    type="text"
                                    placeholder="Ej: Pérez & Asociados"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.row}>
                            {/* Ciudad */}
                            <div className={styles.field}>
                                <label className={styles.label}>Ciudad</label>
                                <div className={styles.inputWrapper}>
                                    <span className={styles.inputIcon}><MapPin /></span>
                                    <input
                                        className={styles.input}
                                        type="text"
                                        placeholder="Bogotá"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Teléfono */}
                            <div className={styles.field}>
                                <label className={styles.label}>Teléfono</label>
                                <div className={styles.inputWrapper}>
                                    <span className={styles.inputIcon}><Phone /></span>
                                    <input
                                        className={styles.input}
                                        type="text"
                                        placeholder="+57 300 123 4567"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Descripción */}
                        <div className={styles.field}>
                            <label className={styles.label}>Descripción <span className={styles.optional}>(opcional)</span></label>
                            <textarea
                                className={styles.textarea}
                                placeholder="Ej: Firma especializada en derecho civil y comercial con más de 10 años de experiencia."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>

                        {error && <p className={styles.errorMsg}>{error}</p>}

                        <button type="submit" className={styles.submit} disabled={isLoading || !name.trim()}>
                            {isLoading ? 'Creando despacho...' : 'Crear despacho y continuar →'}
                        </button>
                    </form>
                </div>
            </div>
        </ThemeProvider>
    );
};

export default OnboardingPage;
