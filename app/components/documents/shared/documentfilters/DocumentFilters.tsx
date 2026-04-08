"use client"
import type React from "react"
import styles from "./documentfilters.module.css"
import {Grid, List, Search} from "@/app/components/svg";

interface DocumentFiltersProps {
    searchTerm?: string
    onSearchChange?: (term: string) => void
    selectedStatus?: string
    onStatusChange?: (status: string) => void
    selectedType?: string
    onTypeChange?: (type: string) => void
    selectedExtra?: string
    onExtraChange?: (value: string) => void
    extraOptions?: Array<{ value: string; label: string }>
    viewMode?: "grid" | "table"
    onViewModeChange?: (mode: "grid" | "table") => void
    statusOptions: Array<{ value: string; label: string }>
    typeOptions?: Array<{ value: string; label: string }>
}

const defaultTypeOptions = [{value: "all", label: "Todos los tipos"}];

const DocumentFilters: React.FC<DocumentFiltersProps> = ({ searchTerm, onSearchChange, selectedStatus, onStatusChange, selectedType, onTypeChange, selectedExtra, onExtraChange, extraOptions, viewMode, onViewModeChange, statusOptions, typeOptions }) =>
{
    return (
        <div className={styles.filtersContainer}>
            <div className={styles.filtersContent}>
                {/* Search Bar */}
                <div className={styles.searchSection}>
                    <div className={styles.searchInputWrapper}>
                        <Search />
                        <input
                            type="text"
                            placeholder="Buscar documentos..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange?.(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                </div>

                {/* Filters */}
                <div className={styles.filtersSection}>
                    <div className={styles.filterGroup}>
                        <select
                            value={selectedStatus}
                            onChange={(e) => onStatusChange?.(e.target.value)}
                            className={styles.filterSelect}
                        >
                            {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <select
                            value={selectedType}
                            onChange={(e) => onTypeChange?.(e.target.value)}
                            className={styles.filterSelect}
                        >
                            {(typeOptions ?? defaultTypeOptions).map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {extraOptions && (
                        <div className={styles.filterGroup}>
                            <select
                                value={selectedExtra}
                                onChange={(e) => onExtraChange?.(e.target.value)}
                                className={styles.filterSelect}
                            >
                                {extraOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* View Mode Toggle */}
                { viewMode && onViewModeChange && (
                    <div className={styles.viewModeSection}>
                        <div className={styles.viewModeToggle}>
                            <button
                                className={`${styles.viewModeButton} ${viewMode === "grid" ? styles.active : ""}`}
                                onClick={() => onViewModeChange?.("grid")}
                                title="Vista de cuadrícula"
                            >
                                <Grid />
                            </button>
                            <button
                                className={`${styles.viewModeButton} ${viewMode === "table" ? styles.active : ""}`}
                                onClick={() => onViewModeChange?.("table")}
                                title="Vista de tabla"
                            >
                                <List />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default DocumentFilters
