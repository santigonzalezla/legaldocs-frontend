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

export enum ClientIdDocumentType
{
    Cc  = 'CC',
    Nit = 'NIT',
    Ce  = 'CE',
    Pp  = 'PP',
    Ti  = 'TI',
    Rut = 'RUT',
}

export enum ClientRegimeType
{
    Simplified        = 'SIMPLIFIED',
    Ordinary          = 'ORDINARY',
    GreatTaxpayer     = 'GREAT_TAXPAYER',
    VatResponsible    = 'VAT_RESPONSIBLE',
    VatNonResponsible = 'VAT_NON_RESPONSIBLE',
}

export const CLIENT_REGIME_TYPE_LABELS: Record<ClientRegimeType, string> = {
    [ClientRegimeType.Simplified]:        'Régimen Simple de Tributación',
    [ClientRegimeType.Ordinary]:          'Régimen Ordinario',
    [ClientRegimeType.GreatTaxpayer]:     'Gran Contribuyente',
    [ClientRegimeType.VatResponsible]:    'Responsable de IVA',
    [ClientRegimeType.VatNonResponsible]: 'No Responsable de IVA',
};

export enum ClientDocumentType
{
    Rut               = 'RUT',
    ChamberOfCommerce = 'CHAMBER_OF_COMMERCE',
    IdDocument        = 'ID_DOCUMENT',
    Other             = 'OTHER',
}

export const CLIENT_DOCUMENT_TYPE_LABELS: Record<ClientDocumentType, string> = {
    [ClientDocumentType.Rut]:               'RUT',
    [ClientDocumentType.ChamberOfCommerce]: 'Cámara de Comercio',
    [ClientDocumentType.IdDocument]:        'Cédula / NIT',
    [ClientDocumentType.Other]:             'Otro',
};

export const CLIENT_DOCUMENT_TYPE_COLORS: Record<ClientDocumentType, {bg: string; color: string}> = {
    [ClientDocumentType.Rut]:               {bg: '#EFF6FF', color: '#3B82F6'},
    [ClientDocumentType.ChamberOfCommerce]: {bg: '#F0FDF4', color: '#22C55E'},
    [ClientDocumentType.IdDocument]:        {bg: '#FAF5FF', color: '#9333EA'},
    [ClientDocumentType.Other]:             {bg: '#F8FAFC', color: '#64748B'},
};

export enum ProcessBillingType
{
    Fixed      = 'FIXED',
    Hourly     = 'HOURLY',
    Milestones = 'MILESTONES',
    Stages     = 'STAGES',
}

export const PROCESS_BILLING_TYPE_LABELS: Record<ProcessBillingType, string> = {
    [ProcessBillingType.Fixed]:      'Monto fijo',
    [ProcessBillingType.Hourly]:     'Por horas',
    [ProcessBillingType.Milestones]: 'Hitos',
    [ProcessBillingType.Stages]:     'Etapas',
};

export enum ProcessDocumentType
{
    Proposal = 'PROPOSAL',
    Contract = 'CONTRACT',
    Other    = 'OTHER',
}

export const PROCESS_DOCUMENT_TYPE_LABELS: Record<ProcessDocumentType, string> = {
    [ProcessDocumentType.Proposal]: 'Propuesta',
    [ProcessDocumentType.Contract]: 'Contrato',
    [ProcessDocumentType.Other]:    'Otro',
};

export const PROCESS_DOCUMENT_TYPE_COLORS: Record<ProcessDocumentType, {bg: string; color: string}> = {
    [ProcessDocumentType.Proposal]: {bg: '#EFF6FF', color: '#3B82F6'},
    [ProcessDocumentType.Contract]: {bg: '#F0FDF4', color: '#22C55E'},
    [ProcessDocumentType.Other]:    {bg: '#F8FAFC', color: '#64748B'},
};

// ─── Línea de tiempo del proceso (flujo de etapas + comentarios) ──────────────

export enum TimelineStage
{
    Demanda      = 'DEMANDA',
    Notificacion = 'NOTIFICACION',
    Contestacion = 'CONTESTACION',
    Audiencia    = 'AUDIENCIA',
    Sentencia    = 'SENTENCIA',
    Recurso      = 'RECURSO',
}

export const TIMELINE_STAGE_LABELS: Record<TimelineStage, string> = {
    [TimelineStage.Demanda]:      'Demanda',
    [TimelineStage.Notificacion]: 'Notificación',
    [TimelineStage.Contestacion]: 'Contestación',
    [TimelineStage.Audiencia]:    'Audiencia',
    [TimelineStage.Sentencia]:    'Sentencia',
    [TimelineStage.Recurso]:      'Recurso',
};

export const TIMELINE_STAGE_ORDER: Record<TimelineStage, number> = {
    [TimelineStage.Demanda]:      1,
    [TimelineStage.Notificacion]: 2,
    [TimelineStage.Contestacion]: 3,
    [TimelineStage.Audiencia]:    4,
    [TimelineStage.Sentencia]:    5,
    [TimelineStage.Recurso]:      6,
};

