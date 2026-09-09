'use client';

import {useEffect, useRef, useState} from 'react';
import styles from './categorycombobox.module.css';
import {useFetch} from '@/hooks/useFetch';
import {toast} from 'sonner';
import {Plus} from '@/app/components/svg';
import type {ProcessCategory} from '@/app/interfaces/interfaces';

interface CategoryComboboxProps
{
    categoryId:    string;
    categoryName?: string;
    placeholder?:  string;
    onChange:      (categoryId: string, categoryName: string) => void;
}

const CategoryCombobox = ({categoryId, categoryName, placeholder, onChange}: CategoryComboboxProps) =>
{
    const [query, setQuery] = useState(categoryName ?? '');
    const [open,  setOpen]  = useState(false);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const {data: options, execute: search} =
        useFetch<ProcessCategory[]>('process-category', {firmScoped: true, immediate: false});

    const {execute: createCategory, isLoading: creating} =
        useFetch<ProcessCategory>('process-category', {method: 'POST', immediate: false, firmScoped: true});

    useEffect(() =>
    {
        setQuery(categoryName ?? '');
    }, [categoryId, categoryName]);

    const runSearch = (text: string) =>
    {
        search({}, `process-category?limit=20${text.trim() ? `&search=${encodeURIComponent(text.trim())}` : ''}`);
    };

    const handleFocus = () =>
    {
        setOpen(true);
        runSearch(query);
    };

    const handleInputChange = (value: string) =>
    {
        setQuery(value);
        setOpen(true);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => runSearch(value), 250);
    };

    const handleSelect = (option: ProcessCategory) =>
    {
        onChange(option.id, option.name);
        setQuery(option.name);
        setOpen(false);
    };

    const handleCreate = async () =>
    {
        const name = query.trim();
        if (!name) return;

        const result = await createCategory({body: {name}});
        if (!result) { toast.error('Error al crear la categoría'); return; }

        onChange(result.id, result.name);
        setQuery(result.name);
        setOpen(false);
    };

    const matches         = options ?? [];
    const hasExactMatch    = matches.some(option => option.name.toLowerCase() === query.trim().toLowerCase());
    const showCreateOption = query.trim().length > 0 && !hasExactMatch;

    return (
        <div className={styles.wrapper}>
            <input
                className={styles.input}
                placeholder={placeholder ?? 'Buscar o crear asunto o tipo de proceso...'}
                value={query}
                onFocus={handleFocus}
                onChange={event => handleInputChange(event.target.value)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
            />

            {open && (
                <div className={styles.dropdown}>
                    {matches.length === 0 && !showCreateOption && (
                        <div className={styles.empty}>Escribe para buscar un asunto o tipo de proceso...</div>
                    )}
                    {matches.map(option => (
                        <button
                            key={option.id}
                            type="button"
                            className={`${styles.option} ${option.id === categoryId ? styles.optionActive : ''}`}
                            onMouseDown={event => event.preventDefault()}
                            onClick={() => handleSelect(option)}
                        >
                            {option.name}
                        </button>
                    ))}
                    {showCreateOption && (
                        <button
                            type="button"
                            className={styles.createOption}
                            onMouseDown={event => event.preventDefault()}
                            onClick={handleCreate}
                            disabled={creating}
                        >
                            <Plus /> Crear &quot;{query.trim()}&quot;
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default CategoryCombobox;
