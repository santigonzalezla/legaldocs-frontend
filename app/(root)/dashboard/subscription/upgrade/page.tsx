'use client';

import {useState, useEffect} from 'react';
import styles from './page.module.css';
import {useFetch} from '@/hooks/useFetch';
import {useConfirm} from '@/hooks/useConfirm';
import ConfirmModal from '@/app/components/ui/confirmmodal/ConfirmModal';
import {toast} from 'sonner';
import type {SubscriptionPlan, Subscription} from '@/app/interfaces/interfaces';
import {BillingCycle, SubscriptionStatus} from '@/app/interfaces/enums';
import {Check, ArrowGo, Crown} from '@/app/components/svg';

const formatPrice = (n: number | null) =>
    n === 0 || n === null ? 'Gratis' : `$${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} COP`;

const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('es-CO', {day: '2-digit', month: 'long', year: 'numeric'}) : '—';

const daysLeft = (dateStr: string | null) =>
    dateStr ? Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000)) : null;

const progressPct = (startStr: string, endStr: string) =>
{
    const start = new Date(startStr).getTime();
    const end   = new Date(endStr).getTime();
    if (end <= start) return 100;
    return Math.min(100, Math.max(0, Math.round(((Date.now() - start) / (end - start)) * 100)));
};

const UpgradePage = () =>
{
    const [cycle, setCycle] = useState<BillingCycle>(BillingCycle.MONTHLY);

    const {data: plans, isLoading: loadingPlans} =
        useFetch<SubscriptionPlan[]>('subscription/plans', {firmScoped: false});

    const {data: currentSub, execute: refetchSub} =
        useFetch<Subscription>('subscription/me', {firmScoped: true});

    const {execute: subscribe} =
        useFetch<object>('subscription/me', {method: 'POST', immediate: false, firmScoped: true});

    const {execute: changePlan} =
        useFetch<object>('subscription/me', {method: 'PATCH', immediate: false, firmScoped: true});

    const {confirm, confirmState, handleConfirm, handleCancel} = useConfirm();

    useEffect(() =>
    {
        if (currentSub?.billingCycle) setCycle(currentSub.billingCycle);
    }, [currentSub?.billingCycle]);

    const handleSelect = async (plan: SubscriptionPlan) =>
    {
        const isCurrent = !!currentSub
            && currentSub.status === SubscriptionStatus.ACTIVE
            && currentSub.planId === plan.id
            && currentSub.billingCycle === cycle;
        if (isCurrent) return;

        const price      = cycle === BillingCycle.ANNUALLY ? plan.priceAnnually : plan.priceMonthly;
        const priceLabel = formatPrice(price);

        if (!await confirm({
            title:        `Cambiar a ${plan.displayName}`,
            message:      `¿Confirmas el cambio al plan ${plan.displayName} (${priceLabel}/mes, ${cycle === BillingCycle.ANNUALLY ? 'facturación anual' : 'facturación mensual'})?`,
            confirmLabel: 'Confirmar cambio',
            danger:       false,
        })) return;

        const body   = {planId: plan.id, billingCycle: cycle};
        const result = currentSub
            ? await changePlan({body})
            : await subscribe({body});
        if (result !== null)
        {
            toast.success(`Plan cambiado a ${plan.displayName}.`);
            refetchSub();
        }
    };

    const sortedPlans = [...(plans ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

    const annualSavingsPct = (plan: SubscriptionPlan) =>
    {
        if (!plan.priceMonthly || !plan.priceAnnually || plan.priceMonthly === 0) return 0;
        const monthly12 = plan.priceMonthly * 12;
        const annual12  = plan.priceAnnually * 12;
        return Math.round((1 - annual12 / monthly12) * 100);
    };

    if (loadingPlans)
        return <div className={styles.page}><p className={styles.loading}>Cargando planes...</p></div>;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1>Mejorar plan</h1>
                    <p>Elige el plan que mejor se adapte a tu despacho.</p>
                </div>
            </div>

            {/* ── Trial banner ── */}
            {currentSub?.status === SubscriptionStatus.TRIAL && currentSub.trialEndsAt && (() =>
            {
                const days = daysLeft(currentSub.trialEndsAt);
                const pct  = progressPct(currentSub.startDate, currentSub.trialEndsAt);
                return (
                    <div className={styles.trialBanner}>
                        <div className={styles.trialBannerBody}>
                            <div className={styles.trialBannerLeft}>
                                <span className={styles.trialBannerTag}>Prueba gratuita activa</span>
                                <p className={styles.trialBannerMsg}>
                                    Tienes los mismos beneficios que el plan <strong>Básico</strong> durante 14 días.
                                    Mejora tu plan para desbloquear más funciones.
                                </p>
                            </div>
                            <div className={styles.trialBannerRight}>
                                <span className={styles.trialDays}>{days} día{days !== 1 ? 's' : ''}</span>
                                <span className={styles.trialEnd}>Termina el {formatDate(currentSub.trialEndsAt)}</span>
                            </div>
                        </div>
                        <div className={styles.trialTrack}>
                            <div className={styles.trialFill} style={{width: `${pct}%`}} />
                        </div>
                    </div>
                );
            })()}

            {/* ── Billing toggle ── */}
            <div className={styles.toggleWrap}>
                <button
                    className={`${styles.toggleBtn} ${cycle === BillingCycle.MONTHLY ? styles.toggleActive : ''}`}
                    onClick={() => setCycle(BillingCycle.MONTHLY)}
                >
                    Mensual
                </button>
                <button
                    className={`${styles.toggleBtn} ${cycle === BillingCycle.ANNUALLY ? styles.toggleActive : ''}`}
                    onClick={() => setCycle(BillingCycle.ANNUALLY)}
                >
                    Anual
                    <span className={styles.savingsBadge}>Ahorra hasta 20%</span>
                </button>
            </div>

            {/* ── Plan cards ── */}
            <div className={styles.plansGrid}>
                {sortedPlans.map(plan =>
                {
                    const price      = cycle === BillingCycle.ANNUALLY ? plan.priceAnnually : plan.priceMonthly;
                    const isCurrent  = !!currentSub
                        && currentSub.status === SubscriptionStatus.ACTIVE
                        && currentSub.planId === plan.id
                        && currentSub.billingCycle === cycle;
                    const canSelect  = !isCurrent;
                    const savings    = annualSavingsPct(plan);
                    const features: string[] = Array.isArray(plan.features) ? plan.features : [];
                    const isPopular  = plan.name === 'business';

                    return (
                        <div
                            key={plan.id}
                            className={`${styles.planCard} ${isPopular ? styles.planCardPopular : ''} ${isCurrent ? styles.planCardCurrent : ''}`}
                        >
                            {isPopular && (
                                <div className={styles.popularBadge}>
                                    <Crown /> Más popular
                                </div>
                            )}

                            {/* ── Card header ── */}
                            <div className={styles.planHeader}>
                                <span className={styles.planNameTag}>{plan.displayName}</span>

                                <div className={styles.planPricing}>
                                    <span className={styles.planPrice}>{formatPrice(price)}</span>
                                    {(plan.priceMonthly ?? 0) > 0 && (
                                        <span className={styles.planCycle}>/ mes</span>
                                    )}
                                </div>

                                {cycle === BillingCycle.ANNUALLY && savings > 0 && (
                                    <span className={styles.annualNote}>Ahorras {savings}% vs mensual</span>
                                )}

                                {plan.description && (
                                    <p className={styles.planDesc}>{plan.description}</p>
                                )}
                            </div>

                            <div className={styles.divider} />

                            {/* ── Features ── */}
                            <ul className={styles.featuresList}>
                                {features.map((f, i) => (
                                    <li key={i} className={styles.featureItem}>
                                        <div className={styles.featureCheckWrap}>
                                            <Check />
                                        </div>
                                        <span>{f}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                className={`${styles.selectBtn} ${isCurrent ? styles.selectBtnCurrent : ''} ${isPopular && !isCurrent ? styles.selectBtnPopular : ''}`}
                                onClick={() => handleSelect(plan)}
                                disabled={isCurrent}
                            >
                                {isCurrent
                                    ? 'Plan actual'
                                    : currentSub?.status === SubscriptionStatus.CANCELLED
                                        ? 'Reactivar plan'
                                        : 'Seleccionar plan'
                                }
                                {!isCurrent && <ArrowGo />}
                            </button>
                        </div>
                    );
                })}

            </div>

            {/* ── Sales banner ── */}
            <div className={styles.salesBanner}>
                <div className={styles.salesBannerLeft}>
                    <p className={styles.salesBannerTitle}>¿Necesitas un plan a la medida?</p>
                    <p className={styles.salesBannerMsg}>
                        Adaptamos el plan a tu volumen, equipo e integraciones. Habla con nosotros y diseñamos una solución para tu despacho.
                    </p>
                </div>
                <a href="mailto:ventas@legalito.co?subject=Plan a medida" className={styles.salesBannerBtn}>
                    Contactar ventas <ArrowGo />
                </a>
            </div>

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

export default UpgradePage;
