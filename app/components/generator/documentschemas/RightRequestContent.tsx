import styles from  "./documentschemas.module.css";
import { FormData } from "@/app/interfaces/types/formtypes";

const generatePetitionContent = (getValue: Function, formatDate: Function, schema: FormData) =>
{
    const tipoPeticionMap = {
        informacion: "SOLICITUD DE INFORMACIÓN",
        queja: "QUEJA",
        reclamo: "RECLAMO",
        sugerencia: "SUGERENCIA",
        denuncia: "DENUNCIA",
        consulta: "CONSULTA",
        solicitud_servicio: "SOLICITUD DE SERVICIO",
    }

    const tipoPeticion = getValue("informacion_basica.tipo_peticion", "reclamo")
    const tipoPeticionTexto = tipoPeticionMap[tipoPeticion as keyof typeof tipoPeticionMap] || "RECLAMO";

    return (`
        <div class="${styles.documentContent}">
          <div class="${styles.documentHeader}">
            <h1>${tipoPeticionTexto}</h1>
            <div class="${styles.documentMeta}">
              <p><strong>Documento:</strong> ${schema.document_type}</p>
              <p><strong>Versión:</strong> ${schema.version}</p>
              <p><strong>Fecha de creación:</strong> ${formatDate(schema.creation_date, "Fecha de Creación")}</p>
            </div>
          </div>
    
          <div class="${styles.documentBody}">
            <div class="${styles.section}">
              <p style="text-align: right;"><span class="${styles.field}" data-field="informacion_basica.lugar_peticion">${getValue("informacion_basica.lugar_peticion", "Ciudad de la Petición")}</span>, <span class="${styles.field}" data-field="informacion_basica.fecha_peticion">${formatDate(getValue("informacion_basica.fecha_peticion", "Fecha de la Petición"), "Fecha de la Petición")}</span></p>
            </div>
    
            <div class="${styles.section}">
              <p><strong>Señores</strong><br>
              <span class="${styles.field}" data-field="destinatario.nombre_entidad">${getValue("destinatario.nombre_entidad", "Nombre de la Entidad")}</span><br>
              <span class="${styles.field}" data-field="destinatario.cargo_funcionario">${getValue("destinatario.cargo_funcionario", "Cargo del Funcionario")}</span></p>
              
              <p><strong>Asunto:</strong> ${tipoPeticionTexto}</p>
              
              <p>Respetados señores:</p>
            </div>
    
            <div class="${styles.section}">
              <p>Yo, <span class="${styles.field}" data-field="peticionario.nombre_completo">${getValue("peticionario.nombre_completo", "Nombre del Peticionario")}</span>, mayor de edad, identificado(a) con <span class="${styles.field}" data-field="peticionario.documento_identificacion">${getValue("peticionario.documento_identificacion", "Documento de Identificación")}</span> expedida en <span class="${styles.field}" data-field="peticionario.ciudad_expedicion">${getValue("peticionario.ciudad_expedicion", "Ciudad de Expedición")}</span>, domiciliado(a) en <span class="${styles.field}" data-field="peticionario.domicilio">${getValue("peticionario.domicilio", "Ciudad de Domicilio")}</span>, obrando en nombre propio, respetuosamente me dirijo a ustedes en ejercicio del Derecho Fundamental de Petición consagrado en el artículo 23 de la Constitución Política, con el fin de presentar la siguiente ${tipoPeticionTexto.toLowerCase()}, conforme a mis derechos como ciudadano y usuario, para que sea resuelta de conformidad con lo preceptuado en la Ley 1755 de 2015.</p>
            </div>
    
            <div class="${styles.section}">
              <h2>HECHOS</h2>
              <p><span class="${styles.field}" data-field="hechos.descripcion_hechos">${getValue("hechos.descripcion_hechos", "Descripción de los Hechos")}</span></p>
              <p><strong>Fecha de los hechos:</strong> <span class="${styles.field}" data-field="hechos.fecha_hechos">${formatDate(getValue("hechos.fecha_hechos", "Fecha de los Hechos"), "Fecha de los Hechos")}</span></p>
            </div>
    
            <div class="${styles.section}">
              <h2>FUNDAMENTOS DE DERECHO</h2>
              <p><strong>DERECHO FUNDAMENTAL DE PETICIÓN:</strong> A través del artículo 23 de la Carta política se establece que: "Toda persona tiene derecho a presentar peticiones respetuosas a las autoridades por motivos de interés general o particular y a obtener pronta resolución..."</p>
              
              <p><strong>Término para la Resolución del Derecho de Petición:</strong> En aras de cumplir el mandato constitucional, el artículo 14 de la Ley 1755 del 2015 estableció que: "Salvo norma legal especial y so pena de sanción disciplinaria, toda petición deberá resolverse dentro de los quince (15) días siguientes a su recepción..."</p>
              
              <p><span class="${styles.field}" data-field="fundamentos_derecho.fundamentos_principales">${getValue("fundamentos_derecho.fundamentos_principales", "Fundamentos Jurídicos Principales")}</span></p>
              
              <p><span class="${styles.field}" data-field="fundamentos_derecho.fundamento_personalizado">${getValue("fundamentos_derecho.fundamento_personalizado", "Fundamento Personalizado")}</span></p>
            </div>
    
            <div class="${styles.section}">
              <h2>PETICIÓN</h2>
              <p>Con base en los argumentos presentados anteriormente, me permito solicitar de manera respetuosa lo siguiente:</p>
              <p><span class="${styles.field}" data-field="pretensiones.solicitud_principal">${getValue("pretensiones.solicitud_principal", "Solicitud Principal")}</span></p>
              <p><span class="${styles.field}" data-field="pretensiones.solicitudes_adicionales">${getValue("pretensiones.solicitudes_adicionales", "Solicitudes Adicionales")}</span></p>
            </div>
    
            <div class="${styles.section}">
              <h2>ANEXOS</h2>
              <p><span class="${styles.field}" data-field="anexos.descripcion_anexos">${getValue("anexos.descripcion_anexos", "Descripción de Anexos")}</span></p>
            </div>
    
            <div class="${styles.section}">
              <h2>NOTIFICACIONES</h2>
              <p>Para efectos del presente Derecho de Petición, recibiré notificaciones y la respuesta por:</p>
              <p><strong>Dirección física:</strong> <span class="${styles.field}" data-field="notificaciones.direccion_fisica">${getValue("notificaciones.direccion_fisica", "Dirección Física")}</span>, <span class="${styles.field}" data-field="notificaciones.ciudad_notificaciones">${getValue("notificaciones.ciudad_notificaciones", "Ciudad de Notificaciones")}</span></p>
              <p><strong>Correo electrónico:</strong> <span class="${styles.field}" data-field="notificaciones.correo_electronico">${getValue("notificaciones.correo_electronico", "Correo Electrónico")}</span></p>
              <p><strong>Teléfono:</strong> <span class="${styles.field}" data-field="notificaciones.telefono_contacto">${getValue("notificaciones.telefono_contacto", "Teléfono de Contacto")}</span></p>
            </div>
          </div>
    
          <div class="${styles.documentFooter}">
            <p>Atentamente,</p>
            <div class="${styles.signatures}">
              <div class="${styles.signatureBlock}">
                <div class="${styles.signatureLine}"></div>
                <p><span class="${styles.field}" data-field="peticionario.nombre_completo">${getValue("peticionario.nombre_completo", "Nombre del Peticionario")}</span></p>
                <p>C.C. <span class="${styles.field}" data-field="peticionario.documento_identificacion">${getValue("peticionario.documento_identificacion", "Documento de Identificación")}</span></p>
              </div>
            </div>
          </div>
        </div>
    `)
}

export default generatePetitionContent;