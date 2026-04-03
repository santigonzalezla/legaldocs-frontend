"use client"

import styles from "./documentpreview.module.css";
import { File, Printer, Download } from "@/app/components/svg";
import { useFormContext } from "@/context/FormContext";

const DocumentPreview = () =>
{
    const { documentState, schema } = useFormContext();

    const getDocumentTitle = () =>
    {
        if (schema?.metadata?.title) return schema.metadata.title;

        return "Vista Previa del Documento";
    }

    const hasContent = documentState.content && documentState.content.trim() !== ""

    return (
        <div className={styles.container}>
            <div className={styles.previewCard}>
                <div className={styles.previewHeader}>
                    <div className={styles.previewTitle}>
                        <File className={styles.previewIcon} />
                        <h2>{getDocumentTitle()}</h2>
                    </div>
                </div>

                <div className={styles.previewContent}>
                    {hasContent ? (
                        <div className={styles.documentViewer} dangerouslySetInnerHTML={{ __html: documentState.content }} />
                    ) : (
                        <div className={styles.emptyState}>
                            <File className={styles.emptyIcon} />
                            <h3>No hay contenido para mostrar</h3>
                            <p>El documento aparecerá aquí una vez que uses el editor para crear contenido.</p>
                        </div>
                    )}
                </div>

                {hasContent && (
                    <div className={styles.previewFooter}>
                        <div className={styles.documentInfo}>
                            <span className={styles.infoLabel}>Estado:</span>
                            <span className={styles.infoValue}>{documentState.hasUnsavedChanges ? "Cambios sin guardar" : "Guardado"}</span>
                            {documentState.hasCustomContent && (
                                <>
                                    <span className={styles.infoSeparator}>•</span>
                                    <span className={styles.infoValue}>Contenido personalizado</span>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default DocumentPreview;