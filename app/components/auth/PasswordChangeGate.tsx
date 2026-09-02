'use client';

import {useEffect, useState} from 'react';
import Image from 'next/image';
import {toast} from 'sonner';
import layout from '@/app/(root)/(auth)/layout.module.css';
import styles from '@/app/(root)/(auth)/form.module.css';
import {useFetch} from '@/hooks/useFetch';
import {useAuth} from '@/context/AuthContext';
import {Alert, Eye, EyeClosed, Lock} from '@/app/components/svg';

const benefits = [
    'Genera contratos y documentos legales en minutos',
    'Cumplimiento normativo colombiano garantizado',
    'Gestiona tu despacho desde un solo lugar',
];

type FieldErrors = {current?: string; next?: string; confirm?: string};

// Intercepta el dashboard cuando el usuario tiene una clave temporal
// (mustChangePassword). Reusa el layout partido y los estilos de las páginas
// de autenticación (signup/signin).
const PasswordChangeGate = ({children}: {children: React.ReactNode}) =>
{
    const {isHydrated, mustChangePassword, clearMustChangePassword} = useAuth();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword,     setNewPassword]     = useState('');
    const [confirm,         setConfirm]         = useState('');
    const [errs,            setErrs]            = useState<FieldErrors>({});
    const [showCurrent,     setShowCurrent]     = useState(false);
    const [showNew,         setShowNew]         = useState(false);
    const [showConfirm,     setShowConfirm]     = useState(false);

    const {execute, isLoading, error} = useFetch<{message: string}>('user/me/password', {
        method:    'PATCH',
        immediate: false,
    });

    // El backend valida la contraseña temporal → el error va bajo ese campo.
    useEffect(() =>
    {
        if (error) setErrs(prev => ({...prev, current: error}));
    }, [error]);

    if (!isHydrated) return null;
    if (!mustChangePassword) return <>{children}</>;

    const handleSubmit = async (e: React.FormEvent) =>
    {
        e.preventDefault();

        const next: FieldErrors = {};
        if (newPassword.length < 8) next.next = 'Debe tener al menos 8 caracteres.';
        if (confirm && newPassword !== confirm) next.confirm = 'Las contraseñas no coinciden.';

        if (Object.keys(next).length)
        {
            setErrs(next);
            return;
        }

        setErrs({});
        const result = await execute({body: {currentPassword, newPassword}});
        if (!result) return;

        toast.success('Contraseña actualizada. ¡Bienvenido!');
        clearMustChangePassword();
    };

    return (
        <div className={layout.wrapper} style={{position: 'fixed', inset: 0, zIndex: 60}}>
            <div className={layout.left}>
                <div className={layout.leftContent}>
                    <div className={layout.hero}>
                        <h1 className={layout.heroTitle}>Automatiza tu práctica legal</h1>
                        <p className={layout.heroSubtitle}>
                            La plataforma diseñada para abogados colombianos que quieren trabajar más inteligente.
                        </p>
                        <ul className={layout.benefits}>
                            {benefits.map((b) => (
                                <li key={b} className={layout.benefit}>
                                    <span className={layout.benefitDot} />
                                    {b}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className={layout.imageWrapper}>
                        <Image
                            src="/bglogin.png"
                            alt="Documentos legales"
                            width={430}
                            height={350}
                            className={layout.heroImage}
                            style={{objectFit: 'fill'}}
                            priority
                        />
                    </div>
                </div>
            </div>

            <div className={layout.right}>
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
                        <h1 className={styles.title}>Genera tu contraseña</h1>
                        <p className={styles.subtitle}>
                            Ingresaste con una contraseña temporal. Por seguridad, elegí una nueva para continuar.
                        </p>
                    </div>

                    <form className={styles.form} onSubmit={handleSubmit} noValidate>
                        <div className={styles.field}>
                            <label className={styles.label}>Contraseña temporal</label>
                            <div className={`${styles.inputWrapper} ${errs.current ? styles.inputWrapperError : ''}`}>
                                <span className={styles.inputIcon}><Lock /></span>
                                <input
                                    className={styles.input}
                                    type={showCurrent ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => { setCurrentPassword(e.target.value); setErrs((x) => ({...x, current: undefined})); }}
                                    required
                                    autoComplete="current-password"
                                />
                                <button type="button" className={styles.eyeToggle} onClick={() => setShowCurrent((p) => !p)}>
                                    {showCurrent ? <EyeClosed /> : <Eye />}
                                </button>
                            </div>
                            {errs.current && <p className={styles.fieldError}><Alert /> {errs.current}</p>}
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Nueva contraseña</label>
                            <div className={`${styles.inputWrapper} ${errs.next ? styles.inputWrapperError : ''}`}>
                                <span className={styles.inputIcon}><Lock /></span>
                                <input
                                    className={styles.input}
                                    type={showNew ? 'text' : 'password'}
                                    placeholder="Mínimo 8 caracteres"
                                    value={newPassword}
                                    onChange={(e) => { setNewPassword(e.target.value); setErrs((x) => ({...x, next: undefined})); }}
                                    required
                                    autoComplete="new-password"
                                />
                                <button type="button" className={styles.eyeToggle} onClick={() => setShowNew((p) => !p)}>
                                    {showNew ? <EyeClosed /> : <Eye />}
                                </button>
                            </div>
                            {errs.next && <p className={styles.fieldError}><Alert /> {errs.next}</p>}
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Confirmar nueva contraseña</label>
                            <div className={`${styles.inputWrapper} ${errs.confirm ? styles.inputWrapperError : ''}`}>
                                <span className={styles.inputIcon}><Lock /></span>
                                <input
                                    className={styles.input}
                                    type={showConfirm ? 'text' : 'password'}
                                    value={confirm}
                                    onChange={(e) => { setConfirm(e.target.value); setErrs((x) => ({...x, confirm: undefined})); }}
                                    required
                                    autoComplete="new-password"
                                />
                                <button type="button" className={styles.eyeToggle} onClick={() => setShowConfirm((p) => !p)}>
                                    {showConfirm ? <EyeClosed /> : <Eye />}
                                </button>
                            </div>
                            <p className={`${styles.fieldError} ${styles.fieldErrorReserved}`}>
                                {errs.confirm && <><Alert /> {errs.confirm}</>}
                            </p>
                        </div>

                        <button
                            type="submit"
                            className={styles.submit}
                            style={{marginTop: 6}}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Guardando...' : 'Guardar y continuar'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PasswordChangeGate;
