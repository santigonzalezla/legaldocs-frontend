'use client';

import {useState} from 'react';
import styles from './roleeditor.module.css';
import {useFetch} from '@/hooks/useFetch';
import {toast} from 'sonner';
import {ArrowDown, ArrowGo, X} from '@/app/components/svg';
import type {FirmRole, PermissionModule} from '@/app/interfaces/interfaces';

interface RoleEditorProps
{
    role:    FirmRole;
    catalog: PermissionModule[];
    onClose: () => void;
    onSaved: () => void;
}

const RoleEditor = ({role, catalog, onClose, onSaved}: RoleEditorProps) =>
{
    const isAdmin = role.slug === 'admin';

    const [selectedKeys,   setSelectedKeys]   = useState<Set<string>>(new Set(role.permissionKeys));
    const [expandedModule, setExpandedModule] = useState<string | null>(catalog[0]?.key ?? null);

    const {execute: savePermissions, isLoading: isSaving} =
        useFetch<FirmRole>('', {method: 'PATCH', immediate: false, firmScoped: true});

    const toggleModule = (module: PermissionModule) =>
    {
        const moduleKeys   = module.permissions.map(p => p.key);
        const allSelected  = moduleKeys.every(key => selectedKeys.has(key));

        setSelectedKeys(prev =>
        {
            const next = new Set(prev);
            moduleKeys.forEach(key => allSelected ? next.delete(key) : next.add(key));
            return next;
        });
    };

    const togglePermission = (key: string) =>
    {
        setSelectedKeys(prev =>
        {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const handleSave = async () =>
    {
        const result = await savePermissions(
            {body: {permissionKeys: Array.from(selectedKeys)}},
            `permissions/firm-roles/${role.id}/permissions`,
        );
        if (!result) return;

        toast.success('Permisos actualizados correctamente.');
        onSaved();
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div>
                        <h3 className={styles.modalTitle}>{role.name}</h3>
                        {role.description && <p className={styles.modalSubtitle}>{role.description}</p>}
                    </div>
                    <button className={styles.closeButton} onClick={onClose}><X/></button>
                </div>

                <div className={styles.modalContent}>
                    {isAdmin ? (
                        <p className={styles.adminNotice}>Este rol tiene acceso total al despacho y no se puede editar.</p>
                    ) : (
                        <div className={styles.moduleList}>
                            {catalog.filter(module => module.permissions.length > 0).map(module =>
                            {
                                const moduleKeys    = module.permissions.map(p => p.key);
                                const selectedCount = moduleKeys.filter(key => selectedKeys.has(key)).length;
                                const allSelected   = selectedCount === moduleKeys.length;
                                const isExpanded    = expandedModule === module.key;

                                return (
                                    <div key={module.key} className={styles.moduleCard}>
                                        <div className={styles.moduleHeader}>
                                            <button
                                                type="button"
                                                className={styles.expandButton}
                                                onClick={() => setExpandedModule(isExpanded ? null : module.key)}
                                            >
                                                {isExpanded ? <ArrowDown/> : <ArrowGo/>}
                                                <span className={styles.moduleLabel}>{module.label}</span>
                                                <span className={styles.moduleCount}>{selectedCount}/{moduleKeys.length}</span>
                                            </button>

                                            <div className={styles.toggle}>
                                                <input
                                                    type="checkbox"
                                                    id={`module-${module.key}`}
                                                    checked={allSelected}
                                                    onChange={() => toggleModule(module)}
                                                    className={styles.toggleInput}
                                                />
                                                <label htmlFor={`module-${module.key}`} className={styles.toggleLabel}>
                                                    <span className={styles.toggleSlider}></span>
                                                </label>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className={styles.permissionList}>
                                                {module.permissions.map(permission => (
                                                    <div key={permission.key} className={styles.permissionRow}>
                                                        <span className={styles.permissionLabel}>{permission.label}</span>
                                                        <div className={styles.toggle}>
                                                            <input
                                                                type="checkbox"
                                                                id={permission.key}
                                                                checked={selectedKeys.has(permission.key)}
                                                                onChange={() => togglePermission(permission.key)}
                                                                className={styles.toggleInput}
                                                            />
                                                            <label htmlFor={permission.key} className={styles.toggleLabel}>
                                                                <span className={styles.toggleSlider}></span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {!isAdmin && (
                    <div className={styles.modalActions}>
                        <button className={styles.cancelButton} onClick={onClose}>Cancelar</button>
                        <button className={styles.confirmButton} onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Guardando...' : 'Guardar Permisos'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoleEditor;
