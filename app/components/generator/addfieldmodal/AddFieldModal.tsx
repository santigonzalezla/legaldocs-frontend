"use client"

import type React from "react"

import { useState } from "react"
import styles from "./addfieldmodal.module.css"
import {FieldConfig} from "@/app/interfaces/types/formtypes";
import {Plus} from "@/app/components/svg";

interface AddFieldModalProps {
    onAddField: (fieldName: string, config: FieldConfig) => void
}

const AddFieldModal = ({ onAddField }: AddFieldModalProps) =>
{
    const [open, setOpen] = useState(false);
    const [fieldName, setFieldName] = useState("");
    const [fieldType, setFieldType] = useState<FieldConfig["type"]>("texto");
    const [required, setRequired] = useState(false);
    const [placeholder, setPlaceholder] = useState("");
    const [options, setOptions] = useState("");

    const handleSubmit = (e: React.FormEvent) =>
    {
        e.preventDefault();

        if (!fieldName.trim()) return;

        const config: FieldConfig = {
            type: fieldType,
            required,
            placeholder: placeholder || undefined,
        }

        if (fieldType === "seleccion" && options.trim())
        {
            config.options = options.split(",").map((opt) => opt.trim());
        }

        onAddField(fieldName.toLowerCase().replace(/\s+/g, "_"), config);

        // Reset form
        setFieldName("");
        setFieldType("texto");
        setRequired(false);
        setPlaceholder("");
        setOptions("");
        setOpen(false);
    }

    const handleOverlayClick = (e: React.MouseEvent) =>
    {
        if (e.target === e.currentTarget) setOpen(false);
    }

    return (
        <div className={styles.container}>
            <button type="button" className={styles.triggerButton} onClick={() => setOpen(true)}>
                <Plus className={styles.triggerIcon} />
                Agregar Campo
            </button>

            {open && (
                <div className={styles.overlay} onClick={handleOverlayClick}>
                    <div className={styles.modal}>
                        <div className={styles.header}>
                            <h2 className={styles.title}>Agregar Nuevo Campo</h2>
                        </div>
                        <div className={styles.content}>
                            <form onSubmit={handleSubmit} className={styles.form}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="fieldName" className={styles.label}>
                                        Nombre del Campo
                                    </label>
                                    <input
                                        id="fieldName"
                                        type="text"
                                        value={fieldName}
                                        onChange={(e) => setFieldName(e.target.value)}
                                        placeholder="Ej: Número de teléfono"
                                        required
                                        className={styles.input}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="fieldType" className={styles.label}>
                                        Tipo de Campo
                                    </label>
                                    <select
                                        id="fieldType"
                                        value={fieldType}
                                        onChange={(e) => setFieldType(e.target.value as FieldConfig["type"])}
                                        className={styles.select}
                                    >
                                        <option value="texto">Texto</option>
                                        <option value="email">Email</option>
                                        <option value="numero">Número</option>
                                        <option value="fecha">Fecha</option>
                                        <option value="booleano">Sí/No</option>
                                        <option value="seleccion">Selección</option>
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="placeholder" className={styles.label}>
                                        Placeholder (opcional)
                                    </label>
                                    <input
                                        id="placeholder"
                                        type="text"
                                        value={placeholder}
                                        onChange={(e) => setPlaceholder(e.target.value)}
                                        placeholder="Texto de ayuda para el usuario"
                                        className={styles.input}
                                    />
                                </div>

                                {fieldType === "seleccion" && (
                                    <div className={styles.formGroup}>
                                        <label htmlFor="options" className={styles.label}>
                                            Opciones (separadas por comas)
                                        </label>
                                        <input
                                            id="options"
                                            type="text"
                                            value={options}
                                            onChange={(e) => setOptions(e.target.value)}
                                            placeholder="opcion1, opcion2, opcion3"
                                            className={styles.input}
                                        />
                                    </div>
                                )}

                                <div className={styles.checkboxGroup}>
                                    <input
                                        id="required"
                                        type="checkbox"
                                        checked={required}
                                        onChange={(e) => setRequired(e.target.checked)}
                                        className={styles.checkbox}
                                    />
                                    <label htmlFor="required" className={styles.checkboxLabel}>
                                        Campo obligatorio
                                    </label>
                                </div>

                                <div className={styles.buttonGroup}>
                                    <button type="button" className={styles.buttonOutline} onClick={() => setOpen(false)}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className={styles.buttonPrimary}>
                                        Agregar Campo
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default  AddFieldModal;