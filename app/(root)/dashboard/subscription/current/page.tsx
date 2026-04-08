'use client';

import styles from './page.module.css';
import Link from 'next/link';
import {useFetch} from '@/hooks/useFetch';
import {useConfirm} from '@/hooks/useConfirm';
import ConfirmModal from '@/app/components/ui/confirmmodal/ConfirmModal';
import {toast} from 'sonner';
import type {Subscription} from '@/app/interfaces/interfaces';
import {SubscriptionStatus, BillingCycle} from '@/app/interfaces/enums';
import {ArrowGo, Check, Card, Users, File, BookOpen, Legalito} from '@/app/components/svg';

interface Usage {
    documents: {used: number; max: number | null};
    users:     {used: number; max: number | null};
    templates: {used: number; max: number | null};
    aiTokens:  {
        usedDaily: number; maxDaily: number | null;
        usedWeekly: number; maxWeekly: number | null;
        usedMonthly: number; maxMonthly: number | null;
    };
}

const formatTokens = (n: number) =>
{
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
    return String(n);
};

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
    [SubscriptionStatus.TRIAL]:     'Prueba gratuita',
    [SubscriptionStatus.ACTIVE]:    'Activo',
    [SubscriptionStatus.CANCELLED]: 'Cancelado',
    [SubscriptionStatus.EXPIRED]:   'Expirado',
    [SubscriptionStatus.PAST_DUE]:  'Pago vencido',
};

const STATUS_STYLE: Record<SubscriptionStatus, {bg: string; color: string}> = {
    [SubscriptionStatus.TRIAL]:     {bg: '#fef9c3', color: '#ca8a04'},
    [SubscriptionStatus.ACTIVE]:    {bg: '#f0fdf4', color: '#16a34a'},
    [SubscriptionStatus.CANCELLED]: {bg: '#fef2f2', color: '#dc2626'},
    [SubscriptionStatus.EXPIRED]:   {bg: '#f1f5f9', color: '#64748b'},
    [SubscriptionStatus.PAST_DUE]:  {bg: '#fff7ed', color: '#ea580c'},
};

const formatPrice = (n: number | null) =>
    n === 0 || n === null ? 'Gratis' : `$${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} COP`;

const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('es-CO', {day: '2-digit', month: 'long', year: 'numeric'}) : '—';

const daysLeft = (dateStr: string | null) =>
{
    if (!dateStr) return null;
    return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000));
};

const progressPct = (startStr: string | null, endStr: string | null) =>
{
    if (!startStr || !endStr) return 0;
    const start = new Date(startStr).getTime();
    const end   = new Date(endStr).getTime();
    if (end <= start) return 100;
    return Math.min(100, Math.max(0, Math.round(((Date.now() - start) / (end - start)) * 100)));
};

const computeEndDate = (startDate: string, cycle: BillingCycle): string =>
{
    const d = new Date(startDate);
    if (cycle === BillingCycle.ANNUALLY) d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);
    return d.toISOString();
};

