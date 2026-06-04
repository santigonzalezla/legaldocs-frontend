'use client';

import {useRef} from 'react';
import {createPortal} from 'react-dom';
import styles from './billingpanel.module.css';
import {X, DollarSign, Download, Users} from '@/app/components/svg';
import type {Client, LegalProcess, TimeEntry} from '@/app/interfaces/interfaces';
import {BillableType, ClientType} from '@/app/interfaces/enums';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface BillingPanelProps
{
    process:       LegalProcess;
    client:        Client | null;
    entries:       TimeEntry[];
    firmHourlyRate: number | null;
    onClose:       () => void;
}

interface UserLine
{
    name:          string;
    userId:        string;
    minutes:       number;
    sharedMinutes: number;
    collaborators: string[];
    subtotal:      number | null;
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

const BillingPanel = ({process, client, entries, firmHourlyRate, onClose}: BillingPanelProps) =>
{
    const previewRef = useRef<HTMLDivElement>(null);

    /* Only BILLABLE entries count toward the invoice.
       Shared entries are counted once (under the creator), never per participant. */
    const billable = entries.filter(e => e.billableType === BillableType.BILLABLE && e.durationMinutes);

    const byUser: Record<string, UserLine> = {};

    for (const e of billable)
    {
        if (!e.durationMinutes) continue;

        if (!byUser[e.userId])
            byUser[e.userId] = {
                name:          `${e.user?.firstName ?? ''} ${e.user?.lastName ?? ''}`.trim() || e.userId.slice(0, 8),
                userId:        e.userId,
                minutes:       0,
                sharedMinutes: 0,
                collaborators: [],
                subtotal:      null,
            };

        byUser[e.userId].minutes += e.durationMinutes;

        if (e.isShared && e.participants.length > 0)
        {
            byUser[e.userId].sharedMinutes += e.durationMinutes;
            for (const p of e.participants)
            {
                const pName = `${p.user.firstName} ${p.user.lastName}`.trim();
                if (!byUser[e.userId].collaborators.includes(pName))
                    byUser[e.userId].collaborators.push(pName);
            }
        }
    }

    /* Use firm rate for every subtotal */
    const lines = Object.values(byUser).map(l =>
    {
        const hours    = l.minutes / 60;
        const subtotal = firmHourlyRate != null ? Math.round(hours * firmHourlyRate) : null;
        return {...l, subtotal};
    });

    const totalMinutes = lines.reduce((acc, l) => acc + l.minutes, 0);
    const total = firmHourlyRate != null
        ? Math.round((totalMinutes / 60) * firmHourlyRate)
        : null;

    const hasShared = lines.some(l => l.sharedMinutes > 0);

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

                        <div className={styles.conceptRow}>
                            <p className={styles.conceptLabel}>Concepto: Honorarios profesionales por tiempo facturado en el proceso</p>
                            {firmHourlyRate != null && (
                                <span className={styles.rateTag}>
                                    Tarifa: {fmtCOP(firmHourlyRate)} / hora
                                </span>
                            )}
                        </div>

                        {/* Table — no per-row rate column */}
                        <div className={styles.table}>
                            <div className={styles.tableHead}>
                                <span>Profesional</span>
                                <span className={styles.right}>Tiempo facturado</span>
                                <span className={styles.right}>Subtotal</span>
                            </div>

                            {lines.length === 0 ? (
                                <div className={styles.emptyRow}>Sin registros de tiempo facturado</div>
                            ) : (
                                lines.map(l => (
                                    <div key={l.userId} className={styles.rowGroup}>
                                        <div className={styles.tableRow}>
                                            <span className={styles.professionalCell}>
                                                {l.name}
                                                {l.sharedMinutes > 0 && (
                                                    <span className={styles.sharedBadge}>
                                                        <Users className={styles.sharedBadgeIcon} />
                                                        Compartida
                                                    </span>
                                                )}
                                            </span>
                                            <span className={styles.right}>{fmtHours(l.minutes)}</span>
                                            <span className={styles.right}>
                                                {l.subtotal != null ? fmtCOP(l.subtotal) : '—'}
                                            </span>
                                        </div>

                                        {/* Shared-hours transparency note */}
                                        {l.collaborators.length > 0 && (
                                            <div className={styles.sharedNote}>
                                                <Users className={styles.sharedNoteIcon} />
                                                <span>
                                                    {fmtHours(l.sharedMinutes)} compartidas con: {l.collaborators.join(', ')} — facturadas una sola vez
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Total */}
                        <div className={styles.totalRow}>
                            <div>
                                <span className={styles.totalLabel}>TOTAL A COBRAR</span>
                                <span className={styles.totalHours}>{fmtHours(totalMinutes)} · {firmHourlyRate != null ? fmtCOP(firmHourlyRate) + '/h' : 'sin tarifa'}</span>
                            </div>
                            <span className={styles.totalAmount}>
                                {total != null ? fmtCOP(total) : '—'}
                            </span>
                        </div>

                        {total == null && (
                            <p className={styles.rateWarning}>
                                La firma no tiene tarifa por hora configurada. Agrégala en Configuración → Despacho.
                            </p>
                        )}

                        {hasShared && (
                            <p className={styles.sharedInfo}>
                                Las horas marcadas como compartidas se cobran una sola vez al cliente, independientemente del número de colaboradores.
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
