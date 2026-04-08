'use client';

import {useState} from 'react';
import styles from './templatelist.module.css';
import {Copy, Edit, File, Plus, Trash} from '@/app/components/svg';
import {useFetch} from '@/hooks/useFetch';
import type {DocumentTemplate, LegalBranch, PaginatedResponse} from '@/app/interfaces/interfaces';
import {TemplateOrigin} from '@/app/interfaces/enums';
import {toast} from 'sonner';
import {useConfirm} from '@/hooks/useConfirm';
import ConfirmModal from '@/app/components/ui/confirmmodal/ConfirmModal';

interface TemplateListProps
{
    onCreateNew:    () => void;
    onEditTemplate: (templateId: string) => void;
    onSaved:        () => void;
}

const TemplateList = ({onCreateNew, onEditTemplate, onSaved}: TemplateListProps) =>
{
    const [selectedBranch, setSelectedBranch] = useState('all');
    const [selectedOrigin, setSelectedOrigin] = useState('all');

    const {data: templatesRes, isLoading, execute: refetch} = useFetch<PaginatedResponse<DocumentTemplate>>(
        'template?limit=100',
        {firmScoped: true},
    );

    const {data: branches} = useFetch<LegalBranch[]>('branch', {firmScoped: true});

    const {execute: executeDelete} = useFetch<{message: string}>('', {
        method:    'DELETE',
        immediate: false,
        firmScoped: true,
    });

    const {execute: executeCopy} = useFetch<DocumentTemplate>('', {
        method:    'POST',
        immediate: false,
        firmScoped: true,
    });

    const {confirm, confirmState, handleConfirm, handleCancel} = useConfirm();

    const branchMap = Object.fromEntries((branches ?? []).map(b => [b.id, b]));
    const templates = templatesRes?.data ?? [];

    const filtered = templates.filter(t =>
    {
        const branchOk = selectedBranch === 'all' || t.branchId === selectedBranch;
        const originOk = selectedOrigin === 'all'
            || (selectedOrigin === 'custom' && t.origin !== TemplateOrigin.SYSTEM)
            || (selectedOrigin === 'system' && t.origin === TemplateOrigin.SYSTEM);
        return branchOk && originOk;
    });

    const systemCount = templates.filter(t => t.origin === TemplateOrigin.SYSTEM).length;
    const customCount = templates.filter(t => t.origin !== TemplateOrigin.SYSTEM).length;

    const handleDelete = async (id: string) =>
    {
        if (!await confirm({title: 'Eliminar plantilla', message: '¿Eliminar esta plantilla? Esta acción no se puede deshacer.', confirmLabel: 'Eliminar'})) return;
        const result = await executeDelete({}, `template/${id}`);
        if (!result) return;
        toast.success('Plantilla eliminada.');
        refetch();
    };

    const handleCopy = async (id: string) =>
    {
        const result = await executeCopy({}, `template/${id}/copy`);
        if (!result) return;
        toast.success('Plantilla copiada a tu despacho.');
        refetch();
        onSaved();
    };

    const getOriginLabel = (origin: TemplateOrigin) =>
    {
        if (origin === TemplateOrigin.SYSTEM)      return 'Sistema';
        if (origin === TemplateOrigin.FIRM_CUSTOM) return 'Personalizada';
        return 'Copiada';
    };

    const getOriginColor = (origin: TemplateOrigin) =>
    {
        if (origin === TemplateOrigin.SYSTEM)      return '#6b7280';
        if (origin === TemplateOrigin.FIRM_CUSTOM) return '#3b82f6';
        return '#10b981';
    };

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('es-ES', {day: '2-digit', month: 'short', year: 'numeric'});

    return (
        <div className={styles.templateList}>

            {/* Stats */}
            <div className={styles.statsSection}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{backgroundColor: '#3b82f615'}}>
                        <File style={{color: '#3b82f6'}} />
                    </div>
                    <div className={styles.statInfo}>
                        <h3 className={styles.statCardValue}>{templatesRes?.total ?? 0}</h3>
                        <p className={styles.statTitle}>Total Plantillas</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{backgroundColor: '#3b82f615'}}>
                        <Edit style={{color: '#3b82f6'}} />
                    </div>
                    <div className={styles.statInfo}>
                        <h3 className={styles.statCardValue}>{customCount}</h3>
                        <p className={styles.statTitle}>Personalizadas</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{backgroundColor: '#10b98115'}}>
                        <Copy style={{color: '#10b981'}} />
                    </div>
                    <div className={styles.statInfo}>
                        <h3 className={styles.statCardValue}>{systemCount}</h3>
                        <p className={styles.statTitle}>Del Sistema</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filtersSection}>
                <div className={styles.filters}>
                    <div className={styles.categoryFilter}>
                        <label className={styles.filterLabel}>Rama:</label>
                        <select
                            value={selectedBranch}
                            onChange={e => setSelectedBranch(e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="all">Todas las ramas</option>
                            {(branches ?? []).map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.categoryFilter}>
                        <label className={styles.filterLabel}>Origen:</label>
                        <select
                            value={selectedOrigin}
                            onChange={e => setSelectedOrigin(e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="all">Todos</option>
                            <option value="custom">Mis plantillas</option>
                            <option value="system">Sistema</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className={styles.loading}>Cargando plantillas...</div>
            ) : (
                <div className={styles.templatesGrid}>
                    {filtered.map(template =>
                    {
                        const branch     = branchMap[template.branchId];
                        const isEditable = template.origin !== TemplateOrigin.SYSTEM;

                        return (
                            <div key={template.id} className={styles.templateCard}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.templateInfo}>
                                        <h4 className={styles.templateName}>{template.title}</h4>
                                        <div className={styles.templateMeta}>
                                            {branch && (
                                                <span
                                                    className={styles.categoryBadge}
                                                    style={{
                                                        backgroundColor: `${branch.color ?? '#6b7280'}15`,
                                                        color: branch.color ?? '#6b7280',
                                                    }}
                                                >
                                                    {branch.name}
                                                </span>
                                            )}
                                            <span
                                                className={styles.originBadge}
                                                style={{
                                                    backgroundColor: `${getOriginColor(template.origin)}15`,
                                                    color: getOriginColor(template.origin),
                                                }}
                                            >
                                                {getOriginLabel(template.origin)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={styles.cardActions}>
                                        {isEditable ? (
                                            <>
                                                <button
                                                    className={styles.actionButton}
                                                    onClick={() => onEditTemplate(template.id)}
                                                    title="Editar"
                                                >
                                                    <Edit />
                                                </button>
                                                <button
                                                    className={`${styles.actionButton} ${styles.dangerButton}`}
                                                    onClick={() => handleDelete(template.id)}
                                                    title="Eliminar"
                                                >
                                                    <Trash />
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                className={styles.actionButton}
                                                onClick={() => handleCopy(template.id)}
                                                title="Copiar al despacho"
                                            >
                                                <Copy />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.cardContent}>
                                    {template.subcategory && (
                                        <p className={styles.templateDescription}>{template.subcategory}</p>
                                    )}
                                    <div className={styles.templateStats}>
                                        <div className={styles.statItem}>
                                            <span className={styles.statLabel}>Tipo:</span>
                                            <span className={styles.statValue}>{template.documentType}</span>
                                        </div>
                                        <div className={styles.statItem}>
                                            <span className={styles.statLabel}>Versión:</span>
                                            <span className={styles.statValue}>{template.version}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.cardFooter}>
                                    <div className={styles.dateInfo}>
                                        <span>Creada: {formatDate(template.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    <div className={styles.createCard} onClick={onCreateNew}>
                        <div className={styles.createIcon}><Plus /></div>
                        <h4 className={styles.createTitle}>Crear Nueva Plantilla</h4>
                        <p className={styles.createDescription}>Diseña una plantilla personalizada para tu despacho</p>
                    </div>
                </div>
            )}

            {confirmState && (
                <ConfirmModal
                    title={confirmState.title}
                    message={confirmState.message}
                    confirmLabel={confirmState.confirmLabel}
                    danger={confirmState.danger}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
        </div>
    );
};

export default TemplateList;
