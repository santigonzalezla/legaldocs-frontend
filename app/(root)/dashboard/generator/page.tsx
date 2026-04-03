'use client';

import styles from './page.module.css';
import {useRouter} from 'next/navigation';
import {useFetch} from '@/hooks/useFetch';
import type {DocumentTemplate, LegalBranch, PaginatedResponse} from '@/app/interfaces/interfaces';
import {ArrowGo, Building, Buildings, File, Globe, Hammer, Scale, Shield, Users} from '@/app/components/svg';
import React from 'react';

const BRANCH_ICONS: Record<string, React.ReactElement> = {
    civil:          <Scale />,
    comercial:      <Buildings />,
    laboral:        <Users />,
    procesal:       <Hammer />,
    administrativo: <Building />,
    penal:          <Shield />,
};

const BRANCH_COLORS: Record<string, string> = {
    civil:          '#3b82f6',
    comercial:      '#10b981',
    laboral:        '#f59e0b',
    procesal:       '#ef4444',
    administrativo: '#8b5cf6',
    penal:          '#06b6d4',
};

const GeneratorPage = () =>
{
    const router = useRouter();

    const {data: branchList, isLoading} = useFetch<LegalBranch[]>(
        'branch?isActive=true&limit=50',
        {firmScoped: true},
    );

    const {data: templatesRes} = useFetch<PaginatedResponse<DocumentTemplate>>(
        'template?isActive=true&limit=100',
        {firmScoped: true},
    );

    const branches  = branchList ?? [];
    const templates = templatesRes?.data ?? [];

    const countFor = (branchId: string) =>
        templates.filter(t => t.branchId === branchId).length;

    const activeBranches = branches.filter(b => countFor(b.id) > 0);

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1>Generador de Documentos</h1>
                    <p>Selecciona el área del derecho para ver las plantillas disponibles y generar tu documento.</p>
                </div>
            </div>

            {isLoading ? (
                <p className={styles.loading}>Cargando ramas jurídicas...</p>
            ) : activeBranches.length === 0 ? (
                <div className={styles.empty}>
                    <Globe className={styles.emptyIcon} />
                    <p>No hay ramas jurídicas con plantillas disponibles.</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {activeBranches.map(branch =>
                    {
                        const color = branch.color ?? BRANCH_COLORS[branch.slug] ?? '#3b82f6';
                        const icon  = BRANCH_ICONS[branch.slug] ?? <Globe />;
                        const count = countFor(branch.id);

                        return (
                            <button
                                key={branch.id}
                                className={styles.card}
                                onClick={() => router.push(`/dashboard/generator/${branch.slug}`)}
                            >
                                <div
                                    className={styles.cardIcon}
                                    style={{background: `${color}18`, color}}
                                >
                                    {icon}
                                </div>

                                <div className={styles.cardBody}>
                                    <h2 className={styles.cardTitle}>{branch.name}</h2>
                                    {branch.description && (
                                        <p className={styles.cardDesc}>{branch.description}</p>
                                    )}
                                    <div className={styles.cardMeta}>
                                        <span className={styles.templateCount} style={{color, background: `${color}15`}}>
                                            <File className={styles.metaIcon} />
                                            {count} plantilla{count !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>

                                <span className={styles.cardArrow} style={{color}}>
                                    <ArrowGo />
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default GeneratorPage;
