'use client';

import {useEffect, useRef, useState} from 'react';
import {useRouter} from 'next/navigation';
import Image from 'next/image';
import styles from './nofirmassigned.module.css';
import {useAuth} from '@/context/AuthContext';
import {useFetch} from '@/hooks/useFetch';
import type {DeletedFirm, User as UserType} from '@/app/interfaces/interfaces';
import {ArrowDown, Building, Help, Logout, Mail, RotateBack} from '@/app/components/svg';

const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', {day: '2-digit', month: 'long', year: 'numeric'});

// Se muestra cuando un usuario autenticado no pertenece a ningún despacho.
// No redirige a /onboarding: en el modelo provisionado el despacho lo asigna
// un administrador. Trae un shell mínimo (logo + menú de usuario + footer legal).
const NoFirmAssigned = () =>
{
    const router = useRouter();
    const {logout, setActiveFirm} = useAuth();
    const {data: me} = useFetch<UserType>('user/me');
    const {data: deletedFirms} = useFetch<DeletedFirm[]>('firm/deleted');
    const {execute: restoreFirm} = useFetch<{message: string}>('', {method: 'POST', immediate: false});

    const [menuOpen, setMenuOpen] = useState(false);
    const [restoringId, setRestoringId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const deleted = deletedFirms ?? [];

    useEffect(() =>
    {
        const handler = (e: MouseEvent) =>
        {
            if (menuRef.current && !menuRef.current.contains(e.target as Node))
                setMenuOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = () =>
    {
        logout();
        router.replace('/signin');
    };

    const handleRestore = async (firm: DeletedFirm) =>
    {
        setRestoringId(firm.id);
        const result = await restoreFirm({}, `firm/restore/${firm.id}`);
        setRestoringId(null);
        if (!result) return;
        setActiveFirm(firm.id);
        window.location.reload();
    };

    const initials = me
        ? `${me.firstName?.[0] ?? ''}${me.lastName?.[0] ?? ''}`.toUpperCase() || (me.email?.[0]?.toUpperCase() ?? '')
        : '';
    const fullName = me ? `${me.firstName} ${me.lastName}`.trim() : '';

    return (
        <div className={styles.shell}>
            <header className={styles.topbar}>
                <div className={styles.brand}>
                    <Image
                        src="/logo.png"
                        alt="LegalDocs"
                        width={150}
                        height={38}
                        style={{objectFit: 'contain'}}
                        priority
                    />
                </div>

                <div className={styles.userWrapper} ref={menuRef}>
                    <button className={styles.userButton} onClick={() => setMenuOpen(v => !v)}>
                        <span className={styles.userAvatar}>{initials || '—'}</span>
                        <span className={styles.userTitle}>
                            <span className={styles.userName}>{fullName || 'Mi cuenta'}</span>
                            <span className={styles.userSubtitle}>Sin despacho</span>
                        </span>
                        <span className={`${styles.chevron} ${menuOpen ? styles.chevronOpen : ''}`}>
                            <ArrowDown/>
                        </span>
                    </button>

                    {menuOpen && (
                        <div className={styles.dropdown}>
                            <div className={styles.dropdownHeader}>
                                <div className={styles.dropdownAvatar}>{initials || '—'}</div>
                                <div>
                                    <p className={styles.dropdownName}>{fullName || 'Mi cuenta'}</p>
                                    <p className={styles.dropdownEmail}>{me?.email ?? ''}</p>
                                </div>
                            </div>

                            <div className={styles.dropdownDivider}/>

                            <button
                                className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                                onClick={handleLogout}
                            >
                                <Logout/>
                                Cerrar sesión
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main className={styles.main}>
                <div className={styles.card}>
                    <div className={styles.iconWrap}>
                        <Building/>
                    </div>
                    <h1 className={styles.title}>Todavía no estás en ningún despacho</h1>
                    <p className={styles.subtitle}>
                        Tu cuenta está lista, pero un administrador aún no te asignó a un despacho.
                        Pedile que te agregue a su equipo — apenas lo haga, vas a poder entrar sin
                        hacer nada más.
                    </p>

                    <div className={styles.hint}>
                        <Mail/>
                        <span>¿Esperás una invitación? Revisá tu correo, incluida la carpeta de spam.</span>
                    </div>

                    {deleted.length > 0 && (
                        <div className={styles.recover}>
                            <p className={styles.recoverLabel}>¿Eliminaste un despacho por error?</p>
                            {deleted.map(firm => (
                                <div key={firm.id} className={styles.recoverRow}>
                                    <div className={styles.recoverInfo}>
                                        <span className={styles.recoverName}>{firm.name}</span>
                                        {firm.purgeAt && (
                                            <span className={styles.recoverMeta}>
                                                Se elimina el {formatDate(firm.purgeAt)}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        className={styles.recoverButton}
                                        onClick={() => handleRestore(firm)}
                                        disabled={restoringId === firm.id}
                                    >
                                        <RotateBack/>
                                        {restoringId === firm.id ? 'Restaurando...' : 'Restaurar'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className={styles.actions}>
                        <button className={styles.primary} onClick={() => window.location.reload()}>
                            <RotateBack/> Ya me agregaron — reintentar
                        </button>
                        <button className={styles.secondary} onClick={handleLogout}>
                            <Logout/> Cerrar sesión
                        </button>
                        <a className={styles.support} href="mailto:soporte@legaldocs.com.co">
                            <Help/> Contactar soporte
                        </a>
                    </div>
                </div>
            </main>

            <footer className={styles.footer}>
                <span>© {new Date().getFullYear()} LegalDocs · Plataforma de gestión de documentos legales</span>
                <div className={styles.footerLinks}>
                    <a href="#">Política de privacidad</a>
                    <a href="#">Términos de servicio</a>
                </div>
            </footer>
        </div>
    );
};

export default NoFirmAssigned;
