'use client';

import {useEffect, useState} from 'react';
import {useAuth} from '@/context/AuthContext';
import {API_BASE_URL} from '@/lib/constants';
import NoFirmAssigned from './NoFirmAssigned';

interface FirmBasic { id: string; name: string; }

const FirmGuard = ({children}: {children: React.ReactNode}) =>
{
    const {isAuthenticated, isHydrated, accessToken, activeFirmId, setActiveFirm} = useAuth();
    const [ready,  setReady]  = useState(false);
    const [noFirm, setNoFirm] = useState(false);

    useEffect(() =>
    {
        if (!isHydrated || !isAuthenticated) return;

        let cancelled = false;

        const resolveFirm = async () =>
        {
            try
            {
                const res = await fetch(`${API_BASE_URL}/firm/my-firms`, {
                    headers: {Authorization: `Bearer ${accessToken}`},
                });

                if (cancelled) return;

                if (!res.ok) { setNoFirm(true); return; }

                const firms: FirmBasic[] = await res.json();

                if (firms.length === 0)
                {
                    setActiveFirm(null);
                    setNoFirm(true);
                    return;
                }

                // Si la firma activa fue eliminada o perdiste acceso, cambiá a otra
                // firma asociada en vez de dejar un id colgado que rompe cada request.
                const stillValid = activeFirmId && firms.some(f => f.id === activeFirmId);
                if (!stillValid)
                {
                    setActiveFirm(firms[0].id);
                    return; // el cambio de activeFirmId vuelve a disparar el effect
                }

                setNoFirm(false);
                setReady(true);
            }
            catch
            {
                if (!cancelled) setNoFirm(true);
            }
        };

        resolveFirm();
        return () => { cancelled = true; };
    }, [isHydrated, isAuthenticated, accessToken, activeFirmId, setActiveFirm]);

    if (!isHydrated || !isAuthenticated) return null;
    if (noFirm) return <NoFirmAssigned/>;
    if (!ready) return null;

    return <>{children}</>;
};

export default FirmGuard;
