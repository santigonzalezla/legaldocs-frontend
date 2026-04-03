"use client"

import {useEffect, useState} from "react"
import styles from "./formcategory.module.css";
import {CategoryConfig, FieldConfig, FormData} from "@/app/interfaces/types/formtypes";
import FieldRenderer from "@/app/components/generator/fieldrenderer/FieldRenderer";
import AddFieldModal from "@/app/components/generator/addfieldmodal/AddFieldModal";
import {ArrowDown, ArrowGo, Trash} from "@/app/components/svg";

interface FormCategoryProps {
    categoryName: string
    categoryConfig: CategoryConfig
    formData: FormData
    onFieldChange: (categoryName: string, fieldPath: string, value: any) => void
    onAddField: (categoryName: string, fieldName: string, config: FieldConfig) => void
    onDeleteCategory: (categoryName: string) => void
    forceExpanded?: boolean
}

const FormCategory = ({ categoryName, categoryConfig,formData, onFieldChange, onAddField, onDeleteCategory, forceExpanded }: FormCategoryProps)=>
{
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() =>
    {
        if (forceExpanded !== undefined)
        {
            setIsExpanded(forceExpanded);
        }
    }, [forceExpanded]);

    const renderFields = (config: CategoryConfig, parentPath = "") =>
    {
        return Object.entries(config).map(([key, value]) =>
        {
            const fieldPath = parentPath ? `${parentPath}.${key}` : key;
            const fullPath = `${categoryName}.${fieldPath}`;

            if (value && typeof value === "object" && !("type" in value))
            {
                // It's a nested category
                return (
                    <div key={key} className={styles.nestedCategory}>
                        <h4 className={styles.nestedTitle}>{key.replace(/_/g, " ")}</h4>
                        {renderFields(value as CategoryConfig, fieldPath)}
                    </div>
                );
            }
            else
            {
                // It's a field
                const fieldConfig = value as FieldConfig;
                const currentValue = getNestedValue(formData[categoryName] || {}, fieldPath);

                return (
                    <div key={key} className={styles.fieldItem}>
                        <FieldRenderer
                            fieldKey={key}
                            config={fieldConfig}
                            value={currentValue}
                            onChange={(newValue) => onFieldChange(categoryName, fieldPath, newValue)}
                        />
                    </div>
                );
            }
        })
    }

    const getNestedValue = (obj: any, path: string) =>
    {
        return path.split(".").reduce((current, key) => current?.[key], obj);
    }

    const displayName = categoryName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

    return (
        <div className={styles.categoryCard}>
            <div className={styles.categoryHeader}>
                <div className={styles.headerTop}>
                    <div className={styles.headerLeft}>
                        <button type="button" onClick={() => setIsExpanded(!isExpanded)} className={styles.expandButton}>
                            {isExpanded ? (
                                <ArrowDown className={styles.expandIcon} />
                            ) : (
                                <ArrowGo className={styles.expandIcon} />
                            )}
                        </button>
                        <h3 className={styles.categoryTitle}>{displayName}</h3>
                    </div>
                    <button type="button" onClick={() => onDeleteCategory(categoryName)} className={styles.deleteButton}>
                        <Trash className={styles.deleteIcon} />
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className={styles.categoryContent}>
                    <div className={styles.fieldsContainer}>
                        {renderFields(categoryConfig)}
                        <AddFieldModal onAddField={(fieldName, config) => onAddField(categoryName, fieldName, config)} />
                    </div>
                </div>
            )}
        </div>
    );
}


export default FormCategory;