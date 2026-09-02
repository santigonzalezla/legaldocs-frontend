'use client';

import styles from './permissionguard.module.css';
import {usePermissions} from '@/context/PermissionsContext';
import {Shield} from '@/app/components/svg';

interface PermissionGuardProps
{
    permission: string | string[];
    // 'any' (default): alcanza con uno de los permisos si es un arreglo. 'all': los necesita todos.
    mode?: 'any' | 'all';
    children: React.ReactNode;
}

// A diferencia de AuthGuard/FirmGuard (que redirigen), este guard no navega a
// ningún lado: solo reemplaza el contenido de la página por un estado "sin
// acceso" cuando falta el permiso. La seguridad real ya la garantiza el backend
// (PermissionsGuard) — esto es solo para no mostrar una página vacía/rota si
// alguien entra por URL directa a algo que no le corresponde.
export function PermissionGuard({permission, mode = 'any', children}: PermissionGuardProps)
{
    const {can, canAny, isLoading} = usePermissions();

    if (isLoading) return null;

    const permissions = Array.isArray(permission) ? permission : [permission];
    const hasAccess = mode === 'all' ? permissions.every(can) : canAny(permissions);

    if (!hasAccess)
    {
        return (
            <div className={styles.container}>
                <Shield/>
                <h2 className={styles.title}>No tenés acceso a esta sección</h2>
                <p className={styles.subtitle}>Tu rol actual no incluye este módulo. Si creés que deberías tener acceso, contactá al administrador de tu despacho.</p>
            </div>
        );
    }

    return <>{children}</>;
}
