'use client';

import { useState } from "react";
import styles from './page.module.css';
import { Check } from "@/app/components/svg";
import DocumentEditor from "@/app/components/generator/documenteditor/DocumentEditor";
import DocumentPreview from "@/app/components/generator/documentpreview/DocumentPreview";
import DynamicLegalForm from "@/app/components/generator/dynamiclegalform/DynamicLegalForm";
import DownloadPanel from "@/app/components/generator/downloadpanel/DownloadPanel";

const Generator = () =>
{
    const [step, setStep] = useState(0);
    const totalSteps = 3;

    const nextStep = () =>
    {
        if (step < totalSteps - 1) setStep(step + 1);
    }

    const prevStep = () =>
    {
        if (step > 0) setStep(step - 1);
    }

    const goToStep = (stepIndex: number) =>
    {
        setStep(stepIndex);
    }

    return (
        <div className={styles.generator}>
            <div className={styles.header}>
                <h1>Derecho Administrativo - Derecho de Peticion</h1>
                <p>Aqui puedes generar un derecho de petición personalizado</p>
            </div>
            <div className={styles.stepsIndicator}>
                {Array.from({ length: totalSteps }, (_, index) => (
                    <div key={index} className={styles.stepItem}>
                        <div className={styles.stepWrapper}>
                            <div
                                className={`${styles.stepCircle} ${
                                    index < step ? styles.stepCompleted : index === step ? styles.stepActive : styles.stepInactive
                                }`}
                                onClick={() => goToStep(index)}
                            >
                                {index < step ? <Check className={styles.checkIcon} /> : <span>{index + 1}</span>}
                            </div>
                            <div className={styles.stepTitle}>
                                {index === 0 ? "Información" : index === 1 ? "Configuración" : "Finalización"}
                            </div>
                        </div>
                        {index < totalSteps - 1 && (
                            <div
                                className={`${styles.stepConnector} ${index < step ? styles.connectorCompleted : styles.connectorInactive}`}
                            />
                        )}
                    </div>
                ))}
            </div>
            {((step == 0) ? (
                <DynamicLegalForm />
            ) : ((step == 1) ? (
                <DocumentEditor />
            ) : (
                <div className={styles.actionsContainer}>
                    <div className={styles.actionsLeft}>
                        <DownloadPanel />
                    </div>
                    <div className={styles.actionsRight}>
                        <DocumentPreview />
                    </div>
                </div>
            )))}
        </div>
    );
}

export default Generator;