'use client';

import {useEffect, useRef, useState} from 'react';
import {Crown, Shield, User as UserIcon, Users, Mail, Phone, MoreHorizontal, UserPlus, X} from '@/app/components/svg';
import styles from './teammanagement.module.css';
import {useFetch} from '@/hooks/useFetch';
import type {FirmMember, User} from '@/app/interfaces/interfaces';
import {FirmMemberRole, FirmMemberStatus} from '@/app/interfaces/enums';
import {toast} from 'sonner';
import {useConfirm} from '@/hooks/useConfirm';
import ConfirmModal from '@/app/components/ui/confirmmodal/ConfirmModal';

// Backend populates user relation on active members
type MemberWithUser = FirmMember & {
    user?: {firstName: string; lastName: string; email: string; phone: string | null};
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<FirmMemberRole, {label: string; color: string}> = {
    [FirmMemberRole.ADMIN]:     {label: 'Administrador', color: '#ef4444'},
    [FirmMemberRole.LAWYER]:    {label: 'Abogado',       color: '#3b82f6'},
    [FirmMemberRole.ASSISTANT]: {label: 'Asistente',     color: '#10b981'},
    [FirmMemberRole.INTERN]:    {label: 'Practicante',   color: '#f59e0b'},
};

const STATUS_CONFIG: Record<FirmMemberStatus, {label: string; color: string}> = {
    [FirmMemberStatus.ACTIVE]:   {label: 'Activo',    color: '#10b981'},
    [FirmMemberStatus.INACTIVE]: {label: 'Inactivo',  color: '#6b7280'},
    [FirmMemberStatus.PENDING]:  {label: 'Pendiente', color: '#f59e0b'},
};

const roleIcon = (role: FirmMemberRole) =>
{
    if (role === FirmMemberRole.ADMIN)  return <Crown />;
    if (role === FirmMemberRole.LAWYER) return <Shield />;
    return <UserIcon />;
};

const memberName = (m: MemberWithUser) =>
    m.user ? `${m.user.firstName} ${m.user.lastName}` : (m.inviteEmail ?? 'Miembro invitado');

const memberEmail = (m: MemberWithUser) => m.user?.email ?? m.inviteEmail ?? '';

const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('es-ES', {day: '2-digit', month: 'short', year: 'numeric'}) : '—';

// ── Component ──────────────────────────────────────────────────────────────────

const TeamManagement = () =>
{
    const [openMenuId,     setOpenMenuId]     = useState<string | null>(null);
    const [showInvite,     setShowInvite]     = useState(false);
    const [inviteEmail,    setInviteEmail]    = useState('');
    const [inviteRole,     setInviteRole]     = useState<FirmMemberRole>(FirmMemberRole.LAWYER);
    const [changeRoleFor,  setChangeRoleFor]  = useState<MemberWithUser | null>(null);
    const [newRole,        setNewRole]        = useState<FirmMemberRole>(FirmMemberRole.LAWYER);
    const menuRef = useRef<HTMLDivElement>(null);

    // ── API ──────────────────────────────────────────────────────────────────
    const {data: me} = useFetch<User>('user/me');

    const {data: members, isLoading, execute: refetch} =
        useFetch<MemberWithUser[]>('firm/me/members', {firmScoped: true});

    const {execute: inviteMember, isLoading: isInviting} =
        useFetch<FirmMember>('firm/me/members', {method: 'POST', immediate: false, firmScoped: true});

    const {execute: updateMember, isLoading: isUpdating} =
        useFetch<FirmMember>('', {method: 'PATCH', immediate: false, firmScoped: true});

    const {execute: removeMember} =
        useFetch<void>('', {method: 'DELETE', immediate: false, firmScoped: true});

    const {confirm, confirmState, handleConfirm, handleCancel} = useConfirm();

    // Close dropdown on outside click
    useEffect(() =>
    {
        const handler = (e: MouseEvent) =>
        {
            if (menuRef.current && !menuRef.current.contains(e.target as Node))
                setOpenMenuId(null);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── Actions ───────────────────────────────────────────────────────────────
    const handleInvite = async () =>
    {
        if (!inviteEmail.trim()) { toast.error('Ingresa un email.'); return; }
        const result = await inviteMember({body: {email: inviteEmail.trim(), role: inviteRole}});
        if (!result) return;
        toast.success(`Invitación enviada a ${inviteEmail}.`);
        setInviteEmail('');
        setShowInvite(false);
        refetch();
    };

    const handleChangeRole = async () =>
    {
        if (!changeRoleFor) return;
        const result = await updateMember(
            {body: {role: newRole}},
            `firm/me/members/${changeRoleFor.id}`,
        );
        if (!result) return;
        toast.success('Rol actualizado correctamente.');
        setChangeRoleFor(null);
        refetch();
    };

    const handleRemove = async (member: MemberWithUser) =>
    {
        if (!await confirm({title: 'Eliminar miembro', message: `¿Eliminar a ${memberName(member)} del equipo?`, confirmLabel: 'Eliminar'})) return;
        await removeMember({}, `firm/me/members/${member.id}`);
        toast.success('Miembro eliminado.');
        refetch();
    };

    // ── Stats ─────────────────────────────────────────────────────────────────
    const list = [...(members ?? [])].sort((a, b) =>
    {
        const aIsMe = me?.id && a.userId === me.id ? -1 : 0;
        const bIsMe = me?.id && b.userId === me.id ?  1 : 0;
        return aIsMe + bIsMe;
    });
    const counts = {
        total:     list.length,
        admin:     list.filter(m => m.role === FirmMemberRole.ADMIN).length,
        lawyer:    list.filter(m => m.role === FirmMemberRole.LAWYER).length,
        assistant: list.filter(m => m.role === FirmMemberRole.ASSISTANT || m.role === FirmMemberRole.INTERN).length,
    };

    return (
        <div className={styles.teamManagement}>

            {/* Stats */}
            <div className={styles.statsSection}>
                {[
                    {label: 'Total Miembros',   value: counts.total,     color: '#3b82f6', icon: <Users />},
                    {label: 'Administradores',   value: counts.admin,     color: '#ef4444', icon: <Crown />},
                    {label: 'Abogados',          value: counts.lawyer,    color: '#3b82f6', icon: <Shield />},
                    {label: 'Asistentes',        value: counts.assistant, color: '#10b981', icon: <UserIcon />},
                ].map(s => (
                    <div key={s.label} className={styles.statCard}>
                        <div className={styles.statIcon} style={{backgroundColor: `${s.color}15`, color: s.color}}>
                            {s.icon}
                        </div>
                        <div className={styles.statInfo}>
                            <h3 className={styles.statValue}>{s.value}</h3>
                            <p className={styles.statTitle}>{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className={styles.sectionHeader}>
                <h4 className={styles.sectionTitle}>Miembros del Equipo</h4>
                <button className={styles.inviteButton} onClick={() => setShowInvite(true)}>
                    <UserPlus /> Invitar Miembro
                </button>
            </div>

            {/* Members list */}
            {isLoading ? (
                <p>Cargando equipo...</p>
            ) : (
                <div className={styles.membersList} ref={menuRef}>
                    {list.map(member =>
                    {
                        const role      = ROLE_CONFIG[member.role]   ?? {label: member.role,   color: '#6b7280'};
                        const status    = STATUS_CONFIG[member.status] ?? {label: member.status, color: '#6b7280'};
                        const isMenuOpen = openMenuId === member.id;
                        const isMe      = me?.id && member.userId === me.id;

                        return (
                            <div key={member.id} className={styles.memberCard}>
                                {/* Info */}
                                <div className={styles.memberInfo}>
                                    <div className={styles.memberInitials}>
                                        {memberName(member).charAt(0).toUpperCase()}
                                    </div>
                                    <div className={styles.memberDetails}>
                                        <h5 className={styles.memberName}>
                                            {memberName(member)}
                                            {isMe && <span className={styles.youBadge}>Tú</span>}
                                        </h5>
                                        <div className={styles.memberMeta}>
                                            <span className={styles.memberEmail}>
                                                <Mail /> {memberEmail(member)}
                                            </span>
                                            {member.user?.phone && (
                                                <span className={styles.memberPhone}>
                                                    <Phone /> {member.user.phone}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Badges */}
                                <div className={styles.memberBadges}>
                                    <span className={styles.roleBadge}
                                        style={{backgroundColor: `${role.color}15`, color: role.color}}>
                                        {roleIcon(member.role)} {role.label}
                                    </span>
                                    <span className={styles.statusBadge}
                                        style={{backgroundColor: `${status.color}15`, color: status.color}}>
                                        {status.label}
                                    </span>
                                </div>

                                {/* Dates */}
                                <div className={styles.memberStats}>
                                    <div className={styles.statItem}>
                                        <span className={styles.statLabel}>Ingresó:</span>
                                        <span className={styles.statDateValue}>{formatDate(member.joinedAt)}</span>
                                    </div>
                                    <div className={styles.statItem}>
                                        <span className={styles.statLabel}>Último acceso:</span>
                                        <span className={styles.statDateValue}>{formatDate(member.lastActiveAt)}</span>
                                    </div>
                                </div>

                                {/* 3-dot menu */}
                                <div className={styles.memberActions}>
                                    <div className={styles.menuWrapper}>
                                        <button className={styles.actionButton}
                                            onClick={() => setOpenMenuId(isMenuOpen ? null : member.id)}>
                                            <MoreHorizontal />
                                        </button>
                                        {isMenuOpen && (
                                            <div className={styles.dropdownMenu}>
                                                <button className={styles.dropdownItem}
                                                    onClick={() =>
                                                    {
                                                        setNewRole(member.role);
                                                        setChangeRoleFor(member);
                                                        setOpenMenuId(null);
                                                    }}>
                                                    <Shield /> Cambiar rol
                                                </button>
                                                <button className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                                                    onClick={() => { setOpenMenuId(null); handleRemove(member); }}>
                                                    <X /> Eliminar miembro
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Invite modal ──────────────────────────────────────────────── */}
            {showInvite && (
                <div className={styles.modalOverlay} onClick={() => setShowInvite(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>Invitar Nuevo Miembro</h3>
                            <button className={styles.closeButton} onClick={() => setShowInvite(false)}>×</button>
                        </div>
                        <div className={styles.modalContent}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Email</label>
                                <input type="email" className={styles.input}
                                    value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                                    placeholder="usuario@ejemplo.com"
                                    onKeyDown={e => e.key === 'Enter' && handleInvite()} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Rol</label>
                                <select className={styles.select} value={inviteRole}
                                    onChange={e => setInviteRole(e.target.value as FirmMemberRole)}>
                                    <option value={FirmMemberRole.INTERN}>Practicante</option>
                                    <option value={FirmMemberRole.ASSISTANT}>Asistente</option>
                                    <option value={FirmMemberRole.LAWYER}>Abogado</option>
                                    <option value={FirmMemberRole.ADMIN}>Administrador</option>
                                </select>
                            </div>
                        </div>
                        <div className={styles.modalActions}>
                            <button className={styles.cancelButton} onClick={() => setShowInvite(false)}>
                                Cancelar
                            </button>
                            <button className={styles.inviteConfirmButton} onClick={handleInvite}
                                disabled={isInviting || !inviteEmail.trim()}>
                                {isInviting ? 'Enviando...' : 'Enviar Invitación'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Change role modal ─────────────────────────────────────────── */}
            {changeRoleFor && (
                <div className={styles.modalOverlay} onClick={() => setChangeRoleFor(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>Cambiar Rol</h3>
                            <button className={styles.closeButton} onClick={() => setChangeRoleFor(null)}>×</button>
                        </div>
                        <div className={styles.modalContent}>
                            <p className={styles.modalSubtitle}>
                                Miembro: <strong>{memberName(changeRoleFor)}</strong>
                            </p>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Nuevo rol</label>
                                <select className={styles.select} value={newRole}
                                    onChange={e => setNewRole(e.target.value as FirmMemberRole)}>
                                    <option value={FirmMemberRole.INTERN}>Practicante</option>
                                    <option value={FirmMemberRole.ASSISTANT}>Asistente</option>
                                    <option value={FirmMemberRole.LAWYER}>Abogado</option>
                                    <option value={FirmMemberRole.ADMIN}>Administrador</option>
                                </select>
                            </div>
                        </div>
                        <div className={styles.modalActions}>
                            <button className={styles.cancelButton} onClick={() => setChangeRoleFor(null)}>
                                Cancelar
                            </button>
                            <button className={styles.inviteConfirmButton} onClick={handleChangeRole}
                                disabled={isUpdating || newRole === changeRoleFor.role}>
                                {isUpdating ? 'Guardando...' : 'Guardar Cambio'}
                            </button>
                        </div>
                    </div>
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

export default TeamManagement;
