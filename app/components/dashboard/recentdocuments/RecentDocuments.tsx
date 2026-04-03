"use client"

import type React from "react"
import styles from "./recentdocuments.module.css"
import {Download, Eye, MoreHorizontal, File} from "@/app/components/svg";

interface Document {
    id: string;
    name: string;
    type: string;
    createdAt: string;
    size: string;
    status: "completed" | "drafts" | "processing" | string;
}

interface RecentDocumentsProps {
    documents: Document[];
    maxItems?: number;
    showActions?: boolean;
}

const RecentDocuments: React.FC<RecentDocumentsProps> = ({ documents, maxItems, showActions }) =>
{
    const limitedDocuments = documents.slice(0, maxItems);

    const getStatusColor = (status: string) =>
    {
        switch (status)
        {
            case "completed":
                return "#10b981";
            case "drafts":
                return "#f59e0b";
            case "processing":
                return "#3b82f6";
            default:
                return "#6b7280";
        }
    }

    const getStatusText = (status: string) =>
    {
        switch (status)
        {
            case "completed":
                return "Completado";
            case "drafts":
                return "Borrador";
            case "processing":
                return "Procesando";
            default:
                return "Desconocido";
        }
    }

    const formatDate = (dateString: string) =>
    {
        const date = new Date(dateString);

        return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>Documentos Recientes</h3>
                <button className={styles.viewAllButton}>Ver todos</button>
            </div>

            <div className={styles.documentsList}>
                {limitedDocuments.map((document) => (
                    <div key={document.id} className={styles.documentItem}>
                        <div className={styles.documentIcon}>
                            <File />
                        </div>

                        <div className={styles.documentInfo}>
                            <h4 className={styles.documentName}>{document.name}</h4>
                            <div className={styles.documentMeta}>
                                <span className={styles.documentType}>{document.type}</span>
                                <span className={styles.documentDate}>{formatDate(document.createdAt)}</span>
                                <span className={styles.documentSize}>{document.size}</span>
                            </div>
                        </div>

                        <div className={styles.documentStatus}>
                            <span className={styles.statusBadge} style={{ backgroundColor: `${getStatusColor(document.status)}15` }}>
                                <span style={{ color: getStatusColor(document.status) }}>{getStatusText(document.status)}</span>
                            </span>
                        </div>

                        {showActions && (
                            <div className={styles.documentActions}>
                                <button className={styles.actionButton} title="Ver documento">
                                    <Eye />
                                </button>
                                <button className={styles.actionButton} title="Descargar">
                                    <Download />
                                </button>
                                <button className={styles.actionButton} title="Más opciones">
                                    <MoreHorizontal />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default RecentDocuments
