'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormContext } from '@/context/FormContext';
import styles from './unsavedchangesguard.module.css';
import { Save, X } from '@/app/components/svg';

const UnsavedChangesGuard = () =>
{
    const { documentState, saveDocument } = useFormContext();
    const { hasUnsavedChanges } = documentState;
    const router = useRouter();

    const [pendingHref, setPendingHref] = useState<string | null>(null);
    const [showModal,   setShowModal]   = useState(false);

    // ── Browser-level navigation (refresh, tab close, browser back) ───────────
    useEffect(() =>
    {
        if (!hasUnsavedChanges) return;
        const handler = (e: BeforeUnloadEvent) =>
        {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [hasUnsavedChanges]);

    // ── In-app navigation (sidebar links, etc.) ───────────────────────────────
    useEffect(() =>
    {
        if (!hasUnsavedChanges) return;

        const handleClick = (e: MouseEvent) =>
        {
            const link = (e.target as HTMLElement).closest('a[href]');
            if (!link) return;

            const href = link.getAttribute('href') ?? '';
            if (!href || href.startsWith('#')) return;

            // Ignore same-page links
            if (href === window.location.pathname) return;

            e.preventDefault();
            e.stopPropagation();
            setPendingHref(href);
            setShowModal(true);
        };

        document.addEventListener('click', handleClick, true);
        return () => document.removeEventListener('click', handleClick, true);
    }, [hasUnsavedChanges]);

    const navigate = (href: string) =>
    {
        setShowModal(false);
        setPendingHref(null);
        router.push(href);
    };

    const handleLeave = () =>
    {
        if (pendingHref) navigate(pendingHref);
    };

    const handleSaveAndLeave = () =>
    {
        saveDocument();
        if (pendingHref) navigate(pendingHref);
    };

    const handleCancel = () =>
    {
        setShowModal(false);
        setPendingHref(null);
    };

    if (!showModal) return null;

    return (
        <div className={styles.overlay} onClick={handleCancel}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>

                <div className={styles.header}>
                    <div className={styles.iconWrapper}>
                        <Save className={styles.icon} />
                    </div>
                    <button className={styles.closeBtn} onClick={handleCancel}>
                        <X className={styles.closeIcon} />
                    </button>
                </div>

                <div className={styles.body}>
                    <h2 className={styles.title}>¿Salir sin guardar?</h2>
                    <p className={styles.description}>
                        Tienes cambios sin guardar en este documento. Si sales ahora, se perderán.
                    </p>
                </div>

                <div className={styles.actions}>
                    <button className={styles.btnLeave} onClick={handleLeave}>
                        Sí, salir
                    </button>
                    <button className={styles.btnCancel} onClick={handleCancel}>
                        Cancelar
                    </button>
                    <button className={styles.btnSave} onClick={handleSaveAndLeave}>
                        <Save className={styles.btnSaveIcon} />
                        Guardar y salir
                    </button>
                </div>

            </div>
        </div>
    );
};

export default UnsavedChangesGuard;
