'use client';

import {createContext, useCallback, useContext, useEffect, useState} from 'react';
import {API_BASE_URL} from '@/lib/constants';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AuthUser
{
    userId:    string;
    email:     string;
    firstName: string;
    lastName:  string;
}

interface AuthContextType
{
    accessToken:         string | null;
    user:                AuthUser | null;
    activeFirmId:        string | null;
    isAuthenticated:     boolean;
    isHydrated:          boolean; // true once localStorage has been read
    login:               (accessToken: string, refreshToken: string) => void;
    logout:              () => void;
    setActiveFirm:       (firmId: string | null) => void;
    refreshAccessToken:  () => Promise<string | null>;
}

// ─── Storage Keys ──────────────────────────────────────────────────────────────

const KEY_ACCESS  = 'ld_access_token';
const KEY_REFRESH = 'ld_refresh_token';
const KEY_FIRM    = 'ld_active_firm';

// ─── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({children}: {children: React.ReactNode})
{
    const [accessToken,  setAccessToken]  = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);
    const [user,         setUser]         = useState<AuthUser | null>(null);
    const [activeFirmId, setActiveFirmId] = useState<string | null>(null);
    const [isHydrated,   setIsHydrated]   = useState(false);

    // Rehydrate from localStorage on mount
    useEffect(() =>
    {
        const at  = localStorage.getItem(KEY_ACCESS);
        const rt  = localStorage.getItem(KEY_REFRESH);
        const fid = localStorage.getItem(KEY_FIRM);

        if (at)  setAccessToken(at);
        if (rt)  setRefreshToken(rt);
        if (fid) setActiveFirmId(fid);

        setIsHydrated(true);
    }, []);

    const login = useCallback((at: string, rt: string) =>
    {
        localStorage.setItem(KEY_ACCESS,  at);
        localStorage.setItem(KEY_REFRESH, rt);
        setAccessToken(at);
        setRefreshToken(rt);
    }, []);

    const logout = useCallback(() =>
    {
        localStorage.removeItem(KEY_ACCESS);
        localStorage.removeItem(KEY_REFRESH);
        localStorage.removeItem(KEY_FIRM);
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
        setActiveFirmId(null);
    }, []);

    const setActiveFirm = useCallback((firmId: string | null) =>
    {
        if (firmId) localStorage.setItem(KEY_FIRM, firmId);
        else        localStorage.removeItem(KEY_FIRM);
        setActiveFirmId(firmId);
    }, []);

    const refreshAccessToken = useCallback(async (): Promise<string | null> =>
    {
        const rt = localStorage.getItem(KEY_REFRESH);
        if (!rt) return null;

        try
        {
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method:  'POST',
                headers: {'Content-Type': 'application/json'},
                body:    JSON.stringify({refreshToken: rt}),
            });

            if (!response.ok)
            {
                logout();
                return null;
            }

            const {accessToken: newAt} = await response.json();
            localStorage.setItem(KEY_ACCESS, newAt);
            setAccessToken(newAt);
            return newAt;
        }
        catch
        {
            logout();
            return null;
        }
    }, [logout]);

    return (
        <AuthContext.Provider value={{
            accessToken,
            user,
            activeFirmId,
            isAuthenticated: !!accessToken,
            isHydrated,
            login,
            logout,
            setActiveFirm,
            refreshAccessToken,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType
{
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
