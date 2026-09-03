'use client';

import {useEffect, useMemo, useState} from 'react';
import styles from './page.module.css';
import {useFetch} from '@/hooks/useFetch';
import type {LegalUpdate, LegalUpdateSourceInfo, PaginatedResponse} from '@/app/interfaces/interfaces';
import {
    LEGAL_UPDATE_SOURCE_LABELS,
    LEGAL_UPDATE_TYPE_COLORS,
    LEGAL_UPDATE_TYPE_LABELS,
    LegalUpdateSource,
    LegalUpdateType,
} from '@/app/interfaces/enums';
import {formatRelativeTime} from '@/lib/format';
import {ArrowBack, ArrowGo, Bell, Cancel, ExternalLink, TriangleAlert} from '@/app/components/svg';
import DocumentFilters from '@/app/components/documents/shared/documentfilters/DocumentFilters';

const PAGE_SIZE = 20;
const SEEN_KEY  = 'ld_legal_updates_seen_at';
const STALE_MS  = 24 * 60 * 60 * 1000;

const TYPE_ORDER: LegalUpdateType[] = [
    LegalUpdateType.NEWS,
    LegalUpdateType.RULING,
    LegalUpdateType.LAW,
    LegalUpdateType.DECREE,
    LegalUpdateType.RESOLUTION,
    LegalUpdateType.CIRCULAR,
    LegalUpdateType.JURISPRUDENCE,
    LegalUpdateType.OTHER,
];

const TYPE_OPTIONS = [
    {value: 'all', label: 'Todos los tipos'},
    ...TYPE_ORDER.map((t) => ({value: t, label: LEGAL_UPDATE_TYPE_LABELS[t]})),
];

