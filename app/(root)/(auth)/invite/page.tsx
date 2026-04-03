'use client';

import {Suspense, useEffect, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {useFetch} from '@/hooks/useFetch';
import {useAuth} from '@/context/AuthContext';
import {ArrowBack, Briefcase, Check} from '@/app/components/svg';
import styles from '../form.module.css';

const InviteForm = () =>
{
    const router       = useRouter();
    const searchParams = useSearchParams();
    const token        = searchParams.get('token') ?? '';

    const {isAuthenticated, isHydrated} = useAuth();
    const [accepted, setAccepted]       = useState(false);

    const {execute, isLoading, error} = useFetch<{message: string}>(
        `firm/me/members/accept?token=${token}`,
        {method: 'POST', immediate: false},
    );

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
                        href={`/signin`}
                        className={styles.submit}
                        style={{textAlign: 'center', textDecoration: 'none', display: 'block'}}>
                        Iniciar sesión
                    </Link>
                    <Link
                        href={`/signup`}
                        className={styles.submit}
                        style={{textAlign: 'center', textDecoration: 'none', display: 'block', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)'}}>
                        Crear cuenta nueva
                    </Link>
                </div>

                <p className={styles.footer} style={{marginTop: '1rem', fontSize: '0.75rem'}}>
                    Después de iniciar sesión, regresa a este enlace para aceptar la invitación.
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

const InvitePage = () =>
{
    return (
        <Suspense fallback={null}>
            <InviteForm />
        </Suspense>
    );
};

export default InvitePage;
