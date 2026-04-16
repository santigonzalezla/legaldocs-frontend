'use client';

import styles from './page.module.css';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useFetch} from '@/hooks/useFetch';
import {useAuth} from '@/context/AuthContext';
import {toast} from 'sonner';
import {Bell, Building, Cancel, Check, Crown, Edit, Plus, Users} from '@/app/components/svg';
import type {Firm, FirmWithRole, PendingInvitation} from '@/app/interfaces/interfaces';
import {FirmMemberRole} from '@/app/interfaces/enums';
import CreateFirmModal from '@/app/components/settings/firms/createfirmmodal/CreateFirmModal';

interface InvitationCardProps
{
    invitation: PendingInvitation;
    acting: boolean;
    onAccept: () => void;
    onReject: () => void;
}

interface FirmCardProps
{
    firm: FirmWithRole;
    isActive: boolean;
    onSwitch: (f: FirmWithRole) => void;
    onManage?: () => void;
}

const ROLE_LABEL: Record<FirmMemberRole, string> = {
    [FirmMemberRole.ADMIN]: 'Administrador',
    [FirmMemberRole.LAWYER]: 'Abogado',
    [FirmMemberRole.ASSISTANT]: 'Asistente',
    [FirmMemberRole.INTERN]: 'Practicante'
};

const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', {day: '2-digit', month: 'long', year: 'numeric'});

const EMPTY_FORM = {name: '', legalName: '', city: ''};