const UpdatesPage = () =>
{
    const [source, setSource]           = useState<'all' | LegalUpdateSource>('all');
    const [type, setType]               = useState<'all' | LegalUpdateType>('all');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch]           = useState('');
    const [page, setPage]               = useState(1);

    const [lastSeen, setLastSeen]               = useState<string | null>(null);
    const [bannerDismissed, setBannerDismissed] = useState(false);

    useEffect(() =>
    {
        const timer = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 350);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() =>
    {
        try { setLastSeen(localStorage.getItem(SEEN_KEY)); } catch { /* almacenamiento no disponible */ }

        const timer = setTimeout(() =>
        {
            try { localStorage.setItem(SEEN_KEY, new Date().toISOString()); } catch { /* ignore */ }
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    const query = useMemo(() =>
    {
        const params = new URLSearchParams({page: String(page), limit: String(PAGE_SIZE)});
        if (source !== 'all') params.set('source', source);
        if (type !== 'all')   params.set('type', type);
        if (search)           params.set('search', search);
        return params.toString();
    }, [source, type, search, page]);

    const {data: feed, isLoading} = useFetch<PaginatedResponse<LegalUpdate>>(`legal-updates?${query}`);
    const {data: sources}        = useFetch<LegalUpdateSourceInfo[]>('legal-updates/sources');
    const {data: newSince, execute: fetchNewSince} =
        useFetch<PaginatedResponse<LegalUpdate>>('legal-updates?limit=1', {immediate: false});

    useEffect(() =>
    {
        if (lastSeen) fetchNewSince({}, `legal-updates?limit=1&since=${encodeURIComponent(lastSeen)}`);
    }, [lastSeen]);

    const newCount   = lastSeen ? (newSince?.total ?? 0) : 0;
    const showBanner = newCount > 0 && !bannerDismissed;

    const items      = feed?.data ?? [];
    const total      = feed?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const sourceList = sources ?? [];
    const hasFilters = source !== 'all' || type !== 'all' || search !== '';

    const sourceOptions = [
        {value: 'all', label: 'Todas las fuentes'},
        ...sourceList.map((s) => ({value: s.source, label: LEGAL_UPDATE_SOURCE_LABELS[s.source] ?? s.label})),
    ];

    const openSource = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

    const resetFilters = () =>
    {
        setSource('all');
        setType('all');
        setSearchInput('');
        setSearch('');
        setPage(1);
    };

    const markSeen = () =>
    {
        try { localStorage.setItem(SEEN_KEY, new Date().toISOString()); } catch { /* ignore */ }
        setBannerDismissed(true);
    };

    return (
        <div className={styles.page}>
            <header className={styles.head}>
                <div className={styles.headText}>
                    <h1 className={styles.title}>Actualizaciones Normativas</h1>
                    <p className={styles.subtitle}>Novedades legislativas y jurisprudenciales de fuentes oficiales de Colombia.</p>
                </div>
                <p className={styles.disclaimer}>
                    <TriangleAlert/>
                    <span>Información recopilada de fuentes públicas; verifique siempre en la fuente oficial.</span>
                </p>
            </header>

            {showBanner && (
                <div className={styles.banner}>
                    <span className={styles.bannerIcon}><Bell/></span>
                    <div className={styles.bannerText}>
                        <strong>{newCount} {newCount === 1 ? 'novedad' : 'novedades'} desde tu última visita</strong>
                        <span>Ponte al día con lo más reciente de tus fuentes.</span>
                    </div>
                    <button className={styles.bannerAction} onClick={markSeen}>Marcar como visto</button>
                    <button className={styles.bannerClose} onClick={() => setBannerDismissed(true)} aria-label="Cerrar aviso">
                        <Cancel/>
                    </button>
                </div>
            )}

            <DocumentFilters
                searchTerm={searchInput}
                searchPlaceholder="Buscar en las actualizaciones"
                onSearchChange={setSearchInput}
                selectedStatus={source}
                onStatusChange={(v) => { setSource(v as 'all' | LegalUpdateSource); setPage(1); }}
                statusOptions={sourceOptions}
                selectedType={type}
                onTypeChange={(v) => { setType(v as 'all' | LegalUpdateType); setPage(1); }}
                typeOptions={TYPE_OPTIONS}
            />

            <div className={styles.body}>
                <div className={styles.feed}>
                    {isLoading ? (
                        Array.from({length: 4}).map((_, i) => <div key={i} className={styles.skeleton}/>)
                    ) : items.length === 0 ? (
                        <div className={styles.empty}>
                            <TriangleAlert/>
                            <p>No hay actualizaciones para estos filtros.</p>
                            {hasFilters && <button className={styles.linkButton} onClick={resetFilters}>Limpiar filtros</button>}
                        </div>
                    ) : (
                        items.map((u) =>
                        {
                            const badge = LEGAL_UPDATE_TYPE_COLORS[u.type] ?? LEGAL_UPDATE_TYPE_COLORS[LegalUpdateType.OTHER];
                            const label = LEGAL_UPDATE_TYPE_LABELS[u.type] ?? LEGAL_UPDATE_TYPE_LABELS[LegalUpdateType.OTHER];
                            const tag   = u.branch?.name ?? u.category;

                            return (
                                <article key={u.id} className={styles.card} onClick={() => openSource(u.url)}>
                                    <div className={styles.cardTop}>
                                        <span className={styles.badge} style={{backgroundColor: badge.bg, color: badge.color}}>{label}</span>
                                        <span className={styles.cardSource}>{u.sourceLabel}</span>
                                        <span className={styles.cardDate}>{formatRelativeTime(u.publishedAt)}</span>
                                    </div>

                                    <h2 className={styles.cardTitle}>{u.title}</h2>
                                    {u.summary && <p className={styles.cardSummary}>{u.summary}</p>}

                                    <div className={styles.cardFoot}>
                                        {tag ? <span className={styles.cardTag}>{tag}</span> : <span/>}
                                        <span className={styles.readLink}>Leer en la fuente <ExternalLink/></span>
                                    </div>
                                </article>
                            );
                        })
                    )}

                    {!isLoading && items.length > 0 && (
                        <div className={styles.pagination}>
                            <button className={styles.pageButton} disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                                <ArrowBack/> Anterior
                            </button>
                            <span className={styles.pageInfo}>Página {page} de {totalPages}</span>
                            <button className={styles.pageButton} disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                                Siguiente <ArrowGo/>
                            </button>
                        </div>
                    )}
                </div>

                <aside className={styles.sourcesPanel}>
                    <h2 className={styles.panelTitle}>Fuentes Oficiales</h2>
                    <p className={styles.panelDesc}>Estado de sincronización y disponibilidad de las fuentes de datos jurídicos.</p>

                    <ul className={styles.sourceList}>
                        {sourceList.length === 0 && <li className={styles.sourceMeta}>Sin datos de sincronización.</li>}
                        {sourceList.map((s) =>
                        {
                            const stale = !s.lastOkAt || Date.now() - new Date(s.lastOkAt).getTime() > STALE_MS;

                            return (
                                <li key={s.source} className={styles.sourceRow}>
                                    <span className={`${styles.healthDot} ${stale ? styles.healthStale : ''}`}/>
                                    <div className={styles.sourceInfo}>
                                        <span className={styles.sourceName}>{LEGAL_UPDATE_SOURCE_LABELS[s.source] ?? s.label}</span>
                                        <span className={styles.sourceMeta}>
                                            {s.lastOkAt ? `Actualizado ${formatRelativeTime(s.lastOkAt)}` : 'Sin sincronizar'}
                                        </span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>

                    <p className={styles.panelNote}>
                        Datos procesados desde interfaces públicas de Datos Abiertos Colombia y gacetas oficiales.
                    </p>
                </aside>
            </div>
        </div>
    );
};

export default UpdatesPage;
