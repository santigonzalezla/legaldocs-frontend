'use client';

import styles from './topbar.module.css';
import {usePathname, useRouter} from 'next/navigation';
import {useTheme} from '@/context/ThemeContext';
import {useSearch} from '@/context/SearchContext';
import {useAuth} from '@/context/AuthContext';
import {useFetch} from '@/hooks/useFetch';
import {Bell, Building, Check, Moon, Search, Settings, Sun, User, Logout, ArrowDown} from '@/app/components/svg';
import {useEffect, useRef, useState} from 'react';
import Link from 'next/link';
import {toast} from 'sonner';
import type {Firm, FirmWithRole, User as UserType} from '@/app/interfaces/interfaces';

const PAGE_TITLES: Record<string, string> = {
    dashboard:    'Resumen',
    generator:    'Generador de Documentos',
    documents:    'Gestión de Documentos',
    processes:    'Gestión de Procesos',
    clients:      'Gestión de Procesos',
    settings:     'Configuración',
    resources:    'Recursos y Soporte',
    subscription: 'Suscripción',
};

const CATEGORY_COLORS: Record<string, string> = {
    main:      '#3B82F6',
    documents: '#F59E0B',
    settings:  '#8B5CF6',
    resources: '#EF4444',
    template:  '#10B981',
    document:  '#6366F1',
};

const Topbar = () =>
{
    const pathname = usePathname();
    const router = useRouter();
    const {theme, toggleTheme} = useTheme();
    const {logout, activeFirmId, setActiveFirm} = useAuth();
    const {searchTerm, setSearchTerm, filteredOptions, isLoading: searchLoading, isSearchOpen, setIsSearchOpen} = useSearch();

    const searchRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const {data: userData}  = useFetch<UserType>('user/me');
    const {data: firmData}  = useFetch<Firm>('firm/me', {firmScoped: true});
    const {data: myFirms}   = useFetch<FirmWithRole[]>('firm/my-firms');

    const pageKey = pathname.split('/')[2] ?? 'dashboard';
    const title = PAGE_TITLES[pageKey] ?? 'Dashboard';

    const initials = userData
        ? `${userData.firstName[0]}${userData.lastName[0]}`.toUpperCase()
        : '--';

    const fullName = userData
        ? `${userData.firstName} ${userData.lastName}`
        : 'Cargando...';

    useEffect(() =>
    {
        const handler = (e: MouseEvent) =>
        {
            if (searchRef.current && !searchRef.current.contains(e.target as Node))
                setIsSearchOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [setIsSearchOpen]);

    useEffect(() =>
    {
        const handler = (e: MouseEvent) =>
        {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
                setIsDropdownOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    {
        const value = e.target.value;
        setSearchTerm(value);
        setIsSearchOpen(value.length > 0);
    };

    const handleLogout = () =>
    {
        logout();
        toast.success('Sesión cerrada correctamente');
        router.push('/signin');
    };

    const handleSwitchFirm = (firmId: string) =>
    {
        if (firmId === activeFirmId) return;
        setActiveFirm(firmId);
        setIsDropdownOpen(false);
        router.refresh();
    };

    return (
        <div className={styles.top}>
            <h1>{title}</h1>

            {/* Center - Search */}
            <div className={styles.topbarCenter}>
                <div className={styles.searchContainer} ref={searchRef}>
                    <div className={styles.searchInputWrapper}>
                        <Search/>
                        <input
                            type="text"
                            placeholder="Buscar documentos..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onFocus={() => setIsSearchOpen(true)}
                            className={styles.searchInput}
                        />
                        {searchTerm && (
                            <button onClick={() =>
                            {
                                setSearchTerm('');
                                setIsSearchOpen(false);
                            }} className={styles.clearButton}>
                                ×
                            </button>
                        )}
                    </div>

                    {isSearchOpen && searchTerm && (
                        <div className={styles.searchResults}>
                            {searchLoading ? (
                                <div className={styles.noResults}>Buscando...</div>
                            ) : filteredOptions.length > 0 ? (
                                filteredOptions.map((option, index) => (
                                    <Link
                                        key={index}
                                        href={option.link}
                                        className={styles.searchResult}
                                        onClick={() => { setIsSearchOpen(false); setSearchTerm(''); }}
                                    >
                                        <div className={styles.searchResultTitle}>{option.item}</div>
                                        <div className={styles.searchResultGroup}
                                             style={{color: CATEGORY_COLORS[option.category] ?? '#6B7280'}}>
                                            {option.group}
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className={styles.noResults}>No se encontraron resultados</div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Right */}
            <div className={styles.topright}>
                <div className={styles.topbell}>
                    <Bell/>
                    <span className={styles.notificationCount}>3</span>
                </div>

                <button onClick={toggleTheme} className={styles.themeToggle}
                        title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}>
                    {theme === 'light' ? <Moon/> : <Sun/>}
                </button>

                {/* User menu */}
                <div className={styles.userWrapper} ref={dropdownRef}>
                    <button className={styles.toprightuser} onClick={() => setIsDropdownOpen((v) => !v)}>
                        <div className={styles.avatar}>{initials}</div>
                        <div className={styles.toprightusertitle}>
                            <h2>{fullName}</h2>
                            <p>Plan Profesional</p>
                        </div>
                        <span className={`${styles.chevron} ${isDropdownOpen ? styles.chevronOpen : ''}`}>
                            <ArrowDown/>
                        </span>
                    </button>

                    {isDropdownOpen && (
                        <div className={styles.dropdown}>
                            {/* Header */}
                            <div className={styles.dropdownHeader}>
                                <div className={styles.dropdownAvatar}>{initials}</div>
                                <div>
                                    <p className={styles.dropdownName}>{fullName}</p>
                                    <p className={styles.dropdownEmail}>{userData?.email ?? ''}</p>
                                </div>
                            </div>

                            {myFirms && myFirms.length > 0 && (
                                <>
                                    <div className={styles.dropdownDivider}/>
                                    <p className={styles.dropdownSectionLabel}>Firmas</p>
                                    {myFirms.map(firm => (
                                        <button
                                            key={firm.id}
                                            className={`${styles.dropdownFirmItem} ${firm.id === activeFirmId ? styles.dropdownFirmItemActive : ''}`}
                                            onClick={() => handleSwitchFirm(firm.id)}>
                                            <div className={styles.dropdownFirmIcon}>
                                                <Building />
                                            </div>
                                            <span className={styles.dropdownFirmName}>{firm.name}</span>
                                            {firm.id === activeFirmId && (
                                                <span className={styles.dropdownFirmCheck}><Check /></span>
                                            )}
                                        </button>
                                    ))}
                                </>
                            )}

                            <div className={styles.dropdownDivider}/>

                            <Link href="/dashboard/settings/profile" className={styles.dropdownItem}
                                  onClick={() => setIsDropdownOpen(false)}>
                                <User/>
                                Mi Perfil
                            </Link>
                            <Link href="/dashboard/settings/firms" className={styles.dropdownItem}
                                  onClick={() => setIsDropdownOpen(false)}>
                                <Building/>
                                Mis Firmas
                            </Link>
                            <Link href="/dashboard/settings/office" className={styles.dropdownItem}
                                  onClick={() => setIsDropdownOpen(false)}>
                                <Settings/>
                                Configuración
                            </Link>

                            <div className={styles.dropdownDivider}/>

                            <button className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                                    onClick={handleLogout}>
                                <Logout/>
                                Cerrar sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Topbar;
