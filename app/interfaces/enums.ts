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

export enum BillableType
{
    BILLABLE     = 'BILLABLE',
    NON_BILLABLE = 'NON_BILLABLE',
}

export enum LibraryDocumentType
{
    LAW           = 'LAW',
    DECREE        = 'DECREE',
    RESOLUTION    = 'RESOLUTION',
    CIRCULAR      = 'CIRCULAR',
    RULING        = 'RULING',
    JURISPRUDENCE = 'JURISPRUDENCE',
    DOCTRINE      = 'DOCTRINE',
    CONTRACT      = 'CONTRACT',
    OTHER         = 'OTHER',
}

export const LIBRARY_DOCUMENT_TYPE_COLORS: Record<LibraryDocumentType, {bg: string; color: string}> = {
    [LibraryDocumentType.LAW]:           {bg: '#EFF6FF', color: '#3B82F6'},
    [LibraryDocumentType.DECREE]:        {bg: '#FDF4FF', color: '#A855F7'},
    [LibraryDocumentType.RESOLUTION]:    {bg: '#F0FDF4', color: '#22C55E'},
    [LibraryDocumentType.CIRCULAR]:      {bg: '#FFF7ED', color: '#F97316'},
    [LibraryDocumentType.RULING]:        {bg: '#FEF2F2', color: '#EF4444'},
    [LibraryDocumentType.JURISPRUDENCE]: {bg: '#FEF9C3', color: '#CA8A04'},
    [LibraryDocumentType.DOCTRINE]:      {bg: '#F0F9FF', color: '#0EA5E9'},
    [LibraryDocumentType.CONTRACT]:      {bg: '#FDF4FF', color: '#D946EF'},
    [LibraryDocumentType.OTHER]:         {bg: '#F8FAFC', color: '#64748B'},
};

export const LIBRARY_DOCUMENT_TYPE_LABELS: Record<LibraryDocumentType, string> = {
    [LibraryDocumentType.LAW]:           'Ley',
    [LibraryDocumentType.DECREE]:        'Decreto',
    [LibraryDocumentType.RESOLUTION]:    'Resolución',
    [LibraryDocumentType.CIRCULAR]:      'Circular',
    [LibraryDocumentType.RULING]:        'Sentencia',
    [LibraryDocumentType.JURISPRUDENCE]: 'Jurisprudencia',
    [LibraryDocumentType.DOCTRINE]:      'Doctrina',
    [LibraryDocumentType.CONTRACT]:      'Contrato',
    [LibraryDocumentType.OTHER]:         'Otro',
};
