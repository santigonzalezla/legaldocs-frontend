"use client"

import type React from "react"

import { useState } from "react"
import styles from "./addcategorymodal.module.css"
import {Plus} from "@/app/components/svg";

interface AddCategoryModalProps {
    onAddCategory: (categoryName: string, description: string) => void
}

const AddCategoryModal = ({ onAddCategory }: AddCategoryModalProps) =>
{
    const [open, setOpen] = useState(false)
    const [categoryName, setCategoryName] = useState("")
    const [description, setDescription] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!categoryName.trim()) return

        onAddCategory(categoryName.toLowerCase().replace(/\s+/g, "_"), description)

        // Reset form
        setCategoryName("")
        setDescription("")
        setOpen(false)
    }

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            setOpen(false)
        }
    }

    return (
        <div className={styles.container}>
            <button type="button" className={styles.triggerButton} onClick={() => setOpen(true)}>
                <Plus className={styles.triggerIcon} />
                Agregar Nueva Categoría
            </button>

            {open && (
                <div className={styles.overlay} onClick={handleOverlayClick}>
                    <div className={styles.modal}>
                        <div className={styles.header}>
                            <h2 className={styles.title}>Agregar Nueva Categoría</h2>
                        </div>
                        <div className={styles.content}>
                            <form onSubmit={handleSubmit} className={styles.form}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="categoryName" className={styles.label}>
                                        Nombre de la Categoría
                                    </label>
                                    <input
                                        id="categoryName"
                                        type="text"
                                        value={categoryName}
                                        onChange={(e) => setCategoryName(e.target.value)}
                                        placeholder="Ej: Información Adicional"
                                        required
                                        className={styles.input}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="description" className={styles.label}>
                                        Descripción (opcional)
                                    </label>
                                    <textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Descripción de la categoría..."
                                        rows={3}
                                        className={styles.textarea}
                                    />
                                </div>

                                <div className={styles.buttonGroup}>
                                    <button type="button" className={styles.buttonOutline} onClick={() => setOpen(false)}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className={styles.buttonPrimary}>
                                        Agregar Categoría
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

export default AddCategoryModal;