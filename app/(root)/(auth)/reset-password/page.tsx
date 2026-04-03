'use client';

import {Suspense, useEffect, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {toast} from 'sonner';
import {useFetch} from '@/hooks/useFetch';
import {ArrowBack, Eye, EyeClosed, Lock} from '@/app/components/svg';
import styles from '../form.module.css';

const ResetPasswordForm = () =>
{
    const router       = useRouter();
    const searchParams = useSearchParams();
    const token        = searchParams.get('token') ?? '';

    const [password,        setPassword]        = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword,    setShowPassword]    = useState(false);
    const [done,            setDone]            = useState(false);

    const {execute, isLoading, error} = useFetch<{message: string}>('auth/reset-password', {
        method:    'POST',
        immediate: false,
    });

    useEffect(() => { if (error) toast.error(error); }, [error]);

    const handleSubmit = async (e: React.FormEvent) =>
    {
        e.preventDefault();

        if (password !== confirmPassword)
        {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        if (!token)
        {
            toast.error('Enlace de recuperación inválido');
            return;
        }

        const result = await execute({body: {token, newPassword: password}});
        if (!result) return;

        setDone(true);
        toast.success('Contraseña actualizada correctamente');
        setTimeout(() => router.push('/signin'), 2000);
    };

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <Image src="/logo.png" alt="LegalDocs" width={130} height={44} className={styles.logo} priority />
                <h1 className={styles.title}>Nueva contraseña</h1>
                <p className={styles.subtitle}>Elige una contraseña segura para tu cuenta.</p>
            </div>

            {done ? (
                <div className={styles.successMsg}>
                    Contraseña actualizada. Redirigiendo a inicio de sesión...
                </div>
            ) : (
                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.field}>
                        <label className={styles.label}>Nueva contraseña</label>
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

                    <div className={styles.field}>
                        <label className={styles.label}>Confirmar contraseña</label>
                        <div className={styles.inputWrapper}>
                            <span className={styles.inputIcon}><Lock /></span>
                            <input
                                className={styles.input}
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Repite tu contraseña"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                            />
                        </div>
                    </div>

                    {error && <p className={styles.errorMsg}>{error}</p>}

                    <button type="submit" className={styles.submit} disabled={isLoading || !token}>
                        {isLoading ? 'Actualizando...' : 'Actualizar contraseña'}
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

const ResetPasswordPage = () =>
{
    return (
        <Suspense fallback={null}>
            <ResetPasswordForm />
        </Suspense>
    );
};

export default ResetPasswordPage;
