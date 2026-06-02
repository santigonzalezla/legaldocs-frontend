"use client"
import styles from "./sidebaroption.module.css"
import type React from "react"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import {ArrowDown, ArrowGo} from "@/app/components/svg";

const toTitleCase = (str: string) =>
    str.toLowerCase().replace(/(?:^|\s)\S/g, c => c.toUpperCase());

const MarqueeText = ({text, className, wrapClass}: {text: string; className: string; wrapClass: string}) =>
{
    const spanRef = useRef<HTMLSpanElement>(null);
    const wrapRef = useRef<HTMLSpanElement>(null);
    const [overflows, setOverflows] = useState(false);

    useEffect(() =>
    {
        const el = spanRef.current;
        const wrap = wrapRef.current;
        if (!el || !wrap) return;
        // Observe the wrapper — not the inner span — so that applying .marquee
        // (which makes the inner span expand to text width) doesn't re-trigger
        // the check and immediately remove the class.
        const check = () => setOverflows(el.scrollWidth > wrap.offsetWidth + 1);
        check();
        const ro = new ResizeObserver(check);
        ro.observe(wrap);
        return () => ro.disconnect();
    }, [text]);

    return (
        <span ref={wrapRef} className={wrapClass} title={text}>
            <span
                ref={spanRef}
                className={`${className}${overflows ? ' ' + styles.marquee : ''}`}
            >
                {text}
            </span>
        </span>
    );
};

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
                        {!isCollapsed && <MarqueeText text={toTitleCase(item)} className={styles.text} wrapClass={styles.textWrap} />}
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
                                <MarqueeText text={toTitleCase(suboption.item)} className={styles.suboptionText} wrapClass={styles.suboptionTextWrap} />
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
            {!isCollapsed && <MarqueeText text={toTitleCase(item)} className={styles.text} wrapClass={styles.textWrap} />}
        </Link>
    )
}

export default SidebarOption
