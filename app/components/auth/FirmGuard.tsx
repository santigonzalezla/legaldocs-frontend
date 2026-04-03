'use client';

import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {useAuth} from '@/context/AuthContext';
import {API_BASE_URL} from '@/lib/constants';

interface FirmBasic { id: string; name: string; }

const FirmGuard = ({children}: {children: React.ReactNode}) =>
{
    const {isAuthenticated, isHydrated, accessToken, activeFirmId, setActiveFirm} = useAuth();
    const router = useRouter();
    const [ready, setReady] = useState(false);

    useEffect(() =>
    {
        if (!isHydrated || !isAuthenticated) return;

        // Ya tiene firma seleccionada — listo
        if (activeFirmId) { setReady(true); return; }

        const checkFirms = async () =>
        {
            try
            {
                const res = await fetch(`${API_BASE_URL}/firm/my-firms`, {
                    headers: {Authorization: `Bearer ${accessToken}`},
                });

                if (!res.ok) { router.replace('/onboarding'); return; }

                const firms: FirmBasic[] = await res.json();

                if (firms.length === 0)
                {
                    router.replace('/onboarding');
                }
                else
                {
                    setActiveFirm(firms[0].id);
                    setReady(true);
                }
            }
            catch
            {
                router.replace('/onboarding');
            }
        };

        checkFirms();
    }, [isHydrated, isAuthenticated, accessToken, activeFirmId, setActiveFirm, router]);

    if (!isHydrated || !isAuthenticated || (!ready && !activeFirmId)) return null;

    return <>{children}</>;
};

export default FirmGuard;
