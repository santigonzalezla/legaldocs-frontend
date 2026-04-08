'use client';

import {useAuth} from '@/context/AuthContext';

export const useFirmId = (): string | null =>
{
    const {activeFirmId} = useAuth();
    return activeFirmId;
};
