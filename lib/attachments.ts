import type {UseFetchOptions} from '@/hooks/useFetch';

// Interface centralizada en app/interfaces/interfaces.ts; se re-exporta acá por compatibilidad.
export type {PendingAttachment} from '@/app/interfaces/interfaces';

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

const startsWith = (bytes: Uint8Array, prefix: number[]): boolean =>
    prefix.every((byte, index) => bytes[index] === byte);

const detectAttachmentKind = (bytes: Uint8Array): 'pdf' | 'png' | 'jpeg' | 'docx' | null =>
{
    if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return 'pdf';
    if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
    if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'jpeg';

    if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]))
    {
        const head = new TextDecoder('latin1').decode(bytes.subarray(0, 4096));
        if (head.includes('[Content_Types].xml') || head.includes('word/')) return 'docx';
        return null;
    }

    return null;
};

export const validateAttachmentFile = async (file: File): Promise<string | null> =>
{
    if (file.size === 0) return 'El archivo está vacío.';
    if (file.size > MAX_ATTACHMENT_BYTES) return 'El archivo supera el tamaño máximo permitido (10MB).';

    const head = new Uint8Array(await file.slice(0, 4096).arrayBuffer());
    if (!detectAttachmentKind(head))
        return 'El contenido del archivo no corresponde a un formato permitido (PDF, DOCX, JPG, PNG).';

    return null;
};

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
