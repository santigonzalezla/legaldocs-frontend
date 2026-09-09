import type {UseFetchOptions} from '@/hooks/useFetch';

// Interface centralizada en app/interfaces/interfaces.ts; se re-exporta acá por compatibilidad.
export type {PendingAttachment} from '@/app/interfaces/interfaces';

type Execute = (overrideOptions?: Partial<UseFetchOptions>, overrideUrl?: string) => Promise<unknown>;

// Arma el multipart y lo manda a través del execute de un useFetch({isFormData: true}).
// El fetch real vive solo dentro de useFetch. Devuelve true si el backend respondió 2xx.
export const uploadAttachment = async (
    execute: Execute,
    apiBasePath: string,
    file: File,
    type: string,
): Promise<boolean> =>
{
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const result = await execute({body: formData}, apiBasePath);
    return result != null;
};