const CurrentSubscriptionPage = () =>
{
    const {data: sub, isLoading, execute: refetch} =
        useFetch<Subscription>('subscription/me', {firmScoped: true});

    const {data: usage} =
        useFetch<Usage>('subscription/me/usage', {firmScoped: true});

    const {execute: cancelSub} =
        useFetch<{message: string}>('subscription/me', {method: 'DELETE', immediate: false, firmScoped: true});

    const {confirm, confirmState, handleConfirm, handleCancel} = useConfirm();

    const handleCancelSub = async () =>
    {
        if (!await confirm({
            title:        'Cancelar suscripción',
            message:      '¿Estás seguro de que quieres cancelar? Seguirás teniendo acceso hasta el final del período actual.',
            confirmLabel: 'Sí, cancelar',
            danger:       true,
        })) return;

        const result = await cancelSub();
        if (result !== null) { toast.success('Suscripción cancelada.'); refetch(); }
    };

    if (isLoading)
        return <div className={styles.page}><p className={styles.loading}>Cargando suscripción...</p></div>;

    if (!sub)
        return (
            <div className={styles.page}>
                <div className={styles.emptyState}>
                    <Card />
                    <p>No tienes una suscripción activa.</p>
                    <Link href="/dashboard/subscription/upgrade" className={styles.btnPrimary}>
                        Ver planes <ArrowGo />
                    </Link>
                </div>
            </div>
        );

    const plan        = sub.plan;
    const statusStyle = STATUS_STYLE[sub.status];
    const isActive    = sub.status === SubscriptionStatus.ACTIVE || sub.status === SubscriptionStatus.TRIAL;
    const isAnnual    = sub.billingCycle === BillingCycle.ANNUALLY;
    const features: string[] = Array.isArray(plan.features) ? plan.features : [];

    // ── Expiry bar ───────────────────────────────────────────────
    const expiryBar = (() =>
    {
        if (sub.status === SubscriptionStatus.TRIAL && sub.trialEndsAt)
            return {label: 'Prueba gratuita', endDate: sub.trialEndsAt, start: sub.startDate, color: '#ca8a04', warn: true};

        if (sub.status === SubscriptionStatus.CANCELLED)
        {
            const endDate = sub.endDate ?? sub.trialEndsAt;
            if (endDate)
                return {label: 'Acceso hasta', endDate, start: sub.cancelledAt ?? sub.startDate, color: '#dc2626', warn: true};
        }

        if (sub.status === SubscriptionStatus.ACTIVE)
        {
            const endDate = sub.endDate ?? computeEndDate(sub.startDate, sub.billingCycle);
            return {label: 'Próxima renovación', endDate, start: sub.startDate, color: '#3b82f6', warn: false};
        }

        return null;
    })();

    // ── Limit cards ──────────────────────────────────────────────
    const aiUsedMonthly = usage?.aiTokens.usedMonthly  ?? null;
    const aiMaxMonthly  = usage?.aiTokens.maxMonthly   ?? null;

    const limits = [
        {
            icon:       <File />,
            label:      'Documentos este mes',
            used:       usage?.documents.used  ?? null,
            max:        usage?.documents.max   ?? plan.maxDocuments,
            formatter:  (n: number) => String(n),
        },
        {
            icon:       <Users />,
            label:      'Usuarios activos',
            used:       usage?.users.used      ?? null,
            max:        usage?.users.max       ?? plan.maxUsers,
            formatter:  (n: number) => String(n),
        },
        {
            icon:       <BookOpen />,
            label:      'Plantillas personalizadas',
            used:       usage?.templates.used  ?? null,
            max:        usage?.templates.max   ?? plan.maxTemplates,
            formatter:  (n: number) => String(n),
        },
        {
            icon:       <Legalito />,
            label:      'Tokens IA este mes',
            used:       aiUsedMonthly,
            max:        aiMaxMonthly,
            formatter:  formatTokens,
            showAsPct:  true,
        },
    ];

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1>Mi Suscripción</h1>
                    <p>Gestiona tu plan y facturación.</p>
                </div>
                <Link href="/dashboard/subscription/upgrade" className={styles.btnPrimary}>
                    {isActive ? 'Mejorar plan' : 'Reactivar plan'} <ArrowGo />
                </Link>
            </div>

            {/* ── Expiry bar ── */}
            {expiryBar && (() =>
            {
                const days = daysLeft(expiryBar.endDate);
                const pct  = progressPct(expiryBar.start, expiryBar.endDate);
                return (
                    <div className={`${styles.expiryBanner} ${expiryBar.warn ? styles.expiryBannerWarn : ''}`}>
                        <div className={styles.expiryBannerTop}>
                            <span className={styles.expiryLabel}>
                                {expiryBar.label}: <strong>{formatDate(expiryBar.endDate)}</strong>
                            </span>
                            <span className={styles.expiryDays}>
                                {days === 0 ? 'Vence hoy' : `${days} día${days !== 1 ? 's' : ''} restante${days !== 1 ? 's' : ''}`}
                            </span>
                        </div>
                        <div className={styles.progressTrack}>
                            <div className={styles.progressFill} style={{width: `${pct}%`, background: expiryBar.color}} />
                        </div>
                    </div>
                );
            })()}

            {/* ── Plan card ── */}
            <div className={styles.planCard}>
                <div className={styles.planCardTop}>
                    <div className={styles.planInfo}>
                        <div className={styles.planNameRow}>
                            <h2 className={styles.planName}>{plan.displayName}</h2>
                            <span className={styles.statusBadge} style={{backgroundColor: statusStyle.bg, color: statusStyle.color}}>
                                {STATUS_LABEL[sub.status]}
                            </span>
                        </div>
                        <p className={styles.planDesc}>{plan.description}</p>
                    </div>
                    <div className={styles.planPricing}>
                        <span className={styles.planPrice}>
                            {formatPrice(isAnnual ? plan.priceAnnually : plan.priceMonthly)}
                        </span>
                        {(plan.priceMonthly ?? 0) > 0 && (
                            <span className={styles.planCycle}>
                                / mes · {isAnnual ? 'facturación anual' : 'facturación mensual'}
                            </span>
                        )}
                    </div>
                </div>

                <div className={styles.planMeta}>
                    {sub.status === SubscriptionStatus.TRIAL && sub.trialEndsAt && (
                        <span className={styles.metaItem}>Prueba hasta: <strong>{formatDate(sub.trialEndsAt)}</strong></span>
                    )}
                    {sub.status === SubscriptionStatus.ACTIVE && sub.endDate && (
                        <span className={styles.metaItem}>Próxima renovación: <strong>{formatDate(sub.endDate)}</strong></span>
                    )}
                    {sub.status === SubscriptionStatus.CANCELLED && sub.cancelledAt && (
                        <span className={styles.metaItem}>Cancelado el: <strong>{formatDate(sub.cancelledAt)}</strong></span>
                    )}
                    <span className={styles.metaItem}>Activo desde: <strong>{formatDate(sub.startDate)}</strong></span>
                </div>
            </div>

            {/* ── Limits ── */}
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Uso del plan</h3>
                <div className={styles.limitsGrid}>
                    {limits.map((l, i) =>
                    {
                        const pct = l.used !== null && l.max !== null
                            ? Math.min(100, Math.round((l.used / l.max) * 100))
                            : null;
                        const isUnlimited = l.max === null;
                        const isNearLimit = pct !== null && pct >= 80;

                        return (
                            <div key={i} className={styles.limitCard}>
                                <div className={styles.limitCardTop}>
                                    <div className={styles.limitIcon}>{l.icon}</div>
                                    <div className={styles.limitInfo}>
                                        <span className={styles.limitLabel}>{l.label}</span>
                                        {'showAsPct' in l && l.showAsPct
                                            ? (
                                                <div className={styles.limitPctRow}>
                                                    <span className={styles.limitValue} style={{color: isNearLimit ? '#ef4444' : undefined}}>
                                                        {pct !== null ? `${pct}%` : '—'}
                                                    </span>
                                                    <span className={styles.limitMax}>/ 100%</span>
                                                </div>
                                            )
                                            : (
                                                <span className={styles.limitValue}>
                                                    {l.used !== null ? l.formatter(l.used) : '—'}
                                                    <span className={styles.limitMax}>
                                                        {isUnlimited ? ' / ∞' : l.max !== null ? ` / ${l.formatter(l.max)}` : ''}
                                                    </span>
                                                </span>
                                            )
                                        }
                                    </div>
                                </div>
                                {!isUnlimited && pct !== null && (
                                    <div className={styles.limitTrack}>
                                        <div
                                            className={styles.limitFill}
                                            style={{
                                                width:      `${pct}%`,
                                                background: isNearLimit ? '#ef4444' : 'var(--primary-color)',
                                            }}
                                        />
                                    </div>
                                )}
                                {isUnlimited && (
                                    <div className={styles.limitTrack}>
                                        <div className={styles.limitFillUnlimited} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ── Features ── */}
            {features.length > 0 && (
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Incluido en tu plan</h3>
                    <div className={styles.featuresList}>
                        {features.map((f, i) => (
                            <div key={i} className={styles.featureItem}>
                                <Check className={styles.featureCheck} />
                                <span>{f}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Cancel zone ── */}
            {sub.status === SubscriptionStatus.ACTIVE && (
                <div className={styles.dangerZone}>
                    <div>
                        <p className={styles.dangerTitle}>Cancelar suscripción</p>
                        <p className={styles.dangerDesc}>
                            Tendrás acceso hasta el final del período actual. No se realizarán más cobros.
                        </p>
                    </div>
                    <button className={styles.btnDanger} onClick={handleCancelSub}>
                        Cancelar suscripción
                    </button>
                </div>
            )}

            {confirmState && (
                <ConfirmModal
                    title={confirmState.title}
                    message={confirmState.message}
                    confirmLabel={confirmState.confirmLabel}
                    danger={confirmState.danger}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
        </div>
    );
};

export default CurrentSubscriptionPage;
