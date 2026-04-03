'use client';

import styles from './page.module.css';
import {useState} from 'react';
import TemplateEditor from '@/app/components/settings/templates/templateeditor/TemplateEditor';
import TemplateList from '@/app/components/settings/templates/templatelist/TemplateList';

const Templates = () =>
{
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [showEditor, setShowEditor]             = useState(false);
    const [listKey, setListKey]                   = useState(0);

    const handleCreateNew = () =>
    {
        setSelectedTemplate(null);
        setShowEditor(true);
    };

    const handleEditTemplate = (templateId: string) =>
    {
        setSelectedTemplate(templateId);
        setShowEditor(true);
    };

    const handleClose = () =>
    {
        setShowEditor(false);
        setSelectedTemplate(null);
    };

    const handleSaved = () =>
    {
        handleClose();
        setListKey(k => k + 1);
    };

    return (
        <div className={styles.templates}>
            <div className={styles.top}>
                <div className={styles.header}>
                    <h1>Plantillas Personalizadas</h1>
                    <p>Crea y gestiona las plantillas de documentos de tu despacho.</p>
                </div>
                {!showEditor && (
                    <button className={styles.createButton} onClick={handleCreateNew}>
                        + Nueva Plantilla
                    </button>
                )}
            </div>
            {showEditor ? (
                <TemplateEditor
                    templateId={selectedTemplate}
                    onClose={handleClose}
                    onSaved={handleSaved}
                />
            ) : (
                <TemplateList
                    key={listKey}
                    onCreateNew={handleCreateNew}
                    onEditTemplate={handleEditTemplate}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
};

export default Templates;
