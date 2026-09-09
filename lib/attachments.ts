import {API_BASE_URL} from '@/lib/constants';

// Interface centralizada en app/interfaces/interfaces.ts; se re-exporta acá por compatibilidad.
export type {PendingAttachment} from '@/app/interfaces/interfaces';

export const uploadAttachment = async (
    apiBasePath: string,
    file: File,
    type: string,
    accessToken: string | null,
    firmId: string | null,
): Promise<boolean> =>
{
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try
    {
        const response = await fetch(`${API_BASE_URL}/${apiBasePath}`, {
            method:  'POST',
            headers: {Authorization: `Bearer ${accessToken}`, 'X-Firm-Id': firmId ?? ''},
            body:    formData,
        });

        if (!response.ok)
        {
            const detail = await response.text().catch(() => '');
            console.error(`[uploadAttachment] ${response.status} ${apiBasePath} → ${detail}`);
        }

        return response.ok;
    }
    catch (error)
    {
        console.error(`[uploadAttachment] network error ${apiBasePath}`, error);
        return false;
    }
};
