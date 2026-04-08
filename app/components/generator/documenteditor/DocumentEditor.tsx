"use client"

import { useState, useRef, useEffect, useLayoutEffect } from "react"
import {
    AlignCenter,
    AlignJustify, AlignLeft, AlignRight,
    Bold,
    Edit,
    File,
    Italic, List, ListOrdered, PanelClose, PanelOpen,
    Save,
    Underline
} from "@/app/components/svg";
import styles from "./documenteditor.module.css";
import {CategoryConfig, FieldConfig, FormData, FormSchema} from "@/app/interfaces/types/formtypes";
import EditorSidebar from "@/app/components/generator/editorsidebar/EditorSidebar";
import {useFormContext} from "@/context/FormContext";
import generateContractContent from "@/app/components/generator/documentschemas/RentalContractContent";
import generatePetitionContent from "@/app/components/generator/documentschemas/RightRequestContent";
import {usePathname} from "next/navigation";

const DocumentEditor = ()=>
{
    const {
        formData,
        schema,
        documentState,
        setDocumentContent,
        setHasCustomContent,
        setHasUnsavedChanges,
        saveDocument,
        resetDocument,
    } = useFormContext();
    const path = usePathname();
    const [isEditing,        setIsEditing]        = useState(false);
    const [showSidebar,      setShowSidebar]       = useState(false);
    const [legalitoWorking,  setLegalitoWorking]   = useState(false);
    const [legalitoSnapshots, setLegalitoSnapshots] = useState<string[]>([]);
    const editorRef        = useRef<HTMLDivElement>(null);
    const contentRef       = useRef<string>('');
    const pendingScrollRef = useRef<number | null>(null);
    // When true, skip the next DOM sync from state (user is typing — browser owns the DOM)
    const skipNextDomSync  = useRef(false);

    // Sync documentState.content → DOM, unless the change came from user typing.
    // Also restores scroll after Legalito inserts (prevents jump to top).
    useLayoutEffect(() =>
    {
        if (!editorRef.current) return;
        if (skipNextDomSync.current)
        {
            skipNextDomSync.current = false;
            return;
        }
        editorRef.current.innerHTML = documentState.content;
        if (pendingScrollRef.current !== null)
        {
            window.scrollTo(0, pendingScrollRef.current);
            pendingScrollRef.current = null;
        }
    }, [documentState.content]);

    // Ensure spans inserted by Legalito get the field CSS class (highlight),
    // and strip any rogue contenteditable attributes from AI-generated HTML.
    const applyFieldStyles = (html: string): string =>
    {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        // Remove contenteditable attrs from AI-generated elements (they block the cursor)
        temp.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
        temp.querySelectorAll('span[data-field]').forEach(el =>
        {
            if (!el.classList.contains(styles.field)) el.classList.add(styles.field);
        });
        return temp.innerHTML;
    };

    useEffect(() =>
    {
        if (schema?.document_type)
        {
            setIsEditing(false)
            setShowSidebar(false)

            const initialContent = generateInitialDocument()
            setDocumentContent(initialContent)
            setHasCustomContent(false)
            setHasUnsavedChanges(false)
        }
    }, [schema]);

    useEffect(() =>
    {
        if (!documentState.hasCustomContent || !documentState.content) setDocumentContent(generateInitialDocument());
        else updateFieldValues();
    }, [formData, schema, path]);

    // Keep a ref to the latest content so the insert handler never has a stale closure
    contentRef.current = documentState.content;

    // Broadcast current document content to AiAgent whenever it changes
    useEffect(() =>
    {
        if (!documentState.content) return;
        window.dispatchEvent(new CustomEvent('legalito:document-update', {
            detail: {content: documentState.content},
        }));
    }, [documentState.content]);

    useEffect(() =>
    {
        const handleInsert = (e: Event) =>
        {
            const html = (e as CustomEvent<{html: string}>).detail.html;
            setLegalitoWorking(true);

            setTimeout(() =>
            {
                const temp = document.createElement('div');
                temp.innerHTML = editorRef.current?.innerHTML ?? contentRef.current;

                const wrapper = document.createElement('div');
                wrapper.innerHTML = html;
                const newNodes = Array.from(wrapper.childNodes);

                // Find the last div that directly contains an h2 — that's the last body section.
                // Insert after it so content lands before any footer/signatures.
                const allDivs = Array.from(temp.querySelectorAll('div'));
                let lastSection: Element | null = null;
                for (const div of allDivs)
                {
                    if (div.querySelector(':scope > h2')) lastSection = div;
                }

                if (lastSection)
                {
                    // Walk to the actual end of the section (skip sibling non-section divs
                    // that belong to the same block, e.g. subsections)
                    let insertAfter: Element = lastSection;
                    let next = lastSection.nextElementSibling;
                    while (next && !next.querySelector(':scope > h2'))
                    {
                        // If sibling has no direct h2, it's still part of this section or
                        // is a subsection — keep it, move insertion point past it.
                        // Stop before footer-like elements (short divs at the very end).
                        const text = (next.textContent ?? '').trim();
                        if (text.length < 5 || next.tagName !== 'DIV') break;
                        insertAfter = next;
                        next = next.nextElementSibling;
                    }

                    [...newNodes].reverse().forEach(n =>
                        insertAfter.parentNode?.insertBefore(n, insertAfter.nextSibling)
                    );
                }
                else
                {
                    // No section found — append to end as fallback
                    newNodes.forEach(n => temp.appendChild(n));
                }

                pendingScrollRef.current = window.scrollY;
                setDocumentContent(applyFieldStyles(temp.innerHTML));
                setHasCustomContent(true);
                setIsEditing(true);
                setLegalitoWorking(false);
            }, 2000);
        };

        const handleModify = (e: Event) =>
        {
            const detail = (e as CustomEvent).detail as {
                accion:      string;
                buscar:      string;
                contenido:   string;
                reemplazos?: Array<{buscar: string; reemplazar: string}>;
            };

            setLegalitoWorking(true);

            setTimeout(() =>
            {
                // Save snapshot before modifying
                const currentHtml = editorRef.current?.innerHTML ?? contentRef.current;
                setLegalitoSnapshots(prev => [...prev, currentHtml]);

                const temp = document.createElement('div');
                temp.innerHTML = currentHtml;

                // Normalize: lowercase, collapse whitespace, strip punctuation/degree signs
                const norm = (s: string) =>
                    s.toLowerCase().replace(/[°.:,;()\-–—]/g, ' ').replace(/\s+/g, ' ').trim();

                // Returns true if an element looks like a top-level section header or
                // a document footer/signature marker — used to stop section-end walking.
                const isSectionHeader = (el: Element): boolean =>
                {
                    const t = norm(el.textContent ?? '');
                    // Standard legal section prefixes: ARTÍCULO 7, CLÁUSULA 3, SECCIÓN II…
                    if (/^(artículo|articulo|cláusula|clausula|sección|seccion|capítulo|capitulo)\s+[\dA-Za-z]/.test(t)) return true;
                    // Numbered with dash: "7 — Título"
                    if (/^\d+\s+(—|–|-)\s+\w/.test(t)) return true;
                    // Footer/signature markers — short headings at end of document
                    if (/^(firmas?|signatures?|atentamente|conclusi[oó]n)\b/i.test(t) && t.length < 40) return true;
                    // Elements that contain a signature line (empty div used as horizontal rule)
                    if (el.querySelector('div:not(:has(*))') !== null &&
                        (el.textContent ?? '').trim().length < 200) return true;
                    return false;
                };

                // Find reference element — pick the block element whose normalized text contains
                // the search string, preferring the element with the shortest (most specific) text.
                const findEl = (root: HTMLElement, search: string): Element | null =>
                {
                    const needle = norm(search);
                    if (!needle) return null;
                    const candidates = root.querySelectorAll('p,h1,h2,h3,h4,h5,h6,li,td,th,div');
                    let best: Element | null = null;
                    let bestScore = -1;
                    candidates.forEach(el =>
                    {
                        if (el.children.length > 3) return; // skip broad containers
                        const text = norm(el.textContent ?? '');
                        if (!text.includes(needle)) return;
                        const score = needle.length / Math.max(text.length, 1);
                        if (score > bestScore) { bestScore = score; best = el; }
                    });
                    return best;
                };

                // When inserting after a section header, find the LAST element that belongs
                // to that section (i.e. just before the next same-level section header).
                const findSectionEnd = (el: Element): Element =>
                {
                    if (!isSectionHeader(el)) return el;
                    let last = el;
                    let sib  = el.nextElementSibling;
                    while (sib)
                    {
                        if (isSectionHeader(sib)) break; // next section starts here
                        last = sib;
                        sib  = sib.nextElementSibling;
                    }
                    return last;
                };

                // Replace text inside an element by walking text nodes (safe with inline HTML)
                const replaceTextInEl = (el: Element, search: string, replacement: string) =>
                {
                    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
                    const needle = norm(search);
                    while (walker.nextNode())
                    {
                        const node = walker.currentNode as Text;
                        if (norm(node.textContent ?? '').includes(needle))
                        {
                            const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            node.textContent = (node.textContent ?? '').replace(
                                new RegExp(escaped, 'gi'), replacement,
                            );
                            return;
                        }
                    }
                    // fallback: innerHTML replace (handles cases where text spans tags)
                    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    el.innerHTML = el.innerHTML.replace(new RegExp(escaped, 'gi'), replacement);
                };

                const target = findEl(temp, detail.buscar);

                if (target)
                {
                    const wrapper = document.createElement('div');
                    wrapper.innerHTML = detail.contenido;

                    if (detail.accion === 'insertar_despues')
                    {
                        // Insert after the END of the section, not just after the heading element
                        const insertAfter = findSectionEnd(target);
                        const nodes = Array.from(wrapper.childNodes).reverse();
                        nodes.forEach(n => insertAfter.parentNode?.insertBefore(n, insertAfter.nextSibling));
                    }
                    else if (detail.accion === 'insertar_antes')
                    {
                        Array.from(wrapper.childNodes).forEach(n => target.parentNode?.insertBefore(n, target));
                    }
                    else if (detail.accion === 'reemplazar')
                    {
                        Array.from(wrapper.childNodes).forEach(n => target.parentNode?.insertBefore(n, target));
                        target.remove();
                    }
                }
                else
                {
                    // Reference element not found — append to end so content is not lost
                    temp.innerHTML += detail.contenido;
                    window.dispatchEvent(new CustomEvent('legalito:modify-notice', {
                        detail: {msg: 'No encontré la sección de referencia exacta, así que añadí el contenido al final del documento. Puedes moverlo manualmente si lo necesitas.'},
                    }));
                }

                // Apply text replacements (renumbering etc.) — uses text-node replacement
                // to avoid mismatches caused by inline HTML tags
                if (detail.reemplazos && detail.reemplazos.length > 0)
                {
                    detail.reemplazos.forEach(({buscar, reemplazar}) =>
                    {
                        const el = findEl(temp, buscar);
                        if (el) replaceTextInEl(el, buscar, reemplazar);
                    });
                }

                pendingScrollRef.current = window.scrollY;
                setDocumentContent(applyFieldStyles(temp.innerHTML));
                setHasCustomContent(true);
                setIsEditing(true);
                setLegalitoWorking(false);
            }, 2000);
        };

        window.addEventListener('legalito:insert', handleInsert);
        window.addEventListener('legalito:modify', handleModify);
        return () =>
        {
            window.removeEventListener('legalito:insert', handleInsert);
            window.removeEventListener('legalito:modify', handleModify);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const generateInitialDocument = () =>
    {
        if (!schema) return "";

        if (schema.text_template)
        {
            // Matches {{campo}}, {{cat:campo}}, {{cat:campo:tipo}}, {{cat:campo:seleccion[...]}}
            // Groups: 1=seg1, 2=seg2 — third segment (type) is non-capturing, only used in form config
            return (schema.text_template as string).replace(
                /\{\{(\w+)(?::(\w+))?(?::(?:\w+(?:\[[^\]]*\])?))?}\}/g,
                (_, seg1: string, seg2: string | undefined) =>
                {
                    const category = seg2 ? seg1 : 'general';
                    const field    = seg2 ?? seg1;
                    const value    = (formData as any)?.[category]?.[field];
                    const display  = (value !== undefined && value !== null && value !== '')
                        ? String(value)
                        : field.replace(/_/g, ' ');
                    return `<span class="${styles.field}" data-field="${category}.${field}">${display}</span>`;
                },
            );
        }

        const getValue = (path: string, fieldLabel?: string) =>
        {
            const keys = path.split(".");
            let current: any = formData;

            for (const key of keys)
            {
                if (current && typeof current === "object" && key in current)
                {
                    current = current[key];
                }
                else
                {
                    const defaultLabel =
                        fieldLabel || keys[keys.length - 1].replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

                    return `[${defaultLabel}]`;
                }
            }

            if (!current || current === "" || current === null || current === undefined)
            {
                const defaultLabel =
                    fieldLabel || keys[keys.length - 1].replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

                return `[${defaultLabel}]`;
            }

            return current;
        }

        const formatDate = (dateString: string, fieldLabel?: string) =>
        {
            if (!dateString || dateString.startsWith("[")) return fieldLabel ? `[${fieldLabel}]` : dateString;

            try
            {
                const date = new Date(dateString);
                return date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
            }
            catch
            {
                return fieldLabel ? `[${fieldLabel}]` : dateString;
            }
        }

        switch (schema.document_type)
        {
            //civil
            case "contrato_arrendamiento":
                return generateContractContent(getValue, formatDate, schema);
            //administrativo
            case "derecho_peticion":
                return generatePetitionContent(getValue, formatDate, schema);
            default:
                return (`
                    <div class="${styles.documentContent}">
                        <h1>Documento Personalizado</h1>
                        <p>Este es un documento generado automáticamente.</p>
                        <p>Por favor, edite el contenido según sea necesario.</p>
                    </div>
                `);
        }
    }

    const updateFieldValues = () =>
    {
        if (!editorRef.current) return;

        const fieldElements = editorRef.current.querySelectorAll("[data-field]");
        fieldElements.forEach((element) =>
        {
            const fieldPath = element.getAttribute("data-field");

            if (fieldPath)
            {
                const getValue = (path: string) =>
                {
                    const keys = path.split(".");
                    let current: any = formData;

                    for (const key of keys)
                    {
                        if (current && typeof current === "object" && key in current)
                        {
                            current = current[key];
                        }
                        else
                        {
                            const currentText = element.textContent || "";
                            const fieldLabel =
                                currentText.match(/\[(.*?)\]/)?.[1] ||
                                keys[keys.length - 1].replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
                            return `[${fieldLabel}]`;
                        }
                    }

                    if (!current || current === "" || current === null || current === undefined)
                    {
                        const currentText = element.textContent || "";
                        const fieldLabel =
                            currentText.match(/\[(.*?)\]/)?.[1] ||
                            keys[keys.length - 1].replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
                        return `[${fieldLabel}]`;
                    }

                    return current;
                }

                const formatDate = (dateString: string) =>
                {
                    if (!dateString || dateString.startsWith("[")) return dateString;

                    try
                    {
                        const date = new Date(dateString);
                        return date.toLocaleDateString("es-ES", { day: "numeric", month: "long",year: "numeric" });
                    }
                    catch
                    {
                        return dateString;
                    }
                }

                let newValue = getValue(fieldPath);

                if (fieldPath.includes("date") || fieldPath.includes("fecha")) newValue = formatDate(newValue);

                element.textContent = newValue;
            }
        })

        if (editorRef.current) setDocumentContent(editorRef.current.innerHTML);
    }

    const handleToggleEdit = () =>
    {
        if (isEditing)
        {
            if (editorRef.current)
            {
                const content = editorRef.current.innerHTML;
                setDocumentContent(content);
                setHasCustomContent(true);
            }

            setShowSidebar(false);
        }
        else setShowSidebar(true);

        setIsEditing(!isEditing);
    }

    const handleSaveDocument = () =>
    {
        if (editorRef.current)
        {
            const content = editorRef.current.innerHTML;
            setDocumentContent(content);
            setHasCustomContent(true);
            setHasUnsavedChanges(false);
            console.log("Documento guardado:", content);

            alert("Documento guardado exitosamente");
        }

        saveDocument();
    }

    const handleRevertLegalito = () =>
    {
        const prev = legalitoSnapshots[legalitoSnapshots.length - 1];
        setLegalitoSnapshots(s => s.slice(0, -1));
        setDocumentContent(prev);
        setHasCustomContent(true);
    };

    const execCommand = (command: string, value?: string) =>
    {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    }

    const insertField = (fieldPath: string, fieldLabel: string) =>
    {
        if (!editorRef.current) return;

        editorRef.current.focus();

        const selection = window.getSelection();
        if (!selection) return;

        let range: Range;
        if (selection.rangeCount > 0)
        {
            const currentRange = selection.getRangeAt(0);
            const isInsideEditor = editorRef.current.contains(currentRange.commonAncestorContainer);

            if (isInsideEditor)
            {
                range = currentRange;
            }
            else
            {
                range = document.createRange();
                range.selectNodeContents(editorRef.current);
                range.collapse(false); // Colapsar al final
            }
        }
        else
        {
            range = document.createRange();
            range.selectNodeContents(editorRef.current);
            range.collapse(false);
        }

        const fieldElement = document.createElement("span");
        fieldElement.className = styles.field;
        fieldElement.setAttribute("data-field", fieldPath);

        const getValue = (path: string) =>
        {
            const keys = path.split(".");
            let current: any = formData;

            for (const key of keys)
            {
                if (current && typeof current === "object" && key in current) current = current[key];
                else return null;
            }

            return current;
        }

        const formatDate = (dateString: string) =>
        {
            if (!dateString) return null;

            try
            {
                const date = new Date(dateString);
                return date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
            }
            catch
            {
                return null;
            }
        }

        let fieldValue = getValue(fieldPath);

        if (fieldPath.includes("date") || fieldPath.includes("fecha")) fieldValue = formatDate(fieldValue);

        if (!fieldValue || fieldValue === "" || fieldValue === null || fieldValue === undefined)
        {
            fieldValue = `[${fieldLabel}]`;
        }

        fieldElement.textContent = fieldValue;
        fieldElement.contentEditable = "false";

        range.deleteContents();
        range.insertNode(fieldElement);

        const spaceNode = document.createTextNode(" ");
        range.setStartAfter(fieldElement);
        range.insertNode(spaceNode);

        range.setStartAfter(spaceNode);
        range.setEndAfter(spaceNode);
        selection.removeAllRanges();
        selection.addRange(range);

        setHasCustomContent(true);
        setHasUnsavedChanges(true);

        const content = editorRef.current.innerHTML;

        setTimeout(() =>
        {
            const insertedField = editorRef.current?.querySelector(`[data-field="${fieldPath}"]:last-of-type`);

            if (insertedField && insertedField.nextSibling)
            {
                const newSelection = window.getSelection();
                const newRange = document.createRange();

                // Si hay un nodo de texto después del campo, posicionar ahí
                if (insertedField.nextSibling.nodeType === Node.TEXT_NODE)
                {
                    newRange.setStart(insertedField.nextSibling, 1);
                    newRange.setEnd(insertedField.nextSibling, 1);
                }
                else
                {
                    newRange.setStartAfter(insertedField);
                    newRange.setEndAfter(insertedField);
                }

                newSelection?.removeAllRanges();
                newSelection?.addRange(newRange);
                editorRef.current?.focus();
            }
        }, 0);

        setDocumentContent(content);
    }

    const insertComponent = (componentType: string) =>
    {
        // Asegurar que el editor esté enfocado y el cursor esté dentro del documento
        if (!editorRef.current) return;

        editorRef.current.focus();

        const selection = window.getSelection();
        if (!selection) return;

        // Verificar si la selección actual está dentro del documento editor
        let range: Range;

        if (selection.rangeCount > 0)
        {
            const currentRange = selection.getRangeAt(0);
            const isInsideEditor = editorRef.current.contains(currentRange.commonAncestorContainer);

            if (isInsideEditor)
            {
                range = currentRange;
            }
            else
            {
                // Si no está dentro del editor, crear un nuevo range al final del documento
                range = document.createRange();
                range.selectNodeContents(editorRef.current);
                range.collapse(false); // Colapsar al final
            }
        }
        else
        {
            // Si no hay selección, crear un nuevo range al final del documento
            range = document.createRange();
            range.selectNodeContents(editorRef.current);
            range.collapse(false);
        }

        let element: HTMLElement;

        switch (componentType)
        {
            case "heading":
                element = document.createElement("h2");
                element.textContent = "Nuevo Título";
                break;
            case "paragraph":
                element = document.createElement("p");
                element.textContent = "Nuevo párrafo";
                break;
            case "list":
                element = document.createElement("ul");
                const li = document.createElement("li");
                li.textContent = "Elemento de lista";
                element.appendChild(li);
                break;
            case "table":
                element = document.createElement("table");
                element.className = styles.table;
                element.innerHTML = `<tr><td>Celda 1</td><td>Celda 2</td></tr><tr><td>Celda 3</td><td>Celda 4</td></tr>`;
                break;
            case "signature":
                element = document.createElement("div");
                element.className = styles.signatureBlock;
                element.innerHTML = `<div class="${styles.signatureLine}"></div><p>FIRMA</p><p>NOMBRE</p>`;
                break;
            default:
                element = document.createElement("p");
                element.textContent = "Nuevo elemento";
        }

        // Agregar un ID único temporal para poder encontrar el elemento después
        const tempId = `temp-component-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        element.setAttribute("data-temp-id", tempId);

        range.deleteContents();
        range.insertNode(element);

        // Crear un párrafo vacío después del elemento para mejor UX
        const newParagraph = document.createElement("p");
        newParagraph.innerHTML = "&nbsp;";
        range.setStartAfter(element);
        range.insertNode(newParagraph);

        // Posicionar el cursor dentro del nuevo párrafo
        range.setStart(newParagraph, 0);
        range.setEnd(newParagraph, 0);
        selection.removeAllRanges();
        selection.addRange(range);

        setHasUnsavedChanges(true);

        // Actualizar el contenido del documento
        const content = editorRef.current.innerHTML;
        setDocumentContent(content);

        // Preservar la posición del cursor después del re-render
        setTimeout(() =>
        {
            if (!editorRef.current) return;

            // Encontrar el componente recién insertado usando el ID temporal
            const insertedElement = editorRef.current.querySelector(`[data-temp-id="${tempId}"]`);

            if (insertedElement)
            {
                // Remover el ID temporal
                insertedElement.removeAttribute("data-temp-id");

                // Encontrar el párrafo que sigue al componente insertado
                const nextElement = insertedElement.nextElementSibling;

                // Si el siguiente elemento es un párrafo vacío, posicionar el cursor ahí
                if (nextElement && nextElement.tagName === "P")
                {
                    const newSelection = window.getSelection();
                    const newRange = document.createRange();

                    // Posicionar el cursor al inicio del párrafo
                    if (nextElement.firstChild)
                    {
                        newRange.setStart(nextElement.firstChild, 0);
                        newRange.setEnd(nextElement.firstChild, 0);
                    }
                    else
                    {
                        newRange.setStart(nextElement, 0);
                        newRange.setEnd(nextElement, 0);
                    }

                    newSelection?.removeAllRanges();
                    newSelection?.addRange(newRange);
                    editorRef.current?.focus();
                }
                else
                {
                    // Si no hay párrafo siguiente, crear uno y posicionar el cursor ahí
                    const newParagraph = document.createElement("p");
                    newParagraph.innerHTML = "&nbsp;";

                    if (insertedElement.parentNode)
                    {
                        insertedElement.parentNode.insertBefore(newParagraph, insertedElement.nextSibling);

                        const newSelection = window.getSelection();
                        const newRange = document.createRange();
                        newRange.setStart(newParagraph, 0);
                        newRange.setEnd(newParagraph, 0);
                        newSelection?.removeAllRanges();
                        newSelection?.addRange(newRange);
                        editorRef.current?.focus();
                    }
                }
            }
            else
            {
                // Fallback: posicionar el cursor al final del documento
                editorRef.current?.focus();
                const newSelection = window.getSelection();
                const newRange = document.createRange();
                newRange.selectNodeContents(editorRef.current);
                newRange.collapse(false);
                newSelection?.removeAllRanges();
                newSelection?.addRange(newRange);
            }
        }, 0);
    }

    const getAllFields = () =>
    {
        if (!schema) return {}

        const fields: { [category: string]: { path: string; label: string; type: string }[] } = {};

        const processCategory = (categoryName: string, categoryConfig: CategoryConfig, parentPath = "") =>
        {
            Object.entries(categoryConfig).forEach(([key, value]) =>
            {
                const fieldPath = parentPath ? `${parentPath}.${key}` : `${categoryName}.${key}`;

                if (value && typeof value === "object" && "type" in value)
                {
                    const fieldConfig = value as FieldConfig;
                    const categoryDisplayName = categoryName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

                    if (!fields[categoryDisplayName])
                    {
                        fields[categoryDisplayName] = [];
                    }

                    fields[categoryDisplayName].push({
                        path: fieldPath,
                        label: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
                        type: fieldConfig.type,
                    });
                }
                else if (value && typeof value === "object")
                {
                    processCategory(categoryName, value as CategoryConfig, fieldPath);
                }
            })
        }

        Object.entries(schema.variable_fields).forEach(([categoryName, categoryConfig]) =>
        {
            processCategory(categoryName, categoryConfig);
        })

        return fields;
    }

    return (
        <div className={styles.container}>
            <div className={styles.editorCard}>
                {legalitoWorking && (
                    <div className={styles.legalitoOverlay}>
                        <div className={styles.legalitoSpinner} />
                        <span className={styles.legalitoOverlayText}>Legalito está trabajando...</span>
                    </div>
                )}
                <div className={styles.editorHeader}>
                    <div className={styles.editorTitle}>
                        <File className={styles.editorIcon} />
                        <h2>Editor de Documento</h2>
                    </div>
                    <div className={styles.editorActions}>
                        <button
                            className={`${styles.button} ${isEditing ? styles.buttonActive : styles.buttonSecondary}`}
                            onClick={handleToggleEdit}
                        >
                            <Edit className={styles.buttonIcon} />
                            {isEditing ? "Finalizar Edición" : "Editar Documento"}
                        </button>
                        {isEditing && (
                            <button
                                className={`${styles.button} ${styles.buttonPrimary} ${documentState.hasUnsavedChanges ? styles.buttonUnsaved : ""}`}
                                onClick={handleSaveDocument}
                            >
                                <Save className={styles.buttonIcon} />
                                {documentState.hasUnsavedChanges ? "Guardar*" : "Guardar"}
                            </button>
                        )}
                        {isEditing && documentState.hasCustomContent && (
                            <button
                                className={`${styles.button} ${styles.buttonOutline}`}
                                onClick={() => {
                                    resetDocument();
                                    setDocumentContent(generateInitialDocument());
                                }}
                                title="Resetear documento al contenido original"
                            >
                                Resetear
                            </button>
                        )}
                        {legalitoSnapshots.length > 0 && (
                            <button
                                className={`${styles.button} ${styles.buttonOutline}`}
                                onClick={handleRevertLegalito}
                                title="Deshacer el último cambio de Legalito"
                            >
                                Revertir Legalito {legalitoSnapshots.length > 1 ? `(${legalitoSnapshots.length})` : ''}
                            </button>
                        )}
                    </div>
                </div>

                {isEditing && (
                    <div className={styles.toolbar}>
                        <div className={styles.toolbarGroup}>
                            <button className={styles.toolbarButton} onClick={() => execCommand("bold")} title="Negrita">
                                <Bold className={styles.toolbarIcon} />
                            </button>
                            <button className={styles.toolbarButton} onClick={() => execCommand("italic")} title="Cursiva">
                                <Italic className={styles.toolbarIcon} />
                            </button>
                            <button className={styles.toolbarButton} onClick={() => execCommand("underline")} title="Subrayado">
                                <Underline className={styles.toolbarIcon} />
                            </button>
                        </div>

                        <div className={styles.toolbarGroup}>
                            <button
                                className={styles.toolbarButton}
                                onClick={() => execCommand("justifyLeft")}
                                title="Alinear izquierda"
                            >
                                <AlignLeft className={styles.toolbarIcon} />
                            </button>
                            <button className={styles.toolbarButton} onClick={() => execCommand("justifyCenter")} title="Centrar">
                                <AlignCenter className={styles.toolbarIcon} />
                            </button>
                            <button
                                className={styles.toolbarButton}
                                onClick={() => execCommand("justifyRight")}
                                title="Alinear derecha"
                            >
                                <AlignRight className={styles.toolbarIcon} />
                            </button>
                            <button
                                className={styles.toolbarButton}
                                onClick={() => execCommand("justifyFull")}
                                title="Justificar"
                            >
                                <AlignJustify className={styles.toolbarIcon} />
                            </button>
                        </div>

                        <div className={styles.toolbarGroup}>
                            <button
                                className={styles.toolbarButton}
                                onClick={() => execCommand("insertUnorderedList")}
                                title="Lista con viñetas"
                            >
                                <List className={styles.toolbarIcon} />
                            </button>
                            <button
                                className={styles.toolbarButton}
                                onClick={() => execCommand("insertOrderedList")}
                                title="Lista numerada"
                            >
                                <ListOrdered className={styles.toolbarIcon} />
                            </button>
                        </div>
                        <div className={styles.toolbarGroup}>
                            <button
                                className={styles.toolbarButton}
                                onClick={() => setShowSidebar((prev) => !prev)}
                                title={`${showSidebar ? "Cerrar" : "Abrir"} barra lateral de edición`}
                            >
                                {
                                    showSidebar
                                    ? <PanelClose className={styles.toolbarIcon} />
                                    : <PanelOpen className={styles.toolbarIcon} />
                                }
                            </button>
                        </div>
                    </div>
                )}

                <div className={styles.editorContainer}>
                    {showSidebar && (
                        <EditorSidebar
                            fields={getAllFields()}
                            onInsertField={insertField}
                            onInsertComponent={insertComponent}
                            onClose={() => setShowSidebar(false)}
                        />
                    )}

                    <div className={`${styles.editorContent} ${isEditing ? styles.editorContentEditable : ""}`}>
                        <div
                            ref={editorRef}
                            className={`${styles.documentEditor} ${isEditing ? styles.editable : ""}`}
                            contentEditable={isEditing}
                            onInput={(e) =>
                            {
                                if (isEditing)
                                {
                                    // Update the ref so Legalito reads fresh content,
                                    // but skip the state→DOM sync to avoid cursor jumps.
                                    skipNextDomSync.current = true;
                                    contentRef.current = e.currentTarget.innerHTML;
                                    setHasCustomContent(true);
                                    setHasUnsavedChanges(true);
                                }
                            }}
                            suppressContentEditableWarning={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DocumentEditor;