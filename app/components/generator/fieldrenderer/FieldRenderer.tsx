"use client"

import styles from "./fieldrenderer.module.css";
import {FieldConfig} from "@/app/interfaces/types/formtypes";

interface FieldRendererProps {
    fieldKey: string
    config: FieldConfig
    value: any
    onChange: (value: any) => void
}

const FieldRenderer = ({ fieldKey, config, value, onChange }: FieldRendererProps) =>
{
    const fieldId = `field-${fieldKey}`;

    const renderField = () =>
    {
        switch (config.type)
        {
            case "texto":
                return (
                    <input
                        id={fieldId}
                        type="text"
                        value={value || config.default_value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={config.placeholder}
                        required={config.required}
                        className={styles.input}
                    />
                );

            case "email":
                return (
                    <input
                        id={fieldId}
                        type="email"
                        value={value || config.default_value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={config.placeholder}
                        required={config.required}
                        className={styles.input}
                    />
                );

            case "numero":
                return (
                    <input
                        id={fieldId}
                        type="number"
                        value={value || config.default_value || ""}
                        onChange={(e) => onChange(Number(e.target.value))}
                        placeholder={config.placeholder}
                        required={config.required}
                        className={styles.input}
                    />
                );

            case "fecha":
                return (
                    <input
                        id={fieldId}
                        type="date"
                        value={value || config.default_value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        required={config.required}
                        className={styles.input}
                    />
                );

            case "booleano":
                return (
                    <div className={styles.checkboxContainer}>
                        <input
                            id={fieldId}
                            type="checkbox"
                            checked={value !== undefined ? value : config.default_value}
                            onChange={(e) => onChange(e.target.checked)}
                            className={styles.checkbox}
                        />
                        <label htmlFor={fieldId} className={styles.checkboxLabel}>
                            Sí
                        </label>
                    </div>
                );

            case "seleccion":
                return (
                    <select
                        id={fieldId}
                        value={value || config.default_value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        required={config.required}
                        className={styles.select}
                    >
                        <option value="" disabled>
                            {config.placeholder || "Seleccionar opción"}
                        </option>
                        {config.options?.map((option) => (
                            <option key={option} value={option} className={styles.selectOption}>
                                {option.replace(/_/g, " ").toUpperCase()}
                            </option>
                        ))}
                    </select>
                );

            default:
                return (
                    <input
                        id={fieldId}
                        type="text"
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={config.placeholder}
                        className={styles.input}
                    />
                );
        }
    }

    return (
        <div className={styles.fieldContainer}>
            <label htmlFor={fieldId} className={styles.label}>
                {fieldKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                {config.required && <span className={styles.required}>*</span>}
            </label>
            {renderField()}
        </div>
    )
}

export default FieldRenderer;