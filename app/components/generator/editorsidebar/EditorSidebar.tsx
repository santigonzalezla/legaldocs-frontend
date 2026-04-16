"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import styles from "./editorsidebar.module.css"
import {
    ArrowDown,
    ArrowGo,
    Calendar,
    Check,
    Create,
    File,
    Hash,
    List,
    Mail,
    PenTool,
    Plus,
    Table,
    Type,
    X,
} from "@/app/components/svg"

interface EditorSidebarProps {
    variableFields: Record<string, any>
    onInsertField: (fieldPath: string, fieldLabel: string) => void
    onInsertComponent: (componentType: string) => void
    onClose: () => void
    formData: Record<string, Record<string, any>>
    onUpdateFieldType: (category: string, field: string, newType: string) => void
    onUpdateFieldValue: (category: string, field: string, value: any) => void
    onUpdateFieldOptions: (category: string, field: string, options: string[]) => void
    onAddField: (category: string, fieldName: string, type: string, options?: string[]) => void
    onAddCategory: (name: string) => void
}

interface VarFormState {
    open: boolean
    name: string
    type: string
    options: string[]
    optionInput: string
}

const FIELD_TYPES = ['texto', 'fecha', 'numero', 'email', 'booleano', 'seleccion']

const TYPE_ICONS: Record<string, React.ElementType> = {
    texto:     Type,
    fecha:     Calendar,
    numero:    Hash,
    email:     Mail,
    booleano:  Check,
    seleccion: List,
}

const TYPE_LABELS: Record<string, string> = {
    texto:     'Texto',
    fecha:     'Fecha',
    numero:    'Número',
    email:     'Email',
    booleano:  'Booleano',
    seleccion: 'Selección',
}

// ── Custom type selector ───────────────────────────────────────────────────

interface TypeSelectProps {
    value: string
    onChange: (type: string) => void
}

const TypeSelect = ({ value, onChange }: TypeSelectProps) =>
{
    const [open, setOpen]   = useState(false)
    const [pos,  setPos]    = useState({ top: 0, left: 0 })
    const triggerRef        = useRef<HTMLButtonElement>(null)
    const dropdownRef       = useRef<HTMLDivElement>(null)
    const Icon              = TYPE_ICONS[value] ?? File

    // Close on outside click or any scroll
    useEffect(() =>
    {
        if (!open) return
        const close = () => setOpen(false)
        const handleClick = (e: MouseEvent) =>
        {
            if (
                dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
                triggerRef.current  && !triggerRef.current.contains(e.target as Node)
            ) close()
        }
        document.addEventListener('mousedown', handleClick)
        window.addEventListener('scroll', close, true)   // capture → catches scroll from any ancestor
        return () =>
        {
            document.removeEventListener('mousedown', handleClick)
            window.removeEventListener('scroll', close, true)
        }
    }, [open])

    const handleToggle = (e: React.MouseEvent) =>
    {
        e.stopPropagation()
        if (!open && triggerRef.current)
        {
            const rect = triggerRef.current.getBoundingClientRect()
            setPos({ top: rect.bottom + 5, left: rect.left })
        }
        setOpen(prev => !prev)
    }

    const dropdown = open && (
        <div
            ref={dropdownRef}
            className={styles.typeSelectDropdown}
            style={{ top: pos.top, left: pos.left }}
        >
            {FIELD_TYPES.map(t =>
            {
                const TIcon    = TYPE_ICONS[t] ?? File
                const isActive = t === value
                return (
                    <button
                        key={t}
                        className={`${styles.typeSelectOption} ${isActive ? styles.typeSelectOptionActive : ''}`}
                        onClick={e => { e.stopPropagation(); onChange(t); setOpen(false) }}
                    >
                        <TIcon className={styles.typeSelectOptionIcon} />
                        <span className={styles.typeSelectOptionLabel}>{TYPE_LABELS[t]}</span>
                        {isActive && <span className={styles.typeSelectOptionCheck}>✓</span>}
                    </button>
                )
            })}
        </div>
    )

    return (
        <div className={styles.typeSelect}>
            <button
                ref={triggerRef}
                className={`${styles.typeSelectTrigger} ${open ? styles.typeSelectTriggerOpen : ''}`}
                onClick={handleToggle}
                title={`Tipo: ${TYPE_LABELS[value] ?? value}`}
            >
                <Icon className={styles.typeSelectIcon} />
                <ArrowDown className={`${styles.typeSelectChevron} ${open ? styles.typeSelectChevronOpen : ''}`} />
            </button>

            {typeof document !== 'undefined' && createPortal(dropdown, document.body)}
        </div>
    )
}

