'use client';

import {useEffect, useRef, useState} from 'react';
import styles from './daterangepicker.module.css';
import {ArrowLeft, ArrowGo, Calendar} from '@/app/components/svg';

interface DateRangePickerProps
{
    startDate: string; // 'YYYY-MM-DD'
    endDate:   string; // 'YYYY-MM-DD'
    onChange:  (startDate: string, endDate: string) => void;
}

const DAY_NAMES   = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTH_NAMES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MONTH_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const toISODate = (date: Date) => date.toISOString().split('T')[0];
const parseISODate = (value: string) => { const [y, m, d] = value.split('-').map(Number); return new Date(y, m - 1, d); };

const formatShort = (value: string) =>
{
    const date = parseISODate(value);
    return `${date.getDate()} ${MONTH_SHORT[date.getMonth()]}`;
};

const formatRangeLabel = (startDate: string, endDate: string): string =>
{
    if (!startDate || !endDate) return 'Seleccionar rango';
    const start = parseISODate(startDate);
    const end   = parseISODate(endDate);
    const year  = end.getFullYear();
    return start.getFullYear() === year
        ? `${formatShort(startDate)} — ${formatShort(endDate)} ${year}`
        : `${formatShort(startDate)} ${start.getFullYear()} — ${formatShort(endDate)} ${year}`;
};

const startOfMonth = (year: number, month: number) => new Date(year, month, 1);

// Lunes=0 ... Domingo=6, para que la grilla arranque igual que el resto del calendario de la app.
const weekdayMondayFirst = (date: Date) => (date.getDay() + 6) % 7;

const buildMonthGrid = (year: number, month: number): (Date | null)[] =>
{
    const first     = startOfMonth(year, month);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leading   = weekdayMondayFirst(first);

    const cells: (Date | null)[] = Array(leading).fill(null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));
    while (cells.length % 7 !== 0) cells.push(null);

    return cells;
};

const PRESETS = [
    {
        label: 'Este mes',
        range: (): [Date, Date] => {
            const now = new Date();
            return [startOfMonth(now.getFullYear(), now.getMonth()), now];
        },
    },
    {
        label: 'Mes pasado',
        range: (): [Date, Date] => {
            const now = new Date();
            const first = startOfMonth(now.getFullYear(), now.getMonth() - 1);
            const last  = new Date(now.getFullYear(), now.getMonth(), 0);
            return [first, last];
        },
    },
    {
        label: 'Últimos 7 días',
        range: (): [Date, Date] => {
            const now = new Date();
            const from = new Date(now); from.setDate(now.getDate() - 6);
            return [from, now];
        },
    },
    {
        label: 'Últimos 30 días',
        range: (): [Date, Date] => {
            const now = new Date();
            const from = new Date(now); from.setDate(now.getDate() - 29);
            return [from, now];
        },
    },
];

