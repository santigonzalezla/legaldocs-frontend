import { FormSchema } from "@/app/interfaces/types/formtypes";

export const rightRequestSchema: FormSchema = {
    document_type: "derecho_peticion",
    version: "1.0",
    creation_date: "2025-07-23",
    metadata: {
        title: "Derecho de Petición",
        category: "Derecho Administrativo",
        subcategory: "Peticiones",
        applicable_regulations: [
            "Constitución Política de Colombia Art. 23",
            "Ley 1755 de 2015",
            "Ley 1437 de 2011",
            "Ley 1480 de 2011",
        ],
        requires_registration: false,
        legal_validity: true,
    },
    variable_fields: {
        informacion_basica: {
            lugar_peticion: {
                type: "texto",
                required: true,
                default_value: "Bogotá D.C.",
                placeholder: "Ciudad donde se presenta la petición",
            },
            fecha_peticion: {
                type: "fecha",
                required: true,
                format: "DD de MMMM de YYYY",
            },
            tipo_peticion: {
                type: "seleccion",
                options: ["informacion", "queja", "reclamo", "sugerencia", "denuncia", "consulta", "solicitud_servicio"],
                required: true,
                default_value: "reclamo",
            },
        },
        peticionario: {
            tipo_persona: {
                type: "seleccion",
                options: ["persona_natural", "persona_juridica", "representante_legal"],
                required: true,
                default_value: "persona_natural",
            },
            nombre_completo: {
                type: "texto",
                required: true,
                placeholder: "Nombre completo del peticionario",
            },
            documento_identificacion: {
                type: "texto",
                required: true,
                placeholder: "C.C., NIT, etc.",
            },
            ciudad_expedicion: {
                type: "texto",
                required: true,
                placeholder: "Ciudad de expedición del documento",
            },
            domicilio: {
                type: "texto",
                required: true,
                placeholder: "Ciudad de domicilio",
            },
            calidad_peticionario: {
                type: "seleccion",
                options: ["nombre_propio", "representante_legal", "apoderado", "organizacion_consumidores"],
                required: true,
                default_value: "nombre_propio",
            },
            representado_nombre: {
                type: "texto",
                required: false,
                placeholder: "Nombre del representado (si aplica)",
            },
            representado_documento: {
                type: "texto",
                required: false,
                placeholder: "Documento del representado",
            },
        },
        destinatario: {
            tipo_entidad: {
                type: "seleccion",
                options: ["superintendencia", "empresa_privada", "entidad_publica", "autoridad_administrativa"],
                required: true,
                default_value: "superintendencia",
            },
            nombre_entidad: {
                type: "texto",
                required: true,
                placeholder: "Nombre de la entidad destinataria",
            },
            cargo_funcionario: {
                type: "texto",
                required: false,
                placeholder: "Cargo del funcionario específico",
            },
            area_responsable: {
                type: "texto",
                required: false,
                placeholder: "Área o departamento responsable",
            },
        },
        empresa_objeto_queja: {
            incluir_empresa: {
                type: "booleano",
                required: true,
                default_value: true,
            },
            nombre_empresa: {
                type: "texto",
                required: false,
                placeholder: "Nombre de la empresa objeto de la queja",
            },
            nit_empresa: {
                type: "texto",
                required: false,
                placeholder: "NIT de la empresa",
            },
            tipo_servicio: {
                type: "seleccion",
                options: ["telecomunicaciones", "servicios_publicos", "financiero", "salud", "educacion", "transporte", "otro"],
                required: false,
                default_value: "telecomunicaciones",
            },
            numero_cliente: {
                type: "texto",
                required: false,
                placeholder: "Número de cliente o contrato",
            },
            linea_servicio: {
                type: "texto",
                required: false,
                placeholder: "Número de línea o servicio específico",
            },
        },
        antecedentes: {
            peticion_previa: {
                incluir_peticion_previa: {
                    type: "booleano",
                    required: true,
                    default_value: false,
                },
                fecha_peticion_previa: {
                    type: "fecha",
                    required: false,
                    format: "DD de MMMM de YYYY",
                },
                numero_radicado: {
                    type: "texto",
                    required: false,
                    placeholder: "Número de radicado de petición anterior",
                },
                respuesta_satisfactoria: {
                    type: "booleano",
                    required: false,
                    default_value: false,
                },
                fecha_respuesta: {
                    type: "fecha",
                    required: false,
                    format: "DD de MMMM de YYYY",
                },
            },
        },
        hechos: {
            descripcion_hechos: {
                type: "texto",
                required: true,
                placeholder: "Descripción detallada de los hechos que motivan la petición",
            },
            fecha_hechos: {
                type: "fecha",
                required: false,
                format: "DD de MMMM de YYYY",
            },
        },
        fundamentos_derecho: {
            incluir_fundamentos: {
                type: "booleano",
                required: true,
                default_value: true,
            },
            fundamento_principal: {
                type: "seleccion",
                options: [
                    "derecho_peticion_art23",
                    "ley_1755_2015",
                    "ley_1437_2011",
                    "ley_1480_2011_consumidor",
                    "ley_1581_2012_datos",
                    "ley_1266_2008_habeas_data",
                    "debido_proceso",
                    "buena_fe",
                ],
                required: true,
                default_value: "derecho_peticion_art23",
            },
            fundamento_personalizado: {
                type: "texto",
                required: false,
                placeholder: "Fundamento jurídico adicional personalizado",
            },
        },
        pretensiones: {
            solicitud_principal: {
                type: "texto",
                required: true,
                placeholder: "Descripción principal de lo que se solicita",
            },
            tipo_pretension: {
                type: "seleccion",
                options: [
                    "informacion",
                    "restablecimiento_servicio",
                    "investigacion",
                    "sancion",
                    "reparacion_danos",
                    "proteccion_datos",
                    "otro",
                ],
                required: true,
                default_value: "informacion",
            },
        },
        anexos: {
            incluir_anexos: {
                type: "booleano",
                required: true,
                default_value: true,
            },
            descripcion_anexos: {
                type: "texto",
                required: false,
                placeholder: "Descripción de los documentos anexos",
            },
        },
        notificaciones: {
            direccion_fisica: {
                type: "texto",
                required: true,
                placeholder: "Dirección completa para notificaciones",
            },
            ciudad_notificaciones: {
                type: "texto",
                required: true,
                default_value: "Bogotá D.C.",
            },
            correo_electronico: {
                type: "email",
                required: true,
                placeholder: "correo@ejemplo.com",
            },
            telefono_contacto: {
                type: "texto",
                required: true,
                placeholder: "Número de teléfono",
            },
            telefono_alternativo: {
                type: "texto",
                required: false,
                placeholder: "Teléfono alternativo",
            },
        },
        firma: {
            incluir_firma_digital: {
                type: "booleano",
                required: true,
                default_value: false,
            },
            firma_manuscrita: {
                type: "booleano",
                required: true,
                default_value: true,
            },
        },
    },
}
