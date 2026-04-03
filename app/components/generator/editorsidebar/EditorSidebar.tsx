"use client"

import { useState } from "react"
import styles from "./editorsidebar.module.css"
import {ArrowDown, ArrowGo, File, Hash, List, PenTool, Table, Type, X} from "@/app/components/svg";

interface EditorSidebarProps {
    fields: { [category: string]: { path: string; label: string; type: string }[] }
    onInsertField: (fieldPath: string, fieldLabel: string) => void
    onInsertComponent: (componentType: string) => void
    onClose: () => void
}

const EditorSidebar = ({ fields, onInsertField, onInsertComponent, onClose }: EditorSidebarProps)=>
{
    const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});
    const [activeTab, setActiveTab] = useState<"fields" | "components">("fields");

    const toggleCategory = (category: string) => {
        setExpandedCategories((prev) => ({
            ...prev,
            [category]: !prev[category],
        }));
    }

    const components = [
        { type: "heading", label: "Título", icon: Type, description: "Agregar un título o encabezado" },
        { type: "paragraph", label: "Párrafo", icon: File, description: "Agregar un párrafo de texto" },
        { type: "list", label: "Lista", icon: List, description: "Agregar una lista con viñetas" },
        { type: "table", label: "Tabla", icon: Table, description: "Agregar una tabla" },
        { type: "signature", label: "Firma", icon: PenTool, description: "Agregar un bloque de firma" },
    ]

    const getFieldIcon = (type: string) =>
    {
        switch (type)
        {
            case "texto":
                return Type;
            case "numero":
                return Hash;
            case "email":
                return File;
            case "fecha":
                return File;
            case "booleano":
                return File;
            case "seleccion":
                return List;
            default:
                return File;
        }
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
                        <p className={styles.sectionDescription}>Haz clic en un campo para insertarlo en la posición del cursor</p>

                        {Object.entries(fields).map(([category, categoryFields]) => (
                            <div key={category} className={styles.categoryGroup}>
                                <button className={styles.categoryHeader} onClick={() => toggleCategory(category)}>
                                    {expandedCategories[category] ? (
                                        <ArrowDown className={styles.categoryIcon} />
                                    ) : (
                                        <ArrowGo className={styles.categoryIcon} />
                                    )}
                                    <span className={styles.categoryTitle}>{category}</span>
                                    <span className={styles.categoryCount}>({categoryFields.length})</span>
                                </button>

                                {expandedCategories[category] && (
                                    <div className={styles.categoryContent}>
                                        {categoryFields.map((field) => {
                                            const IconComponent = getFieldIcon(field.type)
                                            return (
                                                <button
                                                    key={field.path}
                                                    className={styles.fieldItem}
                                                    onClick={() => onInsertField(field.path, field.label)}
                                                    title={`Insertar campo: ${field.label}`}
                                                >
                                                    <IconComponent className={styles.fieldIcon} />
                                                    <div className={styles.fieldInfo}>
                                                        <span className={styles.fieldLabel}>{field.label}</span>
                                                        <span className={styles.fieldType}>{field.type}</span>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === "components" && (
                    <div className={styles.componentsSection}>
                        <p className={styles.sectionDescription}>Haz clic en un componente para insertarlo en el documento</p>

                        {components.map((component) =>
                        {
                            const IconComponent = component.icon
                            return (
                                <button
                                    key={component.type}
                                    className={styles.componentItem}
                                    onClick={() => onInsertComponent(component.type)}
                                    title={component.description}
                                >
                                    <IconComponent className={styles.componentIcon} />
                                    <div className={styles.componentInfo}>
                                        <span className={styles.componentLabel}>{component.label}</span>
                                        <span className={styles.componentDescription}>{component.description}</span>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

export default EditorSidebar;