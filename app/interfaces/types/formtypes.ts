export interface FieldConfig {
    type: "texto" | "fecha" | "numero" | "email" | "booleano" | "seleccion"
    required: boolean
    default_value?: any
    placeholder?: string
    options?: string[]
    format?: string
}

export interface CategoryConfig {
    [key: string]: FieldConfig | CategoryConfig
}

export interface FormSchema {
    document_type: string
    version: string
    creation_date: string
    metadata: {
        title: string
        category: string
        subcategory: string
        applicable_regulations: string[]
        requires_registration: boolean
        legal_validity: boolean
    }
    variable_fields: {
        [categoryName: string]: CategoryConfig
    }
    static_fields?: any
    validations?: any
    text_template?: any
}

export interface FormData {
    [key: string]: any
}
