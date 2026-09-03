"use client"
import type React from "react"
import {useRouter} from "next/navigation"
import styles from "./legalupdates.module.css"
import {Bell, Calendar, ExternalLink} from "@/app/components/svg"
import type {LegalUpdate} from "@/app/interfaces/interfaces"
import {LEGAL_UPDATE_TYPE_COLORS, LEGAL_UPDATE_TYPE_LABELS, LegalUpdateType} from "@/app/interfaces/enums"
import {formatRelativeTime} from "@/lib/format"

interface LegalUpdatesProps
{
    updates: LegalUpdate[]
    maxItems?: number
}

const LegalUpdates: React.FC<LegalUpdatesProps> = ({updates, maxItems}) =>
{
    const router = useRouter();
    const limited = maxItems ? updates.slice(0, maxItems) : updates;

    const openSource = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <Bell/>
                    <h3 className={styles.title}>Actualizaciones Legales</h3>
                </div>
                <button className={styles.viewAllButton} onClick={() => router.push("/dashboard/resources/updates")}>
                    Ver todas
                </button>
            </div>

            <div className={styles.updatesList}>
                {limited.length === 0 && (
                    <p className={styles.emptyState}>Aún no hay actualizaciones.</p>
                )}

                {limited.map((update) =>
                {
                    const badge = LEGAL_UPDATE_TYPE_COLORS[update.type] ?? LEGAL_UPDATE_TYPE_COLORS[LegalUpdateType.OTHER];
                    const label = LEGAL_UPDATE_TYPE_LABELS[update.type] ?? LEGAL_UPDATE_TYPE_LABELS[LegalUpdateType.OTHER];

                    return (
                        <div key={update.id} className={styles.updateItem} onClick={() => openSource(update.url)}>
                            <div className={styles.updateHeader}>
                                <span className={styles.typeBadge} style={{backgroundColor: badge.bg, color: badge.color}}>
                                    {label}
                                </span>
                                <span className={styles.updateDate}>
                                    <Calendar/>
                                    {formatRelativeTime(update.publishedAt)}
                                </span>
                            </div>

                            <div className={styles.updateContent}>
                                <h4 className={styles.updateTitle}>{update.title}</h4>
                                {update.summary && <p className={styles.updateSummary}>{update.summary}</p>}
                            </div>

                            <div className={styles.updateFooter}>
                                <span className={styles.updateSource}>Fuente: {update.sourceLabel}</span>
                                <span className={styles.readMoreButton}>
                                    <span>Leer en la fuente</span>
                                    <ExternalLink/>
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}

export default LegalUpdates
