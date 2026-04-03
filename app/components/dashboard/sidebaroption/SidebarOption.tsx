"use client"
import styles from "./sidebaroption.module.css"
import type React from "react"
import Link from "next/link"
import { useState } from "react"
import {ArrowDown, ArrowGo} from "@/app/components/svg";

interface SubOption {
    item: string
    link: string
}

interface SidebarOptionProps {
    item: string
    icon: React.ReactNode
    link: string
    isCollapsed: boolean
    suboptions?: SubOption[]
    category?: string
    isExpanded?: boolean
    onToggle?: () => void
}

const SidebarOption: React.FC<SidebarOptionProps> = ({ item, icon, link, isCollapsed, suboptions, category, isExpanded = false, onToggle }) =>
{
    const handleToggle = () =>
    {
        if (suboptions && suboptions.length > 0 && !isCollapsed && onToggle) onToggle();
    }

    if (suboptions && suboptions.length > 0)
    {
        return (
            <div className={styles.expandableOption}>
                <div
                    className={`${styles.option} ${isExpanded ? styles.expanded : ""}`}
                    data-category={category}
                >
                    <Link href={link} className={styles.optionLink}>
                        <div className={styles.iconContainer}>{icon}</div>
                        {!isCollapsed && <span className={styles.text}>{item}</span>}
                    </Link>
                    {!isCollapsed && (
                        <div className={styles.chevron} onClick={handleToggle}>
                            {isExpanded ? <ArrowDown size={14} /> : <ArrowGo size={14} />}
                        </div>
                    )}
                </div>

                {!isCollapsed && (
                    <div className={`${styles.suboptions} ${isExpanded ? styles.suboptionsExpanded : styles.suboptionsCollapsed}`}>
                        {suboptions.map((suboption, index) => (
                            <Link key={index} href={suboption.link} className={styles.suboption}>
                                <div className={styles.suboptionDot}></div>
                                <span className={styles.suboptionText}>{suboption.item}</span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <Link href={link} className={styles.option} data-category={category}>
            <div className={styles.iconContainer}>{icon}</div>
            {!isCollapsed && <span className={styles.text}>{item}</span>}
        </Link>
    )
}

export default SidebarOption
