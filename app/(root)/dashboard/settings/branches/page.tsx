'use client';

import {useState} from 'react';
import styles from './page.module.css';
import {useFetch} from '@/hooks/useFetch';
import type {DocumentTemplate, LegalBranch, PaginatedResponse} from '@/app/interfaces/interfaces';
import {File, Plus, Scale, Buildings, Users, Hammer, Building, Shield, Globe, Trash} from '@/app/components/svg';
import {toast} from 'sonner';
import AddBranchModal from '@/app/components/settings/branches/addbranch/AddBranchModal';

const BRANCH_ICONS: Record<string, React.ReactElement> = {
    civil: <Scale/>,
    comercial: <Buildings/>,
    laboral: <Users/>,
    procesal: <Hammer/>,
    administrativo: <Building/>,
    penal: <Shield/>
};

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'];

const toSlug = (name: string) =>
    name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const BranchesPage = () =>
{
    const [showModal, setShowModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newColor, setNewColor] = useState(COLORS[0]);
    const [saving, setSaving] = useState(false);
    const [listKey, setListKey] = useState(0);

    const {data: branchesRes, execute: refetchBranches} = useFetch<LegalBranch[]>(
        'branch?isActive=true&limit=50',
        {immediate: true, firmScoped: true}
    );

    const {data: templatesRes} = useFetch<PaginatedResponse<DocumentTemplate>>(
        'template?limit=100',
        {firmScoped: true}
    );

    const {execute: createBranch} = useFetch<LegalBranch>('branch', {
        method: 'POST',
        immediate: false,
        firmScoped: true
    });

    const {execute: deleteBranch} = useFetch<void>('branch', {
        method: 'DELETE',
        immediate: false,
        firmScoped: true
    });

    const branches = branchesRes ?? [];
    const templates = templatesRes?.data ?? [];

    const systemBranches = branches.filter(b => b.isSystem);
    const firmBranches = branches.filter(b => !b.isSystem);

    const templateCountFor = (branchId: string) =>
        templates.filter(t => t.branchId === branchId).length;

    const openModal = () => setShowModal(true);

    const closeModal = () =>
    {
        setShowModal(false);
        setNewName('');
        setNewDesc('');
        setNewColor(COLORS[0]);
    };

    const handleCreate = async () =>
    {
        if (!newName.trim()) return;
        setSaving(true);
        const result = await createBranch({
            body: {name: newName.trim(), slug: toSlug(newName), description: newDesc.trim() || null, color: newColor}
        });
        setSaving(false);
        if (!result) return;
        closeModal();
        toast.success('Rama jurídica creada correctamente');
        setListKey(k => k + 1);
        refetchBranches();
    };

    const handleDelete = async (branch: LegalBranch) =>
    {
        if (!confirm(`¿Eliminar la rama "${branch.name}"? Esta acción no se puede deshacer.`)) return;
        await deleteBranch({}, `branch/${branch.id}`);
        setListKey(k => k + 1);
        refetchBranches();
    };

    return (
        <div className={styles.page} key={listKey}>
            <div className={styles.header}>
                <div>
                    <h1>Ramas Jurídicas</h1>
                    <p>Configura las áreas del derecho disponibles en el generador de tu firma.</p>
                </div>
                <button className={styles.addButton} onClick={openModal}>
                    <Plus/> Agregar Rama
                </button>
            </div>

            {systemBranches.length > 0 && (
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Ramas del Sistema</h2>
                <p className={styles.sectionDesc}>
                    Ramas predefinidas disponibles para todas las firmas. Aparecen en el generador cuando tienes
                    plantillas asociadas.
                </p>
                <div className={styles.branchGrid}>
                    {systemBranches.map(b => (
                        <div key={b.id} className={styles.branchCard}>
                            <div className={styles.branchCardIcon}
                                 style={{background: `${b.color ?? '#3B82F6'}20`, color: b.color ?? '#3B82F6'}}>
                                {BRANCH_ICONS[b.slug] ?? <Globe/>}
                            </div>
                            <div className={styles.branchCardContent}>
                                <span className={styles.branchCardName}>{b.name}</span>
                                {b.description && (
                                    <span className={styles.branchCardDesc}>{b.description}</span>
                                )}
                                <div className={styles.branchCardMeta}>
                                    <span className={styles.branchCardBadge}>
                                        <File/> {templateCountFor(b.id)} plantilla{templateCountFor(b.id) !== 1 ? 's' : ''}
                                    </span>
                                    <span className={styles.systemBadge}>Sistema</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            )}

            <section className={styles.section}>
                {firmBranches.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Globe/>
                        <p>No tienes ramas personalizadas. Agrega una para comenzar.</p>
                    </div>
                ) : (
                    <>
                    <h2 className={styles.sectionTitle}>Ramas Personalizadas</h2>
                    <p className={styles.sectionDesc}>
                        Ramas específicas de tu firma para áreas del derecho especializadas.
                    </p>
                    <div className={styles.branchGrid}>
                        {firmBranches.map(b => (
                            <div key={b.id} className={styles.branchCard}>
                                <div className={styles.branchCardIcon}
                                     style={{background: `${b.color ?? '#3B82F6'}20`, color: b.color ?? '#3B82F6'}}>
                                    <Globe/>
                                </div>
                                <div className={styles.branchCardContent}>
                                    <span className={styles.branchCardName}>{b.name}</span>
                                    {b.description && (
                                        <span className={styles.branchCardDesc}>{b.description}</span>
                                    )}
                                    <div className={styles.branchCardMeta}>
                                        <span className={styles.branchCardBadge}>
                                            <File/> {templateCountFor(b.id)} plantilla{templateCountFor(b.id) !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                                <button className={styles.deleteButton} onClick={() => handleDelete(b)}
                                        title="Eliminar rama">
                                    <Trash/>
                                </button>
                            </div>
                        ))}
                    </div>
                    </>
                )}
            </section>

            <AddBranchModal
                open={showModal}
                saving={saving}
                name={newName}
                desc={newDesc}
                color={newColor}
                onClose={closeModal}
                onSave={handleCreate}
                onName={setNewName}
                onDesc={setNewDesc}
                onColor={setNewColor}
            />
        </div>
    );
};

export default BranchesPage;
