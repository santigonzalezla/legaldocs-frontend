'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import styles from './templateeditor.module.css';
import {Save, Upload, X} from '@/app/components/svg';
import TemplateDocumentEditor from '@/app/components/generator/documenteditor/TemplateDocumentEditor';
import {useFetch} from '@/hooks/useFetch';
import type {DocumentTemplate, LegalBranch} from '@/app/interfaces/interfaces';
import {toast} from 'sonner';

interface ParseUploadResponse
{
    textTemplate:      string;
    variableFields:    Record<string, any>;
    detectedVariables: string[];
}

interface TemplateEditorProps
{
    templateId: string | null;
    onClose:    () => void;
    onSaved:    () => void;
}

const TemplateEditor = ({templateId, onClose, onSaved}: TemplateEditorProps) =>
{
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        title:          '',
        documentType:   '',
        branchIds:      [] as string[],
        subcategory:    '',
        textTemplate:   '',
        variableFields: {} as Record<string, any>,
    });

    // ── Branches ──────────────────────────────────────────────────────────────
    const {data: branches, isLoading: loadingBranches} = useFetch<LegalBranch[]>('branch', {firmScoped: true});

    // ── Load existing template ─────────────────────────────────────────────────
    const {data: existingTemplate, execute: fetchTemplate} = useFetch<DocumentTemplate>(
        `template/${templateId ?? ''}`,
        {immediate: false, firmScoped: true},
    );

    useEffect(() =>
    {
        if (templateId) fetchTemplate();
    }, [templateId, fetchTemplate]);

    useEffect(() =>
    {
        if (!existingTemplate) return;
        setForm({
            title:          existingTemplate.title,
            documentType:   existingTemplate.documentType,
            branchIds:      existingTemplate.branches.map(b => b.id),
            subcategory:    existingTemplate.subcategory ?? '',
            textTemplate:   existingTemplate.textTemplate ?? '',
            variableFields: (existingTemplate.variableFields as Record<string, any>) ?? {},
        });
    }, [existingTemplate]);

    // ── Parse upload ──────────────────────────────────────────────────────────
    const {execute: parseUpload, isLoading: isParsing} = useFetch<ParseUploadResponse>('', {
        method:     'POST',
        immediate:  false,
        isFormData: true,
        firmScoped: true,
    });

    // ── Create ────────────────────────────────────────────────────────────────
    const {execute: createTemplate, isLoading: isCreating} = useFetch<DocumentTemplate>('template', {
        method:    'POST',
        immediate: false,
        firmScoped: true,
    });

    // ── Update ────────────────────────────────────────────────────────────────
    const {execute: updateTemplate, isLoading: isUpdating} = useFetch<DocumentTemplate>('', {
        method:    'PATCH',
        immediate: false,
        firmScoped: true,
    });

    // ── Detected variables (soporta {{var}}, {{cat:var}}, {{cat:var:tipo}}, {{cat:var:seleccion[op1,op2]}}) ──
    const detectedVariables = useMemo(() =>
    {
        const matches    = [...form.textTemplate.matchAll(/\{\{(\w+)(?::(\w+))?(?::(\w+(?:\[[^\]]*\])?))?}\}/g)];
        const seen       = new Set<string>();
        const validTypes = new Set(['texto', 'fecha', 'numero', 'email', 'booleano', 'seleccion']);
        const result: {full: string; category: string; field: string; type: string; options?: string[]}[] = [];

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
            const options  = selMatch?.[2]?.split(',').map(o => o.trim()).filter(Boolean);

            const full = !seg2 ? seg1 : !seg3 ? `${seg1}:${seg2}` : `${seg1}:${seg2}:${seg3}`;
            result.push({full, category, field, type, ...(options?.length ? {options} : {})});
        }
        return result;
    }, [form.textTemplate]);

    const groupedVariables = useMemo(() =>
    {
        const groups: Record<string, typeof detectedVariables> = {};
        for (const v of detectedVariables)
        {
            if (!groups[v.category]) groups[v.category] = [];
            groups[v.category].push(v);
        }
        return groups;
    }, [detectedVariables]);

    const handleField = (key: string, value: string) =>
        setForm(prev => ({...prev, [key]: value}));

    // ── File upload handler ───────────────────────────────────────────────────
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) =>
    {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        const result = await parseUpload({body: formData}, 'template/parse-upload');
        if (!result) return;

        setForm(prev => ({
            ...prev,
            textTemplate:   result.textTemplate,
            variableFields: result.variableFields,
        }));
        toast.success(`Documento importado. ${result.detectedVariables.length} variables detectadas.`);

        // Reset input so the same file can be re-selected
        e.target.value = '';
    };

    // ── Save ──────────────────────────────────────────────────────────────────
    const handleSave = async () =>
    {
        if (!form.title.trim() || form.branchIds.length === 0)
        {
            toast.error('Título y al menos una rama jurídica son obligatorios.');
            return;
        }

        // Always rebuild from the current textTemplate so variableFields
        // stays in sync with whatever {{cat:field}} variables are actually used.
        // Merge with existing configs to preserve any manual type overrides.
        const builtFields    = buildVariableFields(detectedVariables);
        const variableFields = mergeVariableFields(builtFields, form.variableFields);

        const documentType = templateId
            ? form.documentType
            : toSlug(form.title.trim());

        const payload: Record<string, any> = {
            title:        form.title.trim(),
            documentType,
            branchIds:    form.branchIds,
        };

        if (form.subcategory.trim()) payload.subcategory    = form.subcategory.trim();
        if (form.textTemplate)       payload.textTemplate   = form.textTemplate;
        if (Object.keys(variableFields).length) payload.variableFields = variableFields;

        const result = templateId
            ? await updateTemplate({body: payload}, `template/${templateId}`)
            : await createTemplate({body: payload});

        if (!result) return;

        toast.success(templateId ? 'Plantilla actualizada.' : 'Plantilla creada correctamente.');
        window.dispatchEvent(new Event('template:saved'));
        onSaved();
    };

    const addBranch = (value: string) =>
    {
        if (value === '__all__')
        {
            setForm(prev => ({...prev, branchIds: (branches ?? []).map(b => b.id)}));
            return;
        }
        if (!value) return;
        setForm(prev => prev.branchIds.includes(value)
            ? prev
            : {...prev, branchIds: [...prev.branchIds, value]},
        );
    };

    const removeBranch = (id: string) =>
        setForm(prev => ({...prev, branchIds: prev.branchIds.filter(b => b !== id)}));

    const isSaving = isCreating || isUpdating;
    const canSave  = form.title.trim() && form.branchIds.length > 0;

    return (
        <div className={styles.templateEditor}>

            {/* Header */}
            <div className={styles.header}>
                <h3 className={styles.title}>{templateId ? 'Editar Plantilla' : 'Nueva Plantilla'}</h3>
                <button className={styles.closeButton} onClick={onClose}><X /></button>
            </div>

            {/* Metadata */}
            <div className={styles.form}>
                {/* Row 1: Título + Descripción */}
                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            Título <span className={styles.required}>*</span>
                        </label>
                        <input
                            className={styles.input}
                            type="text"
                            placeholder="Ej: Contrato de Arrendamiento Comercial"
                            value={form.title}
                            onChange={e => handleField('title', e.target.value)}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Descripción</label>
                        <input
                            className={styles.input}
                            type="text"
                            placeholder="Ej: Arrendamiento de vivienda urbana (opcional)"
                            value={form.subcategory}
                            onChange={e => handleField('subcategory', e.target.value)}
                        />
                    </div>
                </div>

                {/* Row 2: Ramas (full width) */}
                <div className={styles.formRow}>
                    <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                        <label className={styles.label}>
                            Ramas Jurídicas <span className={styles.required}>*</span>
                        </label>
                        <div className={styles.branchRow}>
                            <select
                                className={styles.branchSelect}
                                value=""
                                onChange={e => { addBranch(e.target.value); e.target.value = ''; }}
                                disabled={loadingBranches}
                            >
                                <option value="">Agregar rama...</option>
                                <option value="__all__">✦ Todas las ramas</option>
                                {(branches ?? [])
                                    .filter(b => !form.branchIds.includes(b.id))
                                    .map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))
                                }
                            </select>
                            {form.branchIds.map(id =>
                            {
                                const b = (branches ?? []).find(x => x.id === id);
                                if (!b) return null;
                                return (
                                    <span
                                        key={id}
                                        className={styles.branchChip}
                                        style={{
                                            backgroundColor: `${b.color ?? '#6b7280'}15`,
                                            borderColor:      `${b.color ?? '#6b7280'}40`,
                                            color:             b.color ?? '#6b7280',
                                        }}
                                    >
                                        <span
                                            className={styles.branchDot}
                                            style={{backgroundColor: b.color ?? '#6b7280'}}
                                        />
                                        {b.name}
                                        <button
                                            type="button"
                                            className={styles.branchRemove}
                                            onClick={() => removeBranch(id)}
                                        >
                                            ×
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Editor */}
            <div className={styles.editorSection}>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx"
                    style={{display: 'none'}}
                    onChange={handleFileChange}
                />
                <TemplateDocumentEditor
                    value={form.textTemplate}
                    onChange={v => handleField('textTemplate', v)}
                    groupedVariables={groupedVariables}
                    toolbarExtra={
                        <button
                            className={styles.uploadDocxButton}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isParsing}
                            title="Importar contenido desde un archivo .docx"
                        >
                            <Upload />
                            {isParsing ? 'Procesando...' : 'Importar .docx'}
                        </button>
                    }
                />
            </div>

            {/* Actions */}
            <div className={styles.actions}>
                <button className={styles.cancelButton} onClick={onClose}>Cancelar</button>
                <button
                    className={styles.saveButton}
                    onClick={handleSave}
                    disabled={isSaving || !canSave}
                >
                    <Save />
                    {isSaving ? 'Guardando...' : 'Guardar Plantilla'}
                </button>
            </div>
        </div>
    );
};

export default TemplateEditor;

function toSlug(s: string): string
{
    return s
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

function buildVariableFields(
    vars: {full: string; category: string; field: string; type: string; options?: string[]}[],
): Record<string, any>
{
    if (!vars.length) return {};
    const fields: Record<string, any> = {};
    for (const {category, field, type, options} of vars)
    {
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

// Merge built fields with existing stored fields, preserving any manual type/option overrides.
function mergeVariableFields(
    built:    Record<string, any>,
    existing: Record<string, any>,
): Record<string, any>
{
    const result: Record<string, any> = {};
    for (const [category, fields] of Object.entries(built))
    {
        result[category] = {};
        for (const [field, defaultConfig] of Object.entries(fields as Record<string, any>))
        {
            const override = existing?.[category]?.[field];
            result[category][field] = override ?? defaultConfig;
        }
    }
    return result;
}
