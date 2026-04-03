"use client"
import type React from "react"
import styles from "./legalupdates.module.css"
import {Bell, Calendar, ExternalLink} from "@/app/components/svg";

interface LegalUpdate {
    id: string
    title: string
    summary: string
    date: string
    category: string
    priority: "high" | "medium" | "low" | string
    source: string
    url?: string
}

interface LegalUpdatesProps {
    updates: LegalUpdate[]
    maxItems?: number
    showPriority?: boolean
}

const LegalUpdates: React.FC<LegalUpdatesProps> = ({ updates, maxItems, showPriority }) =>
{
    const limitedUpdates = updates.slice(0, maxItems);

    const getPriorityColor = (priority: string) =>
    {
        switch (priority)
        {
            case "high":
                return "#EF4444";
            case "medium":
                return "#F59E0B";
            case "low":
                return "#10B981";
            default:
                return "#6B7280";
        }
    }

    const getPriorityText = (priority: string) =>
    {
        switch (priority)
        {
            case "high":
                return "Alta";
            case "medium":
                return "Media";
            case "low":
                return "Baja";
            default:
                return "Normal";
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
                <div className={styles.titleSection}>
                    <Bell/>
                    <h3 className={styles.title}>Actualizaciones Legales</h3>
                </div>
                <button className={styles.viewAllButton}>Ver todas</button>
            </div>

            <div className={styles.updatesList}>
                {limitedUpdates.map((update) => (
                    <div key={update.id} className={styles.updateItem}>
                        <div className={styles.updateHeader}>
                            <div className={styles.updateMeta}>
                                <span className={styles.updateCategory}>{update.category}</span>
                                <span className={styles.updateDate}>
                                    <Calendar/>
                                    {formatDate(update.date)}
                                </span>
                            </div>
                            {showPriority && (
                                <div className={styles.priorityBadge} style={{backgroundColor: `${getPriorityColor(update.priority)}15`}}>
                                    <span
                                        style={{color: getPriorityColor(update.priority)}}>{getPriorityText(update.priority)}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className={styles.updateContent}>
                            <h4 className={styles.updateTitle}>{update.title}</h4>
                            <p className={styles.updateSummary}>{update.summary}</p>
                        </div>

                        <div className={styles.updateFooter}>
                            <span className={styles.updateSource}>Fuente: {update.source}</span>
                            {update.url && (
                                <button className={styles.readMoreButton}>
                                    <span>Leer más</span>
                                    <ExternalLink />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default LegalUpdates
