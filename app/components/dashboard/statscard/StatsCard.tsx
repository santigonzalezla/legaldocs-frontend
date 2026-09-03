"use client"
import type React from "react"
import styles from "./statscard.module.css"

interface StatCard {
    title: string
    value: string | number
    delta?: string
    deltaType?: "positive" | "negative" | "neutral" | string
    subtitle?: string
    icon: React.ReactNode
    color: string
}

interface StatsCardsProps {
    stat: StatCard
}

const StatsCard: React.FC<StatsCardsProps> = ({ stat }) =>
{
    return (
        <div className={styles.statCard}>
            <div className={styles.cardHeader}>
                <p className={styles.statTitle}>{stat.title}</p>
                <div className={styles.iconContainer} style={{ backgroundColor: `${stat.color}15` }}>
                    <div style={{ color: stat.color }}>{stat.icon}</div>
                </div>
            </div>

            <div className={styles.valueRow}>
                <h3 className={styles.statValue}>{stat.value}</h3>
                {stat.delta && (
                    <span className={`${styles.delta} ${styles[stat.deltaType || "neutral"]}`}>{stat.delta}</span>
                )}
            </div>

            {stat.subtitle && <p className={styles.statSub}>{stat.subtitle}</p>}
        </div>
    )
}

export default StatsCard;
