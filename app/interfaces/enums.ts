export enum FirmMemberRole
{
    ADMIN     = 'ADMIN',
    LAWYER    = 'LAWYER',
    ASSISTANT = 'ASSISTANT',
    INTERN    = 'INTERN',
}

export enum FirmMemberStatus
{
    ACTIVE   = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    PENDING  = 'PENDING',
}

export enum TemplateOrigin
{
    SYSTEM      = 'SYSTEM',
    FIRM_CUSTOM = 'FIRM_CUSTOM',
    FIRM_COPY   = 'FIRM_COPY',
}

export enum DocumentStatus
{
    DRAFT     = 'DRAFT',
    COMPLETED = 'COMPLETED',
    REVISION  = 'REVISION',
    ARCHIVED  = 'ARCHIVED',
}

export enum SignatureType
{
    DRAW   = 'DRAW',
    TYPE   = 'TYPE',
    UPLOAD = 'UPLOAD',
}

export enum SubscriptionStatus
{
    TRIAL     = 'TRIAL',
    ACTIVE    = 'ACTIVE',
    CANCELLED = 'CANCELLED',
    EXPIRED   = 'EXPIRED',
    PAST_DUE  = 'PAST_DUE',
}

export enum BillingCycle
{
    MONTHLY  = 'MONTHLY',
    ANNUALLY = 'ANNUALLY',
}

export enum InvoiceStatus
{
    PENDING  = 'PENDING',
    PAID     = 'PAID',
    FAILED   = 'FAILED',
    REFUNDED = 'REFUNDED',
    VOIDED   = 'VOIDED',
}

export enum PaymentMethodType
{
    CARD          = 'CARD',
    BANK_TRANSFER = 'BANK_TRANSFER',
    PSE           = 'PSE',
}

export enum ClientType
{
    INDIVIDUAL = 'INDIVIDUAL',
    COMPANY    = 'COMPANY',
}

export enum ProcessStatus
{
    ACTIVE    = 'ACTIVE',
    IN_REVIEW = 'IN_REVIEW',
    CLOSED    = 'CLOSED',
    ARCHIVED  = 'ARCHIVED',
}

export enum TimeEntryType
{
    AUTO   = 'AUTO',
    MANUAL = 'MANUAL',
}
