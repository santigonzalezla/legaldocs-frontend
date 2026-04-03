'use client';

import {ReactNode, useEffect, useState} from 'react';
import {FormProvider} from "@/context/FormContext";
import {contractSchema} from "@/app/interfaces/templates/rentalcontract";
import {usePathname, useSearchParams} from "next/navigation";
import {rightRequestSchema} from "@/app/interfaces/templates/rightrequest";
import {FormSchema} from "@/app/interfaces/types/formtypes";
import {useFetch} from "@/hooks/useFetch";
import type {Document, DocumentTemplate, PaginatedResponse} from "@/app/interfaces/interfaces";

// URL segment → documentType alias (for legacy named routes)
const SLUG_ALIASES: Record<string, string> = {
    'rentalcontract': 'contrato_arrendamiento',
    'rightrequest':   'derecho_peticion',
};

// Fallback schemas when no API template is found
const FALLBACK_SCHEMAS: Record<string, FormSchema> = {
    'contrato_arrendamiento': contractSchema,
    'derecho_peticion':       rightRequestSchema,
};

function buildVariableFieldsFromText(text: string): Record<string, Record<string, any>>
{
    const matches    = [...text.matchAll(/\{\{(\w+)(?::(\w+))?(?::(\w+(?:\[[^\]]*\])?))?}\}/g)];
    const seen       = new Set<string>();
    const validTypes = new Set(['texto', 'fecha', 'numero', 'email', 'booleano', 'seleccion']);
    const fields: Record<string, Record<string, any>> = {};

    for (const [, seg1, seg2, seg3] of matches)
    {
        let category: string, field: string, typeRaw: string;

        if (!seg2)      { category = 'general'; field = seg1; typeRaw = 'texto'; }
        else if (!seg3) { category = seg1;      field = seg2; typeRaw = 'texto'; }
        else            { category = seg1;      field = seg2; typeRaw = seg3;    }

        const key = `${category}:${field}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const selMatch = typeRaw.match(/^(\w+)(?:\[([^\]]*)\])?$/);
        const type     = (selMatch?.[1] && validTypes.has(selMatch[1])) ? selMatch[1] : 'texto';
        const options  = selMatch?.[2]?.split(',').map((o: string) => o.trim()).filter(Boolean);

        if (!fields[category]) fields[category] = {};
        fields[category][field] = {
            type,
            required:      true,
            placeholder:   field.replace(/_/g, ' '),
            default_value: '',
            ...(options?.length ? {options} : {}),
        };
    }

    return fields;
}

function templateToFormSchema(tpl: DocumentTemplate): FormSchema
{
    const stored          = (tpl.variableFields as Record<string, any>) ?? {};
    const variable_fields = Object.keys(stored).length
        ? stored
        : buildVariableFieldsFromText(tpl.textTemplate ?? '');

    return {
        document_type:  tpl.documentType,
        version:        tpl.version ?? '1.0',
        creation_date:  tpl.createdAt,
        metadata: {
            title:                   tpl.title,
            category:                tpl.branchId ?? '',
            subcategory:             tpl.subcategory ?? '',
            applicable_regulations:  (tpl.applicableRegulations as string[]) ?? [],
            requires_registration:   tpl.requiresRegistration ?? false,
            legal_validity:          tpl.legalValidity ?? true,
        },
        variable_fields,
        text_template: tpl.textTemplate ?? '',
    };
}

interface EditDocData {
    formData:   Record<string, any>;
    content:    string | undefined;
    id:         string;
    processId?: string | null;
}

export default function GeneratorLayout({children}: Readonly<{ children: ReactNode; }>)
{
    const path         = usePathname();
    const searchParams = useSearchParams();
    const documentId   = searchParams.get('documentId');
    const processId    = searchParams.get('processId');

    const [schema,  setSchema]  = useState<FormSchema | undefined>();
    const [editDoc, setEditDoc] = useState<EditDocData | undefined>();

    // Extract documentType from URL: /dashboard/generator/[branch]/[doctype]
    const pathParts    = path.split('/').filter(Boolean);
    const isDocPage    = pathParts.length >= 4 && pathParts[1] === 'generator';
    const docTypeSlug  = isDocPage ? pathParts[3] : null;
    const documentType = docTypeSlug ? (SLUG_ALIASES[docTypeSlug] ?? docTypeSlug) : null;

    const {execute: fetchTemplate} = useFetch<PaginatedResponse<DocumentTemplate>>(
        'template',
        {immediate: false, firmScoped: true},
    );

    const {execute: fetchDocument} = useFetch<Document>(
        '',
        {immediate: false, firmScoped: true},
    );

    useEffect(() =>
    {
        if (!documentType)
        {
            setSchema(undefined);
            setEditDoc(undefined);
            return;
        }

        const schemaPromise = fetchTemplate({}, `template?documentType=${documentType}&limit=1`);
        const docPromise    = documentId
            ? fetchDocument({}, `document/${documentId}`)
            : Promise.resolve(null);

        Promise.all([schemaPromise, docPromise]).then(([res, doc]) =>
        {
            if (res?.data?.length)
                setSchema(templateToFormSchema(res.data[0]));
            else
                setSchema(FALLBACK_SCHEMAS[documentType] ?? undefined);

            setEditDoc(doc
                ? {formData: (doc.formData as Record<string, any>) ?? {}, content: doc.content ?? undefined, id: doc.id, processId: doc.processId}
                : undefined,
            );
        });
    }, [path, documentId]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <FormProvider
            key={`generator-${schema?.document_type}-${schema?.version}-${documentId ?? 'new'}`}
            initialSchema={schema}
            initialFormData={editDoc?.formData}
            initialContent={editDoc?.content}
            initialDocumentId={editDoc?.id}
            initialProcessId={editDoc?.processId ?? processId ?? undefined}
            onFormChange={() => {}}
            onSave={() => {}}
            onGenerate={() => {}}
        >
            {children}
        </FormProvider>
    );
}
