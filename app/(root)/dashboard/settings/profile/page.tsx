'use client';

import styles from './page.module.css';
import ProfileForm from "@/app/components/settings/profile/profileform/ProfileForm";
import { useState } from "react";
import SecuritySettings from "@/app/components/settings/profile/securitysettings/SecuritySettings";
import NotificationSettings from "@/app/components/settings/profile/notificationsettings/NotificationSettings";
import { User, Lock, Bell } from "@/app/components/svg";

const Profile = () =>
{
    const [activeTab, setActiveTab] = useState("profile")

    const tabs = [
        { id: "profile", label: "Información Personal", Icon: User, color: "#2563EB" },
        { id: "security", label: "Seguridad", Icon: Lock, color: "#059669" },
        { id: "notifications", label: "Notificaciones", Icon: Bell, color: "#D97706" },
    ];

    return (
        <div className={styles.profile}>
            <div className={styles.header}>
                <h1>Perfil</h1>
                <p>Actualiza tu información personal y preferencias de cuenta.</p>
            </div>
            <div className={styles.tabsContainer}>
                <div className={styles.tabsList}>
                    {tabs.map(({ id, label, Icon, color }) => (
                        <button
                            key={id}
                            className={`${styles.tabButton} ${activeTab === id ? styles.active : ""}`}
                            onClick={() => setActiveTab(id)}
                        >
                            <Icon className={styles.tabIcon} style={{ color }} />
                            <span className={styles.tabLabel}>{label}</span>
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