'use client';

import styles from './page.module.css';
import OfficeForm from "@/app/components/settings/office/officeform/OfficeForm";
import BillingSettings from "@/app/components/settings/office/billingsettings/BillingSettings";
import TeamManagement from "@/app/components/settings/office/teammanagement/TeamManagement";
import RolesManagement from "@/app/components/settings/office/rolesmanagement/RolesManagement";
import { useState } from "react";
import { Building, Users, Card, LockUser } from "@/app/components/svg";
import {PermissionGuard} from '@/app/components/auth/PermissionGuard';
import {usePermissions} from '@/context/PermissionsContext';

const Office = () =>
{
    const {can, canAny} = usePermissions();

    // "Datos de la Firma" y "Facturación" solo para quien puede ver la config de
    // la firma; "Equipo" para quien puede ver el equipo; "Roles" para quien los
    // administra. Cada usuario ve únicamente las pestañas que le corresponden.
    const canViewFirm = canAny(['firm_settings:view', 'firm_settings:edit']);

    const tabs = [
        ...(canViewFirm ? [{ id: "info", label: "Información del Despacho", Icon: Building, color: "#2563EB" }] : []),
        ...(can('team:view') ? [{ id: "team", label: "Equipo", Icon: Users, color: "#7C3AED" }] : []),
        ...(canViewFirm ? [{ id: "billing", label: "Facturación", Icon: Card, color: "#059669" }] : []),
        ...(can('team:manage-roles') ? [{ id: "roles", label: "Roles y Permisos", Icon: LockUser, color: "#D97706" }] : []),
    ];

    const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "info");

    return (
        <div className={styles.office}>
            <div className={styles.header}>
                <h1>Datos de la Firma</h1>
                <p>Configura la información de tu firma legal y gestiona tu equipo .</p>
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
                    {activeTab === "info" && canViewFirm && <OfficeForm />}
                    {activeTab === "team" && can('team:view') && <TeamManagement />}
                    {activeTab === "billing" && canViewFirm && <BillingSettings />}
                    {activeTab === "roles" && can('team:manage-roles') && <RolesManagement />}
                </div>
            </div>
        </div>
    );
}

const OfficeGuarded = () => (
    <PermissionGuard permission={['firm_settings:view', 'firm_settings:edit', 'team:view']}>
        <Office/>
    </PermissionGuard>
);

export default OfficeGuarded;
