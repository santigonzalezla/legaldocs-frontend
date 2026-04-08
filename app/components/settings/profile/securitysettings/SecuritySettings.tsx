"use client"
import { useState } from "react"
import styles from "./securitysettings.module.css"
import {Eye, EyeOff, Key, Shield, Smartphone, Lock} from "@/app/components/svg";
import {useFetch} from "@/hooks/useFetch";
import {toast} from "sonner";

const SecuritySettings = () =>
{
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

    const {isLoading: isChangingPassword, execute: changePassword} = useFetch<{message: string}>(
        'user/me/password',
        {method: 'PATCH', immediate: false},
    );

    const handlePasswordChange = async () =>
    {
        if (newPassword !== confirmPassword)
        {
            toast.error("Las contraseñas nuevas no coinciden");
            return;
        }

        if (newPassword.length < 8)
        {
            toast.error("La nueva contraseña debe tener al menos 8 caracteres");
            return;
        }

        const result = await changePassword({body: {currentPassword, newPassword}});

        if (result)
        {
            toast.success("Contraseña actualizada correctamente");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        }
    }

    const togglePasswordVisibility = (field: keyof typeof showPasswords) =>
    {
        setShowPasswords((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    }

    const sessions = [
        {
            id: 1,
            device: "MacBook Pro",
            location: "Bogotá, Colombia",
            lastActive: "Activo ahora",
            current: true,
        },
        {
            id: 2,
            device: "iPhone 13",
            location: "Bogotá, Colombia",
            lastActive: "Hace 2 horas",
            current: false,
        },
        {
            id: 3,
            device: "Chrome - Windows",
            location: "Medellín, Colombia",
            lastActive: "Hace 1 día",
            current: false,
        },
    ]

    return (
        <div className={styles.securitySettings}>
            {/* Cambio de Contraseña */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div className={styles.sectionTitle}>
                        <Lock />
                        <h4>Cambiar Contraseña</h4>
                    </div>
                </div>

                <div className={styles.passwordForm}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Contraseña Actual</label>
                        <div className={styles.passwordInput}>
                            <input
                                type={showPasswords.current ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className={styles.input}
                                placeholder="Ingresa tu contraseña actual"
                            />
                            <button
                                type="button"
                                onClick={() => togglePasswordVisibility("current")}
                                className={styles.passwordToggle}
                            >
                                {showPasswords.current ? <EyeOff /> : <Eye />}
                            </button>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Nueva Contraseña</label>
                        <div className={styles.passwordInput}>
                            <input
                                type={showPasswords.new ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className={styles.input}
                                placeholder="Ingresa tu nueva contraseña"
                            />
                            <button type="button" onClick={() => togglePasswordVisibility("new")} className={styles.passwordToggle}>
                                {showPasswords.new ? <EyeOff /> : <Eye />}
                            </button>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Confirmar Nueva Contraseña</label>
                        <div className={styles.passwordInput}>
                            <input
                                type={showPasswords.confirm ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={styles.input}
                                placeholder="Confirma tu nueva contraseña"
                            />
                            <button
                                type="button"
                                onClick={() => togglePasswordVisibility("confirm")}
                                className={styles.passwordToggle}
                            >
                                {showPasswords.confirm ? <EyeOff /> : <Eye />}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handlePasswordChange}
                        disabled={!currentPassword || !newPassword || !confirmPassword || isChangingPassword}
                        className={styles.changePasswordButton}
                    >
                        {isChangingPassword ? "Cambiando..." : "Cambiar Contraseña"}
                    </button>
                </div>
            </div>

            {/* Autenticación de Dos Factores */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div className={styles.sectionTitle}>
                        <Shield />
                        <h4>Autenticación de Dos Factores</h4>
                    </div>
                    <div className={styles.toggle}>
                        <input
                            type="checkbox"
                            id="twoFactor"
                            checked={twoFactorEnabled}
                            onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                            className={styles.toggleInput}
                        />
                        <label htmlFor="twoFactor" className={styles.toggleLabel}>
                            <span className={styles.toggleSlider}></span>
                        </label>
                    </div>
                </div>

                <p className={styles.sectionDescription}>
                    Agrega una capa extra de seguridad a tu cuenta requiriendo un código de tu teléfono además de tu contraseña.
                </p>

                {twoFactorEnabled && (
                    <div className={styles.twoFactorSetup}>
                        <div className={styles.qrSection}>
                            <div className={styles.qrCode}>
                                <div className={styles.qrPlaceholder}>
                                    <Smartphone />
                                    <p>Código QR</p>
                                </div>
                            </div>
                            <div className={styles.qrInstructions}>
                                <h5>Configurar Autenticador</h5>
                                <ol>
                                    <li>Descarga una app autenticadora (Google Authenticator, Authy)</li>
                                    <li>Escanea el código QR con la app</li>
                                    <li>Ingresa el código de 6 dígitos generado</li>
                                </ol>
                            </div>
                        </div>
                        <div className={styles.verificationCode}>
                            <input type="text" placeholder="Código de verificación" className={styles.input} />
                            <button className={styles.verifyButton}>Verificar</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Sesiones Activas */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div className={styles.sectionTitle}>
                        <Key />
                        <h4>Sesiones Activas</h4>
                    </div>
                </div>

                <div className={styles.sessionsList}>
                    {sessions.map((session) => (
                        <div key={session.id} className={styles.sessionItem}>
                            <div className={styles.sessionInfo}>
                                <div className={styles.sessionDevice}>
                                    <strong>{session.device}</strong>
                                    {session.current && <span className={styles.currentBadge}>Actual</span>}
                                </div>
                                <div className={styles.sessionDetails}>
                                    <span>{session.location}</span>
                                    <span>•</span>
                                    <span>{session.lastActive}</span>
                                </div>
                            </div>
                            {!session.current && <button className={styles.revokeButton}>Cerrar Sesión</button>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default SecuritySettings;