'use client';

import styles from './branchoverview.module.css';
import Link from 'next/link';
import {useEffect} from 'react';
import {useFetch} from '@/hooks/useFetch';
import type {Document, DocumentTemplate, LegalBranch, PaginatedResponse} from '@/app/interfaces/interfaces';
import {ArrowGo, Calendar, File, Scale, Buildings, Users, Hammer, Building, Shield, Globe} from '@/app/components/svg';
import {STATUS_COLOR, STATUS_LABEL, formatDate, formatType} from '@/app/components/documents/generated/documentlist/DocumentList';
import React from 'react';

const BRANCH_ICONS: Record<string, React.ReactElement> = {
    civil:           <Scale />,
    'derecho-civil': <Scale />,
    comercial:       <Buildings />,
    laboral:         <Users />,
    procesal:        <Hammer />,
    administrativo:  <Building />,
    administrative:  <Building />,
    penal:           <Shield />,
};

interface DocumentType
{
    title: string;
    link:  string;
}

interface BranchOverviewProps
{
    branchSlug:         string;
    branchTitle?:       string;
    branchDescription?: string;
    branchIcon?:        React.ReactElement;
    documentTypes?:     DocumentType[];
}

const BranchOverview = ({branchSlug, branchTitle, branchDescription, branchIcon, documentTypes}: BranchOverviewProps) =>
{
    const {data: branchRes} = useFetch<LegalBranch[]>(
        `branch?slug=${branchSlug}&limit=1`,
        {firmScoped: true},
    );
    const branch   = branchRes?.[0];
    const branchId = branch?.id;

    const {data: templatesRes, execute: fetchTemplates} = useFetch<PaginatedResponse<DocumentTemplate>>(
        'template',
        {firmScoped: true, immediate: false},
    );

    const {data: documentsRes, execute: fetchDocuments} = useFetch<PaginatedResponse<Document>>(
        'document',
        {firmScoped: true, immediate: false},
    );

    useEffect(() =>
    {
        if (!branchId) return;
        fetchTemplates({}, `template?branchId=${branchId}&limit=20`);
        fetchDocuments({}, `document?branchId=${branchId}&limit=8`);
    }, [branchId]); // eslint-disable-line react-hooks/exhaustive-deps

    const templates = templatesRes?.data  ?? [];
    const documents = documentsRes?.data  ?? [];
    const totalTpls = templatesRes?.total ?? 0;
    const totalDocs = documentsRes?.total ?? 0;

    const resolvedTitle       = branchTitle       ?? branch?.name        ?? branchSlug;
    const resolvedDescription = branchDescription ?? branch?.description ?? '';
    const resolvedIcon        = branchIcon        ?? BRANCH_ICONS[branchSlug] ?? <Globe />;

    const resolvedDocumentTypes: DocumentType[] = documentTypes ?? templates.map(t => ({
        title: t.title,
        link:  `/dashboard/generator/${branchSlug}/${t.documentType}`,
    }));

    return (
        <div className={styles.container}>
            <div className={styles.hero}>
                <div className={styles.heroContent}>
                    <div className={styles.heroIcon}>{resolvedIcon}</div>
                    <div className={styles.heroText}>
                        <h1 className={styles.heroTitle}>{resolvedTitle}</h1>
                        {resolvedDescription && <p className={styles.heroDesc}>{resolvedDescription}</p>}
                    </div>
                </div>
                <div className={styles.heroStats}>
                    <div className={styles.statItem}>
                        <span className={styles.statValue}>{totalTpls}</span>
                        <span className={styles.statLabel}>Plantillas</span>
                    </div>
                    <div className={styles.statDivider} />
                    <div className={styles.statItem}>
                        <span className={styles.statValue}>{totalDocs}</span>
                        <span className={styles.statLabel}>Generados</span>
                    </div>
                </div>
            </div>

            {resolvedDocumentTypes.length > 0 && (
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Tipos de Documentos</h2>
                    <div className={styles.typeGrid}>
                        {resolvedDocumentTypes.map(dt => (
                            <Link key={dt.link} href={dt.link} className={styles.typeCard}>
                                <div className={styles.typeIcon}><File /></div>
                                <span className={styles.typeTitle}>{dt.title}</span>
                                <span className={styles.typeArrow}><ArrowGo /></span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {templates.length > 0 && (
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Plantillas Disponibles</h2>
                    <div className={styles.listCard}>
                        {templates.map(tpl => (
                            <div key={tpl.id} className={styles.listRow}>
                                <div className={styles.rowIcon}><File /></div>
                                <div className={styles.rowContent}>
                                    <span className={styles.rowTitle}>{tpl.title}</span>
                                    <span className={styles.rowMeta}>
                                        v{tpl.version}{tpl.subcategory ? ` · ${tpl.subcategory}` : ''}
                                    </span>
                                </div>
                                <span className={styles.rowBadge}>
                                    {tpl.origin === 'SYSTEM' ? 'Sistema' : 'Personalizada'}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {documents.length > 0 && (
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Documentos Generados</h2>
                        <Link href="/dashboard/documents/generated" className={styles.seeAll}>
                            Ver todos <ArrowGo />
                        </Link>
                    </div>
                    <div className={styles.listCard}>
                        {documents.map(doc => (
                            <div key={doc.id} className={styles.listRow}>
                                <div className={styles.rowIcon}><File /></div>
                                <div className={styles.rowContent}>
                                    <span className={styles.rowTitle}>{doc.title}</span>
                                    <span className={styles.rowMeta}>{formatType(doc.documentType)}</span>
                                </div>
                                <span className={styles.statusBadge}
                                    style={{backgroundColor: `${STATUS_COLOR[doc.status] ?? '#6b7280'}15`}}>
                                    <span style={{color: STATUS_COLOR[doc.status] ?? '#6b7280'}}>
                                        {STATUS_LABEL[doc.status] ?? doc.status}
                                    </span>
                                </span>
                                <div className={styles.rowDate}>
                                    <Calendar />
                                    <span>{formatDate(doc.createdAt)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {documents.length === 0 && templates.length === 0 && branchId && (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}><File /></div>
                    <p>Aún no hay documentos ni plantillas en esta rama.</p>
                </div>
            )}
        </div>
    );
};

export default BranchOverview;
