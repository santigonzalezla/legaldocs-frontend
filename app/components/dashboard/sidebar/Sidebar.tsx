'use client';

import styles from './sidebar.module.css';
import SidebarOption from "@/app/components/dashboard/sidebaroption/SidebarOption";
import {
    Building,
    Buildings,
    Dashboard,
    FileCheck,
    Hammer,
    File,
    Scale,
    Shield,
    Users,
    Star,
    Trash,
    UserCheck,
    Briefcase,
    PenTool,
    ScrollText,
    Search,
    Card,
    BarChart,
    Help,
    TriangleAlert,
    BookOpen,
    ArrowLeft,
    Globe,
    Crown
} from '@/app/components/svg';
import React, {useEffect, useState} from "react";
import Image from "next/image";
import {useFetch} from "@/hooks/useFetch";
import {usePermissions} from "@/context/PermissionsContext";
import type {DocumentTemplate, LegalBranch, PaginatedResponse} from "@/app/interfaces/interfaces";

interface SubOption
{
    item: string;
    link: string;
}

interface SidebarOptionType
{
    item: string;
    icon: React.ReactElement;
    link: string;
    category: string;
    suboptions?: SubOption[];
    // Sin permission -> visible para cualquier miembro autenticado (self-service,
    // recursos informativos, o datos compartidos como "Mis Firmas").
    permission?: string | string[];
}

interface OptionGroup
{
    title: string;
    options: SidebarOptionType[];
}

const BRANCH_ICONS: Record<string, React.ReactElement> = {
    civil: <Scale/>,
    comercial: <Buildings/>,
    laboral: <Users/>,
    procesal: <Hammer/>,
    administrativo: <Building/>,
    administrative: <Building/>,
    penal: <Shield/>
};

