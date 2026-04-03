'use client';

import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {toast} from 'sonner';
import {useFetch} from '@/hooks/useFetch';
import {useAuth} from '@/context/AuthContext';
import {Eye, EyeClosed, Lock, Mail, User} from '@/app/components/svg';
import styles from '../form.module.css';

interface RegisterResponse
{
    accessToken:  string;
    refreshToken: string;
}

const SignUpPage = () =>
{
    const router = useRouter();
    const {login, isAuthenticated, isHydrated} = useAuth();
    const [firstName,    setFirstName]    = useState('');
    const [lastName,     setLastName]     = useState('');
    const [email,        setEmail]        = useState('');
    const [password,     setPassword]     = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const {execute, isLoading, error} = useFetch<RegisterResponse>('auth/register', {
        method:    'POST',
        immediate: false,
    });

    useEffect(() =>
    {
        if (isHydrated && isAuthenticated) router.replace('/dashboard');
    }, [isHydrated, isAuthenticated, router]);

    useEffect(() => { if (error) toast.error(error); }, [error]);

    const handleSubmit = async (e: React.FormEvent) =>
    {
        e.preventDefault();
        const result = await execute({body: {firstName, lastName, email, password}});
        if (!result) return;

        login(result.accessToken, result.refreshToken);
        toast.success('¡Cuenta creada! Revisa tu correo para verificarla.');
        router.push('/dashboard');
    };

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <Image
                    src="/logo.png"
                    alt="LegalDocs"
                    width={200}
                    height={100}
                    className={styles.logo}
                    style={{objectFit: 'cover'}}
                    priority
                />
                <h1 className={styles.title}>Crea tu cuenta</h1>
                <p className={styles.subtitle}>Empieza a automatizar tu práctica legal</p>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.row}>
                    <div className={styles.field}>
                        <label className={styles.label}>Nombre</label>
                        <div className={styles.inputWrapper}>
                            <span className={styles.inputIcon}><User /></span>
                            <input
                                className={styles.input}
                                type="text"
                                placeholder="Juan"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                                autoComplete="given-name"
                            />
                        </div>
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>Apellido</label>
                        <div className={styles.inputWrapper}>
                            <span className={styles.inputIcon}><User /></span>
                            <input
                                className={styles.input}
                                type="text"
                                placeholder="Pérez"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                                autoComplete="family-name"
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Correo electrónico</label>
                    <div className={styles.inputWrapper}>
                        <span className={styles.inputIcon}><Mail /></span>
                        <input
                            className={styles.input}
                            type="email"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Contraseña</label>
                    <div className={styles.inputWrapper}>
                        <span className={styles.inputIcon}><Lock /></span>
                        <input
                            className={styles.input}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Mínimo 8 caracteres"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                        />
                        <button type="button" className={styles.eyeToggle} onClick={() => setShowPassword((p) => !p)}>
                            {showPassword ? <EyeClosed /> : <Eye />}
                        </button>
                    </div>
                </div>

                {error && <p className={styles.errorMsg}>{error}</p>}

                <button type="submit" className={styles.submit} disabled={isLoading}>
                    {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
                </button>
            </form>

            <p className={styles.footer}>
                ¿Ya tienes cuenta?{' '}
                <Link href="/signin" className={styles.footerLink}>Inicia sesión</Link>
            </p>
        </div>
    );
};

export default SignUpPage;
