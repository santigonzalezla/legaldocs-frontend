"use client"
import type React from "react"
import styles from "./statscard.module.css"

interface StatsCard {
    title: string
    value: number
    icon: React.ReactNode
    color: string
    bgColor: string
}

interface StatsCardProps {
    statCrad: StatsCard
}

const StatsCard: React.FC<StatsCardProps> = ({ statCrad }) =>
{
    return (
        <div className={styles.statCard}>
            <div className={styles.cardHeader}>
                <div className={styles.iconContainer} style={{ backgroundColor: `${statCrad.color}15` }}>
                    <div style={{ color: statCrad.color }}>{statCrad.icon}</div>
                </div>
                <div className={styles.cardContent}>
                    <h3 className={styles.statValue}>{statCrad.value}</h3>
                    <p className={styles.statTitle}>{statCrad.title}</p>
                </div>
            </div>
        </div>
    )
}

export default StatsCard;
