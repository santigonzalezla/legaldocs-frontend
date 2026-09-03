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

export enum LegalUpdateSource
{
    CORTE_CONSTITUCIONAL    = 'CORTE_CONSTITUCIONAL',
    CORTE_SUPREMA           = 'CORTE_SUPREMA',
    PRESIDENCIA_NORMATIVA   = 'PRESIDENCIA_NORMATIVA',
    ACTUALICESE             = 'ACTUALICESE',
    ASUNTOS_LEGALES         = 'ASUNTOS_LEGALES',
    SUIN_JURISCOL           = 'SUIN_JURISCOL',
    AMBITO_JURIDICO         = 'AMBITO_JURIDICO',
    DIARIO_OFICIAL          = 'DIARIO_OFICIAL',
    CORTE_CONST_COMUNICADOS = 'CORTE_CONST_COMUNICADOS',
}

export enum LegalUpdateType
{
    LAW           = 'LAW',
    DECREE        = 'DECREE',
    RESOLUTION    = 'RESOLUTION',
    CIRCULAR      = 'CIRCULAR',
    RULING        = 'RULING',
    JURISPRUDENCE = 'JURISPRUDENCE',
    NEWS          = 'NEWS',
    OTHER         = 'OTHER',
}

export const LEGAL_UPDATE_TYPE_COLORS: Record<LegalUpdateType, {bg: string; color: string}> = {
    [LegalUpdateType.LAW]:           {bg: '#EFF6FF', color: '#3B82F6'},
    [LegalUpdateType.DECREE]:        {bg: '#EEF2FF', color: '#6366F1'},
    [LegalUpdateType.RESOLUTION]:    {bg: '#F0FDFA', color: '#0D9488'},
    [LegalUpdateType.CIRCULAR]:      {bg: '#FFF7ED', color: '#F97316'},
    [LegalUpdateType.RULING]:        {bg: '#FDF2F8', color: '#DB2777'},
    [LegalUpdateType.JURISPRUDENCE]: {bg: '#FAF5FF', color: '#9333EA'},
    [LegalUpdateType.NEWS]:          {bg: '#F1F5F9', color: '#475569'},
    [LegalUpdateType.OTHER]:         {bg: '#F8FAFC', color: '#64748B'},
};

export const LEGAL_UPDATE_TYPE_LABELS: Record<LegalUpdateType, string> = {
    [LegalUpdateType.LAW]:           'Ley',
    [LegalUpdateType.DECREE]:        'Decreto',
    [LegalUpdateType.RESOLUTION]:    'Resolución',
    [LegalUpdateType.CIRCULAR]:      'Circular',
    [LegalUpdateType.RULING]:        'Sentencia',
    [LegalUpdateType.JURISPRUDENCE]: 'Jurisprudencia',
    [LegalUpdateType.NEWS]:          'Noticia',
    [LegalUpdateType.OTHER]:         'Otro',
};

export const LEGAL_UPDATE_SOURCE_LABELS: Record<LegalUpdateSource, string> = {
    [LegalUpdateSource.CORTE_CONSTITUCIONAL]:    'Corte Constitucional',
    [LegalUpdateSource.CORTE_SUPREMA]:           'Corte Suprema de Justicia',
    [LegalUpdateSource.PRESIDENCIA_NORMATIVA]:   'Presidencia de la República',
    [LegalUpdateSource.ACTUALICESE]:             'Actualícese',
    [LegalUpdateSource.ASUNTOS_LEGALES]:         'Asuntos Legales',
    [LegalUpdateSource.SUIN_JURISCOL]:           'SUIN-Juriscol',
    [LegalUpdateSource.AMBITO_JURIDICO]:         'Ámbito Jurídico',
    [LegalUpdateSource.DIARIO_OFICIAL]:          'Diario Oficial',
    [LegalUpdateSource.CORTE_CONST_COMUNICADOS]: 'Corte Constitucional · Comunicados',
};
