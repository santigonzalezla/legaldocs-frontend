'use client';

import styles from './confirmmodal.module.css';
import {TriangleAlert} from '@/app/components/svg';

interface ConfirmModalProps
{
    title:       string;
    message:     string;
    confirmLabel?: string;
    danger?:     boolean;
    onConfirm:   () => void;
    onCancel:    () => void;
}

const ConfirmModal = ({title, message, confirmLabel = 'Eliminar', danger = true, onConfirm, onCancel}: ConfirmModalProps) =>
{
    return (
        <div className={styles.overlay} onClick={onCancel}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.iconWrap} data-danger={danger}>
                    <TriangleAlert className={styles.icon} />
                </div>

                <div className={styles.body}>
                    <h3 className={styles.title}>{title}</h3>
                    <p className={styles.message}>{message}</p>
                </div>

                <div className={styles.actions}>
                    <button className={styles.btnCancel} onClick={onCancel}>
                        Cancelar
                    </button>
                    <button
                        className={`${styles.btnConfirm} ${danger ? styles.btnDanger : styles.btnPrimary}`}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
