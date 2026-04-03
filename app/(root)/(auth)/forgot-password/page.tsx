'use client';

import {useEffect, useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {toast} from 'sonner';
import {useFetch} from '@/hooks/useFetch';
import {ArrowBack, Mail} from '@/app/components/svg';
import styles from '../form.module.css';

const ForgotPasswordPage = () =>
{
    const [email, setEmail] = useState('');
    const [sent,  setSent]  = useState(false);

    const {execute, isLoading, error} = useFetch<{message: string}>('auth/request-password-reset', {
        method:    'POST',
        immediate: false,
    });

    useEffect(() => { if (error) toast.error(error); }, [error]);

    const handleSubmit = async (e: React.FormEvent) =>
    {
        e.preventDefault();
        const result = await execute({body: {email}});
        if (!result) return;

        setSent(true);
        toast.success('Correo de recuperación enviado');
    };

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <Image src="/logo.png" alt="LegalDocs" width={130} height={44} className={styles.logo} priority />
                <h1 className={styles.title}>Recuperar contraseña</h1>
                <p className={styles.subtitle}>
                    Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
                </p>
            </div>

            {sent ? (
                <div className={styles.successMsg}>
                    Revisá tu bandeja de entrada en <strong>{email}</strong>. Si tienes cuenta, recibirás el enlace en unos minutos.
                </div>
            ) : (
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

                    {error && <p className={styles.errorMsg}>{error}</p>}

                    <button type="submit" className={styles.submit} disabled={isLoading}>
                        {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                    </button>
                </form>
            )}

            <p className={styles.footer}>
                <Link href="/signin" className={styles.footerLink} style={{display: 'inline-flex', alignItems: 'center', gap: 4}}>
                    <ArrowBack />
                    Volver a iniciar sesión
                </Link>
            </p>
        </div>
    );
};

export default ForgotPasswordPage;
