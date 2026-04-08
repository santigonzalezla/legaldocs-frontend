"use client"
import {useEffect, useState} from "react"
import styles from "./notificationsettings.module.css"
import {Mail, Monitor} from "@/app/components/svg";
import {useFetch} from "@/hooks/useFetch";
import {toast} from "sonner";
import {NotificationPreferences} from "@/app/interfaces/interfaces";

type NotificationPrefs = Pick<NotificationPreferences,
    'emailNewDocument' | 'emailDocumentShared' | 'emailTemplateUpdated' |
    'emailTeamInvite'  | 'emailBilling'        | 'emailLegalUpdates'    |
    'inAppNewDocument' | 'inAppDocumentShared'  | 'inAppTeamActivity'    | 'inAppBilling'
>;

const defaults: NotificationPrefs = {
    emailNewDocument:     true,
    emailDocumentShared:  true,
    emailTemplateUpdated: false,
    emailTeamInvite:      true,
    emailBilling:         true,
    emailLegalUpdates:    false,
    inAppNewDocument:     true,
    inAppDocumentShared:  true,
    inAppTeamActivity:    false,
    inAppBilling:         true,
};

const notificationGroups = [
    {
        key:         'email',
        title:       'Notificaciones por Email',
        icon:        <Mail />,
        description: 'Recibe notificaciones en tu correo electrónico',
        options: [
            {key: 'emailNewDocument'     as keyof NotificationPrefs, label: 'Documento generado'},
            {key: 'emailDocumentShared'  as keyof NotificationPrefs, label: 'Documento compartido'},
            {key: 'emailTemplateUpdated' as keyof NotificationPrefs, label: 'Actualización de plantillas'},
            {key: 'emailTeamInvite'      as keyof NotificationPrefs, label: 'Invitaciones al equipo'},
            {key: 'emailBilling'         as keyof NotificationPrefs, label: 'Facturación y suscripción'},
            {key: 'emailLegalUpdates'    as keyof NotificationPrefs, label: 'Actualizaciones normativas'},
        ],
    },
    {
        key:         'inApp',
        title:       'Notificaciones en la Aplicación',
        icon:        <Monitor />,
        description: 'Notificaciones dentro del dashboard',
        options: [
            {key: 'inAppNewDocument'    as keyof NotificationPrefs, label: 'Documento generado'},
            {key: 'inAppDocumentShared' as keyof NotificationPrefs, label: 'Documento compartido'},
            {key: 'inAppTeamActivity'   as keyof NotificationPrefs, label: 'Actividad del equipo'},
            {key: 'inAppBilling'        as keyof NotificationPrefs, label: 'Facturación y suscripción'},
        ],
    },
];

const NotificationSettings = () =>
{
    const [prefs, setPrefs] = useState<NotificationPrefs>(defaults);

    const {data, isLoading: isLoadingPrefs} = useFetch<NotificationPreferences>(
        'user/me/notification-preferences',
    );

    const {isLoading: isSaving, execute: savePrefs} = useFetch<NotificationPreferences>(
        'user/me/notification-preferences',
        {method: 'PATCH', immediate: false},
    );

    useEffect(() =>
    {
        if (data)
        {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const {id, userId, createdAt, updatedAt, ...booleans} = data;
            setPrefs(booleans);
        }
    }, [data]);

    const handleToggle = (key: keyof NotificationPrefs) =>
    {
        setPrefs(prev => ({...prev, [key]: !prev[key]}));
    };

    const handleSave = async () =>
    {
        const result = await savePrefs({body: prefs});
        if (result) toast.success('Preferencias de notificaciones guardadas');
    };

    return (
        <div className={styles.notificationSettings}>
            {notificationGroups.map((group) => (
                <div key={group.key} className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionTitle}>
                            {group.icon}
                            <div>
                                <h4>{group.title}</h4>
                                <p className={styles.sectionDescription}>{group.description}</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.optionsList}>
                        {group.options.map((option) => (
                            <div key={option.key} className={styles.optionItem}>
                                <div className={styles.optionInfo}>
                                    <span className={styles.optionLabel}>{option.label}</span>
                                </div>
                                <div className={styles.toggle}>
                                    <input
                                        type="checkbox"
                                        id={option.key}
                                        checked={prefs[option.key]}
                                        onChange={() => handleToggle(option.key)}
                                        className={styles.toggleInput}
                                    />
                                    <label htmlFor={option.key} className={styles.toggleLabel}>
                                        <span className={styles.toggleSlider}></span>
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <div className={styles.saveSection}>
                <button
                    onClick={handleSave}
                    disabled={isSaving || isLoadingPrefs}
                    className={styles.saveButton}
                >
                    {isSaving ? 'Guardando...' : 'Guardar Configuración'}
                </button>
            </div>
        </div>
    );
};

export default NotificationSettings;
