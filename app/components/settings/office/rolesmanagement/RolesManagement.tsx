'use client';

import {useState} from 'react';
import styles from './rolesmanagement.module.css';
import {useFetch} from '@/hooks/useFetch';
import {toast} from 'sonner';
import {Crown, Edit, Plus, Shield, Trash, Users, X} from '@/app/components/svg';
import type {FirmRole, PermissionModule} from '@/app/interfaces/interfaces';
import {useConfirm} from '@/hooks/useConfirm';
import ConfirmModal from '@/app/components/ui/confirmmodal/ConfirmModal';
import RoleEditor from './RoleEditor';

const RolesManagement = () =>
{
    const [showCreate,     setShowCreate]     = useState(false);
    const [newName,        setNewName]        = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [editingRole,    setEditingRole]    = useState<FirmRole | null>(null);

    const {data: roles, isLoading, execute: refetch} =
        useFetch<FirmRole[]>('permissions/firm-roles', {firmScoped: true});

    const {data: catalog} =
        useFetch<PermissionModule[]>('permissions/catalog', {firmScoped: true});

    const {execute: createRole, isLoading: isCreating} =
        useFetch<FirmRole>('permissions/firm-roles', {method: 'POST', immediate: false, firmScoped: true});

    const {execute: deleteRole} =
        useFetch<{message: string}>('', {method: 'DELETE', immediate: false, firmScoped: true});

    const {confirm, confirmState, handleConfirm, handleCancel} = useConfirm();

    const list = roles ?? [];

    const handleCreate = async () =>
    {
        if (!newName.trim()) { toast.error('Ingresa un nombre para el rol.'); return; }

        const result = await createRole({body: {name: newName.trim(), description: newDescription.trim() || undefined}});
        if (!result) return;

        toast.success('Rol creado. Ahora configurá sus permisos.');
        setNewName('');
        setNewDescription('');
        setShowCreate(false);
        await refetch();
        setEditingRole(result);
    };

    const handleDelete = async (role: FirmRole) =>
    {
        if (!await confirm({title: 'Eliminar rol', message: `¿Eliminar el rol "${role.name}"? Esta acción no se puede deshacer.`, confirmLabel: 'Eliminar'})) return;

        const result = await deleteRole({}, `permissions/firm-roles/${role.id}`);
        if (!result) return;

        toast.success('Rol eliminado.');
        refetch();
    };

    return (
        <div className={styles.rolesManagement}>
            <div className={styles.sectionHeader}>
                <div>
                    <h4 className={styles.sectionTitle}>Roles del Despacho</h4>
                    <p className={styles.sectionSubtitle}>Definí qué módulos puede ver y usar cada rol.</p>
                </div>
                <button className={styles.addButton} onClick={() => setShowCreate(true)}>
                    <Plus/> Nuevo Rol
                </button>
            </div>

            {isLoading ? (
                <p>Cargando roles...</p>
            ) : (
                <div className={styles.rolesList}>
                    {list.map(role => (
                        <div key={role.id} className={styles.roleCard}>
                            <div className={styles.roleInfo}>
                                <div className={styles.roleIcon}>
                                    {role.slug === 'admin' ? <Crown/> : <Shield/>}
                                </div>
                                <div className={styles.roleDetails}>
                                    <h5 className={styles.roleName}>
                                        {role.name}
                                        {role.isSystem && <span className={styles.systemBadge}>Sistema</span>}
                                    </h5>
                                    {role.description && <p className={styles.roleDescription}>{role.description}</p>}
                                    <span className={styles.memberCount}>
                                        <Users/> {role.memberCount} miembro{role.memberCount !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>

                            <div className={styles.roleActions}>
                                <button className={styles.editButton} onClick={() => setEditingRole(role)}>
                                    <Edit/> {role.slug === 'admin' ? 'Ver permisos' : 'Editar permisos'}
                                </button>
                                {!role.isSystem && (
                                    <button className={styles.deleteButton} onClick={() => handleDelete(role)} disabled={role.memberCount > 0}>
                                        <Trash/>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showCreate && (
                <div className={styles.modalOverlay} onClick={() => setShowCreate(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>Nuevo Rol</h3>
                            <button className={styles.closeButton} onClick={() => setShowCreate(false)}><X/></button>
                        </div>
                        <div className={styles.modalContent}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Nombre</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="Ej. Paralegal"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Descripción (opcional)</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={newDescription}
                                    onChange={e => setNewDescription(e.target.value)}
                                    placeholder="¿Qué hace este rol?"
                                />
                            </div>
                        </div>
                        <div className={styles.modalActions}>
                            <button className={styles.cancelButton} onClick={() => setShowCreate(false)}>Cancelar</button>
                            <button className={styles.confirmButton} onClick={handleCreate} disabled={isCreating || !newName.trim()}>
                                {isCreating ? 'Creando...' : 'Crear y configurar permisos'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editingRole && catalog && (
                <RoleEditor
                    role={editingRole}
                    catalog={catalog}
                    onClose={() => setEditingRole(null)}
                    onSaved={() => { setEditingRole(null); refetch(); }}
                />
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

export default RolesManagement;
