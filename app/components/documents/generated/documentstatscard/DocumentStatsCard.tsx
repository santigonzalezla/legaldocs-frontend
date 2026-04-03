"use client"
import type React from "react"
import styles from "./documentstats.module.css"

interface DocumentStatsCard {
    title: string
    value: number
    percentage?: number | null
    icon: React.ReactNode
    color: string
    bgColor: string
}

interface DocumentStatsCardProps {
    documentStat: DocumentStatsCard
}

const DocumentStatsCard: React.FC<DocumentStatsCardProps> = ({ documentStat }) =>
{
    return (
        <div className={styles.statCard}>
            <div className={styles.cardHeader}>
                <div className={styles.iconContainer} style={{ backgroundColor: `${documentStat.color}15` }}>
                    <div style={{ color: documentStat.color }}>{documentStat.icon}</div>
                </div>
                {documentStat.percentage && (
                    <div className={styles.percentage}  style={{ color: `${documentStat.color}`, backgroundColor: `${documentStat.color}15` }}>{documentStat.percentage}%</div>
                )}
            </div>
            <div className={styles.cardContent}>
                <h3 className={styles.statValue}>{documentStat.value}</h3>
                <p className={styles.statTitle}>{documentStat.title}</p>
            </div>
        </div>
    )
}

export default DocumentStatsCard
