'use client';

import {useEffect, useRef, useState} from 'react';
import {Crown, Shield, User as UserIcon, Users, Mail, Phone, MoreHorizontal, UserPlus, StarFilled, X} from '@/app/components/svg';
import styles from './teammanagement.module.css';
import {useFetch} from '@/hooks/useFetch';
import {API_BASE_URL} from '@/lib/constants';
import IdentityImage from '@/app/components/shared/imageupload/IdentityImage';
import type {FirmMember, FirmRole, User} from '@/app/interfaces/interfaces';
import {FirmMemberStatus} from '@/app/interfaces/enums';
import {toast} from 'sonner';
import {useConfirm} from '@/hooks/useConfirm';
import ConfirmModal from '@/app/components/ui/confirmmodal/ConfirmModal';

// El backend popula las relaciones user y firmRole (ver FirmMember en interfaces).
type MemberWithUser = FirmMember;

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
    const [menuPos,         setMenuPos]         = useState<{right: number; top?: number; bottom?: number} | null>(null);
    const [showInvite,      setShowInvite]      = useState(false);
    const [inviteEmail,     setInviteEmail]     = useState('');
    const [inviteFirstName, setInviteFirstName] = useState('');
    const [inviteLastName,  setInviteLastName]  = useState('');
    const [inviteFirmRoleId, setInviteFirmRoleId] = useState('');
    const [inviteIsPartner, setInviteIsPartner] = useState(false);
    const [changeRoleFor,   setChangeRoleFor]   = useState<MemberWithUser | null>(null);
    const [newFirmRoleId,   setNewFirmRoleId]   = useState('');
    const [newIsPartner,    setNewIsPartner]    = useState(false);
    const [editFirstName,   setEditFirstName]   = useState('');
    const [editLastName,    setEditLastName]    = useState('');
    const [editPhone,       setEditPhone]       = useState('');
    const [editHourlyRate,  setEditHourlyRate]  = useState('');
    const menuRef = useRef<HTMLDivElement>(null);

    // ── API ──────────────────────────────────────────────────────────────────
    const {data: me} = useFetch<User>('user/me');

    const {data: members, isLoading, execute: refetch} =
        useFetch<MemberWithUser[]>('firm/me/members', {firmScoped: true});

    const {data: firmRoles} =
        useFetch<FirmRole[]>('permissions/firm-roles', {firmScoped: true});

    const {execute: inviteMember, isLoading: isInviting, error: inviteError} =
        useFetch<FirmMember>('firm/me/members', {method: 'POST', immediate: false, firmScoped: true});

    const {execute: updateMember, isLoading: isUpdating, error: updateError} =
        useFetch<FirmMember>('', {method: 'PATCH', immediate: false, firmScoped: true});

    const {execute: updateMemberProfile, isLoading: isSavingProfile, error: profileError} =
        useFetch<{firstName: string; lastName: string; phone: string | null; hourlyRate: number | null}>('', {method: 'PATCH', immediate: false, firmScoped: true});

    const {execute: sendPasswordReset, isLoading: isSendingReset, error: resetError} =
        useFetch<{message: string}>('auth/forgot-password', {method: 'POST', immediate: false});

    const {execute: removeMember, error: removeError} =
        useFetch<void>('', {method: 'DELETE', immediate: false, firmScoped: true});

    useEffect(() =>
    {
        const message = inviteError ?? updateError ?? profileError ?? resetError ?? removeError;
        if (message) toast.error(message);
    }, [inviteError, updateError, profileError, resetError, removeError]);

    const {confirm, confirmState, handleConfirm, handleCancel} = useConfirm();

    const roles = firmRoles ?? [];

    // Default de invitación: rol Abogado si existe, si no el primero de la lista
    useEffect(() =>
    {
        if (inviteFirmRoleId || roles.length === 0) return;
        setInviteFirmRoleId(roles.find(role => role.slug === 'abogado')?.id ?? roles[0].id);
    }, [roles, inviteFirmRoleId]);

    // Cerrar el dropdown al hacer clic fuera, o al hacer scroll / resize (el menú
    // va con position: fixed, así que quedaría descolocado).
    useEffect(() =>
    {
        const onClick = (e: MouseEvent) =>
        {
            if (menuRef.current && !menuRef.current.contains(e.target as Node))
                setOpenMenuId(null);
        };
        const onScrollOrResize = () => setOpenMenuId(null);

        document.addEventListener('mousedown', onClick);
        window.addEventListener('scroll', onScrollOrResize, true);
        window.addEventListener('resize', onScrollOrResize);
        return () =>
        {
            document.removeEventListener('mousedown', onClick);
            window.removeEventListener('scroll', onScrollOrResize, true);
            window.removeEventListener('resize', onScrollOrResize);
        };
    }, []);

    // ── Actions ───────────────────────────────────────────────────────────────
    const handleInvite = async () =>
    {
        if (!inviteEmail.trim()) { toast.error('Ingresa un email.'); return; }
        if (!inviteFirmRoleId) { toast.error('Seleccioná un rol.'); return; }
        const result = await inviteMember({body: {
            email: inviteEmail.trim(),
            firmRoleId: inviteFirmRoleId,
            isPartner: inviteIsPartner,
            ...(inviteFirstName.trim() && {firstName: inviteFirstName.trim()}),
            ...(inviteLastName.trim()  && {lastName:  inviteLastName.trim()}),
        }});
        if (!result) return;
        toast.success(`Listo. ${inviteEmail} ya tiene acceso al despacho y recibirá un correo con las instrucciones de ingreso.`);
        setInviteEmail('');
        setInviteFirstName('');
        setInviteLastName('');
        setInviteIsPartner(false);
        setShowInvite(false);
        refetch();
    };

    const handleUpdateMember = async () =>
    {
        if (!changeRoleFor || !newFirmRoleId) return;

        const [roleResult, profileResult] = await Promise.all([
            updateMember(
                {body: {firmRoleId: newFirmRoleId, isPartner: newIsPartner}},
                `firm/me/members/${changeRoleFor.id}`,
            ),
            changeRoleFor.userId
                ? updateMemberProfile(
                    {body: {
                        firstName:  editFirstName.trim(),
                        lastName:   editLastName.trim(),
                        phone:      editPhone.trim() || undefined,
                        hourlyRate: editHourlyRate.trim() !== '' ? parseFloat(editHourlyRate) : null,
                    }},
                    `firm/me/members/${changeRoleFor.id}/profile`,
                )
                : Promise.resolve(true),
        ]);
        if (!roleResult || !profileResult) return;

        toast.success('Miembro actualizado correctamente.');
        setChangeRoleFor(null);
        refetch();
    };

    const handleSendPasswordReset = async () =>
    {
        if (!changeRoleFor) return;
        const result = await sendPasswordReset({body: {email: memberEmail(changeRoleFor)}});
        if (!result) return;
        toast.success(result.message);
    };

    const handleRemove = async (member: MemberWithUser) =>
    {
        if (!await confirm({title: 'Eliminar miembro', message: `¿Eliminar a ${memberName(member)} del equipo?`, confirmLabel: 'Eliminar'})) return;
        const result = await removeMember({}, `firm/me/members/${member.id}`);
        if (!result) return;
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
        admin:    list.filter(member => member.firmRole?.slug === 'admin').length,
        active:   list.filter(member => member.status === FirmMemberStatus.ACTIVE).length,
        pending:  list.filter(member => member.status === FirmMemberStatus.PENDING).length,
        partners: list.filter(member => member.isPartner).length,
    };

    return (
        <div className={styles.teamManagement}>

            {/* Stats */}
            <div className={styles.statsSection}>
                {[
                    {label: 'Total Miembros',        value: counts.total,   color: '#3b82f6', icon: <Users />},
                    {label: 'Administradores',        value: counts.admin,   color: '#ef4444', icon: <Crown />},
                    {label: 'Socios',                 value: counts.partners, color: '#8b5cf6', icon: <StarFilled />},
                    {label: 'Activos',                value: counts.active,  color: '#10b981', icon: <Shield />},
                    {label: 'Invitaciones Pendientes', value: counts.pending, color: '#f59e0b', icon: <UserIcon />},
                ].map(stat => (
                    <div key={stat.label} className={styles.statCard}>
                        <div className={styles.statIcon} style={{backgroundColor: `${stat.color}15`, color: stat.color}}>
                            {stat.icon}
                        </div>
                        <div className={styles.statInfo}>
                            <h3 className={styles.statValue}>{stat.value}</h3>
                            <p className={styles.statTitle}>{stat.label}</p>
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

            {/* Members table */}
            {isLoading ? (
                <p>Cargando equipo...</p>
            ) : (
                <div className={styles.tableWrapper} ref={menuRef}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Miembro</th>
                                <th>Rol</th>
                                <th>Socio</th>
                                <th>Estado</th>
                                <th>Ingresó</th>
                                <th>Último acceso</th>
                                <th aria-label="Acciones" />
                            </tr>
                        </thead>
                        <tbody>
                            {list.map(member =>
                            {
                                const roleName   = member.firmRole?.name ?? 'Sin rol asignado';
                                const roleSlug   = member.firmRole?.slug ?? null;
                                const roleClr    = roleColor(roleSlug);
                                const status     = STATUS_CONFIG[member.status] ?? {label: member.status, color: '#6b7280'};
                                const isMenuOpen = openMenuId === member.id;
                                const isMe       = me?.id && member.userId === me.id;

                                return (
                                    <tr key={member.id}>
                                        <td>
                                            <div className={styles.memberCell}>
                                                <IdentityImage
                                                    src={member.userId && member.user?.avatarKey
                                                        ? `${API_BASE_URL}/files/user-avatar/${member.userId}`
                                                        : null}
                                                    fallback={memberName(member).charAt(0).toUpperCase()}
                                                    width={48}
                                                    height={48}
                                                    radius="50%"
                                                    alt={memberName(member)}
                                                    className={styles.memberInitials}
                                                />
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
                                        </td>
                                        <td>
                                            <span className={styles.roleBadge}
                                                style={{backgroundColor: `${roleClr}15`, color: roleClr}}>
                                                {roleIcon(roleSlug)} {roleName}
                                            </span>
                                        </td>
                                        <td>
                                            {member.isPartner ? (
                                                <span className={styles.partnerBadge}>
                                                    <StarFilled /> Socio
                                                </span>
                                            ) : (
                                                <span className={styles.dash}>—</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={styles.statusBadge}
                                                style={{backgroundColor: `${status.color}15`, color: status.color}}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className={styles.dateCell}>{formatDate(member.joinedAt)}</td>
                                        <td className={styles.dateCell}>{formatDate(member.lastActiveAt)}</td>
                                        <td>
                                            <div className={styles.menuWrapper}>
                                                <button className={styles.actionButton}
                                                    onClick={e =>
                                                    {
                                                        if (isMenuOpen) { setOpenMenuId(null); return; }
                                                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                        const MENU_H = 104;   // ~2 ítems
                                                        const MARGIN = 16;
                                                        const right  = window.innerWidth - rect.right;
                                                        const openUp = window.innerHeight - rect.bottom < MENU_H + MARGIN;
                                                        setMenuPos(openUp
                                                            ? {right, bottom: window.innerHeight - rect.top + 4}
                                                            : {right, top: rect.bottom + 4});
                                                        setOpenMenuId(member.id);
                                                    }}>
                                                    <MoreHorizontal />
                                                </button>
                                                {isMenuOpen && menuPos && (
                                                    <div className={styles.dropdownMenu} style={{position: 'fixed', ...menuPos}}>
                                                        <button className={styles.dropdownItem}
                                                            onClick={() =>
                                                            {
                                                                setNewFirmRoleId(member.firmRoleId ?? '');
                                                                setNewIsPartner(member.isPartner);
                                                                setEditFirstName(member.user?.firstName ?? '');
                                                                setEditLastName(member.user?.lastName ?? '');
                                                                setEditPhone(member.user?.phone ?? '');
                                                                setEditHourlyRate(member.user?.hourlyRate != null ? String(member.user.hourlyRate) : '');
                                                                setChangeRoleFor(member);
                                                                setOpenMenuId(null);
                                                            }}>
                                                            <Shield /> Editar miembro
                                                        </button>
                                                        <button className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                                                            onClick={() => { setOpenMenuId(null); handleRemove(member); }}>
                                                            <X /> Eliminar miembro
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
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
                                    {roles.map(role => (
                                        <option key={role.id} value={role.id}>{role.name}</option>
                                    ))}
                                </select>
                            </div>
                            <label className={styles.checkboxRow}>
                                <input type="checkbox" checked={inviteIsPartner}
                                    onChange={e => setInviteIsPartner(e.target.checked)} />
                                <span>Es socio/accionista de la firma</span>
                            </label>
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

            {/* ── Edit member modal ─────────────────────────────────────────── */}
            {changeRoleFor && (
                <div className={styles.modalOverlay} onClick={() => setChangeRoleFor(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>Editar Miembro</h3>
                            <button className={styles.closeButton} onClick={() => setChangeRoleFor(null)}>×</button>
                        </div>
                        <div className={styles.modalContent}>
                            <p className={styles.modalSubtitle}>
                                Miembro: <strong>{memberName(changeRoleFor)}</strong>
                            </p>

                            {changeRoleFor.userId && (
                                <>
                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Nombre</label>
                                            <input type="text" className={styles.input}
                                                value={editFirstName} onChange={e => setEditFirstName(e.target.value)} />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Apellido</label>
                                            <input type="text" className={styles.input}
                                                value={editLastName} onChange={e => setEditLastName(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Teléfono <span className={styles.optional}>(opcional)</span></label>
                                        <input type="text" className={styles.input}
                                            value={editPhone} onChange={e => setEditPhone(e.target.value)}
                                            placeholder="+57 300 123 4567" />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Tarifa por hora (COP) <span className={styles.optional}>(opcional)</span></label>
                                        <input type="number" min="0" step="1000" className={styles.input}
                                            value={editHourlyRate} onChange={e => setEditHourlyRate(e.target.value)}
                                            placeholder="Ej: 150000" />
                                    </div>
                                </>
                            )}

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Rol</label>
                                <select className={styles.select} value={newFirmRoleId}
                                    onChange={e => setNewFirmRoleId(e.target.value)}>
                                    {roles.map(role => (
                                        <option key={role.id} value={role.id}>{role.name}</option>
                                    ))}
                                </select>
                            </div>
                            <label className={styles.checkboxRow}>
                                <input type="checkbox" checked={newIsPartner}
                                    onChange={e => setNewIsPartner(e.target.checked)} />
                                <span>Es socio/accionista de la firma</span>
                            </label>

                            {changeRoleFor.userId && (
                                <button type="button" className={styles.resetPasswordButton}
                                    onClick={handleSendPasswordReset} disabled={isSendingReset}>
                                    <Mail /> {isSendingReset ? 'Enviando...' : 'Enviar correo de recuperación de contraseña'}
                                </button>
                            )}
                        </div>
                        <div className={styles.modalActions}>
                            <button className={styles.cancelButton} onClick={() => setChangeRoleFor(null)}>
                                Cancelar
                            </button>
                            <button className={styles.inviteConfirmButton} onClick={handleUpdateMember}
                                disabled={
                                    isUpdating || isSavingProfile || !newFirmRoleId ||
                                    (!!changeRoleFor.userId && (!editFirstName.trim() || !editLastName.trim())) ||
                                    (newFirmRoleId === changeRoleFor.firmRoleId
                                        && newIsPartner === changeRoleFor.isPartner
                                        && editFirstName.trim() === (changeRoleFor.user?.firstName ?? '')
                                        && editLastName.trim()  === (changeRoleFor.user?.lastName ?? '')
                                        && editPhone.trim()     === (changeRoleFor.user?.phone ?? '')
                                        && editHourlyRate.trim() === (changeRoleFor.user?.hourlyRate != null ? String(changeRoleFor.user.hourlyRate) : ''))
                                }>
                                {(isUpdating || isSavingProfile) ? 'Guardando...' : 'Guardar Cambios'}
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