const Sidebar = () =>
{
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [expandedOption, setExpandedOption] = useState<string | null>(null);

    const {can, canAny} = usePermissions();
    const hasAccess = (permission?: string | string[]): boolean =>
    {
        if (!permission) return true;
        return Array.isArray(permission) ? canAny(permission) : can(permission);
    };

    const {data: branchesData} = useFetch<LegalBranch[]>('branch?isActive=true&limit=50', {firmScoped: true});
    const branches = branchesData ?? [];
    const {
        data: templatesRes,
        execute: refetchTemplates
    } = useFetch<PaginatedResponse<DocumentTemplate>>('template?limit=100', {firmScoped: true});

    const templates = templatesRes?.data ?? [];

    useEffect(() =>
    {
        const handler = () => refetchTemplates();
        window.addEventListener('template:saved', handler);
        return () => window.removeEventListener('template:saved', handler);
    }, [refetchTemplates]);

    const toggleCollapse = () =>
    {
        setIsCollapsed(!isCollapsed);
        if (!isCollapsed) setExpandedOption(null);
    };

    const handleOptionToggle = (optionItem: string) =>
    {
        if (isCollapsed) return;
        setExpandedOption(prev => (prev === optionItem ? null : optionItem));
    };

    const generatorOptions: SidebarOptionType[] = can('documents:create')
        ? [...branches]
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .filter(b => templates.some(t => t.branches.some(br => br.id === b.id)))
            .map(b => ({
                item: b.name,
                icon: BRANCH_ICONS[b.slug] ?? <File/>,
                link: `/dashboard/generator/${b.slug}`,
                category: 'generator',
                suboptions: templates
                    .filter(t => t.branches.some(br => br.id === b.id))
                    .map(t => ({
                        item: t.title,
                        link: `/dashboard/generator/${b.slug}/${t.documentType}`
                    }))
            }))
        : [];

    const optionGroups: OptionGroup[] = [
        {
            title: "Resumen",
            options: [
                {item: "Dashboard", icon: <Dashboard/>, link: "/dashboard", category: "main"}
            ]
        },
        {
            title: "Generador de Documentos",
            options: generatorOptions
        },
        {
            title: "Gestión de Procesos",
            options: [
                {item: "Clientes", icon: <Users/>, link: "/dashboard/clients", category: "processes", permission: "clients:view"},
                {item: "Procesos Legales", icon: <Briefcase/>, link: "/dashboard/processes", category: "processes", permission: "processes:view"},
                {
                    item: "Análisis de Tiempo",
                    icon: <BarChart/>,
                    link: "/dashboard/processes/analytics",
                    category: "processes",
                    permission: "time_entries:view"
                }
            ]
        },
        {
            title: "Gestión de Documentos",
            options: [
                {
                    item: "Documentos Generados",
                    icon: <FileCheck/>,
                    link: "/dashboard/documents/generated",
                    category: "documents",
                    permission: "documents:view"
                },
                {
                    item: "Plantillas Personalizadas",
                    icon: <ScrollText/>,
                    link: "/dashboard/settings/templates",
                    category: "documents",
                    permission: "templates:view"
                },
                {item: "Borradores", icon: <File/>, link: "/dashboard/documents/drafts", category: "documents", permission: "documents:view"},
                {item: "Favoritos", icon: <Star/>, link: "/dashboard/documents/favorites", category: "documents", permission: "documents:view"},
                {item: "Papelera", icon: <Trash/>, link: "/dashboard/documents/trash", category: "documents", permission: "documents:view"}
            ]
        },
        {
            title: "Configuración",
            options: [
                {
                    item: "Ramas Jurídicas",
                    icon: <Globe/>,
                    link: "/dashboard/settings/branches",
                    category: "settings",
                    permission: ["branches:create", "branches:edit", "branches:delete"]
                },
                {
                    item: "Datos de la Firma",
                    icon: <Briefcase/>,
                    link: "/dashboard/settings/office",
                    category: "settings",
                    permission: ["firm_settings:view", "firm_settings:edit"]
                },
                {item: "Mis Firmas", icon: <Crown/>, link: "/dashboard/settings/firms", category: "settings"},
                {
                    item: "Perfil de Usuario",
                    icon: <UserCheck/>,
                    link: "/dashboard/settings/profile",
                    category: "settings"
                },
                {
                    item: "Firmas Digitales",
                    icon: <PenTool/>,
                    link: "/dashboard/settings/signatures",
                    category: "settings"
                }
            ]
        },
        {
            title: "Recursos y Soporte",
            options: [
                {
                    item: "Biblioteca Jurídica",
                    icon: <BookOpen/>,
                    link: "/dashboard/resources/library",
                    category: "resources",
                    permission: "library:view"
                },
                {
                    item: "Actualizaciones Normativas",
                    icon: <TriangleAlert/>,
                    link: "/dashboard/resources/updates",
                    category: "resources"
                },
                {item: "Tutoriales", icon: <Help/>, link: "/dashboard/resources/tutorials", category: "resources"},
                {item: "Soporte Técnico", icon: <Search/>, link: "/dashboard/resources/support", category: "resources"}
            ]
        },
        {
            title: "Suscripción",
            options: [
                {item: "Plan Actual", icon: <Card/>, link: "/dashboard/subscription/current", category: "subscription", permission: "firm_settings:view"},
                {
                    item: "Historial de Pagos",
                    icon: <BarChart/>,
                    link: "/dashboard/subscription/history",
                    category: "subscription",
                    permission: "firm_settings:view"
                },
                {
                    item: "Upgrade de Plan",
                    icon: <Star/>,
                    link: "/dashboard/subscription/upgrade",
                    category: "subscription",
                    permission: "firm_settings:view"
                }
            ]
        }
    ];

    const visibleGroups = optionGroups
        .map(group => ({...group, options: group.options.filter(option => hasAccess(option.permission))}))
        .filter(group => group.options.length > 0);

    return (
        <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}>
            <div className={styles.logo}>
                <Image
                    src="/logo.png"
                    alt="LegalDocs"
                    width={isCollapsed ? 40 : 200}
                    height={isCollapsed ? 40 : 100}
                    style={{objectFit: "cover"}}
                    priority
                />
            </div>

            <div className={styles.scrollContainer}>
                <div className={styles.options}>
                    {visibleGroups.map((group, groupIndex) => (
                        <div key={groupIndex} className={styles.optionGroup}>
                            {!isCollapsed && (
                                <h3 className={styles.groupTitle}>{group.title}</h3>
                            )}
                            {group.options.map((option, index) => (
                                <SidebarOption
                                    key={index}
                                    item={option.item}
                                    icon={option.icon}
                                    link={option.link}
                                    isCollapsed={isCollapsed}
                                    suboptions={option.suboptions}
                                    category={option.category}
                                    isExpanded={expandedOption === option.item}
                                    onToggle={() => handleOptionToggle(option.item)}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <button className={styles.collapsebutton} onClick={toggleCollapse}>
                <ArrowLeft/>
            </button>
        </div>
    );
};

export default Sidebar;
