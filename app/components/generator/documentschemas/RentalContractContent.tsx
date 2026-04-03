import styles from  "./documentschemas.module.css";
import { FormData } from "@/app/interfaces/types/formtypes";

const generateContractContent = (getValue: Function, formatDate: Function, schema: FormData) =>
{
    return (`
       <div class="${styles.documentContent}">
          <div class="${styles.documentHeader}">
            <h1>CONTRATO DE ARRENDAMIENTO PARA VIVIENDA</h1>
            <div class="${styles.documentMeta}">
              <p><strong>Documento:</strong> ${schema.document_type}</p>
              <p><strong>Versión:</strong> ${schema.version}</p>
              <p><strong>Fecha de creación:</strong> ${formatDate(schema.creation_date, "Fecha de Creación")}</p>
            </div>
          </div>
    
          <div class="${styles.documentBody}">
            <div class="${styles.section}">
              <h2>INFORMACIÓN BÁSICA</h2>
              <p>El presente contrato de arrendamiento se celebra en la ciudad de <span class="${styles.field}" data-field="basic_information.contract_location">${getValue("basic_information.contract_location", "Ciudad del Contrato")}</span> el día <span class="${styles.field}" data-field="basic_information.contract_date">${formatDate(getValue("basic_information.contract_date", "Fecha del Contrato"), "Fecha del Contrato")}</span>.</p>
            </div>
    
            <div class="${styles.section}">
              <h2>PARTES CONTRATANTES</h2>
              <div class="${styles.subsection}">
                <h3>ARRENDADOR:</h3>
                <p><span class="${styles.field}" data-field="landlord.name_company_name">${getValue("landlord.name_company_name", "Nombre del Arrendador")}</span>, identificado(a) con <span class="${styles.field}" data-field="landlord.identification_document">${getValue("landlord.identification_document", "Documento del Arrendador")}</span> expedida en <span class="${styles.field}" data-field="landlord.issuance_city">${getValue("landlord.issuance_city", "Ciudad de Expedición")}</span>.</p>
              </div>
              
              <div class="${styles.subsection}">
                <h3>ARRENDATARIO:</h3>
                <p><span class="${styles.field}" data-field="tenant.full_name">${getValue("tenant.full_name", "Nombre del Arrendatario")}</span>, identificado(a) con <span class="${styles.field}" data-field="tenant.identification_document">${getValue("tenant.identification_document", "Documento del Arrendatario")}</span> expedida en <span class="${styles.field}" data-field="tenant.issuance_city">${getValue("tenant.issuance_city", "Ciudad de Expedición")}</span>, con correo electrónico <span class="${styles.field}" data-field="tenant.email">${getValue("tenant.email", "Email del Arrendatario")}</span>.</p>
              </div>
            </div>
    
            <div class="${styles.section}">
              <h2>INMUEBLE OBJETO DEL CONTRATO</h2>
              <p>El inmueble arrendado corresponde a un <span class="${styles.field}" data-field="property.property_type">${getValue("property.property_type", "Tipo de Propiedad")}</span> ubicado en la dirección <span class="${styles.field}" data-field="property.full_address">${getValue("property.full_address", "Dirección Completa")}</span>, en la ciudad de <span class="${styles.field}" data-field="property.city">${getValue("property.city", "Ciudad")}</span>.</p>
            </div>
    
            <div class="${styles.section}">
              <h2>CONDICIONES ECONÓMICAS</h2>
              <p><strong>Valor del Arriendo:</strong> El canon mensual de arrendamiento es de <span class="${styles.field}" data-field="economic_conditions.rent_amount">${getValue("economic_conditions.rent_amount", "Valor del Arriendo")}</span>.</p>
            </div>
          </div>
    
          <div class="${styles.documentFooter}">
            <div class="${styles.signatures}">
              <div class="${styles.signatureBlock}">
                <div class="${styles.signatureLine}"></div>
                <p>ARRENDADOR</p>
                <p><span class="${styles.field}" data-field="landlord.name_company_name">${getValue("landlord.name_company_name", "Nombre del Arrendador")}</span></p>
              </div>
              <div class="${styles.signatureBlock}">
                <div class="${styles.signatureLine}"></div>
                <p>ARRENDATARIO</p>
                <p><span class="${styles.field}" data-field="tenant.full_name">${getValue("tenant.full_name", "Nombre del Arrendatario")}</span></p>
              </div>
            </div>
          </div>
        </div>
      `)
}

export default generateContractContent;