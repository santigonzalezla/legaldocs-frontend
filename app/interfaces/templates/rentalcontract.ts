import {FormSchema} from "@/app/interfaces/types/formtypes";

export const contractSchema: FormSchema = {
    document_type: "contrato_arrendamiento_vivienda",
    version: "1.0",
    creation_date: "2024-07-07",
    metadata: {
        title: "Contrato de Arrendamiento para Vivienda",
        category: "Derecho Civil",
        subcategory: "Contratos",
        applicable_regulations: ["Ley 820 de 2003", "Código Civil Colombiano", "Decreto 051 de 2004"],
        requires_registration: false,
        legal_validity: true
    },
    variable_fields: {
        basic_information: {
            contract_location: {
                type: "texto",
                required: true,
                default_value: "Bogotá D.C.",
                placeholder: "Ciudad donde se firma el contrato"
            },
            contract_date: {
                type: "fecha",
                required: true,
                format: "DD de MMMM de YYYY"
            }
        },
        landlord: {
            person_type: {
                type: "seleccion",
                options: ["persona_natural", "persona_juridica"],
                required: true,
                default_value: "persona_juridica"
            },
            name_company_name: {
                type: "texto",
                required: true,
                placeholder: "Nombre completo o razón social del arrendador"
            },
            identification_document: {
                type: "texto",
                required: true,
                placeholder: "C.C., NIT, etc."
            },
            issuance_city: {
                type: "texto",
                required: true,
                placeholder: "Ciudad de expedición del documento"
            },
            landlord_registration: {
                type: "texto",
                required: true,
                placeholder: "Número de matrícula como arrendador"
            },
            legal_representative: {
                type: "texto",
                required: false,
                placeholder: "Nombre del representante legal (solo para personas jurídicas)"
            },
            surveillance_entity: {
                type: "texto",
                required: false,
                default_value: "Alcaldía Mayor de Bogotá D.C. mediante la Subsecretaria de Inspección, Vigilancia y Control de Vivienda"
            }
        },
        tenant: {
            full_name: {
                type: "texto",
                required: true,
                placeholder: "Nombre completo del arrendatario"
            },
            identification_document: {
                type: "texto",
                required: true,
                placeholder: "C.C. y número"
            },
            issuance_city: {
                type: "texto",
                required: true,
                placeholder: "Ciudad de expedición"
            },
            email: {
                type: "email",
                required: true,
                placeholder: "correo@ejemplo.com"
            }
        },
        joint_debtor: {
            include_debtor: {
                type: "booleano",
                required: true,
                default_value: true
            },
            full_name: {
                type: "texto",
                required: true,
                placeholder: "Nombre completo del deudor solidario"
            },
            identification_document: {
                type: "texto",
                required: true,
                placeholder: "C.C. y número"
            },
            issuance_city: {
                type: "texto",
                required: true,
                placeholder: "Ciudad de expedición"
            },
            email: {
                type: "email",
                required: true,
                placeholder: "correo@ejemplo.com"
            }
        },
        property: {
            property_type: {
                type: "seleccion",
                options: ["apartamento", "casa", "finca", "local"],
                required: true,
                default_value: "apartamento"
            },
            full_address: {
                type: "texto",
                required: true,
                placeholder: "Dirección completa del inmueble"
            },
            complex_name: {
                type: "texto",
                required: false,
                placeholder: "Nombre del conjunto residencial (si aplica)"
            },
            apartment_number: {
                type: "texto",
                required: false,
                placeholder: "Número del apartamento"
            },
            tower: {
                type: "texto",
                required: false,
                placeholder: "Número de torre"
            },
            city: {
                type: "texto",
                required: true,
                default_value: "Bogotá D.C."
            },
            specific_boundaries: {
                east: {
                    type: "texto",
                    required: true,
                    placeholder: "Lindero oriental"
                },
                west: {
                    type: "texto",
                    required: true,
                    placeholder: "Lindero occidental"
                },
                north: {
                    type: "texto",
                    required: true,
                    placeholder: "Lindero norte"
                },
                south: {
                    type: "texto",
                    required: true,
                    placeholder: "Lindero sur"
                },
                zenith: {
                    type: "texto",
                    required: true,
                    placeholder: "Lindero superior"
                },
                nadir: {
                    type: "texto",
                    required: true,
                    placeholder: "Lindero inferior"
                }
            },
            general_boundaries: {
                include_general_boundaries: {
                    type: "booleano",
                    required: true,
                    default_value: false
                },
                east: {
                    type: "texto",
                    required: false,
                    placeholder: "Lindero oriental del conjunto"
                },
                west: {
                    type: "texto",
                    required: false,
                    placeholder: "Lindero occidental del conjunto"
                },
                north: {
                    type: "texto",
                    required: false,
                    placeholder: "Lindero norte del conjunto"
                },
                south: {
                    type: "texto",
                    required: false,
                    placeholder: "Lindero sur del conjunto"
                }
            },
            parking: {
                include_parking: {
                    type: "booleano",
                    required: true,
                    default_value: false
                },
                parking_number: {
                    type: "texto",
                    required: false,
                    placeholder: "Número del garaje o parqueadero"
                }
            }
        },
        economic_conditions: {
            rent_amount: {
                type: "numero",
                required: true,
                placeholder: "Valor mensual del arriendo"
            },
            rent_amount_words: {
                type: "texto",
                required: true,
                placeholder: "Valor en letras"
            },
            administration_fee: {
                include_administration: {
                    type: "booleano",
                    required: true,
                    default_value: true
                },
                administration_amount: {
                    type: "numero",
                    required: false,
                    placeholder: "Valor mensual de administración"
                },
                administration_amount_words: {
                    type: "texto",
                    required: false,
                    placeholder: "Valor de administración en letras"
                }
            },
            collection_entity: {
                type: "texto",
                required: false,
                default_value: "BANCOLOMBIA",
                placeholder: "Entidad bancaria para recaudo"
            }
        },
        validity: {
            validity_type: {
                type: "seleccion",
                options: ["vigencia_inicial_diferente", "vigencia_uniforme"],
                required: true,
                default_value: "vigencia_uniforme"
            },
            initial_validity: {
                start_date: {
                    type: "fecha",
                    required: true,
                    format: "DD de MMMM de YYYY"
                },
                end_date: {
                    type: "fecha",
                    required: true,
                    format: "DD de MMMM de YYYY"
                },
                duration_months: {
                    type: "numero",
                    required: true,
                    default_value: 2
                }
            },
            main_validity: {
                start_date: {
                    type: "fecha",
                    required: true,
                    format: "DD de MMMM de YYYY"
                },
                duration_months: {
                    type: "numero",
                    required: true,
                    default_value: 12
                }
            }
        },
        notifications: {
            landlord_address: {
                type: "texto",
                required: true,
                placeholder: "Dirección física del arrendador"
            },
            landlord_email: {
                type: "email",
                required: true,
                placeholder: "correo@arrendador.com"
            },
            landlord_phone: {
                type: "texto",
                required: true,
                placeholder: "Teléfono del arrendador"
            }
        },
        special_clauses: {
            previous_assignment: {
                include_assignment: {
                    type: "booleano",
                    required: true,
                    default_value: false
                },
                assignor_name: {
                    type: "texto",
                    required: false,
                    placeholder: "Nombre del cedente anterior"
                },
                assignor_document: {
                    type: "texto",
                    required: false,
                    placeholder: "Documento del cedente"
                },
                assignor_city: {
                    type: "texto",
                    required: false,
                    placeholder: "Ciudad de expedición"
                }
            },
            pets: {
                include_pets_clause: {
                    type: "booleano",
                    required: true,
                    default_value: true
                }
            },
            electronic_signature: {
                include_electronic_signature: {
                    type: "booleano",
                    required: true,
                    default_value: true
                },
                signature_platform: {
                    type: "texto",
                    required: false,
                    default_value: "Signio"
                }
            },
            contract_copies: {
                number_of_copies: {
                    type: "numero",
                    required: true,
                    default_value: 4
                },
                delivery_type: {
                    type: "seleccion",
                    options: ["fisicas", "digitales"],
                    required: true,
                    default_value: "digitales"
                }
            }
        }
    }
};