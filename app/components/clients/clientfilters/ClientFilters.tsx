'use client';

import styles from './clientfilters.module.css';
import {Grid, List, Search} from '@/app/components/svg';
import {ClientType} from '@/app/interfaces/enums';

interface ClientFiltersProps
{
    search:        string;
    onSearch:      (v: string) => void;
    selectedType:  string;
    onTypeChange:  (v: string) => void;
    view:          'grid' | 'list';
    onViewChange:  (v: 'grid' | 'list') => void;
}

const typeOptions = [
    {value: 'all',               label: 'Todos los tipos'},
    {value: ClientType.INDIVIDUAL, label: 'Persona Natural'},
    {value: ClientType.COMPANY,    label: 'Empresa'},
];

const ClientFilters = ({search, onSearch, selectedType, onTypeChange, view, onViewChange}: ClientFiltersProps) =>
(
    <div className={styles.filtersContainer}>
        <div className={styles.filtersContent}>
            <div className={styles.searchSection}>
                <div className={styles.searchInputWrapper}>
                    <Search />
                    <input
                        className={styles.searchInput}
                        type="text"
                        placeholder="Buscar por nombre, documento o email..."
                        value={search}
                        onChange={e => onSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className={styles.filtersSection}>
                <div className={styles.filterGroup}>
                    <select
                        className={styles.filterSelect}
                        value={selectedType}
                        onChange={e => onTypeChange(e.target.value)}
                    >
                        {typeOptions.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
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

export default ClientFilters;
