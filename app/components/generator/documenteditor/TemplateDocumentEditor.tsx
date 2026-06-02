'use client';

import {useRef, useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import docStyles from './documenteditor.module.css';
import panelStyles from './templatedocumenteditor.module.css';
import {
    AlignCenter, AlignJustify, AlignLeft, AlignRight,
    ArrowDown, ArrowGo,
    Bold, Calendar, Check, Create, Edit, File, Hash, Italic, List, ListOrdered,
    Mail, Options, PenTool, Plus, Table, Trash, Type, Underline, X
} from '@/app/components/svg';

interface Variable
{
    full: string;
    category: string;
    field: string;
    type: string;
    options?: string[];
}

interface TemplateDocumentEditorProps
{
    value: string;
    onChange: (value: string) => void;
    groupedVariables: Record<string, Variable[]>;
    toolbarExtra?: React.ReactNode;
}

const TYPES = ['texto', 'fecha', 'numero', 'email', 'booleano', 'seleccion'] as const;

const TYPE_ICONS: Record<string, React.ElementType> = {
    texto:     Type,
    fecha:     Calendar,
    numero:    Hash,
    email:     Mail,
    booleano:  Check,
    seleccion: List,
};

const TYPE_LABELS: Record<string, string> = {
    texto:     'Texto',
    fecha:     'Fecha',
    numero:    'Número',
    email:     'Email',
    booleano:  'Booleano',
    seleccion: 'Selección',
};

const COMPONENTS = [
    {type: 'heading', label: 'Título', description: 'Encabezado de sección', Icon: Type},
    {type: 'paragraph', label: 'Párrafo', description: 'Bloque de texto', Icon: File},
    {type: 'list', label: 'Lista', description: 'Lista con viñetas', Icon: List},
    {type: 'table', label: 'Tabla', description: 'Tabla de datos', Icon: Table},
    {type: 'signature', label: 'Firma', description: 'Bloque de firma', Icon: PenTool}
];

const fieldTypeIcon = (type: string) => TYPE_ICONS[type] ?? Type;

// ── Type selector for template variables ──────────────────────────────────
interface VarTypeSelectProps { value: string; onChange: (type: string) => void; }

const VarTypeSelect = ({value, onChange}: VarTypeSelectProps) =>
{
    const [open, setOpen] = useState(false);
    const [pos, setPos]   = useState({top: 0, left: 0});
    const triggerRef      = useRef<HTMLButtonElement>(null);
    const dropdownRef     = useRef<HTMLDivElement>(null);
    const Icon            = TYPE_ICONS[value] ?? File;

    useEffect(() =>
    {
        if (!open) return;
        const close = () => setOpen(false);
        const handleClick = (e: MouseEvent) =>
        {
            if (
                dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
                triggerRef.current  && !triggerRef.current.contains(e.target as Node)
            ) close();
        };
        document.addEventListener('mousedown', handleClick);
        window.addEventListener('scroll', close, true);
        return () =>
        {
            document.removeEventListener('mousedown', handleClick);
            window.removeEventListener('scroll', close, true);
        };
    }, [open]);

    const handleToggle = (e: React.MouseEvent) =>
    {
        e.stopPropagation();
        if (!open && triggerRef.current)
        {
            const rect = triggerRef.current.getBoundingClientRect();
            setPos({top: rect.bottom + 5, left: rect.left});
        }
        setOpen(prev => !prev);
    };

    const dropdown = open && (
        <div ref={dropdownRef} className={panelStyles.typeSelectDropdown} style={{top: pos.top, left: pos.left}}>
            {TYPES.map(t =>
            {
                const TIcon    = TYPE_ICONS[t] ?? File;
                const isActive = t === value;
                return (
                    <button
                        key={t}
                        className={`${panelStyles.typeSelectOption} ${isActive ? panelStyles.typeSelectOptionActive : ''}`}
                        onClick={e => { e.stopPropagation(); onChange(t); setOpen(false); }}
                    >
                        <TIcon className={panelStyles.typeSelectOptionIcon} />
                        <span className={panelStyles.typeSelectOptionLabel}>{TYPE_LABELS[t]}</span>
                        {isActive && <span className={panelStyles.typeSelectOptionCheck}>✓</span>}
                    </button>
                );
            })}
        </div>
    );

    return (
        <div className={panelStyles.typeSelect}>
            <button
                ref={triggerRef}
                className={`${panelStyles.typeSelectTrigger} ${open ? panelStyles.typeSelectTriggerOpen : ''}`}
                onClick={handleToggle}
                title={`Tipo: ${TYPE_LABELS[value] ?? value}`}
            >
                <Icon className={panelStyles.typeSelectIcon} />
                <ArrowDown className={`${panelStyles.typeSelectChevron} ${open ? panelStyles.typeSelectChevronOpen : ''}`} />
            </button>
            {typeof document !== 'undefined' && createPortal(dropdown, document.body)}
        </div>
    );
};

const toDisplay = (template: string, fieldClass: string): string =>
{
    if (!template) return '';
    return template.replace(
        /\{\{([\w]+(?::[\w]+(?::[\w]+(?:\[[^\]]*\])?)?)?)\}\}/g,
        (_, varKey) =>
        {
            const parts = varKey.split(':');
            const label = parts.length > 1 ? parts[1] : parts[0];
            return `<span class="${fieldClass}" data-var="${varKey}" contenteditable="false">{{${label}}}</span>`;
        }
    );
};

