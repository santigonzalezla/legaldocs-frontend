'use client';

import {useCallback, useEffect, useMemo, useState} from 'react';
import {useAuth} from '@/context/AuthContext';
import {API_BASE_URL} from '@/lib/constants';

export interface UseFetchOptions
{
    method?:       'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?:         any;
    headers?:      Record<string, string>;
    immediate?:    boolean;
    responseType?: 'json' | 'blob';
    isFormData?:   boolean;
    firmScoped?:   boolean;
}

export interface UseFetchResult<T>
{
    data:      T | null;
    isLoading: boolean;
    error:     string | null;
    execute:   (overrideOptions?: Partial<UseFetchOptions>, overrideUrl?: string) => Promise<T | null>;
    reset:     () => void;
}

export function useFetch<T = any>(url: string, options: UseFetchOptions = {}): UseFetchResult<T>
{
    const [data,      setData]      = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error,     setError]     = useState<string | null>(null);

    const {accessToken, activeFirmId, logout, refreshAccessToken} = useAuth();

    const stableOptions = useMemo(() => options, [
        options.method,
        options.immediate,
        options.isFormData,
        options.firmScoped,
        options.responseType,
        JSON.stringify(options.body),
        JSON.stringify(options.headers),
    ]);

    const execute = useCallback(async (
        overrideOptions: Partial<UseFetchOptions> = {},
        overrideUrl?: string,
    ): Promise<T | null> =>
    {
        setIsLoading(true);
        setError(null);

        const merged     = {...stableOptions, ...overrideOptions};
        const urlToUse   = overrideUrl ?? url;
        const isFormData = merged.isFormData ?? false;
        const firmScoped = merged.firmScoped  ?? false;

        const doRequest = async (token: string | null): Promise<Response> =>
        {
            const headers: Record<string, string> = {...merged.headers};

            if (!isFormData)              headers['Content-Type'] = 'application/json';
            if (token)                    headers['Authorization'] = `Bearer ${token}`;
            if (firmScoped && activeFirmId) headers['X-Firm-Id'] = activeFirmId;

            const fetchOptions: RequestInit = {
                method:  merged.method ?? 'GET',
                headers,
            };

            if (merged.body && merged.method !== 'GET')
                fetchOptions.body = isFormData
                    ? merged.body
                    : JSON.stringify(merged.body);

            return fetch(`${API_BASE_URL}/${urlToUse}`, fetchOptions);
        };

        try
        {
            let response = await doRequest(accessToken);

            if (response.status === 401)
            {
                const newToken = await refreshAccessToken();

                if (!newToken)
                {
                    logout();
                    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
                }

                response = await doRequest(newToken);

                if (response.status === 401)
                {
                    logout();
                    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
                }
            }

            if (!response.ok)
            {
                const errorData = await response.json().catch(() => ({}));
                const message   = Array.isArray(errorData.message)
                    ? errorData.message.join(', ')
                    : (errorData.message ?? `Error ${response.status}: ${response.statusText}`);
                throw new Error(message);
            }

            const responseData: T = merged.responseType === 'blob'
                ? await response.blob() as T
                : await response.json();

            setData(responseData);
            return responseData;
        }
        catch (e)
        {
            const msg = e instanceof Error ? e.message : 'Error desconocido al realizar la solicitud';
            setError(msg);
            console.error('[useFetch]', msg);
            return null;
        }
        finally
        {
            setIsLoading(false);
        }
    }, [url, stableOptions, accessToken, activeFirmId, logout, refreshAccessToken]);

    const reset = useCallback(() =>
    {
        setData(null);
        setIsLoading(false);
        setError(null);
    }, []);

    useEffect(() =>
    {
        if (stableOptions.immediate !== false) execute();
    }, [execute]);

    return {data, isLoading, error, execute, reset};
}
