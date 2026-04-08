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
    Crown,
} from '@/app/components/svg';
import React, {useState} from "react";
import Image from "next/image";
import {useFetch} from "@/hooks/useFetch";
import type {DocumentTemplate, LegalBranch, PaginatedResponse} from "@/app/interfaces/interfaces";

interface SubOption
{
    item: string
    link: string
}

interface SidebarOptionType
{
    item:        string
    icon:        React.ReactElement
    link:        string
    category:    string
    suboptions?: SubOption[]
}

interface OptionGroup
{
    title:   string
    options: SidebarOptionType[]
}

const BRANCH_ICONS: Record<string, React.ReactElement> = {
    civil:           <Scale />,
    comercial:       <Buildings />,
    laboral:         <Users />,
    procesal:        <Hammer />,
    administrativo:  <Building />,
    administrative:  <Building />,
    penal:           <Shield />,
};

const Sidebar = () =>
{
    const [isCollapsed,    setIsCollapsed]    = useState(false);
    const [expandedOption, setExpandedOption] = useState<string | null>(null);

    const {data: branchesData}   = useFetch<LegalBranch[]>('branch?isActive=true&limit=50', {firmScoped: true});
    const branches = branchesData ?? [];
    const {data: templatesRes}  = useFetch<PaginatedResponse<DocumentTemplate>>('template?limit=100', {firmScoped: true});

    const templates = templatesRes?.data ?? [];

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

    // Build generator section from branches that have at least one template
    const generatorOptions: SidebarOptionType[] = branches
        .filter(b => templates.some(t => t.branchId === b.id))
        .map(b => ({
            item:      b.name,
            icon:      BRANCH_ICONS[b.slug] ?? <File />,
            link:      `/dashboard/generator/${b.slug}`,
            category:  'generator',
            suboptions: templates
                .filter(t => t.branchId === b.id)
                .map(t => ({
                    item: t.title,
                    link: `/dashboard/generator/${b.slug}/${t.documentType}`,
                })),
        }));

    const optionGroups: OptionGroup[] = [
        {
            title: "Resumen",
            options: [
                {item: "Dashboard", icon: <Dashboard />, link: "/dashboard", category: "main"},
            ],
        },
        {
            title: "Generador de Documentos",
            options: generatorOptions,
        },
        {
            title: "Gestión de Procesos",
            options: [
                {item: "Procesos Legales",   icon: <Briefcase />, link: "/dashboard/processes",           category: "processes"},
                {item: "Análisis de Tiempo", icon: <BarChart />,  link: "/dashboard/processes/analytics", category: "processes"},
                {item: "Clientes",           icon: <Users />,     link: "/dashboard/clients",             category: "processes"},
            ],
        },
        {
            title: "Gestión de Documentos",
            options: [
                {item: "Documentos Generados",      icon: <FileCheck />, link: "/dashboard/documents/generated", category: "documents"},
                {item: "Plantillas Personalizadas", icon: <ScrollText />, link: "/dashboard/settings/templates", category: "documents"},
                {item: "Borradores",                icon: <File />,      link: "/dashboard/documents/drafts",    category: "documents"},
                {item: "Favoritos",                 icon: <Star />,      link: "/dashboard/documents/favorites", category: "documents"},
                {item: "Papelera",                  icon: <Trash />,     link: "/dashboard/documents/trash",     category: "documents"},
            ],
        },
        {
            title: "Configuración",
            options: [
                {item: "Datos de la Firma",  icon: <Briefcase />, link: "/dashboard/settings/office",     category: "settings"},
                {item: "Mis Firmas",         icon: <Crown />,     link: "/dashboard/settings/firms",      category: "settings"},
                {item: "Perfil de Usuario",  icon: <UserCheck />, link: "/dashboard/settings/profile",    category: "settings"},
                {item: "Ramas Jurídicas",    icon: <Globe />,     link: "/dashboard/settings/branches",   category: "settings"},
                {item: "Firmas Digitales",   icon: <PenTool />,   link: "/dashboard/settings/signatures", category: "settings"},
            ],
        },
        {
            title: "Recursos y Soporte",
            options: [
                {item: "Biblioteca Jurídica",       icon: <BookOpen />,     link: "/dashboard/resources/library",   category: "resources"},
                {item: "Actualizaciones Normativas", icon: <TriangleAlert />, link: "/dashboard/resources/updates",   category: "resources"},
                {item: "Tutoriales",                icon: <Help />,         link: "/dashboard/resources/tutorials", category: "resources"},
                {item: "Soporte Técnico",           icon: <Search />,       link: "/dashboard/resources/support",   category: "resources"},
            ],
        },
        {
            title: "Suscripción",
            options: [
                {item: "Plan Actual",        icon: <Card />,    link: "/dashboard/subscription/current", category: "subscription"},
                {item: "Historial de Pagos", icon: <BarChart />, link: "/dashboard/subscription/history", category: "subscription"},
                {item: "Upgrade de Plan",    icon: <Star />,    link: "/dashboard/subscription/upgrade", category: "subscription"},
            ],
        },
    ];

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
                    {optionGroups.filter(g => g.options.length > 0).map((group, groupIndex) => (
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
                <ArrowLeft />
            </button>
        </div>
    );
};

export default Sidebar;
