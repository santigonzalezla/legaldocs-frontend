"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { FormData, FormSchema } from "@/app/interfaces/types/formtypes";

interface DocumentState {
    content: string
    hasCustomContent: boolean
    hasUnsavedChanges: boolean
}

interface FormContextType {
    // Form data
    formData: FormData
    setFormData: (data: FormData) => void
    updateFormField: (categoryName: string, fieldPath: string, value: any) => void

    // Schema
    schema: FormSchema | null
    setSchema: (schema: FormSchema) => void

    // Process association
    selectedProcessId: string
    setSelectedProcessId: (id: string) => void

    // Document being edited (null = creating new)
    currentDocumentId: string | null
    setCurrentDocumentId: (id: string | null) => void

    // Document state
    documentState: DocumentState
    setDocumentContent: (content: string) => void
    setHasCustomContent: (hasCustom: boolean) => void
    setHasUnsavedChanges: (hasUnsaved: boolean) => void

    // Actions
    saveDocument: () => void
    resetDocument: () => void

    // Callbacks
    onFormChange?: (formData: FormData) => void
    onSave?: (formData: FormData) => void
    onGenerate?: (formData: FormData) => void
}

const FormContext = createContext<FormContextType | undefined>(undefined);

interface FormProviderProps {
    children: ReactNode
    initialSchema?: FormSchema
    initialFormData?: Record<string, any>
    initialContent?: string
    initialDocumentId?: string
    initialProcessId?: string
    onFormChange?: (formData: FormData) => void
    onSave?: (formData: FormData) => void
    onGenerate?: (formData: FormData) => void
}

export function FormProvider({ children, initialSchema, initialFormData, initialContent, initialDocumentId, initialProcessId, onFormChange, onSave, onGenerate }: FormProviderProps)
{
    const [formData, setFormData] = useState<FormData>({});
    const [schema, setSchema] = useState<FormSchema | null>(initialSchema || null);
    const [selectedProcessId, setSelectedProcessId] = useState(initialProcessId ?? '');
    const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(initialDocumentId ?? null);
    const [documentState, setDocumentState] = useState<DocumentState>({
        content: "",
        hasCustomContent: false,
        hasUnsavedChanges: false,
    });

    // Initialize form data when schema loads
    useEffect(() =>
    {
        if (!schema) return;

        if (initialFormData && Object.keys(initialFormData).length > 0)
        {
            // Editing existing document: restore saved values
            const { _processId, ...cleanData } = initialFormData as any;
            setFormData(cleanData);
            // initialProcessId (from DB column) takes priority; fall back to legacy _processId in formData
            if (!initialProcessId && _processId) setSelectedProcessId(_processId);
        }
        else
        {
            // New document: initialize from schema defaults
            const initializeFormData = () =>
            {
                const initialData: FormData = {};

                Object.entries(schema.variable_fields).forEach(([categoryName, categoryConfig]) =>
                {
                    initialData[categoryName] = {};
                    initializeCategory(categoryConfig, initialData[categoryName]);
                });

                setFormData(initialData);
            };

            const initializeCategory = (config: any, target: any) =>
            {
                Object.entries(config).forEach(([key, value]) =>
                {
                    if (value && typeof value === "object" && "type" in value)
                    {
                        const fieldConfig = value as any;
                        if (fieldConfig.default_value !== undefined) target[key] = fieldConfig.default_value;
                    }
                    else if (value && typeof value === "object")
                    {
                        target[key] = {};
                        initializeCategory(value, target[key]);
                    }
                });
            };

            initializeFormData();
            if (!initialProcessId) setSelectedProcessId('');
        }
    }, [schema]); // eslint-disable-line react-hooks/exhaustive-deps

    // Initialize document content when schema loads
    useEffect(() =>
    {
        if (!schema) return;

        if (initialContent)
        {
            setDocumentState({content: initialContent, hasCustomContent: true, hasUnsavedChanges: false});
        }
        else
        {
            setDocumentState({content: "", hasCustomContent: false, hasUnsavedChanges: false});
        }
    }, [schema]); // eslint-disable-line react-hooks/exhaustive-deps

    // Call onFormChange when formData changes
    useEffect(() =>
    {
        if (Object.keys(formData).length > 0) onFormChange?.(formData);
    }, [formData, onFormChange]);

    const updateFormField = (categoryName: string, fieldPath: string, value: any) =>
    {
        setFormData((prev: any) =>
        {
            const newData = { ...prev };

            if (!newData[categoryName]) newData[categoryName] = {};

            const pathParts = fieldPath.split(".");
            let current = newData[categoryName];

            for (let i = 0; i < pathParts.length - 1; i++)
            {
                if (!current[pathParts[i]]) current[pathParts[i]] = {};
                current = current[pathParts[i]];
            }

            current[pathParts[pathParts.length - 1]] = value;
            return newData;
        });
    };

    const setDocumentContent = (content: string) =>
    {
        setDocumentState((prev) => ({...prev, content}));
    };

    const setHasCustomContent = (hasCustom: boolean) =>
    {
        setDocumentState((prev) => ({...prev, hasCustomContent: hasCustom}));
    };

    const setHasUnsavedChanges = (hasUnsaved: boolean) =>
    {
        setDocumentState((prev) => ({...prev, hasUnsavedChanges: hasUnsaved}));
    };

    const saveDocument = () =>
    {
        setDocumentState((prev) => ({...prev, hasUnsavedChanges: false}));

        const saveData = {
            formData,
            document: documentState.content,
            documentType: schema?.document_type,
            timestamp: new Date().toISOString(),
        };

        localStorage.setItem("legal-form-data", JSON.stringify(saveData));
        onSave?.(formData);
    };

    const resetDocument = () =>
    {
        setDocumentState({content: "", hasCustomContent: false, hasUnsavedChanges: false});
    };


    const contextValue: FormContextType = {
        formData,
        setFormData,
        updateFormField,
        schema,
        setSchema,
        selectedProcessId,
        setSelectedProcessId,
        currentDocumentId,
        setCurrentDocumentId,
        documentState,
        setDocumentContent,
        setHasCustomContent,
        setHasUnsavedChanges,
        saveDocument,
        resetDocument,
        onFormChange,
        onSave,
        onGenerate,
    };

    return <FormContext.Provider value={contextValue}>{children}</FormContext.Provider>;
}

export function useFormContext()
{
    const context = useContext(FormContext);
    if (context === undefined) throw new Error("useFormContext must be used within a FormProvider");
    return context;
}
