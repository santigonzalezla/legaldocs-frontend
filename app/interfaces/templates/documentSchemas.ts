import {contractSchema} from "@/app/interfaces/templates/rentalcontract";
import {rightRequestSchema} from "@/app/interfaces/templates/rightrequest";

export const documentSchemas = {
    contract: contractSchema,
    petition: rightRequestSchema,
}

export type DocumentType = keyof typeof documentSchemas