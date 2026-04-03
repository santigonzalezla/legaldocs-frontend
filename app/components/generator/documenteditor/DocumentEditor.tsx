"use client"

import { useState, useRef, useEffect } from "react"
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
    const [isEditing, setIsEditing] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);

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
                            dangerouslySetInnerHTML={{ __html: documentState.content }}
                            onInput={(e) =>
                            {
                                if (isEditing)
                                {
                                    const content = e.currentTarget.innerHTML;
                                    setDocumentContent(content);
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