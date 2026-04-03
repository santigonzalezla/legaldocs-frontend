'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import styles from '../downloadpanel/downloadpanel.module.css';
import { Save, Loader } from '@/app/components/svg';
import { useFormContext } from '@/context/FormContext';
import { useFetch } from '@/hooks/useFetch';
import { toast } from 'sonner';
import type { LegalProcess, PaginatedResponse } from '@/app/interfaces/interfaces';

const SaveBanner = () =>
{
    const { documentState, formData, schema, saveDocument, selectedProcessId, setSelectedProcessId, currentDocumentId, setCurrentDocumentId } = useFormContext();
    const [docTitle,     setDocTitle]     = useState('');
    const [isSaving,     setIsSaving]     = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);

    // Extract branch and doctype slugs from the current URL
    // URL shape: /dashboard/generator/[branchSlug]/[docTypeSlug]
    const pathname     = usePathname();
    const urlParts     = pathname.split('/').filter(Boolean);
    const branchSlug   = urlParts[2] ?? '';
    const docTypeSlug  = urlParts[3] ?? '';

    const isEditing = !!currentDocumentId;

    const { data: processRes } = useFetch<PaginatedResponse<LegalProcess>>(
        'process?limit=100',
        { firmScoped: true },
    );

    const { execute: createDocument } = useFetch<any>(
        'document',
        { method: 'POST', immediate: false, firmScoped: true },
    );

    const { execute: updateDocument } = useFetch<any>(
        '',
        { method: 'PATCH', immediate: false, firmScoped: true },
    );

    const processes = processRes?.data ?? [];

    useEffect(() =>
    {
        if (schema?.metadata?.title) setDocTitle(schema.metadata.title);
    }, [schema?.metadata?.title]);

    const hasContent = documentState.content && documentState.content.trim() !== '';

    const handleSave = async () =>
    {
        if (!hasContent) return;
        setIsSaving(true);
        setSavedSuccess(false);

        // Strip internal metadata keys before saving formData
        const { _processId: _p, ...cleanFormData } = formData as any;

        const body = {
            title:            docTitle.trim() || schema?.metadata?.title || 'Documento sin título',
            documentType:     schema?.document_type ?? '',
            branchId:         schema?.metadata?.category || undefined,
            processId:        selectedProcessId || null,
            formData: {
                ...cleanFormData,
                // Store routing metadata so the document can be reopened for editing
                ...(branchSlug  && { _branchSlug:  branchSlug }),
                ...(docTypeSlug && { _docTypeSlug: docTypeSlug }),
            },
            content:          documentState.content,
            hasCustomContent: documentState.hasCustomContent,
        };

        const result = isEditing
            ? await updateDocument({body}, `document/${currentDocumentId}`)
            : await createDocument({body});

        setIsSaving(false);

        if (result)
        {
            setSavedSuccess(true);
            // After first save, store the returned id so subsequent saves use PATCH
            if (!isEditing && result.id) setCurrentDocumentId(result.id);
            toast.success(isEditing ? 'Documento actualizado correctamente.' : 'Documento guardado en el sistema correctamente.');
            saveDocument();
        }
    };

    return (
        <div className={styles.saveBanner}>
            <div className={styles.saveBannerLeft}>
                <div className={styles.saveBannerIcon}><Save /></div>
                <span className={styles.saveBannerLabel}>{isEditing ? 'Actualizar documento' : 'Guardar en el sistema'}</span>
            </div>
            <div className={styles.saveBannerBody}>
                <input
                    className={styles.saveBannerInput}
                    value={docTitle}
                    onChange={e => { setDocTitle(e.target.value); setSavedSuccess(false); }}
                    placeholder="Nombre del documento"
                />
                <select
                    className={styles.saveBannerSelect}
                    value={selectedProcessId}
                    onChange={e => { setSelectedProcessId(e.target.value); setSavedSuccess(false); }}
                >
                    <option value="">Sin proceso asociado</option>
                    {processes.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                </select>
                <button
                    className={styles.saveBannerBtn}
                    onClick={handleSave}
                    disabled={isSaving || !hasContent}
                >
                    {isSaving
                        ? <><Loader style={{ width: 14, height: 14 }} className={styles.spinning} /> {isEditing ? 'Actualizando...' : 'Guardando...'}</>
                        : <><Save style={{ width: 14, height: 14 }} /> {isEditing ? 'Actualizar' : 'Guardar'}</>
                    }
                </button>
            </div>
        </div>
    );
};

export default SaveBanner;
