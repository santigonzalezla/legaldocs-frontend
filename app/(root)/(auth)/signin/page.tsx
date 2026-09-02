'use client';

import {Suspense, useEffect, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {toast} from 'sonner';
import {useFetch} from '@/hooks/useFetch';
import {useAuth} from '@/context/AuthContext';
import {Eye, EyeClosed, Lock, Mail} from '@/app/components/svg';
import {ALLOW_FIRM_CREATION} from '@/lib/constants';
import type {AuthResponse} from '@/app/interfaces/interfaces';
import styles from '../form.module.css';

const SignInForm = () =>
{
    const router       = useRouter();
    const searchParams = useSearchParams();
    const inviteToken  = searchParams.get('invite') ?? '';
    const inviteEmail  = searchParams.get('email') ?? '';

    const {login, isAuthenticated, isHydrated} = useAuth();
    const [email,        setEmail]        = useState(inviteEmail);
    const [password,     setPassword]     = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const {execute, isLoading, error} = useFetch<AuthResponse>('auth/login', {
        method:    'POST',
        immediate: false,
    });

    useEffect(() =>
    {
        if (!isHydrated || !isAuthenticated) return;
        router.replace(inviteToken ? `/invite?token=${inviteToken}` : '/dashboard');
    }, [isHydrated, isAuthenticated, router, inviteToken]);

    useEffect(() => { if (error) toast.error(error); }, [error]);

    const handleSubmit = async (e: React.FormEvent) =>
    {
        e.preventDefault();
        const result = await execute({body: {email, password}});
        if (!result) return;

        login(result.accessToken, result.refreshToken, result.mustChangePassword);
        toast.success('¡Bienvenido de nuevo!');
        // If came from an invite link, go back to it so it auto-accepts.
        // Si debe cambiar la clave, el PasswordChangeGate del dashboard intercepta.
        router.push(inviteToken ? `/invite?token=${inviteToken}` : '/dashboard');
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
                            readOnly={!!inviteEmail}
                            style={inviteEmail ? {opacity: 0.7, cursor: 'default'} : undefined}
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

            {ALLOW_FIRM_CREATION && (
                <p className={styles.footer}>
                    ¿No tienes cuenta?
                    <Link href={inviteToken ? `/signup?invite=${inviteToken}` : '/signup'} className={styles.footerLink}>
                        Regístrate
                    </Link>
                </p>
            )}
        </div>
    );
};

const SignInPage = () => (
    <Suspense fallback={null}>
        <SignInForm />
    </Suspense>
);

export default SignInPage;
