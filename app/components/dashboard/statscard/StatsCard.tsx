"use client"
import type React from "react"
import styles from "./statscard.module.css"

interface StatCard {
    title: string
    value: string | number
    change?: string
    changeType: "positive" | "negative" | "neutral" | string
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
                <div className={styles.iconContainer} style={{ backgroundColor: `${stat.color}15` }}>
                    <div style={{ color: stat.color }}>{stat.icon}</div>
                </div>
                {stat.change && (
                    <div className={`${styles.change} ${styles[stat.changeType || "neutral"]}`}>{stat.change}</div>
                )}
            </div>
            <div className={styles.cardContent}>
                <h3 className={styles.statValue}>{stat.value}</h3>
                <p className={styles.statTitle}>{stat.title}</p>
            </div>
        </div>
    )
}

export default StatsCard;
