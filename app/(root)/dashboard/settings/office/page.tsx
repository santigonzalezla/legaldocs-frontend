'use client';

import styles from './page.module.css';
import OfficeForm from "@/app/components/settings/office/officeform/OfficeForm";
import BillingSettings from "@/app/components/settings/office/billingsettings/BillingSettings";
import TeamManagement from "@/app/components/settings/office/teammanagement/TeamManagement";
import { useState } from "react";

const Office = () =>
{
    const [activeTab, setActiveTab] = useState("info");

    const tabs = [
        { id: "info", label: "Información del Despacho", icon: "🏢" },
        { id: "team", label: "Equipo", icon: "👥" },
        { id: "billing", label: "Facturación", icon: "💳" },
    ];

    return (
        <div className={styles.office}>
            <div className={styles.header}>
                <h1>Datos de la Firma</h1>
                <p>Configura la información de tu firma legal y gestiona tu equipo .</p>
            </div>
            <div className={styles.tabsContainer}>
                <div className={styles.tabsList}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ""}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span className={styles.tabIcon}>{tab.icon}</span>
                            <span className={styles.tabLabel}>{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className={styles.tabContent}>
                    {activeTab === "info" && <OfficeForm />}
                    {activeTab === "team" && <TeamManagement />}
                    {activeTab === "billing" && <BillingSettings />}
                </div>
            </div>
        </div>
    );
}

export default Office;