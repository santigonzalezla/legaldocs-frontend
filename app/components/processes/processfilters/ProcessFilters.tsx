'use client';

import styles from './processfilters.module.css';
import {Grid, List, Search} from '@/app/components/svg';
import {ProcessStatus, ClientType} from '@/app/interfaces/enums';
import type {Client, LegalBranch} from '@/app/interfaces/interfaces';

const clientName = (c: Client) =>
    c.type === ClientType.COMPANY
        ? (c.companyName ?? '—')
        : [c.firstName, c.lastName].filter(Boolean).join(' ') || '—';

const statusOptions = [
    {value: 'all',                   label: 'Todos los estados'},
    {value: ProcessStatus.ACTIVE,    label: 'Activos'},
    {value: ProcessStatus.IN_REVIEW, label: 'En Revisión'},
    {value: ProcessStatus.CLOSED,    label: 'Cerrados'},
    {value: ProcessStatus.ARCHIVED,  label: 'Archivados'},
];

interface ProcessFiltersProps
{
    search:         string;
    onSearch:       (v: string) => void;
    selectedStatus: string;
    onStatus:       (v: string) => void;
    selectedClient: string;
    onClient:       (v: string) => void;
    selectedBranch: string;
    onBranch:       (v: string) => void;
    clients:        Client[];
    branches:       LegalBranch[];
    view:           'grid' | 'list';
    onViewChange:   (v: 'grid' | 'list') => void;
}

const ProcessFilters = ({search, onSearch, selectedStatus, onStatus, selectedClient, onClient, selectedBranch, onBranch, clients, branches, view, onViewChange}: ProcessFiltersProps) =>
(
    <div className={styles.filtersContainer}>
        <div className={styles.filtersContent}>
            <div className={styles.searchSection}>
                <div className={styles.searchInputWrapper}>
                    <Search />
                    <input
                        className={styles.searchInput}
                        type="text"
                        placeholder="Buscar por título o radicado..."
                        value={search}
                        onChange={e => onSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className={styles.filtersSection}>
                <div className={styles.filterGroup}>
                    <select className={styles.filterSelect} value={selectedStatus} onChange={e => onStatus(e.target.value)}>
                        {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <select className={styles.filterSelect} value={selectedClient} onChange={e => onClient(e.target.value)}>
                        <option value="all">Todos los clientes</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{clientName(c)}</option>)}
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <select className={styles.filterSelect} value={selectedBranch} onChange={e => onBranch(e.target.value)}>
                        <option value="all">Todas las ramas</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>
            </div>

            <div className={styles.viewModeSection}>
                <div className={styles.viewModeToggle}>
                    <button
                        className={`${styles.viewModeButton} ${view === 'grid' ? styles.active : ''}`}
                        onClick={() => onViewChange('grid')}
                        title="Vista cuadrícula"
                    >
                        <Grid />
                    </button>
                    <button
                        className={`${styles.viewModeButton} ${view === 'list' ? styles.active : ''}`}
                        onClick={() => onViewChange('list')}
                        title="Vista lista"
                    >
                        <List />
                    </button>
                </div>
            </div>
        </div>
    </div>
);

export default ProcessFilters;
