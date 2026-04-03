'use client';

import React, {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {useFetch} from '@/hooks/useFetch';
import type {Document, DocumentTemplate, LegalBranch, PaginatedResponse} from '@/app/interfaces/interfaces';

export interface SearchOption
{
    item:     string;
    link:     string;
    category: string;
    group:    string;
}

interface SearchContextType
{
    searchTerm:      string;
    setSearchTerm:   (term: string) => void;
    filteredOptions: SearchOption[];
    isLoading:       boolean;
    isSearchOpen:    boolean;
    setIsSearchOpen: (open: boolean) => void;
}

interface SearchProviderProps
{
    children: React.ReactNode;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearch = () =>
{
    const context = useContext(SearchContext);
    if (!context) throw new Error('useSearch must be used within a SearchProvider');
    return context;
};

// Static platform navigation — no generator suboptions (those come from the API)
const STATIC_OPTIONS: SearchOption[] = [
    {item: 'Dashboard',                  link: '/dashboard',                   category: 'main',         group: 'Principal'},
    {item: 'Documentos Generados',       link: '/dashboard/documents/generated', category: 'documents',   group: 'Gestión de Documentos'},
    {item: 'Borradores',                 link: '/dashboard/documents/drafts',    category: 'documents',   group: 'Gestión de Documentos'},
    {item: 'Favoritos',                  link: '/dashboard/documents/favorites', category: 'documents',   group: 'Gestión de Documentos'},
    {item: 'Papelera',                   link: '/dashboard/documents/trash',     category: 'documents',   group: 'Gestión de Documentos'},
    {item: 'Procesos',                   link: '/dashboard/processes',           category: 'documents',   group: 'Gestión de Documentos'},
    {item: 'Clientes',                   link: '/dashboard/clients',             category: 'documents',   group: 'Gestión de Documentos'},
    {item: 'Perfil de Usuario',          link: '/dashboard/settings/profile',    category: 'settings',    group: 'Configuración'},
    {item: 'Datos de la Firma',          link: '/dashboard/settings/office',     category: 'settings',    group: 'Configuración'},
    {item: 'Mis Firmas',                 link: '/dashboard/settings/firms',      category: 'settings',    group: 'Configuración'},
    {item: 'Firmas Digitales',           link: '/dashboard/settings/signatures', category: 'settings',    group: 'Configuración'},
    {item: 'Plantillas Personalizadas',  link: '/dashboard/settings/templates',  category: 'settings',    group: 'Configuración'},
];

const CATEGORY_LABEL: Record<string, string> = {
    main:      'Principal',
    documents: 'Gestión de Documentos',
    settings:  'Configuración',
    template:  'Plantillas',
    document:  'Documentos',
};

export const SearchProvider: React.FC<SearchProviderProps> = ({children}) =>
{
    const [searchTerm,      setSearchTerm]      = useState('');
    const [isSearchOpen,    setIsSearchOpen]    = useState(false);
    const [dynamicResults,  setDynamicResults]  = useState<SearchOption[]>([]);
    const [isLoading,       setIsLoading]       = useState(false);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const {execute: fetchTemplates} = useFetch<PaginatedResponse<DocumentTemplate>>(
        '', {immediate: false, firmScoped: true},
    );

    const {execute: fetchDocuments} = useFetch<PaginatedResponse<Document>>(
        '', {immediate: false, firmScoped: true},
    );

    const {data: branches} = useFetch<LegalBranch[]>(
        'branch?isActive=true&limit=50', {firmScoped: true},
    );

    const buildTemplateLink = useCallback((tpl: DocumentTemplate): string | null =>
    {
        const branch = (branches ?? []).find(b => b.id === tpl.branchId);
        if (!branch) return null;
        return `/dashboard/generator/${branch.slug}/${tpl.documentType}`;
    }, [branches]);

    const buildDocumentLink = useCallback((doc: Document): string | null =>
    {
        const meta        = doc.formData as Record<string, any> | null;
        const branchSlug  = meta?._branchSlug  ?? doc.branchSlug  ?? null;
        const docTypeSlug = meta?._docTypeSlug ?? doc.documentType;
        if (!branchSlug) return null;
        return `/dashboard/generator/${branchSlug}/${docTypeSlug}?documentId=${doc.id}`;
    }, []);

    useEffect(() =>
    {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        const term = searchTerm.trim();

        if (term.length < 2)
        {
            setDynamicResults([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        debounceTimer.current = setTimeout(async () =>
        {
            const encoded = encodeURIComponent(term);

            const [tplRes, docRes] = await Promise.all([
                fetchTemplates({}, `template?search=${encoded}&isActive=true&limit=5`),
                fetchDocuments({}, `document?search=${encoded}&limit=5`),
            ]);

            const results: SearchOption[] = [];

            (tplRes?.data ?? []).forEach(tpl =>
            {
                const link = buildTemplateLink(tpl);
                if (!link) return;
                results.push({
                    item:     tpl.title,
                    link,
                    category: 'template',
                    group:    'Plantillas',
                });
            });

            (docRes?.data ?? []).forEach(doc =>
            {
                const link = buildDocumentLink(doc);
                if (!link) return;
                results.push({
                    item:     doc.title,
                    link,
                    category: 'document',
                    group:    'Documentos',
                });
            });

            setDynamicResults(results);
            setIsLoading(false);
        }, 300);

        return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
    }, [searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

    const staticFiltered: SearchOption[] = searchTerm.trim().length >= 1
        ? STATIC_OPTIONS.filter(o => o.item.toLowerCase().includes(searchTerm.trim().toLowerCase()))
        : [];

    const filteredOptions = [...staticFiltered, ...dynamicResults].slice(0, 12);

    return (
        <SearchContext.Provider value={{searchTerm, setSearchTerm, filteredOptions, isLoading, isSearchOpen, setIsSearchOpen}}>
            {children}
        </SearchContext.Provider>
    );
};
