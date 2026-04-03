'use client';

import styles from './page.module.css';
import {useRouter} from 'next/navigation';
import {useFetch} from '@/hooks/useFetch';
import {useAuth} from '@/context/AuthContext';
import {toast} from 'sonner';
import {Building, Check, Crown, Edit, Plus, Users} from '@/app/components/svg';
import type {FirmWithRole} from '@/app/interfaces/interfaces';
import {FirmMemberRole} from '@/app/interfaces/enums';

const ROLE_LABEL: Record<FirmMemberRole, string> = {
    [FirmMemberRole.ADMIN]:     'Administrador',
    [FirmMemberRole.LAWYER]:    'Abogado',
    [FirmMemberRole.ASSISTANT]: 'Asistente',
    [FirmMemberRole.INTERN]:    'Practicante',
};

const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', {day: '2-digit', month: 'long', year: 'numeric'});

const FirmsPage = () =>
{
    const router = useRouter();
    const {activeFirmId, setActiveFirm} = useAuth();

    const {data: firms, isLoading} = useFetch<FirmWithRole[]>('firm/my-firms');

    const owned      = (firms ?? []).filter(f => f.isOwner);
    const associated = (firms ?? []).filter(f => !f.isOwner);

    const handleSwitch = (firm: FirmWithRole) =>
    {
        if (firm.id === activeFirmId) return;
        setActiveFirm(firm.id);
        toast.success(`Cambiaste a la firma "${firm.name}".`);
        router.refresh();
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1>Mis Firmas</h1>
                    <p>Gestiona las firmas legales a las que perteneces y cambia de firma activa.</p>
                </div>
                <button className={styles.addButton}>
                    <Plus /> Crear firma
                </button>
            </div>

            {isLoading ? (
                <p className={styles.loading}>Cargando firmas...</p>
            ) : (
                <>
                    {/* Firmas propias */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <Crown className={styles.sectionIcon} />
                            Firmas que administro ({owned.length})
                        </h2>

                        {owned.length === 0 ? (
                            <p className={styles.empty}>No eres propietario de ninguna firma.</p>
                        ) : (
                            <div className={styles.cards}>
                                {owned.map(firm => (
                                    <FirmCard
                                        key={firm.id}
                                        firm={firm}
                                        isActive={firm.id === activeFirmId}
                                        onSwitch={handleSwitch}
                                        onManage={() => router.push('/dashboard/settings/office')}
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Firmas asociadas */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <Users className={styles.sectionIcon} />
                            Firmas donde estoy asociado ({associated.length})
                        </h2>

                        {associated.length === 0 ? (
                            <p className={styles.empty}>No estás asociado a ninguna otra firma.</p>
                        ) : (
                            <div className={styles.cards}>
                                {associated.map(firm => (
                                    <FirmCard
                                        key={firm.id}
                                        firm={firm}
                                        isActive={firm.id === activeFirmId}
                                        onSwitch={handleSwitch}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
};

interface FirmCardProps
{
    firm:      FirmWithRole;
    isActive:  boolean;
    onSwitch:  (f: FirmWithRole) => void;
    onManage?: () => void;
}

const FirmCard = ({firm, isActive, onSwitch, onManage}: FirmCardProps) => (
    <div className={`${styles.card} ${isActive ? styles.cardActive : ''}`}>
        <div className={styles.cardTop}>
            <div className={styles.firmIcon}>
                <Building />
            </div>
            <div className={styles.firmInfo}>
                <div className={styles.firmNameRow}>
                    <span className={styles.firmName}>{firm.name}</span>
                    {isActive && (
                        <span className={styles.activeBadge}>
                            <Check className={styles.activeBadgeIcon} /> Activa
                        </span>
                    )}
                </div>
                {firm.legalName && (
                    <span className={styles.firmLegal}>{firm.legalName}</span>
                )}
                <div className={styles.firmMeta}>
                    {firm.city && <span>{firm.city}</span>}
                    {firm.city && firm.createdAt && <span>·</span>}
                    {firm.createdAt && <span>Desde {formatDate(firm.createdAt)}</span>}
                </div>
            </div>
            <span className={`${styles.roleBadge} ${firm.isOwner ? styles.roleOwner : styles.roleMember}`}>
                {firm.isOwner ? 'Propietario' : ROLE_LABEL[firm.role] ?? firm.role}
            </span>
        </div>

        <div className={styles.cardActions}>
            {onManage && (
                <button className={styles.btnManage} onClick={onManage}>
                    <Edit className={styles.btnIcon} /> Administrar
                </button>
            )}
            {isActive ? (
                <span className={styles.activeLabel}>
                    <Check className={styles.btnIcon} /> Firma activa
                </span>
            ) : (
                <button className={styles.btnSwitch} onClick={() => onSwitch(firm)}>
                    Usar esta firma
                </button>
            )}
        </div>
    </div>
);

export default FirmsPage;
