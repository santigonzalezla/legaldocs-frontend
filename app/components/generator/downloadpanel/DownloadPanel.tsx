"use client"

import { useState } from "react";
import styles from "./downloadpanel.module.css";
import { Download, File, Save, Loader } from "@/app/components/svg";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from "docx";
import { useFormContext } from "@/context/FormContext";

// Helper function to download files without file-saver
const downloadFile = (blob: Blob, filename: string) =>
{
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

const DownloadPanel = ()=>
{
    const { documentState, formData, schema, saveDocument } = useFormContext();
    const [isGenerating, setIsGenerating] = useState<string | null>(null);

    const parseHtmlToDocxElements = (html: string) =>
    {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        const elements: any[] = [];

        // Función para convertir HTML a elementos DOCX de manera más directa
        const convertHtmlToDocx = (htmlContent: string) =>
        {
            // Crear un parser DOM temporal
            const parser = new DOMParser();
            const doc = parser.parseFromString(`<div>${htmlContent}</div>`, "text/html");
            const container = doc.querySelector("div");

            if (!container) return [];

            const processNode = (node: Node): void =>
            {
                if (node.nodeType === Node.TEXT_NODE)
                {
                    const text = node.textContent?.trim();

                    if (text)
                    {
                        elements.push(
                            new Paragraph({
                                children: [new TextRun({ text, color: "000000" })],
                                spacing: { after: 120 },
                            }),
                        );
                    }
                }
                else if (node.nodeType === Node.ELEMENT_NODE)
                {
                    const element = node as Element;
                    const tagName = element.tagName.toLowerCase();
                    const textContent = element.textContent?.trim() || "";

                    switch (tagName)
                    {
                        case "h1":
                            if (textContent)
                            {
                                elements.push(
                                    new Paragraph({
                                        children: [ new TextRun({text: textContent, bold: true, size: 32, color: "000000",}) ],
                                        heading: HeadingLevel.HEADING_1,
                                        alignment: AlignmentType.CENTER,
                                        spacing: { before: 400, after: 400 },
                                        border: { bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 6 } },
                                    }),
                                );
                            }
                            break;

                        case "h2":
                            if (textContent)
                            {
                                elements.push(
                                    new Paragraph({
                                        children: [ new TextRun({text: textContent, bold: true, size: 24, color: "000000",}) ],
                                        heading: HeadingLevel.HEADING_2,
                                        spacing: { before: 300, after: 200 },
                                        border: { bottom: {color: "CCCCCC", space: 1, style: BorderStyle.SINGLE, size: 3,} },
                                    }),
                                );
                            }
                            break;

                        case "h3":
                            if (textContent)
                            {
                                elements.push(
                                    new Paragraph({
                                        children: [ new TextRun({text: textContent, bold: true, size: 20, color: "000000"}) ],
                                        heading: HeadingLevel.HEADING_3,
                                        spacing: { before: 240, after: 120 },
                                    }),
                                );
                            }
                            break;

                        case "p":
                            // Procesar párrafos con contenido mixto
                            const runs: TextRun[] = [];

                            const processInlineContent = (node: Node) =>
                            {
                                if (node.nodeType === Node.TEXT_NODE)
                                {
                                    const text = node.textContent;

                                    if (text) runs.push(new TextRun({ text, color: "000000" }));
                                }
                                else if (node.nodeType === Node.ELEMENT_NODE)
                                {
                                    const inlineEl = node as Element;
                                    const inlineText = inlineEl.textContent;

                                    if (inlineText)
                                    {
                                        const isBold =
                                            inlineEl.tagName.toLowerCase() === "strong" ||
                                            inlineEl.tagName.toLowerCase() === "b" ||
                                            inlineEl.classList.contains("field") ||
                                            inlineEl.hasAttribute("data-field");

                                        const isItalic = inlineEl.tagName.toLowerCase() === "em" || inlineEl.tagName.toLowerCase() === "i";

                                        runs.push(
                                            new TextRun({ text: inlineText, bold: isBold, italics: isItalic, color: "000000" }),
                                        );
                                    }
                                }
                            }

                            Array.from(element.childNodes).forEach(processInlineContent);

                            if (runs.length > 0)
                            {
                                elements.push(
                                    new Paragraph({
                                        children: runs,
                                        spacing: { after: 120 },
                                    }),
                                );
                            }
                            else if (textContent)
                            {
                                elements.push(
                                    new Paragraph({
                                        children: [new TextRun({ text: textContent, color: "000000" })],
                                        spacing: { after: 120 },
                                    }),
                                );
                            }
                            else
                            {
                                // Párrafo vacío para espaciado
                                elements.push(
                                    new Paragraph({
                                        children: [new TextRun({ text: " ", color: "000000" })],
                                        spacing: { after: 120 },
                                    }),
                                );
                            }
                            break;

                        case "div":
                            // Manejar divs especiales
                            if (element.classList.contains("document-header"))
                            {
                                // Agregar espacio extra después del header
                                Array.from(element.children).forEach((child) => processNode(child));

                                elements.push(
                                    new Paragraph({
                                        children: [new TextRun({ text: " ", color: "000000" })],
                                        spacing: { after: 400 },
                                    }),
                                );
                            }
                            else if (element.classList.contains("signatures"))
                            {
                                // Área de firmas - agregar espacio antes
                                elements.push(
                                    new Paragraph({
                                        children: [new TextRun({ text: " ", color: "000000" })],
                                        spacing: { before: 600, after: 200 },
                                    }),
                                );
                                Array.from(element.children).forEach((child) => processNode(child));
                            }
                            else if (element.classList.contains("signature-block"))
                            {
                                // Bloque individual de firma - buscar la línea de firma
                                const signatureLine = element.querySelector(".signature-line");

                                if (signatureLine)
                                {
                                    // Agregar línea de firma con guiones bajos
                                    elements.push(
                                        new Paragraph({
                                            children: [ new TextRun({ text: "____________________________________", color: "000000",}) ],
                                            alignment: AlignmentType.CENTER,
                                            spacing: { before: 300, after: 120 },
                                        }),
                                    );
                                }

                                // Textos de la firma (solo los párrafos p, no la línea)
                                const signaturePs = element.querySelectorAll("p");
                                signaturePs.forEach((p) =>
                                {
                                    const pText = p.textContent?.trim();

                                    if (pText)
                                    {
                                        elements.push(
                                            new Paragraph({
                                                children: [ new TextRun({ text: pText, bold: true, size: 20, color: "000000" })],
                                                alignment: AlignmentType.CENTER,
                                                spacing: { after: 80 },
                                            }),
                                        );
                                    }
                                });

                                // Espacio después del bloque
                                elements.push(
                                    new Paragraph({
                                        children: [new TextRun({ text: " ", color: "000000" })],
                                        spacing: { after: 200 },
                                    }),
                                );
                            }
                            else if (element.classList.contains("signature-line"))
                            {
                                // Línea de firma específica - no procesar aquí, se maneja en signature-block
                                // Solo agregar si no está dentro de un signature-block
                                const parentSignatureBlock = element.closest(".signature-block");

                                if (!parentSignatureBlock)
                                {
                                    elements.push(
                                        new Paragraph({
                                            children: [ new TextRun({text: "____________________________________", color: "000000"})],
                                            alignment: AlignmentType.CENTER,
                                            spacing: { before: 200, after: 80 },
                                        }),
                                    );
                                }
                            }
                            else
                            {
                                // Otros divs - procesar hijos
                                Array.from(element.children).forEach((child) => processNode(child));
                            }
                            break;

                        case "ul":
                            Array.from(element.children).forEach((li, index) =>
                            {
                                if (li.tagName.toLowerCase() === "li")
                                {
                                    elements.push(
                                        new Paragraph({
                                            children: [new TextRun({ text: `• ${li.textContent}`, color: "000000" })],
                                            spacing: { after: 80 },
                                            indent: { left: 720 },
                                        }),
                                    );
                                }
                            });

                            break;

                        case "ol":
                            Array.from(element.children).forEach((li, index) =>
                            {
                                if (li.tagName.toLowerCase() === "li")
                                {
                                    elements.push(
                                        new Paragraph({
                                            children: [new TextRun({ text: `${index + 1}. ${li.textContent}`, color: "000000" })],
                                            spacing: { after: 80 },
                                            indent: { left: 720 },
                                        }),
                                    );
                                }
                            });
                            break;

                        case "table":
                            // Procesar tabla
                            const rows = element.querySelectorAll("tr");
                            rows.forEach((row, rowIndex) =>
                            {
                                const cells = Array.from(row.querySelectorAll("td, th"));
                                const cellTexts = cells.map((cell) => cell.textContent || "").join(" | ");

                                if (cellTexts.trim())
                                {
                                    const isHeader = row.querySelector("th") !== null;

                                    elements.push(
                                        new Paragraph({
                                            children: [
                                                new TextRun({
                                                    text: cellTexts,
                                                    bold: isHeader,
                                                    color: "000000",
                                                }),
                                            ],
                                            spacing: { after: 80 },
                                            indent: { left: 360 },
                                            border: isHeader
                                                ? {
                                                    bottom: {
                                                        color: "000000",
                                                        space: 1,
                                                        style: BorderStyle.SINGLE,
                                                        size: 3,
                                                    },
                                                }
                                                : undefined,
                                        }),
                                    );
                                }
                            });
                            break;

                        case "br":
                            elements.push(
                                new Paragraph({
                                    children: [new TextRun({ text: " ", color: "000000" })],
                                    spacing: { after: 120 },
                                }),
                            );
                            break;

                        default:
                            // Para otros elementos, procesar hijos
                            Array.from(element.children).forEach((child) => processNode(child));
                            break;
                    }
                }
            }

            Array.from(container.childNodes).forEach(processNode)
            return elements
        }

        // Usar la función de conversión
        const docxElements = convertHtmlToDocx(html)

        // Si no hay elementos, crear contenido básico
        if (docxElements.length === 0)
        {
            const textContent = tempDiv.textContent || "";

            if (textContent.trim())
            {
                return [
                    new Paragraph({
                        children: [new TextRun({ text: textContent, color: "000000" })],
                        spacing: { after: 120 },
                    }),
                ];
            }
            else
            {
                return [
                    new Paragraph({
                        children: [new TextRun({ text: "Documento vacío", color: "000000" })],
                    }),
                ];
            }
        }

        return docxElements
    }

    const handleDownloadPDF = async () =>
    {
        if (!documentState.content)
        {
            alert("No hay contenido para descargar");
            return;
        }

        setIsGenerating("pdf");

        try
        {
            // Dynamic imports to avoid SSR issues
            const jsPDF = (await import("jspdf")).jsPDF;
            const html2canvas = (await import("html2canvas")).default;

            // Crear un elemento temporal con el contenido
            const element = document.createElement("div");
            element.innerHTML = documentState.content;
            element.style.fontFamily = "Times New Roman, serif";
            element.style.fontSize = "14px";
            element.style.lineHeight = "1.6";
            element.style.color = "#000000";
            element.style.backgroundColor = "#ffffff";
            element.style.padding = "40px";
            element.style.maxWidth = "800px";
            element.style.margin = "0 auto";
            element.style.position = "absolute";
            element.style.left = "-9999px";
            element.style.top = "0";

            // Agregar estilos CSS para anular completamente los estilos de campos
            const style = document.createElement("style");
            style.textContent = (`
                .field, [data-field] {
                background-color: transparent !important;
                border: none !important;
                padding: 0 !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                color: #000000 !important;
                font-weight: bold !important;
                }
            `);
            element.appendChild(style);

            // Asegurar que todos los elementos tengan color negro y remover estilos de campos
            const allElements = element.querySelectorAll("*");

            allElements.forEach((el) =>
            {
                const htmlEl = el as HTMLElement;
                htmlEl.style.color = "#000000";

                // Remover completamente los estilos de los campos/variables
                if (htmlEl.classList.contains("field") || htmlEl.hasAttribute("data-field"))
                {
                    htmlEl.style.backgroundColor = "transparent";
                    htmlEl.style.border = "none";
                    htmlEl.style.fontWeight = "bold";
                    htmlEl.style.padding = "0";
                    htmlEl.style.borderRadius = "0";
                    htmlEl.style.boxShadow = "none";
                    htmlEl.style.textDecoration = "none";
                    // Remover cualquier clase que pueda aplicar estilos
                    htmlEl.className = "";
                }
            });

            document.body.appendChild(element);

            // Generar canvas del contenido
            const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false });

            document.body.removeChild(element);

            // Crear PDF
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

            const imgWidth = 210; // A4 width in mm
            const pageHeight = 295; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;

            let position = 0;

            // Agregar primera página
            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Agregar páginas adicionales si es necesario
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            // Descargar el PDF
            pdf.save("documento-legal.pdf");
            alert("PDF descargado exitosamente");
        }
        catch (error)
        {
            console.error("Error generating PDF:", error);
            alert("Error al generar el PDF. Por favor, intenta de nuevo.");
        }
        finally
        {
            setIsGenerating(null);
        }
    }

    const handleDownloadWord = async () =>
    {
        if (!documentState.content)
        {
            alert("No hay contenido para descargar");
            return;
        }

        setIsGenerating("word");

        try
        {
            const docxElements = parseHtmlToDocxElements(documentState.content);

            const doc = new Document({
                sections: [
                    {
                        properties: {},
                        children: docxElements,
                    },
                ],
            });

            const buffer = await Packer.toBuffer(doc);
            const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });

            downloadFile(blob, "documento-legal.docx");
            alert("Documento Word descargado exitosamente");
        }
        catch (error)
        {
            console.error("Error generating Word document:", error);
            alert("Error al generar el documento Word. Por favor, intenta de nuevo.");
        }
        finally
        {
            setIsGenerating(null);
        }
    }

    const handleSaveTemplate = () =>
    {
        setIsGenerating("template");

        try
        {
            const templateData = {
                schema,
                formData,
                documentContent: documentState.content,
                timestamp: new Date().toISOString(),
                templateName: schema?.metadata?.title || "Plantilla Legal",
            }

            const blob = new Blob([JSON.stringify(templateData, null, 2)], {
                type: "application/json",
            });

            const fileName = `plantilla-${schema?.document_type || "legal"}-${new Date().toISOString().split("T")[0]}.json`;
            downloadFile(blob, fileName);

            // También guardar en el contexto
            saveDocument();
            alert("Plantilla guardada exitosamente");
        }
        catch (error)
        {
            console.error("Error saving template:", error);
            alert("Error al guardar la plantilla. Por favor, intenta de nuevo.");
        }
        finally
        {
            setIsGenerating(null);
        }
    }

    const hasContent = documentState.content && documentState.content.trim() !== "";

    return (
        <div className={styles.container}>
            <div className={styles.downloadCard}>
                <div className={styles.downloadHeader}>
                    <div className={styles.downloadTitle}>
                        <Download className={styles.downloadIcon}/>
                        <h2>Descargar Documento</h2>
                    </div>
                </div>

                <div className={styles.downloadContent}>
                    <div className={styles.downloadGrid}>
                        <button
                            className={`${styles.downloadButton} ${styles.pdfButton}`}
                            onClick={handleDownloadPDF}
                            disabled={!hasContent || isGenerating === "pdf"}
                        >
                            {isGenerating === "pdf" ? (
                                <Loader className={`${styles.downloadButtonIcon} ${styles.spinning}`}/>
                            ) : (
                                <File className={styles.downloadButtonIcon}/>
                            )}
                            <div className={styles.downloadButtonContent}>
                                <span className={styles.downloadButtonTitle}>Descargar PDF</span>
                                <span className={styles.downloadButtonDescription}>
                                    {isGenerating === "pdf" ? "Generando..." : "Formato portable para impresión"}
                                </span>
                            </div>
                        </button>

                        <button
                            className={`${styles.downloadButton} ${styles.wordButton}`}
                            onClick={handleDownloadWord}
                            disabled={!hasContent || isGenerating === "word"}
                        >
                            {isGenerating === "word" ? (
                                <Loader className={`${styles.downloadButtonIcon} ${styles.spinning}`}/>
                            ) : (
                                <File className={styles.downloadButtonIcon}/>
                            )}
                            <div className={styles.downloadButtonContent}>
                                <span className={styles.downloadButtonTitle}>Descargar Word</span>
                                <span className={styles.downloadButtonDescription}>
                                    {isGenerating === "word" ? "Generando..." : "Formato .docx editable"}
                                </span>
                            </div>
                        </button>

                        <button
                            className={`${styles.downloadButton} ${styles.templateButton}`}
                            onClick={handleSaveTemplate}
                            disabled={isGenerating === "template"}
                        >
                            {isGenerating === "template" ? (
                                <Loader className={`${styles.downloadButtonIcon} ${styles.spinning}`}/>
                            ) : (
                                <Save className={styles.downloadButtonIcon}/>
                            )}
                            <div className={styles.downloadButtonContent}>
                                <span className={styles.downloadButtonTitle}>Guardar Plantilla</span>
                                <span className={styles.downloadButtonDescription}>
                                    {isGenerating === "template" ? "Guardando..." : "Guardar como plantilla reutilizable"}
                                </span>
                            </div>
                        </button>
                    </div>

                    {!hasContent && (
                        <div className={styles.noContentMessage}>
                            <File className={styles.noContentIcon}/>
                            <p>No hay contenido disponible para descargar. Usa el editor para crear contenido
                                primero.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}

export default DownloadPanel;