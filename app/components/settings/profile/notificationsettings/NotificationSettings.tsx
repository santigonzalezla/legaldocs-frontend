"use client"
import { useState } from "react"
import styles from "./notificationsettings.module.css"
import {Mail, Monitor, Smartphone} from "@/app/components/svg";

interface NotificationSettings {
    email: {
        documentGenerated: boolean,
        documentShared: boolean,
        teamUpdates: boolean,
        systemUpdates: boolean,
        securityAlerts: boolean,
    }
    push: {
        documentGenerated: boolean,
        documentShared: boolean,
        teamUpdates: boolean,
        reminders: boolean,
    }
    desktop: {
        documentGenerated: boolean,
        documentShared: boolean,
        reminders: boolean,
    }
}

const NotificationSettings = () =>
{
    const [settings, setSettings] = useState<NotificationSettings>({
        email: {
            documentGenerated: true,
            documentShared: true,
            teamUpdates: false,
            systemUpdates: true,
            securityAlerts: true,
        },
        push: {
            documentGenerated: true,
            documentShared: false,
            teamUpdates: false,
            reminders: true,
        },
        desktop: {
            documentGenerated: false,
            documentShared: true,
            reminders: true,
        },
    });

    const [isSaving, setIsSaving] = useState(false);

    const getSettingValue = (category: keyof NotificationSettings, setting: string): boolean => {
        const categorySettings = settings[category];
        return (categorySettings as any)[setting] ?? false;
    };

    const handleToggle = (category: keyof NotificationSettings, setting: string) =>
    {
        setSettings((prev) => ({
            ...prev,
            [category]: {
                ...prev[category],
                [setting]: !prev[category][setting as keyof (typeof prev)[typeof category]],
            },
        }));
    }

    const handleSave = async () =>
    {
        setIsSaving(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsSaving(false);
        console.log("Configuración de notificaciones guardada:", settings);
    }

    const notificationTypes = [
        {
            key: "email" as const,
            title: "Notificaciones por Email",
            icon: <Mail />,
            description: "Recibe notificaciones en tu correo electrónico",
            options: [
                { key: "documentGenerated", label: "Documento generado" },
                { key: "documentShared", label: "Documento compartido" },
                { key: "teamUpdates", label: "Actualizaciones del equipo" },
                { key: "systemUpdates", label: "Actualizaciones del sistema" },
                { key: "securityAlerts", label: "Alertas de seguridad" },
            ],
        },
        {
            key: "push" as const,
            title: "Notificaciones Push",
            icon: <Smartphone />,
            description: "Notificaciones en tu dispositivo móvil",
            options: [
                { key: "documentGenerated", label: "Documento generado" },
                { key: "documentShared", label: "Documento compartido" },
                { key: "teamUpdates", label: "Actualizaciones del equipo" },
                { key: "reminders", label: "Recordatorios" },
            ],
        },
        {
            key: "desktop" as const,
            title: "Notificaciones de Escritorio",
            icon: <Monitor />,
            description: "Notificaciones en tu navegador web",
            options: [
                { key: "documentGenerated", label: "Documento generado" },
                { key: "documentShared", label: "Documento compartido" },
                { key: "reminders", label: "Recordatorios" },
            ],
        },
    ];


    return (
        <div className={styles.notificationSettings}>
            {notificationTypes.map((type) => (
                <div key={type.key} className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionTitle}>
                            {type.icon}
                            <div>
                                <h4>{type.title}</h4>
                                <p className={styles.sectionDescription}>{type.description}</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.optionsList}>
                        {type.options.map((option) => (
                            <div key={option.key} className={styles.optionItem}>
                                <div className={styles.optionInfo}>
                                    <span className={styles.optionLabel}>{option.label}</span>
                                </div>
                                <div className={styles.toggle}>
                                    <input
                                        type="checkbox"
                                        id={`${type.key}-${option.key}`}
                                        checked={getSettingValue(type.key, option.key)}
                                        onChange={() => handleToggle(type.key as keyof NotificationSettings, option.key)}
                                        className={styles.toggleInput}
                                    />
                                    <label htmlFor={`${type.key}-${option.key}`} className={styles.toggleLabel}>
                                        <span className={styles.toggleSlider}></span>
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <div className={styles.saveSection}>
                <button onClick={handleSave} disabled={isSaving} className={styles.saveButton}>
                    {isSaving ? "Guardando..." : "Guardar Configuración"}
                </button>
            </div>
        </div>
    )
}

export default NotificationSettings;