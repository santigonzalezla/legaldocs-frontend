"use client";

import { useState } from "react";
import styles from "./billingsettings.module.css";
import {Calendar, Card, Download, DollarSign, File} from "@/app/components/svg";

interface BillingInfo {
    companyName: string,
    taxId: string,
    address: string,
    city: string,
    country: string,
    paymentMethod: "card" | "bank" | "paypal" | string
    cardLast4?: string,
    cardBrand?: string,
    autoRenewal: boolean
}

interface Invoice {
    id: string,
    date: string,
    amount: number,
    status: "paid" | "pending" | "overdue" | string,
    description: string,
    downloadUrl: string,
}

const BillingSettings = () =>
{
    const [billingInfo, setBillingInfo] = useState<BillingInfo>({
        companyName: "Pérez García & Asociados S.A.S.",
        taxId: "900.123.456-7",
        address: "Carrera 15 #93-47, Oficina 501",
        city: "Bogotá",
        country: "Colombia",
        paymentMethod: "card",
        cardLast4: "4242",
        cardBrand: "Visa",
        autoRenewal: true,
    });

    const [invoices] = useState<Invoice[]>([
        {
            id: "INV-2024-001",
            date: "2024-01-01",
            amount: 299000,
            status: "paid",
            description: "Plan Profesional - Enero 2024",
            downloadUrl: "#",
        },
        {
            id: "INV-2023-012",
            date: "2023-12-01",
            amount: 299000,
            status: "paid",
            description: "Plan Profesional - Diciembre 2023",
            downloadUrl: "#",
        },
        {
            id: "INV-2023-011",
            date: "2023-11-01",
            amount: 299000,
            status: "paid",
            description: "Plan Profesional - Noviembre 2023",
            downloadUrl: "#",
        },
    ]);

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleInputChange = (field: keyof BillingInfo, value: string | boolean) =>
    {
        setBillingInfo((prev) => ({
            ...prev,
            [field]: value,
        }));
    }

    const handleSave = async () =>
    {
        setIsSaving(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsSaving(false);
        setIsEditing(false);
        console.log("Información de facturación guardada:", billingInfo);
    }

    const formatCurrency = (amount: number) =>
    {
        return new Intl.NumberFormat("es-CO", {style: "currency", currency: "COP",}).format(amount);
    }

    const formatDate = (dateString: string) =>
    {
        const date = new Date(dateString);

        return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
    }

    const getStatusColor = (status: string) =>
    {
        switch (status)
        {
            case "paid":
                return "#10b981";
            case "pending":
                return "#f59e0b";
            case "overdue":
                return "#ef4444";
            default:
                return "#6b7280";
        }
    }

    const getStatusLabel = (status: string) =>
    {
        switch (status)
        {
            case "paid":
                return "Pagada";
            case "pending":
                return "Pendiente";
            case "overdue":
                return "Vencida";
            default:
                return "Desconocido";
        }
    }

    const currentPlan = {
        name: "Plan Profesional",
        price: 299000,
        period: "mensual",
        features: [
            "Documentos ilimitados",
            "5 usuarios incluidos",
            "Firmas digitales",
            "Soporte prioritario",
            "Plantillas personalizadas",
        ],
    }

    return (
        <div className={styles.billingSettings}>
            {/* Plan Actual */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div className={styles.sectionTitle}>
                        <DollarSign />
                        <h4>Plan Actual</h4>
                    </div>
                </div>

                <div className={styles.planCard}>
                    <div className={styles.planInfo}>
                        <h5 className={styles.planName}>{currentPlan.name}</h5>
                        <div className={styles.planPrice}>
                            {formatCurrency(currentPlan.price)}
                            <span className={styles.planPeriod}>/{currentPlan.period}</span>
                        </div>
                    </div>
                    <div className={styles.planFeatures}>
                        {currentPlan.features.map((feature, index) => (
                            <div key={index} className={styles.feature}>
                                ✓ {feature}
                            </div>
                        ))}
                    </div>
                    <div className={styles.planActions}>
                        <button className={styles.upgradeButton}>Cambiar Plan</button>
                        <button className={styles.cancelButton}>Cancelar Suscripción</button>
                    </div>
                </div>
            </div>

            {/* Información de Facturación */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div className={styles.sectionTitle}>
                        <File />
                        <h4>Información de Facturación</h4>
                    </div>
                    {!isEditing ? (
                        <button className={styles.editButton} onClick={() => setIsEditing(true)}>
                            Editar
                        </button>
                    ) : (
                        <div className={styles.actionButtons}>
                            <button className={styles.cancelEditButton} onClick={() => setIsEditing(false)}>
                                Cancelar
                            </button>
                            <button className={styles.saveButton} onClick={handleSave} disabled={isSaving}>
                                {isSaving ? "Guardando..." : "Guardar"}
                            </button>
                        </div>
                    )}
                </div>

                <div className={styles.billingForm}>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Nombre de la Empresa</label>
                            <input
                                type="text"
                                value={billingInfo.companyName}
                                onChange={(e) => handleInputChange("companyName", e.target.value)}
                                disabled={!isEditing}
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>NIT / RUT</label>
                            <input
                                type="text"
                                value={billingInfo.taxId}
                                onChange={(e) => handleInputChange("taxId", e.target.value)}
                                disabled={!isEditing}
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.formGroupFull}>
                            <label className={styles.label}>Dirección</label>
                            <input
                                type="text"
                                value={billingInfo.address}
                                onChange={(e) => handleInputChange("address", e.target.value)}
                                disabled={!isEditing}
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Ciudad</label>
                            <input
                                type="text"
                                value={billingInfo.city}
                                onChange={(e) => handleInputChange("city", e.target.value)}
                                disabled={!isEditing}
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>País</label>
                            <select
                                value={billingInfo.country}
                                onChange={(e) => handleInputChange("country", e.target.value)}
                                disabled={!isEditing}
                                className={styles.input}
                            >
                                <option value="Colombia">Colombia</option>
                                <option value="México">México</option>
                                <option value="Argentina">Argentina</option>
                                <option value="Chile">Chile</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Método de Pago */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div className={styles.sectionTitle}>
                        <Card />
                        <h4>Método de Pago</h4>
                    </div>
                    <button className={styles.editButton}>Cambiar</button>
                </div>

                <div className={styles.paymentMethod}>
                    <div className={styles.paymentCard}>
                        <div className={styles.cardInfo}>
                            <div className={styles.cardBrand}>{billingInfo.cardBrand}</div>
                            <div className={styles.cardNumber}>•••• •••• •••• {billingInfo.cardLast4}</div>
                        </div>
                        <div className={styles.cardActions}>
                            <button className={styles.updateCardButton}>Actualizar Tarjeta</button>
                        </div>
                    </div>

                    <div className={styles.autoRenewal}>
                        <div className={styles.toggle}>
                            <input
                                type="checkbox"
                                id="autoRenewal"
                                checked={billingInfo.autoRenewal}
                                onChange={(e) => handleInputChange("autoRenewal", e.target.checked)}
                                className={styles.toggleInput}
                            />
                            <label htmlFor="autoRenewal" className={styles.toggleLabel}>
                                <span className={styles.toggleSlider}></span>
                            </label>
                        </div>
                        <div className={styles.renewalInfo}>
                            <span className={styles.renewalTitle}>Renovación Automática</span>
                            <span className={styles.renewalDescription}>Tu suscripción se renovará automáticamente cada mes</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Historial de Facturas */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div className={styles.sectionTitle}>
                        <Calendar />
                        <h4>Historial de Facturas</h4>
                    </div>
                </div>

                <div className={styles.invoicesList}>
                    {invoices.map((invoice) => (
                        <div key={invoice.id} className={styles.invoiceItem}>
                            <div className={styles.invoiceInfo}>
                                <div className={styles.invoiceId}>{invoice.id}</div>
                                <div className={styles.invoiceDescription}>{invoice.description}</div>
                                <div className={styles.invoiceDate}>{formatDate(invoice.date)}</div>
                            </div>

                            <div className={styles.invoiceAmount}>{formatCurrency(invoice.amount)}</div>

                            <div className={styles.invoiceStatus}>
                                <span
                                    className={styles.statusBadge}
                                    style={{backgroundColor: `${getStatusColor(invoice.status)}15`, color: getStatusColor(invoice.status),}}
                                >
                                    {getStatusLabel(invoice.status)}
                                </span>
                            </div>

                            <div className={styles.invoiceActions}>
                                <button className={styles.downloadButton} title="Descargar">
                                    <Download />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default BillingSettings
