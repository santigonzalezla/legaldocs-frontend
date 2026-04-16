'use client';

import {useRef, useEffect, useState} from 'react';
import docStyles from './documenteditor.module.css';
import panelStyles from './templatedocumenteditor.module.css';
import {
    AlignCenter, AlignJustify, AlignLeft, AlignRight,
    ArrowDown, ArrowGo,
    Bold, File, Hash, Italic, List, ListOrdered,
    PenTool, Plus, Table, Type, Underline
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

const COMPONENTS = [
    {type: 'heading', label: 'Título', description: 'Encabezado de sección', Icon: Type},
    {type: 'paragraph', label: 'Párrafo', description: 'Bloque de texto', Icon: File},
    {type: 'list', label: 'Lista', description: 'Lista con viñetas', Icon: List},
    {type: 'table', label: 'Tabla', description: 'Tabla de datos', Icon: Table},
    {type: 'signature', label: 'Firma', description: 'Bloque de firma', Icon: PenTool}
];

const fieldTypeIcon = (type: string) =>
    type === 'numero' ? Hash : type === 'seleccion' ? List : type === 'fecha' ? File : Type;

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
    const [registeredVars, setRegisteredVars] = useState<Record<string, { field: string; type: string }[]>>({});
    const [addingVarIn, setAddingVarIn] = useState<string | null>(null);
    const [newVarField, setNewVarField] = useState('');
    const [newVarType, setNewVarType] = useState<string>('texto');
    const detectedCats = Object.keys(groupedVariables);
    const allCats = [...new Set([...definedCats, ...detectedCats, ...Object.keys(registeredVars)])];

    const getMergedVars = (cat: string): Variable[] =>
    {
        const detected = groupedVariables[cat] ?? [];
        const registered = registeredVars[cat] ?? [];
        const result = [...detected];
        for (const rv of registered) {
            if (!detected.find(d => d.field === rv.field)) {
                result.push({full: `${cat}:${rv.field}:${rv.type}`, category: cat, field: rv.field, type: rv.type});
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
        setRegisteredVars(prev => ({
            ...prev,
            [cat]: [...(prev[cat] ?? []), {field, type: newVarType}]
        }));
        setNewVarField('');
        setNewVarType('texto');
        setAddingVarIn(null);
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
                                                                const Icon = fieldTypeIcon(v.type);
                                                                return (
                                                                    <button key={v.full}
                                                                            className={panelStyles.fieldItem}
                                                                            onClick={() => insertVariableSpan(v.full, v.field)}
                                                                            title={`Insertar {{${v.full}}}`}>
                                                                        <Icon className={panelStyles.fieldIcon}/>
                                                                        <div className={panelStyles.fieldInfo}>
                                                                            <span
                                                                                className={panelStyles.fieldLabel}>{v.field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                                                                            <span
                                                                                className={panelStyles.fieldType}>{v.type}</span>
                                                                        </div>
                                                                    </button>
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
                                                                            onChange={e => setNewVarType(e.target.value)}>
                                                                        {TYPES.map(t => <option key={t}
                                                                                                value={t}>{t}</option>)}
                                                                    </select>
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
