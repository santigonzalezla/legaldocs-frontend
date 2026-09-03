import {
    BillingCycle,
    BillableType,
    ClientType,
    DocumentStatus,
    FirmMemberRole,
    FirmMemberStatus,
    InvoiceStatus,
    LegalUpdateSource,
    LegalUpdateType,
    PaymentMethodType,
    ProcessStatus,
    SignatureType,
    SubscriptionStatus,
    TemplateOrigin,
    TimeEntryType
} from './enums';

// ─── User ────────────────────────────────────────────────────────────────────

export interface User
{
    id: string;
    numId: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    birthDate: string | null;
    bio: string | null;
    hourlyRate: number | null;
    avatarUrl: string | null;
    lastLoginAt: string | null;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface NotificationPreferences
{
    id: string;
    userId: string;
    emailNewDocument: boolean;
    emailDocumentShared: boolean;
    emailTemplateUpdated: boolean;
    emailTeamInvite: boolean;
    emailBilling: boolean;
    emailLegalUpdates: boolean;
    inAppNewDocument: boolean;
    inAppDocumentShared: boolean;
    inAppTeamActivity: boolean;
    inAppBilling: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface SecuritySettings
{
    id: string;
    userId: string;
    twoFactorEnabled: boolean;
    twoFactorMethod: string;
    sessionTimeoutMins: number;
    loginNotifications: boolean;
    createdAt: string;
    updatedAt: string;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthResponse
{
    accessToken: string;
    refreshToken: string;
    // Presente en login/refresh; ausente en register (el owner define su propia clave).
    mustChangePassword?: boolean;
}

// ─── Firm ────────────────────────────────────────────────────────────────────

export interface Firm
{
    id: string;
    numId: number;
    name: string;
    legalName: string | null;
    nit: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    description: string | null;
    logoUrl: string | null;
    firmHourlyRate: number | null;
    dailyBillableGoalHours: number | null;
    dailyNonBillableGoalHours: number | null;
    createdBy: string;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface FirmWithRole extends Firm
{
    role: FirmMemberRole;
    isOwner: boolean;
}

export interface FirmMember
{
    id: string;
    firmId: string;
    userId: string | null;
    role: FirmMemberRole;
    firmRoleId: string | null;
    firmRole: {id: string; name: string; slug: string | null} | null;
    status: FirmMemberStatus;
    inviteEmail: string | null;
    inviteExpiresAt: string | null;
    joinedAt: string | null;
    lastActiveAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface DeletedFirm
{
    id: string;
    name: string;
    deletedAt: string | null;
    purgeAt: string | null;
}

export interface PendingInvitation
{
    id: string;
    role: FirmMemberRole;
    inviteToken: string;
    inviteExpiresAt: string;
    createdAt: string;
    firm: {
        id: string;
        name: string;
        legalName: string | null;
        city: string | null;
    };
}

// ─── Roles y Permisos ───────────────────────────────────────────────────────

export interface FirmRole
{
    id: string;
    name: string;
    description: string | null;
    slug: string | null;
    isSystem: boolean;
    memberCount: number;
    permissionKeys: string[];
}

export interface PermissionEntry
{
    id: string;
    key: string;
    method: string;
    path: string;
    label: string;
    deprecated: boolean;
}

export interface PermissionModule
{
    id: string;
    key: string;
    label: string;
    description: string | null;
    sortOrder: number;
    permissions: PermissionEntry[];
}

export interface EffectivePermissions
{
    isAdmin: boolean;
    permissionKeys: string[];
}

// ─── Document ────────────────────────────────────────────────────────────────

export interface Document
{
    id: string;
    numId: number;
    title: string;
    templateId: string | null;
    documentType: string;
    branchId: string | null;
    formData: Record<string, any>;
    content: string | null;
    hasCustomContent: boolean;
    status: DocumentStatus;
    firmId: string;
    createdBy: string;
    deletedAt: string | null;
    trashExpiresAt: string | null;
    processId?: string | null;
    isFavorite?: boolean;
    branchSlug?: string | null;
    createdAt: string;
    updatedAt: string;
}

// ─── Template ────────────────────────────────────────────────────────────────

export interface DocumentTemplate
{
    id: string;
    numId: number;
    documentType: string;
    version: string;
    title: string;
    subcategory: string | null;
    applicableRegulations: any;
    requiresRegistration: boolean;
    legalValidity: boolean;
    variableFields: any;
    textTemplate: string | null;
    origin: TemplateOrigin;
    parentTemplateId: string | null;
    firmId: string | null;
    createdBy: string | null;
    isActive: boolean;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
    branches: {id: string; name: string; color: string | null; icon: string | null; slug: string}[];
}

// ─── Digital Signature ───────────────────────────────────────────────────────

export interface DigitalSignature
{
    id: string;
    userId: string;
    name: string;
    type: SignatureType;
    content: string;
    font: string | null;
    isDefault: boolean;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

// ─── Legal Branch ────────────────────────────────────────────────────────────

export interface LegalBranch
{
    id: string;
    numId: number;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    color: string | null;
    isSystem: boolean;
    firmId: string | null;
    isActive: boolean;
    sortOrder: number;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

// ─── Subscription ────────────────────────────────────────────────────────────

export interface SubscriptionPlan
{
    id: string;
    name: string;
    displayName: string;
    description: string | null;
    priceMonthly: number | null;
    priceAnnually: number | null;
    maxDocuments: number | null;
    maxUsers: number | null;
    maxTemplates: number | null;
    features: any;
    isActive: boolean;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface Subscription
{
    id: string;
    firmId: string;
    planId: string;
    status: SubscriptionStatus;
    billingCycle: BillingCycle;
    startDate: string;
    endDate: string | null;
    trialEndsAt: string | null;
    cancelledAt: string | null;
    createdAt: string;
    updatedAt: string;
    plan: SubscriptionPlan;
}

export interface Invoice
{
    id: string;
    numId: number;
    firmId: string;
    subscriptionId: string | null;
    invoiceNumber: string;
    amount: number;
    currency: string;
    status: InvoiceStatus;
    billingPeriodStart: string | null;
    billingPeriodEnd: string | null;
    dueDate: string | null;
    paidAt: string | null;
    pdfUrl: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface PaymentMethod
{
    id: string;
    firmId: string;
    type: PaymentMethodType;
    lastFour: string | null;
    brand: string | null;
    holderName: string | null;
    expiryMonth: number | null;
    expiryYear: number | null;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

// ─── Firm Specialty ──────────────────────────────────────────────────────────

export interface FirmSpecialty
{
    id: string;
    firmId: string;
    specialty: string;
}

// ─── Client ──────────────────────────────────────────────────────────────────

export interface Client
{
    id: string;
    numId: number;
    firmId: string;
    type: ClientType;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    documentType: string | null;
    documentNumber: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    createdBy: string;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

// Proyección mínima (id+nombre) usada por selectores fuera del módulo Clientes
// (ej. asignar cliente a un proceso) — no requiere el permiso clients:view.
export interface ClientPickerOption
{
    id:   string;
    name: string;
}

// ─── Legal Process ────────────────────────────────────────────────────────────

export interface ProcessValueEntry
{
    id: string;
    processId: string;
    amount: number;
    description: string;
    createdBy: string;
    createdAt: string;
}

export interface LegalProcess
{
    id: string;
    numId: number;
    firmId: string;
    clientId: string;
    title: string;
    description: string | null;
    reference: string | null;
    branchId: string | null;
    status: ProcessStatus;
    court: string | null;
    counterpart: string | null;
    startDate: string | null;
    endDate: string | null;
    assignedTo: string | null;
    processValue: number | null;
    valueEntries: ProcessValueEntry[];
    // Solo viene poblado en GET process/:id (no en el listado).
    client?: ProcessClientSummary | null;
    createdBy: string;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

// Subconjunto de Client sin datos de contacto (email/teléfono/dirección),
// embebido en LegalProcess — ver LegalProcessWithEntriesEntity en el backend.
export interface ProcessClientSummary
{
    id: string;
    type: ClientType;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    documentType: string | null;
    documentNumber: string | null;
}

export interface ProcessTemplate
{
    id: string;
    processId: string;
    templateId: string;
    sortOrder: number;
    isRequired: boolean;
    createdAt: string;
}

// ─── Time Entry ──────────────────────────────────────────────────────────────

export interface TimeEntryParticipant
{
    id: string;
    timeEntryId: string;
    userId: string;
    user: { firstName: string; lastName: string };
    createdAt: string;
}

export interface TimeEntry
{
    id: string;
    numId: number;
    processId: string;
    userId: string;
    firmId: string;
    type: TimeEntryType;
    billableType: BillableType;
    isShared: boolean;
    description: string | null;
    startedAt: string;
    endedAt: string | null;
    durationMinutes: number | null;
    createdAt: string;
    updatedAt: string;
    user: { firstName: string; lastName: string; hourlyRate: number | null };
    participants: TimeEntryParticipant[];
}

// ─── Paginated Response ──────────────────────────────────────────────────────

export interface PaginatedResponse<T>
{
    data: T[];
    total: number;
    page: number;
    limit: number;
    pages: number;
}

export interface LibraryDocument
{
    id: string;
    numId: number;
    firmId: string;
    uploadedBy: string;
    title: string;
    description: string | null;
    type: string;
    fileKey: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    isIndexed: boolean;
    branchId: string | null;
    branch: { id: string; name: string; color: string | null; icon: string | null; slug: string } | null;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

// ─── Legal Update ────────────────────────────────────────────────────────────

export interface LegalUpdate
{
    id: string;
    numId: number;
    source: LegalUpdateSource;
    sourceLabel: string;
    type: LegalUpdateType;
    title: string;
    summary: string | null;
    url: string;
    category: string | null;
    branchId: string | null;
    branch: { id: string; name: string; slug: string; color: string | null; icon: string | null } | null;
    publishedAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface LegalUpdateSourceInfo
{
    source: LegalUpdateSource;
    label: string;
    lastOkAt: string | null;
    itemsLastRun: number;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardSummary
{
    documents: {
        month: number;
        total: number;
        deltaPct: number | null;
    };
    billableHours: {
        month: number;
        trackedMonth: number;
        deltaPct: number | null;
    };
    processes: {
        active: number;
        inReview: number;
        newThisMonth: number;
    };
    clients: {
        active: number;
        newThisMonth: number;
        newCompanies: number;
        newIndividuals: number;
    };
}
