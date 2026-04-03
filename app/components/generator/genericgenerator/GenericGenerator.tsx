'use client';

import {useMemo, useState} from 'react';
import {useParams} from 'next/navigation';
import Link from 'next/link';
import styles from './genericgenerator.module.css';
import {ArrowLeft, ArrowGo, Check} from '@/app/components/svg';
import DynamicLegalForm from '@/app/components/generator/dynamiclegalform/DynamicLegalForm';
import DocumentEditor   from '@/app/components/generator/documenteditor/DocumentEditor';
import DocumentPreview  from '@/app/components/generator/documentpreview/DocumentPreview';
import DownloadPanel    from '@/app/components/generator/downloadpanel/DownloadPanel';
import SaveBanner       from '@/app/components/generator/savebanner/SaveBanner';
import {useFormContext} from '@/context/FormContext';

const formatTitle = (slug: string) =>
    slug.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const STEP_LABELS = ['Información', 'Configuración', 'Finalización'];
const TOTAL_STEPS = 3;

// Count all FieldConfig nodes (objects with a `type` key) recursively
const countFields = (node: Record<string, any>): number =>
{
    let n = 0;
    for (const v of Object.values(node))
    {
        if (v && typeof v === 'object')
            n += 'type' in v ? 1 : countFields(v);
    }
    return n;
};

// Count how many of those fields have a non-empty value in formData
const countFilled = (schemaNode: Record<string, any>, dataNode: Record<string, any>): number =>
{
    let n = 0;
    for (const [key, v] of Object.entries(schemaNode))
    {
        if (v && typeof v === 'object')
        {
            if ('type' in v)
            {
                const val = dataNode?.[key];
                if (val !== undefined && val !== '' && val !== null) n++;
            }
            else
            {
                n += countFilled(v, dataNode?.[key] ?? {});
            }
        }
    }
    return n;
};

const GenericGenerator = () =>
{
    const params   = useParams();
    const doctype  = (params?.doctype as string) ?? '';
    const branch   = (params?.branch  as string) ?? '';
    const title    = formatTitle(doctype);
    const backHref = `/dashboard/generator/${branch}`;

    const [step, setStep] = useState(0);

    const {schema, formData} = useFormContext();

    const {totalFields, filledFields} = useMemo(() =>
    {
        if (!schema) return {totalFields: 0, filledFields: 0};

        let total  = 0;
        let filled = 0;

        for (const [cat, catFields] of Object.entries(schema.variable_fields))
        {
            total  += countFields(catFields as Record<string, any>);
            filled += countFilled(catFields as Record<string, any>, (formData as any)[cat] ?? {});
        }

        return {totalFields: total, filledFields: filled};
    }, [schema, formData]);

    const hasNoVariables = !!schema && totalFields === 0;
    const percentage     = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

    const progressColor =
        percentage === 100 ? '#10b981' :
        percentage >= 60   ? '#3b82f6' :
        percentage >= 30   ? '#f59e0b' : '#ef4444';

    return (
        <div className={styles.generator}>
            {/* Header */}
            <div className={styles.header}>
                {branch && (
                    <Link href={backHref} className={styles.backButton}>
                        <ArrowLeft />
                    </Link>
                )}
                <div>
                    <h1>{title}</h1>
                    <p>Genera este documento de forma personalizada con los datos de tu firma.</p>
                </div>
            </div>

            {/* Steps indicator */}
            <div className={styles.stepsRow}>
                <div className={styles.stepsIndicator}>
                    {Array.from({length: TOTAL_STEPS}, (_, i) => (
                        <div key={i} className={styles.stepItem}>
                            <div className={styles.stepWrapper}>
                                <div
                                    className={`${styles.stepCircle} ${
                                        i < step  ? styles.stepCompleted :
                                        i === step ? styles.stepActive    :
                                                     styles.stepInactive
                                    }`}
                                    onClick={() => setStep(i)}
                                >
                                    {i < step
                                        ? <Check className={styles.checkIcon} />
                                        : <span>{i + 1}</span>
                                    }
                                </div>
                                <div className={`${styles.stepTitle} ${i === step ? styles.stepTitleActive : ''}`}>
                                    {STEP_LABELS[i]}
                                </div>
                            </div>
                            {i < TOTAL_STEPS - 1 && (
                                <div className={`${styles.stepConnector} ${
                                    i < step ? styles.connectorCompleted : styles.connectorInactive
                                }`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Progress bar */}
            <div className={styles.progressSection}>
                <div className={styles.progressHeader}>
                    {hasNoVariables ? (
                        <span className={styles.progressNote}>Este documento no tiene variables configurables</span>
                    ) : (
                        <>
                            <span className={styles.progressLabel}>
                                Campos completados: <strong>{filledFields} / {totalFields}</strong>
                            </span>
                            <span className={styles.progressPct} style={{color: progressColor}}>
                                {percentage}%
                            </span>
                        </>
                    )}
                </div>
                <div className={styles.progressTrack}>
                    <div
                        className={styles.progressFill}
                        style={{
                            width:      hasNoVariables ? '100%' : `${percentage}%`,
                            background: hasNoVariables ? '#10b981' : progressColor,
                        }}
                    />
                </div>
            </div>

            {/* Step content */}
            <div className={styles.stepContent}>
                {step === 0 && <DynamicLegalForm />}
                {step === 1 && <DocumentEditor />}
                {step === 2 && (
                    <>
                        <SaveBanner />
                        <div className={styles.actionsContainer}>
                            <div className={styles.actionsLeft}><DownloadPanel /></div>
                            <div className={styles.actionsRight}><DocumentPreview /></div>
                        </div>
                    </>
                )}
            </div>

            {/* Previous / Next navigation */}
            <div className={styles.navButtons}>
                <button
                    className={`${styles.navBtn} ${styles.navBtnPrev}`}
                    onClick={() => setStep(s => s - 1)}
                    disabled={step === 0}
                >
                    <ArrowLeft className={styles.navBtnIcon} />
                    Anterior
                </button>
                <span className={styles.navStepIndicator}>
                    Paso {step + 1} de {TOTAL_STEPS}
                </span>
                <button
                    className={`${styles.navBtn} ${styles.navBtnNext}`}
                    onClick={() => setStep(s => s + 1)}
                    disabled={step === TOTAL_STEPS - 1}
                >
                    Siguiente
                    <ArrowGo className={styles.navBtnIcon} />
                </button>
            </div>
        </div>
    );
};

export default GenericGenerator;
