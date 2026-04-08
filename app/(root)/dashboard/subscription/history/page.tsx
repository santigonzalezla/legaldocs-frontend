'use client';

import styles from './page.module.css';
import {useFetch} from '@/hooks/useFetch';
import type {Invoice} from '@/app/interfaces/interfaces';
import {InvoiceStatus} from '@/app/interfaces/enums';
import {FileDown, DollarSign} from '@/app/components/svg';

const STATUS_LABEL: Record<InvoiceStatus, string> = {
    [InvoiceStatus.PENDING]:  'Pendiente',
    [InvoiceStatus.PAID]:     'Pagado',
    [InvoiceStatus.FAILED]:   'Fallido',
    [InvoiceStatus.REFUNDED]: 'Reembolsado',
    [InvoiceStatus.VOIDED]:   'Anulado',
};

const STATUS_STYLE: Record<InvoiceStatus, {bg: string; color: string}> = {
    [InvoiceStatus.PENDING]:  {bg: '#fef9c3', color: '#ca8a04'},
    [InvoiceStatus.PAID]:     {bg: '#f0fdf4', color: '#16a34a'},
    [InvoiceStatus.FAILED]:   {bg: '#fef2f2', color: '#dc2626'},
    [InvoiceStatus.REFUNDED]: {bg: '#eff6ff', color: '#2563eb'},
    [InvoiceStatus.VOIDED]:   {bg: '#f1f5f9', color: '#64748b'},
};

const formatPrice = (amount: number, currency: string) =>
    `$${amount.toLocaleString('es-CO')} ${currency.toUpperCase()}`;

const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('es-CO', {day: '2-digit', month: 'long', year: 'numeric'}) : '—';

const formatPeriod = (start: string | null, end: string | null) =>
{
    if (!start && !end) return '—';
    const s = start ? new Date(start).toLocaleDateString('es-CO', {day: '2-digit', month: 'short'}) : '?';
    const e = end   ? new Date(end).toLocaleDateString('es-CO',   {day: '2-digit', month: 'short', year: 'numeric'}) : '?';
    return `${s} – ${e}`;
};

const HistoryPage = () =>
{
    const {data: invoicesRes, isLoading} =
        useFetch<{data: Invoice[]; total: number}>('subscription/me/invoices', {firmScoped: true});

    const invoices = invoicesRes?.data ?? [];

    if (isLoading)
        return <div className={styles.page}><p className={styles.loading}>Cargando historial...</p></div>;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1>Historial de pagos</h1>
                    <p>Revisa tus facturas y comprobantes de pago.</p>
                </div>
            </div>

            {invoices.length === 0 ? (
                <div className={styles.emptyState}>
                    <DollarSign />
                    <p>No tienes facturas registradas aún.</p>
                </div>
            ) : (
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Factura</th>
                                <th>Período</th>
                                <th>Fecha</th>
                                <th>Monto</th>
                                <th>Estado</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map(inv => (
                                <tr key={inv.id}>
                                    <td className={styles.invoiceNum}>{inv.invoiceNumber}</td>
                                    <td className={styles.period}>
                                        {formatPeriod(inv.billingPeriodStart, inv.billingPeriodEnd)}
                                    </td>
                                    <td>{formatDate(inv.paidAt ?? inv.dueDate)}</td>
                                    <td className={styles.amount}>
                                        {formatPrice(inv.amount, inv.currency)}
                                    </td>
                                    <td>
                                        <span
                                            className={styles.statusBadge}
                                            style={{
                                                backgroundColor: STATUS_STYLE[inv.status].bg,
                                                color:           STATUS_STYLE[inv.status].color,
                                            }}
                                        >
                                            {STATUS_LABEL[inv.status]}
                                        </span>
                                    </td>
                                    <td className={styles.actions}>
                                        {inv.pdfUrl && (
                                            <a
                                                href={inv.pdfUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={styles.downloadBtn}
                                                title="Descargar PDF"
                                            >
                                                <FileDown />
                                            </a>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default HistoryPage;
