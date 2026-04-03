"use client"

import styles from "./documentactions.module.css";
import { FileDown, File, Save } from "@/app/components/svg";
import {useFormContext} from "@/context/FormContext";

const DocumentActions = ()=>
{
    const { documentState, formData, schema, saveDocument } = useFormContext();

    const handleDownloadPDF = async () =>
    {
        try
        {
            // Crear el contenido HTML completo para PDF
            const htmlContent = (`
              <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="utf-8">
                    <title>Documento Legal</title>
                    <style>
                      body { 
                        font-family: 'Times New Roman', serif; 
                        line-height: 1.6; 
                        color: #000; 
                        max-width: 800px; 
                        margin: 0 auto; 
                        padding: 40px;
                        font-size: 12px;
                      }
                      .field { 
                        background-color: transparent; 
                        padding: 0; 
                        border: none; 
                        font-weight: bold; 
                        color: #000; 
                      }
                      h1 { 
                        font-size: 18px; 
                        text-align: center; 
                        margin-bottom: 30px; 
                        text-transform: uppercase;
                        font-weight: bold;
                      }
                      h2 { 
                        font-size: 14px; 
                        margin: 20px 0 10px 0; 
                        text-transform: uppercase;
                        font-weight: bold;
                        border-bottom: 1px solid #000;
                        padding-bottom: 2px;
                      }
                      h3 { 
                        font-size: 12px; 
                        margin: 15px 0 8px 0; 
                        font-weight: bold;
                      }
                      p { margin: 8px 0; text-align: justify; }
                      table { width: 100%; border-collapse: collapse; margin: 16px 0; }
                      td { border: 1px solid #000; padding: 8px; font-size: 11px; }
                      ul, ol { margin: 8px 0; padding-left: 20px; }
                      li { margin: 4px 0; }
                      .signature-line { 
                        height: 1px; 
                        background-color: #000; 
                        margin: 20px 0 8px 0; 
                        width: 200px; 
                      }
                      .signatures { 
                        display: grid; 
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                        gap: 32px; 
                        margin-top: 40px; 
                      }
                      .signature-block { text-align: center; }
                      .signature-block p { margin: 4px 0; font-size: 10px; font-weight: bold; }
                      @page { margin: 2cm; }
                    </style>
                  </head>
                  <body>
                    ${documentState.content}
                  </body>
                </html>
            `);

            // Usar html2pdf si está disponible, sino mostrar mensaje
            if (typeof window !== "undefined" && (window as any).html2pdf)
            {
                const element = document.createElement("div");
                element.innerHTML = documentState.content;

                const opt = {
                        margin: 1,
                        filename: "documento-legal.pdf",
                        image: { type: "jpeg", quality: 0.98 },
                        html2canvas: { scale: 2 },
                        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
                };
                (window as any).html2pdf().set(opt).from(element).save();
            }
            else
            {
                // Fallback: crear un blob y descargarlo como HTML
                const blob = new Blob([htmlContent], { type: "text/html" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "documento-legal.html";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                alert("PDF generado como HTML. Para generar PDF real, instala la librería html2pdf.");
            }
        }
        catch (error)
        {
            console.error("Error al generar PDF:", error);
            alert("Error al generar el PDF. Inténtalo de nuevo.");
        }
    }

    const handleDownloadWord = () =>
    {
        try
        {
            // Crear contenido HTML limpio para Word
            const cleanContent = documentState.content
                .replace(/class="[^"]*"/g, "") // Remover clases CSS
                .replace(/<span[^>]*data-field="[^"]*"[^>]*>/g, "<strong>") // Convertir campos a negrita
                .replace(/<\/span>/g, "</strong>");

            const wordContent = (`
                <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                      xmlns:w='urn:schemas-microsoft-com:office:word' 
                      xmlns='http://www.w3.org/TR/REC-html40'>
                  <head>
                    <meta charset='utf-8'>
                    <title>Documento Legal</title>
                    <style>
                      body { 
                        font-family: 'Times New Roman', serif; 
                        font-size: 12pt; 
                        line-height: 1.6; 
                        margin: 2cm;
                      }
                      h1 { 
                        font-size: 16pt; 
                        text-align: center; 
                        font-weight: bold; 
                        text-transform: uppercase;
                        margin-bottom: 20pt;
                      }
                      h2 { 
                        font-size: 14pt; 
                        font-weight: bold; 
                        text-transform: uppercase;
                        border-bottom: 1pt solid black;
                        padding-bottom: 2pt;
                        margin: 15pt 0 10pt 0;
                      }
                      h3 { 
                        font-size: 12pt; 
                        font-weight: bold;
                        margin: 12pt 0 8pt 0;
                      }
                      p { 
                        margin: 6pt 0; 
                        text-align: justify; 
                      }
                      table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 12pt 0; 
                      }
                      td { 
                        border: 1pt solid black; 
                        padding: 6pt; 
                      }
                      strong { 
                        background-color: #e3f2fd; 
                        padding: 1pt 3pt; 
                        font-weight: bold; 
                      }
                    </style>
                  </head>
                  <body>
                    ${cleanContent}
                  </body>
                </html>
            `);

            const blob = new Blob([wordContent], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "documento-legal.doc";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        catch (error)
        {
            console.error("Error al generar Word:", error);
            alert("Error al generar el documento Word. Inténtalo de nuevo.");
        }
    }

    const handleSaveTemplate = () =>
    {
        try
        {
            const template = {
                id: `template_${Date.now()}`,
                name: `Plantilla - ${schema?.metadata?.title || "Documento Legal"}`,
                description: `Plantilla generada el ${new Date().toLocaleDateString("es-ES")}`,
                schema: schema,
                documentContent: documentState.content,
                formData: formData,
                createdAt: new Date().toISOString(),
                version: "1.0",
            }

            // Guardar en localStorage
            const existingTemplates = JSON.parse(localStorage.getItem("legal-form-templates") || "[]");
            existingTemplates.push(template);
            localStorage.setItem("legal-form-templates", JSON.stringify(existingTemplates));

            // También crear un archivo descargable
            const templateBlob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });

            const url = URL.createObjectURL(templateBlob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `plantilla-${template.name.toLowerCase().replace(/\s+/g, "-")}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert(`Plantilla "${template.name}" guardada exitosamente`);
        }
        catch (error)
        {
            console.error("Error al guardar plantilla:", error);
            alert("Error al guardar la plantilla. Inténtalo de nuevo.");
        }
    }

    const hasContent = documentState.content && documentState.content.trim() !== ""

    return (
        <div className={styles.container}>
            <div className={styles.actionsCard}>
                <div className={styles.actionsHeader}>
                    <h3 className={styles.actionsTitle}>Acciones del Documento</h3>
                    <p className={styles.actionsDescription}>
                        Descarga tu documento en diferentes formatos o guárdalo como plantilla
                    </p>
                </div>

                <div className={styles.actionsContent}>
                    <button
                        className={`${styles.actionButton} ${styles.buttonPdf}`}
                        onClick={handleDownloadPDF}
                        disabled={!hasContent}
                        title="Descargar documento en formato PDF"
                    >
                        <FileDown className={styles.buttonIcon} />
                        <div className={styles.buttonContent}>
                            <span className={styles.buttonLabel}>Descargar PDF</span>
                            <span className={styles.buttonSubtext}>Formato para impresión</span>
                        </div>
                    </button>

                    <button
                        className={`${styles.actionButton} ${styles.buttonWord}`}
                        onClick={handleDownloadWord}
                        disabled={!hasContent}
                        title="Descargar documento en formato Word"
                    >
                        <File className={styles.buttonIcon} />
                        <div className={styles.buttonContent}>
                            <span className={styles.buttonLabel}>Descargar Word</span>
                            <span className={styles.buttonSubtext}>Formato editable</span>
                        </div>
                    </button>

                    <button
                        className={`${styles.actionButton} ${styles.buttonTemplate}`}
                        onClick={handleSaveTemplate}
                        disabled={!hasContent}
                        title="Guardar como plantilla reutilizable"
                    >
                        <Save className={styles.buttonIcon} />
                        <div className={styles.buttonContent}>
                            <span className={styles.buttonLabel}>Guardar Plantilla</span>
                            <span className={styles.buttonSubtext}>Para reutilizar</span>
                        </div>
                    </button>
                </div>

                {!hasContent && (
                    <div className={styles.emptyMessage}>
                        <p>Crea contenido en el editor para habilitar las opciones de descarga</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default DocumentActions;