'use client';

import styles from './page.module.css';
import SignatureCreator from '@/app/components/settings/signatures/signaturecreator/SignatureCreator';
import SignatureList from '@/app/components/settings/signatures/signaturelist/SignatureList';
import type {DigitalSignature} from '@/app/interfaces/interfaces';
import {useState} from 'react';

const Signatures = () =>
{
    const [editSignature, setEditSignature] = useState<DigitalSignature | null>(null);
    const [showCreator,   setShowCreator]   = useState(false);
    const [listKey,       setListKey]       = useState(0);

    const handleSaved = () =>
    {
        setShowCreator(false);
        setEditSignature(null);
        setListKey(k => k + 1);
    };

    const handleClose = () =>
    {
        setShowCreator(false);
        setEditSignature(null);
    };

    const showingCreator = showCreator || !!editSignature;

    return (
        <div className={styles.signatures}>
            <div className={styles.top}>
                <div className={styles.header}>
                    <h1>Firmas Digitales</h1>
                    <p>Crea y gestiona tus firmas digitales para documentos legales.</p>
                </div>
                <button className={styles.createButton} onClick={() => setShowCreator(true)}>
                    + Nueva Firma
                </button>
            </div>
            {showingCreator ? (
                <SignatureCreator
                    onClose={handleClose}
                    onSaved={handleSaved}
                    signature={editSignature ?? undefined}
                />
            ) : (
                <SignatureList
                    key={listKey}
                    onCreateNew={() => setShowCreator(true)}
                    onEdit={sig => setEditSignature(sig)}
                />
            )}
        </div>
    );
};

export default Signatures;
