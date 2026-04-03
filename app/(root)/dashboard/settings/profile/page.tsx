'use client';

import styles from './page.module.css';
import ProfileForm from "@/app/components/settings/profile/profileform/ProfileForm";
import { useState } from "react";
import SecuritySettings from "@/app/components/settings/profile/securitysettings/SecuritySettings";
import NotificationSettings from "@/app/components/settings/profile/notificationsettings/NotificationSettings";

const Profile = () =>
{
    const [activeTab, setActiveTab] = useState("profile")

    const tabs = [
        { id: "profile", label: "Información Personal", icon: "👤" },
        { id: "security", label: "Seguridad", icon: "🔒" },
        { id: "notifications", label: "Notificaciones", icon: "🔔" },
    ];

    return (
        <div className={styles.profile}>
            <div className={styles.header}>
                <h1>Perfil</h1>
                <p>Actualiza tu información personal y preferencias de cuenta.</p>
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
                    {activeTab === "profile" && <ProfileForm />}
                    {activeTab === "security" && <SecuritySettings />}
                    {activeTab === "notifications" && <NotificationSettings />}
                </div>
            </div>
        </div>
    );
}

export default Profile;