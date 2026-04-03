'use client';

import styles from './dynamiclegalform.module.css';
import {FieldConfig, FormSchema, FormData} from "@/app/interfaces/types/formtypes";
import {useEffect, useState} from "react";
import {ArrowDown, ArrowGo, Briefcase, Download, File, Save} from "@/app/components/svg";
import FormCategory from "@/app/components/generator/formcategory/FormCategory";
import AddCategoryModal from "@/app/components/generator/addcategorymodal/AddCategoryModal";
import DocumentPreview from "@/app/components/generator/documentpreview/DocumentPreview";
import DocumentEditor from "@/app/components/generator/documenteditor/DocumentEditor";
import { useFormContext } from '@/context/FormContext';
import { useFetch } from '@/hooks/useFetch';
import type { LegalProcess, PaginatedResponse } from '@/app/interfaces/interfaces';

const DynamicLegalForm = () =>
{
    const [allExpanded, setAllExpanded] = useState(false);
    const { formData, schema, setSchema, updateFormField, saveDocument, onGenerate, selectedProcessId, setSelectedProcessId, currentDocumentId } = useFormContext();

    const {data: processRes} = useFetch<PaginatedResponse<LegalProcess>>(
        'process?limit=100',
        {firmScoped: true},
    );
    const processes = processRes?.data ?? [];

    useEffect(() =>
    {
        // Reinicializar estados cuando cambia el tipo de documento
        if (schema?.document_type)
        {
            setAllExpanded(false);
        }
    }, [schema?.document_type])

    if (!schema) return <div>No schema provided</div>;

    const handleAddField = (categoryName: string, fieldName: string, config: FieldConfig) =>
    {
        setSchema({
            ...schema,
            variable_fields: {
                ...schema.variable_fields,
                [categoryName]: {
                    ...schema.variable_fields[categoryName],
                    [fieldName]: config,
                },
            },
        });
    }

    const handleAddCategory = (categoryName: string, description: string) =>
    {
        setSchema({
            ...schema,
            variable_fields: {
                ...schema.variable_fields,
                [categoryName]: {},
            },
        });
    }

    const handleDeleteCategory = (categoryName: string) =>
    {
        const newVariableFields = { ...schema.variable_fields };
        delete newVariableFields[categoryName];

        setSchema({
            ...schema,
            variable_fields: newVariableFields,
        });
    }

    const handleToggleAll = () => setAllExpanded(!allExpanded);

    const handleSave = () => saveDocument();

    const handleGenerate = () => onGenerate?.(formData);

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.headerCard}>
                <div className={styles.headerCardHeader}>
                    <div className={styles.headerTop}>
                        <div className={styles.titleSection}>
                            <h1 className={styles.title}>
                                <File className={styles.titleIcon} />
                                {schema.metadata.title}
                            </h1>
                            <div className={styles.badges}>
                                {currentDocumentId && (
                                    <span className={`${styles.badge} ${styles.badgeSecondary}`}>{currentDocumentId}</span>
                                )}
                                <span className={`${styles.badge} ${styles.badgeOutline}`}>{schema.metadata.subcategory}</span>
                                <span className={`${styles.badge} ${styles.badgeOutline}`}>v{schema.version}</span>
                            </div>
                        </div>
                        <div className={styles.actionButtons}>
                            <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={handleToggleAll}>
                                {allExpanded ? (
                                    <>
                                        <ArrowGo className={styles.buttonIcon} />
                                        Colapsar Todo
                                    </>
                                ) : (
                                    <>
                                        <ArrowDown className={styles.buttonIcon} />
                                        Expandir Todo
                                    </>
                                )}
                            </button>
                            <button className={`${styles.button} ${styles.buttonOutline}`} onClick={handleSave}>
                                <Save className={styles.buttonIcon} />
                                Guardar
                            </button>
                            <button className={`${styles.button} ${styles.buttonPrimary}`} onClick={handleGenerate}>
                                <Download className={styles.buttonIcon} />
                                Generar Documento
                            </button>
                        </div>
                    </div>
                </div>
                <div className={styles.headerCardContent}>
                    <div className={styles.regulationsSection}>
                        <p className={styles.regulationsTitle}>Regulaciones aplicables:</p>
                        <ul className={styles.regulationsList}>
                            {schema.metadata.applicable_regulations.map((reg, index) => (
                                <li key={index}>{reg}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

           {/* Process association card */}
           <div className={styles.processCard}>
               <div className={styles.processCardIcon}><Briefcase /></div>
               <div className={styles.processCardBody}>
                   <label className={styles.processCardLabel}>
                       ¿Para qué caso es este documento?
                       <span className={styles.processCardOptional}> (opcional)</span>
                   </label>
                   <select
                       className={styles.processCardSelect}
                       value={selectedProcessId}
                       onChange={e => setSelectedProcessId(e.target.value)}
                   >
                       <option value="">Sin proceso asociado</option>
                       {processes.map(p => (
                           <option key={p.id} value={p.id}>{p.title}</option>
                       ))}
                   </select>
               </div>
           </div>

           <div className={styles.dynamicContainer}>
               <div className={styles.dynamicContainerLeft}>
                   {/* Form Categories */}
                   <div className={styles.categoriesContainer}>
                       {Object.entries(schema.variable_fields).map(([categoryName, categoryConfig]) => (
                           <FormCategory
                               key={categoryName}
                               categoryName={categoryName}
                               categoryConfig={categoryConfig}
                               formData={formData}
                               onFieldChange={updateFormField}
                               onAddField={handleAddField}
                               onDeleteCategory={handleDeleteCategory}
                               forceExpanded={allExpanded}
                           />
                       ))}
                   </div>

                   {/* Add Category Button */}
                   <AddCategoryModal onAddCategory={handleAddCategory} />
               </div>

               <div className={styles.dynamicContainerRight}>
                   {/* Document Editor */}
                   <DocumentEditor />
               </div>
           </div>

            {/* Form Summary */}
            <div className={styles.summaryCard}>
                <div className={styles.summaryHeader}>
                    <h2 className={styles.summaryTitle}>Resumen del Formulario</h2>
                </div>
                <div className={styles.summaryContent}>
                    <div className={styles.summaryGrid}>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>Categorías:</span>
                            <p>{Object.keys(schema.variable_fields).length}</p>
                        </div>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>Campos completados:</span>
                            <p>{Object.values(formData).reduce((acc, category) => acc + Object.keys(category || {}).length, 0)}</p>
                        </div>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>Registro requerido:</span>
                            <p>{schema.metadata.requires_registration ? "Sí" : "No"}</p>
                        </div>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>Validez legal:</span>
                            <p>{schema.metadata.legal_validity ? "Válido" : "No válido"}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DynamicLegalForm;