export const TIMELINE_STAGE_COLORS: Record<TimelineStage, {bg: string; color: string}> = {
    [TimelineStage.Demanda]:      {bg: '#EFF6FF', color: '#2563EB'},
    [TimelineStage.Notificacion]: {bg: '#EEF2FF', color: '#4F46E5'},
    [TimelineStage.Contestacion]: {bg: '#FAF5FF', color: '#9333EA'},
    [TimelineStage.Audiencia]:    {bg: '#FFF7ED', color: '#EA580C'},
    [TimelineStage.Sentencia]:    {bg: '#ECFDF5', color: '#059669'},
    [TimelineStage.Recurso]:      {bg: '#FEF2F2', color: '#DC2626'},
};

// Estado visual de cada una de las 6 etapas (calculado en el cliente):
//  - current:    la última etapa registrada.
//  - done:       etapa registrada anterior a la actual (superada).
//  - skipped:    sin registro y de orden menor a la actual — el proceso empezó
//                más adelante o saltó etapas; no se puede retroceder a registrarla.
//  - notReached: sin registro y de orden mayor a la actual — todavía no se llega.
export type TimelineStageStatus = 'current' | 'done' | 'skipped' | 'notReached';

export const TIMELINE_STAGE_STATUS_LABELS: Record<TimelineStageStatus, string> = {
    current:    'Etapa actual',
    done:       'Superada',
    skipped:    'Sin seguimiento',
    notReached: 'No alcanzada',
};

export const TIMELINE_STAGE_STATUS_COLORS: Record<TimelineStageStatus, {bg: string; color: string}> = {
    current:    {bg: '#EEF2FF', color: '#4F46E5'},
    done:       {bg: '#ECFDF5', color: '#059669'},
    skipped:    {bg: '#F1F5F9', color: '#64748B'},
    notReached: {bg: '#F8FAFC', color: '#94A3B8'},
};

export enum ProcessTimelineAttachmentType
{
    Ruling       = 'RULING',
    Brief        = 'BRIEF',
    Evidence     = 'EVIDENCE',
    Notification = 'NOTIFICATION',
    Draft        = 'DRAFT',
    Other        = 'OTHER',
}

export const PROCESS_TIMELINE_ATTACHMENT_TYPE_LABELS: Record<ProcessTimelineAttachmentType, string> = {
    [ProcessTimelineAttachmentType.Ruling]:       'Providencia / Auto',
    [ProcessTimelineAttachmentType.Brief]:        'Memorial',
    [ProcessTimelineAttachmentType.Evidence]:     'Prueba',
    [ProcessTimelineAttachmentType.Notification]: 'Notificación / Estado',
    [ProcessTimelineAttachmentType.Draft]:        'Borrador',
    [ProcessTimelineAttachmentType.Other]:        'Otro',
};

export const PROCESS_TIMELINE_ATTACHMENT_TYPE_COLORS: Record<ProcessTimelineAttachmentType, {bg: string; color: string}> = {
    [ProcessTimelineAttachmentType.Ruling]:       {bg: '#FEF2F2', color: '#DC2626'},
    [ProcessTimelineAttachmentType.Brief]:        {bg: '#EFF6FF', color: '#2563EB'},
    [ProcessTimelineAttachmentType.Evidence]:     {bg: '#FFFBEB', color: '#D97706'},
    [ProcessTimelineAttachmentType.Notification]: {bg: '#EEF2FF', color: '#4F46E5'},
    [ProcessTimelineAttachmentType.Draft]:        {bg: '#F1F5F9', color: '#64748B'},
    [ProcessTimelineAttachmentType.Other]:        {bg: '#FAF5FF', color: '#9333EA'},
};

export enum ReminderChannel
{
    Email = 'EMAIL',
}

export enum ReminderStatus
{
    Pending   = 'PENDING',
    Sent      = 'SENT',
    Failed    = 'FAILED',
    Cancelled = 'CANCELLED',
}

export const REMINDER_STATUS_LABELS: Record<ReminderStatus, string> = {
    [ReminderStatus.Pending]:   'Programado',
    [ReminderStatus.Sent]:      'Enviado',
    [ReminderStatus.Failed]:    'Falló',
    [ReminderStatus.Cancelled]: 'Cancelado',
};

export const REMINDER_STATUS_COLORS: Record<ReminderStatus, {bg: string; color: string}> = {
    [ReminderStatus.Pending]:   {bg: '#FFF7ED', color: '#C2410C'},
    [ReminderStatus.Sent]:      {bg: '#ECFDF5', color: '#047857'},
    [ReminderStatus.Failed]:    {bg: '#FEF2F2', color: '#DC2626'},
    [ReminderStatus.Cancelled]: {bg: '#F1F5F9', color: '#64748B'},
};

// Anticipos ofrecidos en el picker de recordatorios (offsetMinutes).
// value 0 = "Ahora": envía el correo de inmediato al crear el recordatorio.
export const REMINDER_OFFSET_OPTIONS: Array<{value: number; label: string}> = [
    {value: 0,     label: 'Ahora — enviar de inmediato'},
    {value: 10,    label: '10 minutos antes'},
    {value: 60,    label: '1 hora antes'},
    {value: 1440,  label: '1 día antes'},
    {value: 4320,  label: '3 días antes'},
    {value: 10080, label: '1 semana antes'},
];

