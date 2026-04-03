'use client';

import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {useAuth} from '@/context/AuthContext';

export function AuthGuard({children}: {children: React.ReactNode})
{
    const {isAuthenticated, isHydrated} = useAuth();
    const router = useRouter();

    useEffect(() =>
    {
        if (isHydrated && !isAuthenticated)
            router.replace('/signin');
    }, [isHydrated, isAuthenticated, router]);

    // Mientras carga localStorage no renderizar nada (evita flash)
    if (!isHydrated || !isAuthenticated) return null;

    return <>{children}</>;
}