const fromDisplay = (html: string): string =>
{
    if (typeof document === 'undefined') return html;
    const div = document.createElement('div');
    div.innerHTML = html;
    div.querySelectorAll('[data-var]').forEach(span =>
    {
        const varKey = span.getAttribute('data-var') ?? '';
        span.parentNode?.replaceChild(document.createTextNode(`{{${varKey}}}`), span);
    });
    return div.innerHTML;
};

const TemplateDocumentEditor = ({value, onChange, groupedVariables, toolbarExtra}: TemplateDocumentEditorProps) =>
{
    const editorRef = useRef<HTMLDivElement>(null);
    const lastValueRef = useRef<string>('');
    const catRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const [activeTab, setActiveTab] = useState<'variables' | 'components'>('variables');
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [definedCats, setDefinedCats] = useState<string[]>([]);
    const [addingCat, setAddingCat] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [registeredVars, setRegisteredVars] = useState<Record<string, { field: string; type: string; options?: string[] }[]>>({});
    const [addingVarIn, setAddingVarIn] = useState<string | null>(null);
    const [newVarField, setNewVarField] = useState('');
    const [newVarType, setNewVarType] = useState<string>('texto');
    const [newVarOptions, setNewVarOptions] = useState<string[]>([]);
    const [newVarOptionInput, setNewVarOptionInput] = useState('');
    const [varOptionInputs, setVarOptionInputs] = useState<Record<string, string>>({});
    const [renamingVar,    setRenamingVar]    = useState<{cat: string; field: string; type: string; value: string} | null>(null);
    const [openVarMenuKey, setOpenVarMenuKey] = useState<string | null>(null);
    const [varMenuPos,     setVarMenuPos]     = useState({top: 0, left: 0});
    const varMenuRef = useRef<HTMLDivElement>(null);
    const detectedCats = Object.keys(groupedVariables);
    const allCats = [...new Set([...definedCats, ...detectedCats, ...Object.keys(registeredVars)])];

    const getMergedVars = (cat: string): Variable[] =>
    {
        const detected   = groupedVariables[cat] ?? [];
        const registered = registeredVars[cat] ?? [];
        const result: Variable[] = [];
        for (const d of detected) {
            const override = registered.find(rv => rv.field === d.field);
            if (override) {
                result.push({full: `${cat}:${override.field}:${override.type}`, category: cat, field: override.field, type: override.type, options: override.options});
            } else {
                result.push(d);
            }
        }
        for (const rv of registered) {
            if (!detected.find(d => d.field === rv.field)) {
                result.push({full: `${cat}:${rv.field}:${rv.type}`, category: cat, field: rv.field, type: rv.type, options: rv.options});
            }
        }
        return result;
    };

    useEffect(() =>
    {
        if (!editorRef.current) return;
        if (value === lastValueRef.current) return;
        lastValueRef.current = value;
        editorRef.current.innerHTML = toDisplay(value, docStyles.field);
    }, [value]);

    useEffect(() =>
    {
        if (!openVarMenuKey) return;
        const close = () => setOpenVarMenuKey(null);
        const handleClick = (e: MouseEvent) =>
        {
            if (varMenuRef.current && !varMenuRef.current.contains(e.target as Node)) close();
        };
        document.addEventListener('mousedown', handleClick);
        window.addEventListener('scroll', close, true);
        return () =>
        {
            document.removeEventListener('mousedown', handleClick);
            window.removeEventListener('scroll', close, true);
        };
    }, [openVarMenuKey]);

    const emit = () =>
    {
        if (!editorRef.current) return;
        const stored = fromDisplay(editorRef.current.innerHTML);
        lastValueRef.current = stored;
        onChange(stored);
    };

    const execCommand = (cmd: string, val?: string) =>
    {
        document.execCommand(cmd, false, val);
        editorRef.current?.focus();
    };

    const scanAndHighlight = (): boolean =>
    {
        if (!editorRef.current) return false;

        const walker = document.createTreeWalker(
            editorRef.current,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) =>
                {
                    if ((node.parentElement as HTMLElement)?.hasAttribute('data-var'))
                        return NodeFilter.FILTER_REJECT;
                    return /\{\{[^{}]*\}\}/.test(node.textContent ?? '')
                        ? NodeFilter.FILTER_ACCEPT
                        : NodeFilter.FILTER_SKIP;
                }
            }
        );

        const textNodes: Text[] = [];
        let n: Text | null;
        while ((n = walker.nextNode() as Text)) textNodes.push(n);
        if (textNodes.length === 0) return false;

        const sel = window.getSelection();
        const savedAnchor = sel?.anchorNode ?? null;
        const savedOffset = sel?.anchorOffset ?? 0;

        let cursorAfterNode: Node | null = null;

        for (const textNode of textNodes) {
            const text = textNode.textContent ?? '';
            const parent = textNode.parentNode;
            if (!parent) continue;

            const frag = document.createDocumentFragment();
            let last = 0;
            const regex = /\{\{([^{}]*)\}\}/g;
            let match: RegExpExecArray | null;

            while ((match = regex.exec(text)) !== null) {
                if (match.index > last)
                    frag.appendChild(document.createTextNode(text.slice(last, match.index)));

                const varKey = match[1].trim();
                const parts = varKey.split(':');
                const label = parts.length > 1 ? parts[1] : parts[0];

                const span = document.createElement('span');
                span.className = docStyles.field;
                span.setAttribute('data-var', varKey);
                span.setAttribute('contenteditable', 'false');
                span.textContent = `{{${label}}}`;
                frag.appendChild(span);
                cursorAfterNode = span;
                last = match.index + match[0].length;
            }

            if (last < text.length)
                frag.appendChild(document.createTextNode(text.slice(last)));

            const wasCursorNode = savedAnchor === textNode;
            parent.replaceChild(frag, textNode);

            if (wasCursorNode && cursorAfterNode && sel) {
                const space = document.createTextNode('\u00A0');
                (cursorAfterNode as ChildNode).after(space);
                const r = document.createRange();
                r.setStart(space, 0);
                r.collapse(true);
                sel.removeAllRanges();
                sel.addRange(r);
            }
        }

        emit();
        return true;
    };

    const insertVariableSpan = (varKey: string, label: string) =>
    {
        if (!editorRef.current) return;
        editorRef.current.focus();

        const selection = window.getSelection();
        if (!selection) return;

        let range: Range;
        if (selection.rangeCount > 0) {
            const cur = selection.getRangeAt(0);
            range = editorRef.current.contains(cur.commonAncestorContainer)
                ? cur
                : (() =>
                {
                    const r = document.createRange();
                    r.selectNodeContents(editorRef.current!);
                    r.collapse(false);
                    return r;
                })();
        } else {
            range = document.createRange();
            range.selectNodeContents(editorRef.current);
            range.collapse(false);
        }

        const span = document.createElement('span');
        span.className = docStyles.field;
        span.setAttribute('data-var', varKey);
        span.setAttribute('contenteditable', 'false');
        span.textContent = `{{${label}}}`;

        range.deleteContents();
        range.insertNode(span);

        const space = document.createTextNode('\u00A0');
        range.setStartAfter(span);
        range.insertNode(space);
        range.setStartAfter(space);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);

        emit();
    };

    const insertComponent = (type: string) =>
    {
        if (!editorRef.current) return;
        editorRef.current.focus();

        const selection = window.getSelection();
        if (!selection) return;

        let range: Range;
        if (selection.rangeCount > 0) {
            const cur = selection.getRangeAt(0);
            range = editorRef.current.contains(cur.commonAncestorContainer)
                ? cur
                : (() =>
                {
                    const r = document.createRange();
                    r.selectNodeContents(editorRef.current!);
                    r.collapse(false);
                    return r;
                })();
        } else {
            range = document.createRange();
            range.selectNodeContents(editorRef.current);
            range.collapse(false);
        }

        let el: HTMLElement;
        switch (type) {
            case 'heading':
                el = Object.assign(document.createElement('h2'), {textContent: 'Nuevo Título'});
                break;
            case 'paragraph':
                el = Object.assign(document.createElement('p'), {textContent: 'Nuevo párrafo'});
                break;
            case 'list': {
                el = document.createElement('ul');
                const li = document.createElement('li');
                li.textContent = 'Elemento';
                el.appendChild(li);
                break;
            }
            case 'table': {
                el = document.createElement('table');
                el.className = docStyles.table;
                el.innerHTML = '<tr><td>Celda 1</td><td>Celda 2</td></tr><tr><td>Celda 3</td><td>Celda 4</td></tr>';
                break;
            }
            case 'signature': {
                el = document.createElement('div');
                el.className = docStyles.signatureBlock;
                el.innerHTML = `<div class="${docStyles.signatureLine}"></div><p>FIRMA</p><p>NOMBRE</p>`;
                break;
            }
            default:
                el = Object.assign(document.createElement('p'), {textContent: 'Nuevo elemento'});
        }

        range.deleteContents();
        range.insertNode(el);
        const p = document.createElement('p');
        p.innerHTML = '&nbsp;';
        range.setStartAfter(el);
        range.insertNode(p);
        range.setStart(p, 0);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);

        emit();
    };

    const handleAddCategory = () =>
    {
        const name = newCatName.trim().replace(/\s+/g, '_');
        if (!name || allCats.includes(name)) return;
        setDefinedCats(prev => [...prev, name]);
        setExpanded(prev => ({...prev, [name]: true}));
        setNewCatName('');
        setAddingCat(false);
    };

    const handleAddVar = (cat: string) =>
    {
        const field = newVarField.trim().replace(/\s+/g, '_');
        if (!field) return;
        const opts = newVarType === 'seleccion' && newVarOptions.length ? newVarOptions : undefined;
        setRegisteredVars(prev => ({
            ...prev,
            [cat]: [...(prev[cat] ?? []), {field, type: newVarType, options: opts}]
        }));
        setNewVarField('');
        setNewVarType('texto');
        setNewVarOptions([]);
        setNewVarOptionInput('');
        setAddingVarIn(null);
    };

    const addNewVarOption = () =>
    {
        const val = newVarOptionInput.trim();
        if (!val || newVarOptions.includes(val)) return;
        setNewVarOptions(prev => [...prev, val]);
        setNewVarOptionInput('');
    };

    const toggleCat = (cat: string) =>
    {
        const willOpen = !(expanded[cat] ?? true);
        setExpanded(prev => ({...prev, [cat]: willOpen}));
        if (willOpen)
            requestAnimationFrame(() =>
                catRefs.current[cat]?.scrollIntoView({block: 'nearest', behavior: 'smooth'})
            );
    };

    const commitVarRename = () =>
    {
        if (!renamingVar || !editorRef.current) return;
        const {cat, field, type, value: rawValue} = renamingVar;
        const newField = rawValue.trim().replace(/\s+/g, '_');
        if (!newField || newField === field) { setRenamingVar(null); return; }
        const oldKey = `${cat}:${field}:${type}`;
        const newKey = `${cat}:${newField}:${type}`;
        editorRef.current.querySelectorAll(`[data-var="${oldKey}"]`).forEach(span =>
        {
            span.setAttribute('data-var', newKey);
            span.textContent = `{{${newField}}}`;
        });
        setRegisteredVars(prev =>
        {
            const catVars = prev[cat] ?? [];
            const idx = catVars.findIndex(v => v.field === field);
            if (idx === -1) return prev;
            const updated = [...catVars];
            updated[idx] = {...updated[idx], field: newField};
            return {...prev, [cat]: updated};
        });
        emit();
        setRenamingVar(null);
    };

    const handleDeleteVar = (cat: string, field: string, type: string) =>
    {
        if (!editorRef.current) return;
        const varKey = `${cat}:${field}:${type}`;
        editorRef.current.querySelectorAll(`[data-var="${varKey}"]`).forEach(span =>
        {
            span.parentNode?.removeChild(span);
        });
        setRegisteredVars(prev =>
        {
            const catVars = (prev[cat] ?? []).filter(v => v.field !== field);
            if (!catVars.length) { const {[cat]: _, ...rest} = prev; return rest; }
            return {...prev, [cat]: catVars};
        });
        emit();
    };

    const handleChangeVarType = (cat: string, field: string, oldType: string, newType: string) =>
    {
        if (!editorRef.current || oldType === newType) return;
        const oldKey = `${cat}:${field}:${oldType}`;
        const newKey = `${cat}:${field}:${newType}`;
        editorRef.current.querySelectorAll(`[data-var="${oldKey}"]`).forEach(span =>
        {
            span.setAttribute('data-var', newKey);
        });
        setRegisteredVars(prev =>
        {
            const catVars = prev[cat] ?? [];
            const idx = catVars.findIndex(v => v.field === field);
            if (idx === -1) {
                return {...prev, [cat]: [...catVars, {field, type: newType, options: newType === 'seleccion' ? [] : undefined}]};
            }
            const updated = [...catVars];
            updated[idx] = {...updated[idx], type: newType, options: newType === 'seleccion' ? (updated[idx].options ?? []) : undefined};
            return {...prev, [cat]: updated};
        });
        emit();
    };

    const handleUpdateVarOptions = (cat: string, field: string, options: string[]) =>
    {
        setRegisteredVars(prev =>
        {
            const catVars = prev[cat] ?? [];
            const idx = catVars.findIndex(v => v.field === field);
            if (idx === -1) return prev;
            const updated = [...catVars];
            updated[idx] = {...updated[idx], options};
            return {...prev, [cat]: updated};
        });
    };

    const getVarOptInput = (key: string) => varOptionInputs[key] ?? '';
    const setVarOptInput = (key: string, val: string) =>
        setVarOptionInputs(prev => ({...prev, [key]: val}));

    const addOptionToVar = (cat: string, field: string, currentOptions: string[]) =>
    {
        const key = `${cat}:${field}`;
        const val = getVarOptInput(key).trim();
        if (!val || currentOptions.includes(val)) return;
        handleUpdateVarOptions(cat, field, [...currentOptions, val]);
        setVarOptInput(key, '');
    };

    const removeOptionFromVar = (cat: string, field: string, currentOptions: string[], i: number) =>
        handleUpdateVarOptions(cat, field, currentOptions.filter((_, j) => j !== i));

    return (
        <div className={docStyles.container}>
            <div className={docStyles.editorCard}>

                {/* Toolbar */}
                <div className={docStyles.toolbar}>
                    <div className={docStyles.toolbarGroup}>
                        <button className={docStyles.toolbarButton} onClick={() => execCommand('bold')} title="Negrita">
                            <Bold className={docStyles.toolbarIcon}/></button>
                        <button className={docStyles.toolbarButton} onClick={() => execCommand('italic')}
                                title="Cursiva"><Italic className={docStyles.toolbarIcon}/></button>
                        <button className={docStyles.toolbarButton} onClick={() => execCommand('underline')}
                                title="Subrayado"><Underline className={docStyles.toolbarIcon}/></button>
                    </div>
                    <div className={docStyles.toolbarGroup}>
                        <button className={docStyles.toolbarButton} onClick={() => execCommand('justifyLeft')}>
                            <AlignLeft className={docStyles.toolbarIcon}/></button>
                        <button className={docStyles.toolbarButton} onClick={() => execCommand('justifyCenter')}>
                            <AlignCenter className={docStyles.toolbarIcon}/></button>
                        <button className={docStyles.toolbarButton} onClick={() => execCommand('justifyRight')}>
                            <AlignRight className={docStyles.toolbarIcon}/></button>
                        <button className={docStyles.toolbarButton} onClick={() => execCommand('justifyFull')}>
                            <AlignJustify className={docStyles.toolbarIcon}/></button>
                    </div>
                    <div className={docStyles.toolbarGroup}>
                        <button className={docStyles.toolbarButton} onClick={() => execCommand('insertUnorderedList')}>
                            <List className={docStyles.toolbarIcon}/></button>
                        <button className={docStyles.toolbarButton} onClick={() => execCommand('insertOrderedList')}>
                            <ListOrdered className={docStyles.toolbarIcon}/></button>
                    </div>
                    {toolbarExtra && <div className={docStyles.toolbarGroup}>{toolbarExtra}</div>}
                </div>

                {/* Body */}
                <div className={panelStyles.editorWrapper}>

                    {/* ── Panel ── */}
                    <div className={panelStyles.panel}>
                        <div className={panelStyles.panelHeader}>
                            <h3 className={panelStyles.panelTitle}>Herramientas</h3>
                        </div>

                        <div className={panelStyles.tabs}>
                            <button
                                className={`${panelStyles.tab} ${activeTab === 'variables' ? panelStyles.tabActive : ''}`}
                                onClick={() => setActiveTab('variables')}>Variables
                            </button>
                            <button
                                className={`${panelStyles.tab} ${activeTab === 'components' ? panelStyles.tabActive : ''}`}
                                onClick={() => setActiveTab('components')}>Componentes
                            </button>
                        </div>

                        <div className={panelStyles.panelContent}>

                            {/* ── Variables tab ── */}
                            {activeTab === 'variables' && (
                                <>
                                    <p className={panelStyles.hint}>
                                        Escribe <code>{'{{cat:campo:tipo}}'}</code> en el editor o define las variables
                                        aquí.
                                    </p>

                                    {/* Scrollable category list */}
                                    <div className={panelStyles.categoriesList}>
                                        {allCats.length === 0 && (
                                            <p className={panelStyles.emptyState}>
                                                Sin categorías. Añade una para organizar las variables.
                                            </p>
                                        )}

                                        {allCats.map(cat =>
                                        {
                                            const vars = getMergedVars(cat);
                                            const isOpen = expanded[cat] ?? true;
                                            const isAddingVar = addingVarIn === cat;

                                            return (
                                                <div key={cat} className={panelStyles.categoryGroup}
                                                     ref={el => { catRefs.current[cat] = el; }}>
                                                    <button className={panelStyles.categoryHeader}
                                                            onClick={() => toggleCat(cat)}>
                                                        {isOpen ? <ArrowDown className={panelStyles.categoryIcon}/> :
                                                            <ArrowGo className={panelStyles.categoryIcon}/>}
                                                        <span
                                                            className={panelStyles.categoryTitle}>{cat.replace(/_/g, ' ')}</span>
                                                        <span
                                                            className={panelStyles.categoryCount}>({vars.length})</span>
                                                    </button>

                                                    {isOpen && (
                                                        <div className={panelStyles.categoryContent}>
                                                            {vars.map(v =>
                                                            {
                                                                const varKey     = v.full;
                                                                const menuKey    = varKey;
                                                                const label      = v.field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                                                                const isRenaming = renamingVar?.cat === v.category && renamingVar?.field === v.field;

                                                                return (
                                                                    <div key={varKey} className={panelStyles.fieldItem}>
                                                                        <div className={panelStyles.fieldRow1}>
                                                                            {isRenaming ? (
                                                                                <input
                                                                                    className={panelStyles.fieldRenameInput}
                                                                                    value={renamingVar!.value}
                                                                                    autoFocus
                                                                                    onChange={e => setRenamingVar(prev => prev ? {...prev, value: e.target.value} : null)}
                                                                                    onKeyDown={e =>
                                                                                    {
                                                                                        e.stopPropagation();
                                                                                        if (e.key === 'Enter')  commitVarRename();
                                                                                        if (e.key === 'Escape') setRenamingVar(null);
                                                                                    }}
                                                                                    onClick={e => e.stopPropagation()}
                                                                                    onBlur={commitVarRename}
                                                                                />
                                                                            ) : (
                                                                                <span className={panelStyles.fieldLabelWrap} title={label}>
                                                                                    <span className={panelStyles.fieldLabel}>{label}</span>
                                                                                </span>
                                                                            )}
                                                                            <button
                                                                                className={panelStyles.fieldInsertBtn}
                                                                                onClick={() => insertVariableSpan(varKey, v.field)}
                                                                                title={`Insertar {{${varKey}}}`}
                                                                            >
                                                                                <Create className={panelStyles.fieldInsertIcon} />
                                                                            </button>
                                                                            <button
                                                                                className={panelStyles.fieldOptionsBtn}
                                                                                title="Opciones"
                                                                                onClick={e =>
                                                                                {
                                                                                    e.stopPropagation();
                                                                                    if (openVarMenuKey === menuKey) { setOpenVarMenuKey(null); return; }
                                                                                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                                                    setVarMenuPos({top: rect.bottom + 4, left: rect.right - 140});
                                                                                    setOpenVarMenuKey(menuKey);
                                                                                }}
                                                                            >
                                                                                <Options className={panelStyles.fieldOptionsBtnIcon} />
                                                                            </button>
                                                                            {openVarMenuKey === menuKey && typeof document !== 'undefined' && createPortal(
                                                                                <div ref={varMenuRef} className={panelStyles.fieldMenu} style={{top: varMenuPos.top, left: varMenuPos.left}}>
                                                                                    <button className={panelStyles.fieldMenuItem} onClick={() =>
                                                                                    {
                                                                                        setRenamingVar({cat: v.category, field: v.field, type: v.type, value: v.field});
                                                                                        setOpenVarMenuKey(null);
                                                                                    }}>
                                                                                        <Edit className={panelStyles.fieldMenuIcon} />
                                                                                        Renombrar
                                                                                    </button>
                                                                                    <button className={`${panelStyles.fieldMenuItem} ${panelStyles.fieldMenuItemDelete}`} onClick={() =>
                                                                                    {
                                                                                        handleDeleteVar(v.category, v.field, v.type);
                                                                                        setOpenVarMenuKey(null);
                                                                                    }}>
                                                                                        <Trash className={panelStyles.fieldMenuIcon} />
                                                                                        Eliminar
                                                                                    </button>
                                                                                </div>,
                                                                                document.body,
                                                                            )}
                                                                        </div>
                                                                        <div className={panelStyles.fieldRow2}>
                                                                            <VarTypeSelect
                                                                                value={v.type}
                                                                                onChange={newType => handleChangeVarType(v.category, v.field, v.type, newType)}
                                                                            />
                                                                        </div>
                                                                        {v.type === 'seleccion' && (
                                                                            <div className={panelStyles.fieldOptionsRow}>
                                                                                <div className={panelStyles.fieldOptionsAdd}>
                                                                                    <input
                                                                                        className={panelStyles.fieldOptionsInput}
                                                                                        placeholder="nueva opción..."
                                                                                        value={getVarOptInput(`${v.category}:${v.field}`)}
                                                                                        onChange={e => setVarOptInput(`${v.category}:${v.field}`, e.target.value)}
                                                                                        onKeyDown={e =>
                                                                                        {
                                                                                            e.stopPropagation();
                                                                                            if (e.key === 'Enter') addOptionToVar(v.category, v.field, v.options ?? []);
                                                                                        }}
                                                                                        onClick={e => e.stopPropagation()}
                                                                                    />
                                                                                    <button
                                                                                        className={panelStyles.fieldOptionsAddBtn}
                                                                                        disabled={!getVarOptInput(`${v.category}:${v.field}`).trim()}
                                                                                        onClick={e => { e.stopPropagation(); addOptionToVar(v.category, v.field, v.options ?? []); }}
                                                                                        title="Agregar opción"
                                                                                    >
                                                                                        <Plus className={panelStyles.fieldOptionsAddBtnIcon} />
                                                                                    </button>
                                                                                </div>
                                                                                {(v.options ?? []).length > 0 && (
                                                                                    <div className={panelStyles.fieldOptionsTags}>
                                                                                        {(v.options ?? []).map((opt, i) => (
                                                                                            <span key={i} className={panelStyles.fieldOptionsTag}>
                                                                                                {opt}
                                                                                                <button
                                                                                                    className={panelStyles.fieldOptionsTagRemove}
                                                                                                    onClick={e => { e.stopPropagation(); removeOptionFromVar(v.category, v.field, v.options ?? [], i); }}
                                                                                                >
                                                                                                    <X className={panelStyles.fieldOptionsTagX} />
                                                                                                </button>
                                                                                            </span>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}

                                                            {/* Inline add-variable form */}
                                                            {isAddingVar ? (
                                                                <div className={panelStyles.addVarForm}>
                                                                    <input
                                                                        className={panelStyles.addVarInput}
                                                                        placeholder="Nombre del campo *"
                                                                        value={newVarField}
                                                                        autoFocus
                                                                        onChange={e => setNewVarField(e.target.value)}
                                                                        onKeyDown={e =>
                                                                        {
                                                                            if (e.key === 'Enter') handleAddVar(cat);
                                                                            if (e.key === 'Escape') {
                                                                                setAddingVarIn(null);
                                                                                setNewVarField('');
                                                                            }
                                                                        }}
                                                                    />
                                                                    <select className={panelStyles.addVarSelect}
                                                                            value={newVarType}
                                                                            onChange={e => { setNewVarType(e.target.value); setNewVarOptions([]); setNewVarOptionInput(''); }}>
                                                                        {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                                    </select>

                                                                    {newVarType === 'seleccion' && (
                                                                        <div className={panelStyles.addVarOptionsBlock}>
                                                                            <p className={panelStyles.addVarOptionsLabel}>Opciones de selección:</p>
                                                                            <div className={panelStyles.addVarOptionRow}>
                                                                                <input
                                                                                    className={panelStyles.addVarOptionInput}
                                                                                    placeholder="nueva opción..."
                                                                                    value={newVarOptionInput}
                                                                                    onChange={e => setNewVarOptionInput(e.target.value)}
                                                                                    onKeyDown={e =>
                                                                                    {
                                                                                        if (e.key === 'Enter') { e.preventDefault(); addNewVarOption(); }
                                                                                        if (e.key === 'Escape') setNewVarOptionInput('');
                                                                                    }}
                                                                                />
                                                                                <button
                                                                                    className={panelStyles.addVarOptionBtn}
                                                                                    disabled={!newVarOptionInput.trim()}
                                                                                    onClick={addNewVarOption}
                                                                                >
                                                                                    <Plus className={panelStyles.addVarOptionBtnIcon} />
                                                                                </button>
                                                                            </div>
                                                                            {newVarOptions.length > 0 && (
                                                                                <div className={panelStyles.addVarOptionTags}>
                                                                                    {newVarOptions.map((opt, i) => (
                                                                                        <span key={i} className={panelStyles.addVarOptionTag}>
                                                                                            {opt}
                                                                                            <button
                                                                                                className={panelStyles.addVarOptionTagRemove}
                                                                                                onClick={() => setNewVarOptions(prev => prev.filter((_, j) => j !== i))}
                                                                                            >
                                                                                                <X className={panelStyles.addVarOptionTagX} />
                                                                                            </button>
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    <div className={panelStyles.addVarActions}>
                                                                        <button className={panelStyles.addVarConfirm}
                                                                                onClick={() => handleAddVar(cat)}
                                                                                disabled={!newVarField.trim()}>Insertar
                                                                        </button>
                                                                        <button className={panelStyles.addVarCancel}
                                                                                onClick={() =>
                                                                                {
                                                                                    setAddingVarIn(null);
                                                                                    setNewVarField('');
                                                                                    setNewVarOptions([]);
                                                                                    setNewVarOptionInput('');
                                                                                }}>Cancelar
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    className={panelStyles.addVarBtn}
                                                                    onClick={() =>
                                                                    {
                                                                        setAddingVarIn(cat);
                                                                        setNewVarField('');
                                                                        setNewVarType('texto');
                                                                        setNewVarOptions([]);
                                                                        setNewVarOptionInput('');
                                                                    }}
                                                                >
                                                                    <Plus className={panelStyles.addVarBtnIcon}/>
                                                                    Agregar variable
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Add category — always visible at bottom */}
                                    {addingCat ? (
                                        <div className={panelStyles.addCatForm}>
                                            <input
                                                className={panelStyles.addCatInput}
                                                placeholder="Nombre de categoría *"
                                                value={newCatName}
                                                autoFocus
                                                onChange={e => setNewCatName(e.target.value)}
                                                onKeyDown={e =>
                                                {
                                                    if (e.key === 'Enter') handleAddCategory();
                                                    if (e.key === 'Escape') {
                                                        setAddingCat(false);
                                                        setNewCatName('');
                                                    }
                                                }}
                                            />
                                            <div className={panelStyles.addVarActions}>
                                                <button className={panelStyles.addVarConfirm}
                                                        onClick={handleAddCategory} disabled={!newCatName.trim()}>Crear
                                                </button>
                                                <button className={panelStyles.addVarCancel} onClick={() =>
                                                {
                                                    setAddingCat(false);
                                                    setNewCatName('');
                                                }}>Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button className={panelStyles.addCatBtn} onClick={() => setAddingCat(true)}>
                                            <Plus className={panelStyles.addCatBtnIcon}/>
                                            Agregar categoría
                                        </button>
                                    )}
                                </>
                            )}

                            {/* ── Components tab ── */}
                            {activeTab === 'components' && (
                                <div className={panelStyles.componentsSection}>
                                    <p className={panelStyles.hint}>Haz clic para insertar en la posición del
                                        cursor.</p>
                                    {COMPONENTS.map(({type, label, description, Icon}) => (
                                        <button key={type} className={panelStyles.componentItem}
                                                onClick={() => insertComponent(type)}>
                                            <Icon className={panelStyles.componentIcon}/>
                                            <div className={panelStyles.componentInfo}>
                                                <span className={panelStyles.componentLabel}>{label}</span>
                                                <span className={panelStyles.componentDescription}>{description}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Editor ── */}
                    <div className={`${docStyles.editorContent} ${docStyles.editorContentEditable}`}>
                        <div
                            ref={editorRef}
                            className={`${docStyles.documentEditor} ${docStyles.editable}`}
                            contentEditable={true}
                            onInput={() => { if (!scanAndHighlight()) emit(); }}
                            suppressContentEditableWarning={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TemplateDocumentEditor;
