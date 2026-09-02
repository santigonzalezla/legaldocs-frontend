'use client';

import {useEffect, useRef, useState} from 'react';
import {Crown, Shield, User as UserIcon, Users, Mail, Phone, MoreHorizontal, UserPlus, X} from '@/app/components/svg';
import styles from './teammanagement.module.css';
import {useFetch} from '@/hooks/useFetch';
import type {FirmMember, FirmRole, User} from '@/app/interfaces/interfaces';
import {FirmMemberStatus} from '@/app/interfaces/enums';
import {toast} from 'sonner';
import {useConfirm} from '@/hooks/useConfirm';
import ConfirmModal from '@/app/components/ui/confirmmodal/ConfirmModal';

// Backend populates user y firmRole relations en los miembros
type MemberWithUser = FirmMember & {
    user?: {firstName: string; lastName: string; email: string; phone: string | null};
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const ROLE_COLOR: Record<string, string> = {
    admin:   '#ef4444',
    abogado: '#3b82f6',
    gerente: '#10b981',
};
const DEFAULT_ROLE_COLOR = '#8b5cf6'; // roles custom

const roleColor = (slug: string | null | undefined) => (slug && ROLE_COLOR[slug]) ?? DEFAULT_ROLE_COLOR;

const STATUS_CONFIG: Record<FirmMemberStatus, {label: string; color: string}> = {
    [FirmMemberStatus.ACTIVE]:   {label: 'Activo',    color: '#10b981'},
    [FirmMemberStatus.INACTIVE]: {label: 'Inactivo',  color: '#6b7280'},
    [FirmMemberStatus.PENDING]:  {label: 'Pendiente', color: '#f59e0b'},
};

const roleIcon = (slug: string | null | undefined) =>
{
    if (slug === 'admin')   return <Crown />;
    if (slug === 'abogado') return <Shield />;
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
    const [openMenuId,      setOpenMenuId]      = useState<string | null>(null);
    const [menuUp,          setMenuUp]          = useState(false);
    const [showInvite,      setShowInvite]      = useState(false);
    const [inviteEmail,     setInviteEmail]     = useState('');
    const [inviteFirstName, setInviteFirstName] = useState('');
    const [inviteLastName,  setInviteLastName]  = useState('');
    const [inviteFirmRoleId, setInviteFirmRoleId] = useState('');
    const [changeRoleFor,   setChangeRoleFor]   = useState<MemberWithUser | null>(null);
    const [newFirmRoleId,   setNewFirmRoleId]   = useState('');
    const menuRef = useRef<HTMLDivElement>(null);

    // ── API ──────────────────────────────────────────────────────────────────
    const {data: me} = useFetch<User>('user/me');

    const {data: members, isLoading, execute: refetch} =
        useFetch<MemberWithUser[]>('firm/me/members', {firmScoped: true});

    const {data: firmRoles} =
        useFetch<FirmRole[]>('permissions/firm-roles', {firmScoped: true});

    const {execute: inviteMember, isLoading: isInviting} =
        useFetch<FirmMember>('firm/me/members', {method: 'POST', immediate: false, firmScoped: true});

    const {execute: updateMember, isLoading: isUpdating} =
        useFetch<FirmMember>('', {method: 'PATCH', immediate: false, firmScoped: true});

    const {execute: removeMember} =
        useFetch<void>('', {method: 'DELETE', immediate: false, firmScoped: true});

    const {confirm, confirmState, handleConfirm, handleCancel} = useConfirm();

    const roles = firmRoles ?? [];

    // Default de invitación: rol Abogado si existe, si no el primero de la lista
    useEffect(() =>
    {
        if (inviteFirmRoleId || roles.length === 0) return;
        setInviteFirmRoleId(roles.find(r => r.slug === 'abogado')?.id ?? roles[0].id);
    }, [roles, inviteFirmRoleId]);

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
        if (!inviteFirmRoleId) { toast.error('Seleccioná un rol.'); return; }
        const result = await inviteMember({body: {
            email: inviteEmail.trim(),
            firmRoleId: inviteFirmRoleId,
            ...(inviteFirstName.trim() && {firstName: inviteFirstName.trim()}),
            ...(inviteLastName.trim()  && {lastName:  inviteLastName.trim()}),
        }});
        if (!result) return;
        toast.success(`Listo. ${inviteEmail} ya tiene acceso al despacho y recibirá un correo con las instrucciones de ingreso.`);
        setInviteEmail('');
        setInviteFirstName('');
        setInviteLastName('');
        setShowInvite(false);
        refetch();
    };

    const handleChangeRole = async () =>
    {
        if (!changeRoleFor || !newFirmRoleId) return;
        const result = await updateMember(
            {body: {firmRoleId: newFirmRoleId}},
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
        total:    list.length,
        admin:    list.filter(m => m.firmRole?.slug === 'admin').length,
        active:   list.filter(m => m.status === FirmMemberStatus.ACTIVE).length,
        pending:  list.filter(m => m.status === FirmMemberStatus.PENDING).length,
    };

    return (
        <div className={styles.teamManagement}>

            {/* Stats */}
            <div className={styles.statsSection}>
                {[
                    {label: 'Total Miembros',        value: counts.total,   color: '#3b82f6', icon: <Users />},
                    {label: 'Administradores',        value: counts.admin,   color: '#ef4444', icon: <Crown />},
                    {label: 'Activos',                value: counts.active,  color: '#10b981', icon: <Shield />},
                    {label: 'Invitaciones Pendientes', value: counts.pending, color: '#f59e0b', icon: <UserIcon />},
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
                        const roleName  = member.firmRole?.name ?? 'Sin rol asignado';
                        const roleSlug  = member.firmRole?.slug ?? null;
                        const roleClr   = roleColor(roleSlug);
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
                                        style={{backgroundColor: `${roleClr}15`, color: roleClr}}>
                                        {roleIcon(roleSlug)} {roleName}
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
                                            onClick={e =>
                                            {
                                                if (isMenuOpen) { setOpenMenuId(null); return; }
                                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                setMenuUp(rect.bottom + 110 > window.innerHeight);
                                                setOpenMenuId(member.id);
                                            }}>
                                            <MoreHorizontal />
                                        </button>
                                        {isMenuOpen && (
                                            <div className={`${styles.dropdownMenu} ${menuUp ? styles.dropdownMenuUp : ''}`}>
                                                <button className={styles.dropdownItem}
                                                    onClick={() =>
                                                    {
                                                        setNewFirmRoleId(member.firmRoleId ?? '');
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
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Nombre <span className={styles.optional}>(opcional)</span></label>
                                    <input type="text" className={styles.input}
                                        value={inviteFirstName} onChange={e => setInviteFirstName(e.target.value)}
                                        placeholder="Juan" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Apellido <span className={styles.optional}>(opcional)</span></label>
                                    <input type="text" className={styles.input}
                                        value={inviteLastName} onChange={e => setInviteLastName(e.target.value)}
                                        placeholder="Pérez" />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Email</label>
                                <input type="email" className={styles.input}
                                    value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                                    placeholder="usuario@ejemplo.com"
                                    onKeyDown={e => e.key === 'Enter' && handleInvite()} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Rol</label>
                                <select className={styles.select} value={inviteFirmRoleId}
                                    onChange={e => setInviteFirmRoleId(e.target.value)}>
                                    {roles.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
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
                                <select className={styles.select} value={newFirmRoleId}
                                    onChange={e => setNewFirmRoleId(e.target.value)}>
                                    {roles.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className={styles.modalActions}>
                            <button className={styles.cancelButton} onClick={() => setChangeRoleFor(null)}>
                                Cancelar
                            </button>
                            <button className={styles.inviteConfirmButton} onClick={handleChangeRole}
                                disabled={isUpdating || !newFirmRoleId || newFirmRoleId === changeRoleFor.firmRoleId}>
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
