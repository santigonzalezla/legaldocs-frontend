'use client';

import {useRef} from 'react';
import {createPortal} from 'react-dom';
import styles from './billingpanel.module.css';
import {X, DollarSign, Download} from '@/app/components/svg';
import type {Client, LegalProcess, TimeEntry} from '@/app/interfaces/interfaces';
import {ClientType} from '@/app/interfaces/enums';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface BillingPanelProps
{
    process: LegalProcess;
    client:  Client | null;
    entries: TimeEntry[];
    onClose: () => void;
}

interface UserLine
{
    name:        string;
    userId:      string;
    minutes:     number;
    hourlyRate:  number | null;
    subtotal:    number | null;
}

const fmtCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', {style: 'currency', currency: 'COP', maximumFractionDigits: 0}).format(n);

const fmtHours = (minutes: number) =>
{
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
};

const clientName = (c: Client) =>
    c.type === ClientType.COMPANY
        ? (c.companyName ?? '—')
        : [c.firstName, c.lastName].filter(Boolean).join(' ') || '—';

const todayLabel = () =>
    new Date().toLocaleDateString('es-ES', {day: '2-digit', month: 'long', year: 'numeric'});

const BillingPanel = ({process, client, entries, onClose}: BillingPanelProps) =>
{
    const previewRef = useRef<HTMLDivElement>(null);

    // Build per-user summary
    const byUser: Record<string, UserLine> = {};
    for (const e of entries)
    {
        if (!e.durationMinutes) continue;
        if (!byUser[e.userId])
            byUser[e.userId] = {
                name:       `${e.user?.firstName ?? ''} ${e.user?.lastName ?? ''}`.trim() || e.userId.slice(0, 8),
                userId:     e.userId,
                minutes:    0,
                hourlyRate: e.user?.hourlyRate ?? null,
                subtotal:   null,
            };
        byUser[e.userId].minutes += e.durationMinutes;
    }

    const lines = Object.values(byUser).map(l =>
    {
        const hours    = l.minutes / 60;
        const subtotal = l.hourlyRate != null ? Math.round(hours * l.hourlyRate) : null;
        return {...l, subtotal};
    });

    const total = lines.reduce<number | null>((acc, l) =>
    {
        if (l.subtotal == null) return acc;
        return (acc ?? 0) + l.subtotal;
    }, null);

    const handleDownload = async () =>
    {
        if (!previewRef.current) return;
        const canvas = await html2canvas(previewRef.current, {scale: 2, useCORS: true});
        const img    = canvas.toDataURL('image/png');
        const pdf    = new jsPDF({orientation: 'portrait', unit: 'mm', format: 'a4'});
        const pdfW   = pdf.internal.pageSize.getWidth();
        const pdfH   = (canvas.height * pdfW) / canvas.width;
        pdf.addImage(img, 'PNG', 0, 0, pdfW, pdfH);
        pdf.save(`cuenta-de-cobro-${process.reference ?? process.numId}.pdf`);
    };

    const modal = (
        <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={styles.modal}>

                {/* Modal header */}
                <div className={styles.modalHeader}>
                    <div className={styles.modalHeaderLeft}>
                        <div className={styles.modalIcon}><DollarSign /></div>
                        <span className={styles.modalTitle}>Cuenta de Cobro</span>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}><X /></button>
                </div>

                {/* Invoice preview */}
                <div className={styles.scrollArea}>
                    <div className={styles.invoice} ref={previewRef}>

                        {/* Invoice header */}
                        <div className={styles.invoiceHeader}>
                            <div>
                                <h2 className={styles.invoiceTitle}>CUENTA DE COBRO</h2>
                                <p className={styles.invoiceDate}>Fecha: {todayLabel()}</p>
                            </div>
                            <div className={styles.invoiceNum}>
                                N.° {process.numId}
                            </div>
                        </div>

                        <div className={styles.divider} />

                        {/* Process & client info */}
                        <div className={styles.infoBlock}>
                            <div className={styles.infoRow}>
                                <span className={styles.infoKey}>Proceso</span>
                                <span className={styles.infoVal}>{process.title}</span>
                            </div>
                            {process.reference && (
                                <div className={styles.infoRow}>
                                    <span className={styles.infoKey}>Radicado</span>
                                    <span className={styles.infoVal}>{process.reference}</span>
                                </div>
                            )}
                            {client && (
                                <div className={styles.infoRow}>
                                    <span className={styles.infoKey}>Cliente</span>
                                    <span className={styles.infoVal}>{clientName(client)}</span>
                                </div>
                            )}
                            {client?.documentNumber && (
                                <div className={styles.infoRow}>
                                    <span className={styles.infoKey}>Identificación</span>
                                    <span className={styles.infoVal}>{client.documentType ? `${client.documentType} ` : ''}{client.documentNumber}</span>
                                </div>
                            )}
                        </div>

                        <div className={styles.divider} />

                        {/* Billing concept label */}
                        <p className={styles.conceptLabel}>Concepto: Honorarios profesionales por tiempo trabajado en el proceso</p>

                        {/* Table */}
                        <div className={styles.table}>
                            <div className={styles.tableHead}>
                                <span>Profesional</span>
                                <span className={styles.right}>Tiempo</span>
                                <span className={styles.right}>Tarifa / hora</span>
                                <span className={styles.right}>Subtotal</span>
                            </div>

                            {lines.length === 0 ? (
                                <div className={styles.emptyRow}>Sin registros de tiempo completados</div>
                            ) : (
                                lines.map(l => (
                                    <div key={l.userId} className={styles.tableRow}>
                                        <span>{l.name}</span>
                                        <span className={styles.right}>{fmtHours(l.minutes)}</span>
                                        <span className={styles.right}>
                                            {l.hourlyRate != null ? fmtCOP(l.hourlyRate) : <em className={styles.noRate}>Sin tarifa</em>}
                                        </span>
                                        <span className={styles.right}>
                                            {l.subtotal != null ? fmtCOP(l.subtotal) : '—'}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Total */}
                        <div className={styles.totalRow}>
                            <span className={styles.totalLabel}>TOTAL A COBRAR</span>
                            <span className={styles.totalAmount}>
                                {total != null ? fmtCOP(total) : '—'}
                            </span>
                        </div>

                        {total == null && lines.some(l => l.hourlyRate == null) && (
                            <p className={styles.rateWarning}>
                                Uno o más profesionales no tienen tarifa por hora configurada. Complétala en tu perfil de usuario.
                            </p>
                        )}

                        <div className={styles.invoiceFooter}>
                            <p>Esta cuenta de cobro no constituye factura de venta. Válida como soporte de honorarios profesionales.</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className={styles.modalFooter}>
                    <button className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
                    <button className={styles.downloadBtn} onClick={handleDownload}>
                        <Download />
                        Descargar PDF
                    </button>
                </div>

            </div>
        </div>
    );

    return createPortal(modal, document.body);
};

export default BillingPanel;
