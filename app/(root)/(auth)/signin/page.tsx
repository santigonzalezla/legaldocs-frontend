'use client';

import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {toast} from 'sonner';
import {useFetch} from '@/hooks/useFetch';
import {useAuth} from '@/context/AuthContext';
import {Eye, EyeClosed, Lock, Mail} from '@/app/components/svg';
import styles from '../form.module.css';

interface LoginResponse
{
    accessToken:  string;
    refreshToken: string;
}

const SignInPage = () =>
{
    const router = useRouter();
    const {login, isAuthenticated, isHydrated} = useAuth();
    const [email,        setEmail]        = useState('');
    const [password,     setPassword]     = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const {execute, isLoading, error} = useFetch<LoginResponse>('auth/login', {
        method:    'POST',
        immediate: false,
    });

    // Redirigir si ya tiene sesión
    useEffect(() =>
    {
        if (isHydrated && isAuthenticated) router.replace('/dashboard');
    }, [isHydrated, isAuthenticated, router]);

    useEffect(() => { if (error) toast.error(error); }, [error]);

    const handleSubmit = async (e: React.FormEvent) =>
    {
        e.preventDefault();
        const result = await execute({body: {email, password}});
        if (!result) return;

        login(result.accessToken, result.refreshToken);
        toast.success('¡Bienvenido de nuevo!');
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
                <h1 className={styles.title}>Inicia sesión</h1>
                <p className={styles.subtitle}>Accede a tu plataforma legal</p>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
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
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                        <button type="button" className={styles.eyeToggle} onClick={() => setShowPassword((p) => !p)}>
                            {showPassword ? <EyeClosed /> : <Eye />}
                        </button>
                    </div>
                </div>

                <Link href="/forgot-password" className={styles.forgotLink}>
                    ¿Olvidaste tu contraseña?
                </Link>

                {error && <p className={styles.errorMsg}>{error}</p>}

                <button type="submit" className={styles.submit} disabled={isLoading}>
                    {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </button>
            </form>

            <p className={styles.footer}>
                ¿No tienes cuenta?
                <Link href="/signup" className={styles.footerLink}>Regístrate</Link>
            </p>
        </div>
    );
};

export default SignInPage;