const components = [
    { type: "heading",   label: "Título",  icon: Type,    description: "Agregar un título o encabezado" },
    { type: "paragraph", label: "Párrafo", icon: File,    description: "Agregar un párrafo de texto"    },
    { type: "list",      label: "Lista",   icon: List,    description: "Agregar una lista con viñetas"  },
    { type: "table",     label: "Tabla",   icon: Table,   description: "Agregar una tabla"              },
    { type: "signature", label: "Firma",   icon: PenTool, description: "Agregar un bloque de firma"    },
]

const EditorSidebar = ({
    variableFields,
    onInsertField,
    onInsertComponent,
    onClose,
    formData,
    onUpdateFieldType,
    onUpdateFieldValue,
    onUpdateFieldOptions,
    onAddField,
    onAddCategory,
}: EditorSidebarProps) =>
{
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
    const [activeTab,          setActiveTab]          = useState<"fields" | "components">("fields")
    const [varForms,           setVarForms]           = useState<Record<string, VarFormState>>({})
    const [addCat,             setAddCat]             = useState({ open: false, name: "" })
    // Per-field option inputs for existing seleccion fields (keyed by "cat.field")
    const [optionInputs,       setOptionInputs]       = useState<Record<string, string>>({})

    const toggleCategory = (cat: string) =>
        setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }))

    const openVarForm  = (cat: string) =>
        setVarForms(prev => ({ ...prev, [cat]: { open: true, name: "", type: "texto", options: [], optionInput: "" } }))

    const closeVarForm = (cat: string) =>
        setVarForms(prev => ({ ...prev, [cat]: { open: false, name: "", type: "texto", options: [], optionInput: "" } }))

    const commitVar = (cat: string) =>
    {
        const state = varForms[cat]
        if (!state?.name.trim()) return
        onAddField(cat, state.name.trim(), state.type, state.options.length ? state.options : undefined)
        closeVarForm(cat)
    }

    const commitCat = () =>
    {
        if (!addCat.name.trim()) return
        onAddCategory(addCat.name.trim())
        setAddCat({ open: false, name: "" })
    }

    // Helpers for existing-field option inputs
    const getOptInput = (key: string) => optionInputs[key] ?? ''
    const setOptInput = (key: string, val: string) =>
        setOptionInputs(prev => ({ ...prev, [key]: val }))

    const addOptionToField = (cat: string, field: string, currentOptions: string[]) =>
    {
        const key = `${cat}.${field}`
        const val = getOptInput(key).trim()
        if (!val) return
        onUpdateFieldOptions(cat, field, [...currentOptions, val])
        setOptInput(key, '')
    }

    const removeOptionFromField = (cat: string, field: string, currentOptions: string[], idx: number) =>
        onUpdateFieldOptions(cat, field, currentOptions.filter((_, i) => i !== idx))

    const renderValueControl = (cat: string, field: string, type: string, options?: string[]) =>
    {
        const value    = formData[cat]?.[field] ?? ""
        const onChange = (v: any) => onUpdateFieldValue(cat, field, v)
        const stop     = (e: React.SyntheticEvent) => e.stopPropagation()

        if (type === "booleano")
        {
            return (
                <label className={styles.fieldValueBool} onClick={stop}>
                    <input
                        type="checkbox"
                        className={styles.fieldValueCheckbox}
                        checked={!!value}
                        onChange={e => onChange(e.target.checked)}
                    />
                    <span className={styles.fieldValueBoolLabel}>{value ? "Sí" : "No"}</span>
                </label>
            )
        }

        if (type === "seleccion")
        {
            if (!options?.length)
            {
                return (
                    <span className={styles.fieldValueNoOptions}>Sin opciones</span>
                )
            }
            return (
                <select
                    className={styles.fieldValueSelect}
                    value={value}
                    onChange={e => { stop(e); onChange(e.target.value) }}
                    onClick={stop}
                >
                    <option value="">— seleccionar —</option>
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
            )
        }

        return (
            <input
                type={type === "fecha" ? "date" : type === "numero" ? "number" : type === "email" ? "email" : "text"}
                className={styles.fieldValueInput}
                value={value}
                placeholder="valor..."
                onChange={e => { stop(e); onChange(e.target.value) }}
                onClick={stop}
            />
        )
    }

    return (
        <div className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
                <h3 className={styles.sidebarTitle}>Herramientas de Edición</h3>
                <button className={styles.closeButton} onClick={onClose}>
                    <X className={styles.closeIcon} />
                </button>
            </div>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === "fields" ? styles.tabActive : ""}`}
                    onClick={() => setActiveTab("fields")}
                >
                    Campos
                </button>
                <button
                    className={`${styles.tab} ${activeTab === "components" ? styles.tabActive : ""}`}
                    onClick={() => setActiveTab("components")}
                >
                    Componentes
                </button>
            </div>

            <div className={styles.sidebarContent}>
                {activeTab === "fields" && (
                    <div className={styles.fieldsSection}>
                        <p className={styles.sectionDescription}>
                            Edita tipo y valor. Usa <Create className={styles.descIcon} /> para insertar en el cursor.
                        </p>

                        {Object.entries(variableFields).map(([cat, catConfig]) =>
                        {
                            const isExpanded  = !!expandedCategories[cat]
                            const displayName = cat.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
                            const varState    = varForms[cat] ?? { open: false, name: "", type: "texto", options: [], optionInput: "" }

                            const entries = Object.entries(catConfig as Record<string, any>).filter(
                                ([, v]) => v && typeof v === "object" && "type" in v
                            )

                            return (
                                <div key={cat} className={styles.categoryGroup}>
                                    <button className={styles.categoryHeader} onClick={() => toggleCategory(cat)}>
                                        {isExpanded
                                            ? <ArrowDown className={styles.categoryIcon} />
                                            : <ArrowGo  className={styles.categoryIcon} />
                                        }
                                        <span className={styles.categoryTitle}>{displayName}</span>
                                        <span className={styles.categoryCount}>({entries.length})</span>
                                    </button>

                                    {isExpanded && (
                                        <div className={styles.categoryContent}>
                                            {entries.map(([field, config]) =>
                                            {
                                                const cfg      = config as { type: string; options?: string[] }
                                                const label    = field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
                                                const path     = `${cat}.${field}`
                                                const optKey   = `${cat}.${field}`
                                                const isSelect = cfg.type === 'seleccion'

                                                return (
                                                    <div key={field} className={styles.fieldItem}>

                                                        {/* Row 1: nombre + botón insertar */}
                                                        <div className={styles.fieldRow1}>
                                                            <span className={styles.fieldLabel}>{label}</span>
                                                            <button
                                                                className={styles.fieldInsertBtn}
                                                                onClick={() => onInsertField(path, label)}
                                                                title={`Insertar "${label}" en el cursor`}
                                                            >
                                                                <Create className={styles.fieldInsertIcon} />
                                                            </button>
                                                        </div>

                                                        {/* Row 2: tipo (selector custom) + valor */}
                                                        <div className={styles.fieldRow2}>
                                                            <TypeSelect
                                                                value={cfg.type}
                                                                onChange={t => onUpdateFieldType(cat, field, t)}
                                                            />
                                                            {renderValueControl(cat, field, cfg.type, cfg.options)}
                                                        </div>

                                                        {/* Row 3 (seleccion only): opciones */}
                                                        {isSelect && (
                                                            <div className={styles.fieldOptionsRow}>
                                                                <div className={styles.fieldOptionsAdd}>
                                                                    <input
                                                                        className={styles.fieldOptionsInput}
                                                                        placeholder="nueva opción..."
                                                                        value={getOptInput(optKey)}
                                                                        onChange={e => setOptInput(optKey, e.target.value)}
                                                                        onKeyDown={e => {
                                                                            e.stopPropagation()
                                                                            if (e.key === 'Enter') addOptionToField(cat, field, cfg.options ?? [])
                                                                        }}
                                                                        onClick={e => e.stopPropagation()}
                                                                    />
                                                                    <button
                                                                        className={styles.fieldOptionsAddBtn}
                                                                        disabled={!getOptInput(optKey).trim()}
                                                                        onClick={e => { e.stopPropagation(); addOptionToField(cat, field, cfg.options ?? []) }}
                                                                        title="Agregar opción"
                                                                    >
                                                                        <Plus className={styles.fieldOptionsAddBtnIcon} />
                                                                    </button>
                                                                </div>
                                                                {(cfg.options ?? []).length > 0 && (
                                                                    <div className={styles.fieldOptionsTags}>
                                                                        {(cfg.options ?? []).map((opt, i) => (
                                                                            <span key={i} className={styles.fieldOptionsTag}>
                                                                                {opt}
                                                                                <button
                                                                                    className={styles.fieldOptionsTagRemove}
                                                                                    onClick={e => { e.stopPropagation(); removeOptionFromField(cat, field, cfg.options ?? [], i) }}
                                                                                >
                                                                                    <X className={styles.fieldOptionsTagX} />
                                                                                </button>
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                    </div>
                                                )
                                            })}

                                            {/* Add variable */}
                                            {varState.open ? (
                                                <div className={styles.addVarForm}>
                                                    <input
                                                        className={styles.addVarInput}
                                                        placeholder="nombre_campo"
                                                        value={varState.name}
                                                        onChange={e => setVarForms(prev => ({
                                                            ...prev,
                                                            [cat]: { ...varState, name: e.target.value },
                                                        }))}
                                                        onKeyDown={e => e.key === "Enter" && commitVar(cat)}
                                                    />
                                                    <select
                                                        className={styles.addVarSelect}
                                                        value={varState.type}
                                                        onChange={e => setVarForms(prev => ({
                                                            ...prev,
                                                            [cat]: { ...varState, type: e.target.value, options: [], optionInput: "" },
                                                        }))}
                                                    >
                                                        {FIELD_TYPES.map(t =>
                                                            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                                                        )}
                                                    </select>

                                                    {/* Options builder — only shown when type = seleccion */}
                                                    {varState.type === 'seleccion' && (
                                                        <div className={styles.addVarOptionsBlock}>
                                                            <p className={styles.addVarOptionsLabel}>Opciones de selección:</p>
                                                            <div className={styles.addVarOptionRow}>
                                                                <input
                                                                    className={styles.addVarOptionInput}
                                                                    placeholder="nueva opción..."
                                                                    value={varState.optionInput}
                                                                    onChange={e => setVarForms(prev => ({
                                                                        ...prev,
                                                                        [cat]: { ...varState, optionInput: e.target.value },
                                                                    }))}
                                                                    onKeyDown={e => {
                                                                        if (e.key === 'Enter' && varState.optionInput.trim())
                                                                        {
                                                                            setVarForms(prev => ({
                                                                                ...prev,
                                                                                [cat]: {
                                                                                    ...varState,
                                                                                    options: [...varState.options, varState.optionInput.trim()],
                                                                                    optionInput: "",
                                                                                },
                                                                            }))
                                                                        }
                                                                    }}
                                                                />
                                                                <button
                                                                    className={styles.addVarOptionBtn}
                                                                    disabled={!varState.optionInput.trim()}
                                                                    onClick={() =>
                                                                    {
                                                                        if (!varState.optionInput.trim()) return
                                                                        setVarForms(prev => ({
                                                                            ...prev,
                                                                            [cat]: {
                                                                                ...varState,
                                                                                options: [...varState.options, varState.optionInput.trim()],
                                                                                optionInput: "",
                                                                            },
                                                                        }))
                                                                    }}
                                                                >
                                                                    <Plus className={styles.addVarOptionBtnIcon} />
                                                                </button>
                                                            </div>
                                                            {varState.options.length > 0 && (
                                                                <div className={styles.addVarOptionTags}>
                                                                    {varState.options.map((opt, i) => (
                                                                        <span key={i} className={styles.addVarOptionTag}>
                                                                            {opt}
                                                                            <button
                                                                                className={styles.addVarOptionTagRemove}
                                                                                onClick={() => setVarForms(prev => ({
                                                                                    ...prev,
                                                                                    [cat]: {
                                                                                        ...varState,
                                                                                        options: varState.options.filter((_, j) => j !== i),
                                                                                    },
                                                                                }))}
                                                                            >
                                                                                <X className={styles.addVarOptionTagX} />
                                                                            </button>
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className={styles.addVarActions}>
                                                        <button
                                                            className={styles.addVarConfirm}
                                                            disabled={!varState.name.trim()}
                                                            onClick={() => commitVar(cat)}
                                                        >
                                                            Agregar
                                                        </button>
                                                        <button
                                                            className={styles.addVarCancel}
                                                            onClick={() => closeVarForm(cat)}
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    className={styles.addVarBtn}
                                                    onClick={() => openVarForm(cat)}
                                                >
                                                    <Plus className={styles.addVarBtnIcon} />
                                                    Variable
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}

                        {/* Add category */}
                        {addCat.open ? (
                            <div className={styles.addCatForm}>
                                <input
                                    className={styles.addCatInput}
                                    placeholder="nombre_categoria"
                                    value={addCat.name}
                                    onChange={e => setAddCat(prev => ({ ...prev, name: e.target.value }))}
                                    onKeyDown={e => e.key === "Enter" && commitCat()}
                                />
                                <div className={styles.addVarActions}>
                                    <button
                                        className={styles.addVarConfirm}
                                        disabled={!addCat.name.trim()}
                                        onClick={commitCat}
                                    >
                                        Crear
                                    </button>
                                    <button
                                        className={styles.addVarCancel}
                                        onClick={() => setAddCat({ open: false, name: "" })}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                className={styles.addCatBtn}
                                onClick={() => setAddCat({ open: true, name: "" })}
                            >
                                <Plus className={styles.addCatBtnIcon} />
                                Categoría
                            </button>
                        )}
                    </div>
                )}

                {activeTab === "components" && (
                    <div className={styles.componentsSection}>
                        <p className={styles.sectionDescription}>
                            Haz clic en un componente para insertarlo en el documento
                        </p>
                        {components.map(({ type, label, icon: Icon, description }) => (
                            <button
                                key={type}
                                className={styles.componentItem}
                                onClick={() => onInsertComponent(type)}
                                title={description}
                            >
                                <Icon className={styles.componentIcon} />
                                <div className={styles.componentInfo}>
                                    <span className={styles.componentLabel}>{label}</span>
                                    <span className={styles.componentDescription}>{description}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default EditorSidebar