const FirmsPage = () =>
{
    const router = useRouter();
    const {activeFirmId, setActiveFirm} = useAuth();
    const [showCreate, setShowCreate] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({...EMPTY_FORM});
    const [actingToken, setActingToken] = useState<string | null>(null);
    const {data: firms, isLoading: loadingFirms, execute: refetchFirms} = useFetch<FirmWithRole[]>('firm/my-firms');
    const {
        data: invitations,
        isLoading: loadingInv,
        execute: refetchInv
    } = useFetch<PendingInvitation[]>('firm/my-invitations');
    const {execute: createFirm} = useFetch<Firm>('firm', {method: 'POST', immediate: false});
    const {execute: acceptInv} = useFetch<{ message: string }>('', {method: 'POST', immediate: false});
    const {execute: rejectInv} = useFetch<{ message: string }>('', {method: 'POST', immediate: false});

    const isLoading = loadingFirms || loadingInv;
    const owned = (firms ?? []).filter(f => f.isOwner);
    const associated = (firms ?? []).filter(f => !f.isOwner);
    const pending = invitations ?? [];

    const handleOpenCreate = () =>
    {
        setForm({...EMPTY_FORM});
        setShowCreate(true);
    };
    const handleCloseCreate = () => setShowCreate(false);

    const handleCreate = async () =>
    {
        setSaving(true);
        const body = {
            name: form.name.trim(),
            legalName: form.legalName.trim() || undefined,
            city: form.city.trim() || undefined
        };
        const result = await createFirm({body});
        setSaving(false);
        if (!result) return;
        toast.success('Firma creada correctamente.');
        setShowCreate(false);
        refetchFirms();
    };

    const handleSwitch = (firm: FirmWithRole) =>
    {
        if (firm.id === activeFirmId) return;
        setActiveFirm(firm.id);
        toast.success(`Cambiaste a la firma "${firm.name}".`);
        router.refresh();
    };

    const handleAccept = async (inv: PendingInvitation) =>
    {
        setActingToken(inv.inviteToken);
        const result = await acceptInv({}, `firm/me/members/accept?token=${inv.inviteToken}`);
        setActingToken(null);
        if (!result) return;
        toast.success(`Te uniste a "${inv.firm.name}" correctamente.`);
        refetchFirms();
        refetchInv();
    };

    const handleReject = async (inv: PendingInvitation) =>
    {
        setActingToken(inv.inviteToken);
        const result = await rejectInv({}, `firm/my-invitations/reject?token=${inv.inviteToken}`);
        setActingToken(null);
        if (!result) return;
        toast.success('Invitación rechazada.');
        refetchInv();
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1>Mis Firmas</h1>
                    <p>Gestiona las firmas legales a las que perteneces y cambia de firma activa.</p>
                </div>
                {!isLoading && owned.length === 0 && (
                    <button className={styles.addButton} onClick={handleOpenCreate}>
                        <Plus/> Crear firma
                    </button>
                )}
            </div>

            {isLoading ? (
                <p className={styles.loading}>Cargando firmas...</p>
            ) : (
                <>
                    {/* Invitaciones pendientes */}
                    {pending.length > 0 && (
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>
                                <Bell className={styles.sectionIcon}/>
                                Invitaciones pendientes ({pending.length})
                            </h2>
                            <div className={styles.cards}>
                                {pending.map(inv => (
                                    <InvitationCard
                                        key={inv.id}
                                        invitation={inv}
                                        acting={actingToken === inv.inviteToken}
                                        onAccept={() => handleAccept(inv)}
                                        onReject={() => handleReject(inv)}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Firmas propias */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <Crown className={styles.sectionIcon}/>
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
                            <Users className={styles.sectionIcon}/>
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

            <CreateFirmModal
                open={showCreate}
                saving={saving}
                name={form.name}
                legalName={form.legalName}
                city={form.city}
                onClose={handleCloseCreate}
                onSave={handleCreate}
                onName={v => setForm(prev => ({...prev, name: v}))}
                onLegalName={v => setForm(prev => ({...prev, legalName: v}))}
                onCity={v => setForm(prev => ({...prev, city: v}))}
            />
        </div>
    );
};

const InvitationCard = ({invitation, acting, onAccept, onReject}: InvitationCardProps) => (
    <div className={`${styles.card} ${styles.cardInvite}`}>
        <div className={styles.cardTop}>
            <div className={`${styles.firmIcon} ${styles.firmIconInvite}`}>
                <Building/>
            </div>
            <div className={styles.firmInfo}>
                <div className={styles.firmNameRow}>
                    <span className={styles.firmName}>{invitation.firm.name}</span>
                    <span className={styles.inviteBadge}>Invitación pendiente</span>
                </div>
                {invitation.firm.legalName && (
                    <span className={styles.firmLegal}>{invitation.firm.legalName}</span>
                )}
                <div className={styles.firmMeta}>
                    {invitation.firm.city && <span>{invitation.firm.city}</span>}
                    {invitation.firm.city && <span>·</span>}
                    <span>Recibida el {formatDate(invitation.createdAt)}</span>
                </div>
            </div>
            <span className={`${styles.roleBadge} ${styles.roleMember}`}>
                {ROLE_LABEL[invitation.role] ?? invitation.role}
            </span>
        </div>

        <div className={styles.inviteNote}>
            Esta firma te ha invitado a unirte como <strong>{ROLE_LABEL[invitation.role] ?? invitation.role}</strong>.
            La invitación vence el {formatDate(invitation.inviteExpiresAt)}.
        </div>

        <div className={styles.cardActions}>
            <button
                className={styles.btnReject}
                onClick={onReject}
                disabled={acting}
            >
                <Cancel className={styles.btnIcon}/> Rechazar
            </button>
            <button
                className={styles.btnAccept}
                onClick={onAccept}
                disabled={acting}
            >
                <Check className={styles.btnIcon}/>
                {acting ? 'Procesando...' : 'Aceptar invitación'}
            </button>
        </div>
    </div>
);

const FirmCard = ({firm, isActive, onSwitch, onManage}: FirmCardProps) => (
    <div className={`${styles.card} ${isActive ? styles.cardActive : ''}`}>
        <div className={styles.cardTop}>
            <div className={styles.firmIcon}>
                <Building/>
            </div>
            <div className={styles.firmInfo}>
                <div className={styles.firmNameRow}>
                    <span className={styles.firmName}>{firm.name}</span>
                    {isActive && (
                        <span className={styles.activeBadge}>
                            <Check className={styles.activeBadgeIcon}/> Activa
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
                    <Edit className={styles.btnIcon}/> Administrar
                </button>
            )}
            {isActive ? (
                <span className={styles.activeLabel}>
                    <Check className={styles.btnIcon}/> Firma activa
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