const DateRangePicker = ({startDate, endDate, onChange}: DateRangePickerProps) =>
{
    const [isOpen,       setIsOpen]       = useState(false);
    const [viewDate,     setViewDate]     = useState(() => (startDate ? parseISODate(startDate) : new Date()));
    const [pendingStart, setPendingStart] = useState<Date | null>(startDate ? parseISODate(startDate) : null);
    const [pendingEnd,   setPendingEnd]   = useState<Date | null>(endDate ? parseISODate(endDate) : null);
    const [hoverDate,    setHoverDate]    = useState<Date | null>(null);

    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() =>
    {
        const handler = (e: MouseEvent) =>
        {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
                setIsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const openPicker = () =>
    {
        setPendingStart(startDate ? parseISODate(startDate) : null);
        setPendingEnd(endDate ? parseISODate(endDate) : null);
        setViewDate(startDate ? parseISODate(startDate) : new Date());
        setIsOpen(true);
    };

    const handleDayClick = (day: Date) =>
    {
        if (!pendingStart || (pendingStart && pendingEnd))
        {
            setPendingStart(day);
            setPendingEnd(null);
            return;
        }

        if (day < pendingStart)
        {
            setPendingEnd(pendingStart);
            setPendingStart(day);
        }
        else
        {
            setPendingEnd(day);
        }
    };

    const applyPreset = (range: [Date, Date]) =>
    {
        const [from, to] = range;
        setPendingStart(from);
        setPendingEnd(to);
        setViewDate(from);
        onChange(toISODate(from), toISODate(to));
        setIsOpen(false);
    };

    const handleApply = () =>
    {
        if (!pendingStart || !pendingEnd) return;
        onChange(toISODate(pendingStart), toISODate(pendingEnd));
        setIsOpen(false);
    };

    const handleCancel = () =>
    {
        setPendingStart(startDate ? parseISODate(startDate) : null);
        setPendingEnd(endDate ? parseISODate(endDate) : null);
        setIsOpen(false);
    };

    const changeMonth = (delta: number) =>
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));

    const rangeStart = pendingStart;
    const rangeEnd   = pendingEnd ?? (pendingStart && hoverDate && hoverDate > pendingStart ? hoverDate : null);
    const rangeLo    = rangeStart && rangeEnd ? (rangeStart < rangeEnd ? rangeStart : rangeEnd) : rangeStart;
    const rangeHi    = rangeStart && rangeEnd ? (rangeStart < rangeEnd ? rangeEnd : rangeStart) : (pendingStart && hoverDate) || null;

    const isSameDay = (a: Date | null, b: Date | null) =>
        !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    const isInRange = (day: Date) =>
        !!rangeLo && !!rangeHi && day >= rangeLo && day <= rangeHi;

    const grid = buildMonthGrid(viewDate.getFullYear(), viewDate.getMonth());

    return (
        <div className={styles.wrapper} ref={wrapperRef}>
            <button type="button" className={styles.trigger} onClick={() => (isOpen ? setIsOpen(false) : openPicker())}>
                <Calendar className={styles.triggerIcon} />
                <span>{formatRangeLabel(startDate, endDate)}</span>
            </button>

            {isOpen && (
                <div className={styles.popover}>
                    <div className={styles.presets}>
                        {PRESETS.map(preset => (
                            <button
                                key={preset.label}
                                type="button"
                                className={styles.presetButton}
                                onClick={() => applyPreset(preset.range())}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    <div className={styles.calendar}>
                        <div className={styles.calendarHeader}>
                            <button type="button" className={styles.navButton} onClick={() => changeMonth(-1)}>
                                <ArrowLeft />
                            </button>
                            <span className={styles.calendarTitle}>
                                {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
                            </span>
                            <button type="button" className={styles.navButton} onClick={() => changeMonth(1)}>
                                <ArrowGo />
                            </button>
                        </div>

                        <div className={styles.weekRow}>
                            {DAY_NAMES.map(day => <span key={day} className={styles.weekDay}>{day}</span>)}
                        </div>

                        <div className={styles.daysGrid}>
                            {grid.map((day, index) =>
                            {
                                if (!day) return <span key={index} className={styles.dayEmpty} />;

                                const selectedEdge = isSameDay(day, rangeStart) || isSameDay(day, pendingEnd);

                                return (
                                    <button
                                        type="button"
                                        key={index}
                                        className={`${styles.day} ${isInRange(day) ? styles.dayInRange : ''} ${selectedEdge ? styles.daySelected : ''}`}
                                        onClick={() => handleDayClick(day)}
                                        onMouseEnter={() => setHoverDate(day)}
                                    >
                                        {day.getDate()}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <span className={styles.footerRange}>
                            {pendingStart ? formatShort(toISODate(pendingStart)) : 'Desde'}
                            {' — '}
                            {pendingEnd ? formatShort(toISODate(pendingEnd)) : 'Hasta'}
                        </span>
                        <div className={styles.footerActions}>
                            <button type="button" className={styles.cancelButton} onClick={handleCancel}>Cancelar</button>
                            <button
                                type="button"
                                className={styles.applyButton}
                                onClick={handleApply}
                                disabled={!pendingStart || !pendingEnd}
                            >
                                Aplicar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateRangePicker;
