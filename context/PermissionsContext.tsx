'use client';

import React, {createContext, useCallback, useContext, useMemo} from 'react';
import {useFetch} from '@/hooks/useFetch';
import type {EffectivePermissions} from '@/app/interfaces/interfaces';

interface PermissionsContextType
{
    isAdmin:   boolean;
    isLoading: boolean;
    can:       (key: string) => boolean;
    canAny:    (keys: string[]) => boolean;
}

interface PermissionsProviderProps
{
    children: React.ReactNode;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const usePermissions = () =>
{
    const context = useContext(PermissionsContext);
    if (!context) throw new Error('usePermissions must be used within a PermissionsProvider');
    return context;
};

// Refetchea solo con firmScoped:true — useFetch ya re-ejecuta automáticamente
// cuando cambia activeFirmId (ver hooks/useFetch.ts), así que cambiar de firma
// activa alcanza para traer el set de permisos correcto sin lógica extra acá.
export const PermissionsProvider: React.FC<PermissionsProviderProps> = ({children}) =>
{
    const {data, isLoading} = useFetch<EffectivePermissions>('permissions/me', {firmScoped: true});

    const permissionKeySet = useMemo(() => new Set(data?.permissionKeys ?? []), [data]);
    const isAdmin = data?.isAdmin ?? false;

    const can = useCallback(
        (key: string) => isAdmin || permissionKeySet.has(key),
        [isAdmin, permissionKeySet],
    );

    const canAny = useCallback(
        (keys: string[]) => isAdmin || keys.some(key => permissionKeySet.has(key)),
        [isAdmin, permissionKeySet],
    );

    return (
        <PermissionsContext.Provider value={{isAdmin, isLoading, can, canAny}}>
            {children}
        </PermissionsContext.Provider>
    );
};
