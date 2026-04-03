'use client';

import type React from 'react';
import styles from './quickactions.module.css';
import {useRouter} from 'next/navigation';
import {File, Plus, Search, Settings, Upload, Users} from '@/app/components/svg';

interface QuickAction
{
    id:          string;
    title:       string;
    description: string;
    icon:        React.ReactNode;
    color:       string;
    href:        string;
}

const ACTIONS: QuickAction[] = [
    {
        id:          'new-document',
        title:       'Nuevo Documento',
        description: 'Crear un documento jurídico desde plantilla',
        icon:        <Plus />,
        color:       '#10b981',
        href:        '/dashboard/generator',
    },
    {
        id:          'upload-template',
        title:       'Plantillas',
        description: 'Gestionar plantillas personalizadas',
        icon:        <Upload />,
        color:       '#3b82f6',
        href:        '/dashboard/settings/templates',
    },
    {
        id:          'search-documents',
        title:       'Documentos Generados',
        description: 'Explorar todos los documentos creados',
        icon:        <Search />,
        color:       '#f59e0b',
        href:        '/dashboard/documents/generated',
    },
    {
        id:          'manage-clients',
        title:       'Gestionar Clientes',
        description: 'Administrar información de clientes',
        icon:        <Users />,
        color:       '#8b5cf6',
        href:        '/dashboard/clients',
    },
    {
        id:          'view-templates',
        title:       'Procesos Legales',
        description: 'Ver y gestionar procesos activos',
        icon:        <File />,
        color:       '#ef4444',
        href:        '/dashboard/processes',
    },
    {
        id:          'settings',
        title:       'Configuración',
        description: 'Ajustar preferencias del sistema',
        icon:        <Settings />,
        color:       '#06b6d4',
        href:        '/dashboard/settings/office',
    },
];

const QuickActions: React.FC = () =>
{
    const router = useRouter();

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>Acciones Rápidas</h3>
            </div>

            <div className={styles.actionsGrid} style={{gridTemplateColumns: 'repeat(3, 1fr)'}}>
                {ACTIONS.map(action => (
                    <button
                        key={action.id}
                        className={styles.actionCard}
                        onClick={() => router.push(action.href)}
                    >
                        <div className={styles.actionIcon} style={{backgroundColor: `${action.color}15`}}>
                            <div style={{color: action.color}}>{action.icon}</div>
                        </div>
                        <div className={styles.actionContent}>
                            <h4 className={styles.actionTitle}>{action.title}</h4>
                            <p className={styles.actionDescription}>{action.description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default QuickActions;
