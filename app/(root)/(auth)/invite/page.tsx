'use client';

import {Suspense, useEffect, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {useFetch} from '@/hooks/useFetch';
import {useAuth} from '@/context/AuthContext';
import {ALLOW_FIRM_CREATION, API_BASE_URL} from '@/lib/constants';
import {ArrowBack, Briefcase, Check} from '@/app/components/svg';
import styles from '../form.module.css';

const InviteForm = () =>
{
    const router       = useRouter();
    const searchParams = useSearchParams();
    const token        = searchParams.get('token') ?? '';
    const email        = searchParams.get('email') ?? '';

    const {isAuthenticated, isHydrated} = useAuth();
    const [accepted, setAccepted]       = useState(false);
    const [checking, setChecking]       = useState(false);

    const {execute, isLoading, error} = useFetch<{message: string}>(
        `firm/me/members/accept?token=${token}`,
        {method: 'POST', immediate: false},
    );

    // Auto-accept when already authenticated
    useEffect(() =>
    {
        if (!isHydrated || !isAuthenticated || !token || accepted) return;

        execute().then(result =>
        {
            if (!result) return;
            setAccepted(true);
            setTimeout(() => router.push('/dashboard'), 3000);
        });
    }, [isHydrated, isAuthenticated]);

    // Auto-detect account and redirect to the right page
    useEffect(() =>
    {
        if (!isHydrated || isAuthenticated || !token || !email) return;

        setChecking(true);
        fetch(`${API_BASE_URL}/auth/check-email?email=${encodeURIComponent(email)}`)
            .then(r => r.json())
            .then(({exists}: {exists: boolean}) =>
            {
                // En el modelo provisionado el invitado ya tiene cuenta → siempre a signin.
                const dest = (exists || !ALLOW_FIRM_CREATION)
                    ? `/signin?invite=${token}&email=${encodeURIComponent(email)}`
                    : `/signup?invite=${token}&email=${encodeURIComponent(email)}`;
                router.replace(dest);
            })
            .catch(() => setChecking(false));
    }, [isHydrated, isAuthenticated, token, email]);

    if (!token)
    {
        return (
            <div className={styles.card}>
                <div className={styles.header}>
                    <Image src="/logo.png" alt="LegalDocs" width={130} height={44} className={styles.logo} priority />
                    <h1 className={styles.title}>Enlace inválido</h1>
                    <p className={styles.subtitle}>Este enlace de invitación no es válido o ya expiró.</p>
                </div>
                <p className={styles.footer}>
                    <Link href="/signin" className={styles.footerLink} style={{display: 'inline-flex', alignItems: 'center', gap: 4}}>
                        <ArrowBack /> Ir a inicio de sesión
                    </Link>
                </p>
            </div>
        );
    }

    if (accepted)
    {
        return (
            <div className={styles.card}>
                <div className={styles.header}>
                    <div style={{
                        width: 56, height: 56, borderRadius: '50%',
                        background: 'rgba(16,185,129,0.12)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        color: '#10b981', marginBottom: '0.5rem',
                    }}>
                        <Check />
                    </div>
                    <h1 className={styles.title}>¡Te uniste al despacho!</h1>
                    <p className={styles.subtitle}>Ya eres parte del equipo. Redirigiendo al dashboard...</p>
                </div>
                <div className={styles.successMsg}>
                    Acceso concedido correctamente. En unos segundos serás redirigido.
                </div>
            </div>
        );
    }

    // Unauthenticated with email — redirect is happening automatically, show spinner
    if (isHydrated && !isAuthenticated && email)
    {
        return (
            <div className={styles.card}>
                <div className={styles.header}>
                    <Image src="/logo.png" alt="LegalDocs" width={130} height={44} className={styles.logo} priority />
                    <h1 className={styles.title}>Invitación a despacho</h1>
                    <p className={styles.subtitle}>{checking ? 'Verificando tu cuenta...' : 'Preparando tu acceso...'}</p>
                </div>
            </div>
        );
    }

    // Unauthenticated without email — show manual buttons as fallback
    if (isHydrated && !isAuthenticated)
    {
        return (
            <div className={styles.card}>
                <div className={styles.header}>
                    <Image src="/logo.png" alt="LegalDocs" width={130} height={44} className={styles.logo} priority />
                    <h1 className={styles.title}>Invitación a despacho</h1>
                    <p className={styles.subtitle}>Necesitas iniciar sesión para aceptar esta invitación.</p>
                </div>

                <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                    <Link
                        href={`/signin?invite=${token}`}
                        className={styles.submit}
                        style={{textAlign: 'center', textDecoration: 'none', display: 'block'}}>
                        Iniciar sesión
                    </Link>
                    {ALLOW_FIRM_CREATION && (
                        <Link
                            href={`/signup?invite=${token}`}
                            className={styles.submit}
                            style={{textAlign: 'center', textDecoration: 'none', display: 'block', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)'}}>
                            Crear cuenta nueva
                        </Link>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'rgba(59,130,246,0.12)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: '#3b82f6', marginBottom: '0.5rem',
                }}>
                    <Briefcase />
                </div>
                <h1 className={styles.title}>Invitación a despacho</h1>
                <p className={styles.subtitle}>
                    {isLoading ? 'Procesando tu invitación...' : 'Verificando invitación...'}
                </p>
            </div>

            {isLoading && (
                <p style={{textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem'}}>
                    Por favor espera un momento.
                </p>
            )}

            {error && (
                <>
                    <p className={styles.errorMsg}>{error}</p>
                    <p className={styles.footer}>
                        <Link href="/signin" className={styles.footerLink} style={{display: 'inline-flex', alignItems: 'center', gap: 4}}>
                            <ArrowBack /> Volver a inicio de sesión
                        </Link>
                    </p>
                </>
            )}
        </div>
    );
};

const InvitePage = () => (
    <Suspense fallback={null}>
        <InviteForm />
    </Suspense>
);

export default InvitePage;
