import {
    BillingCycle,
    ClientType,
    DocumentStatus,
    FirmMemberRole,
    FirmMemberStatus,
    InvoiceStatus,
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
    status: FirmMemberStatus;
    inviteEmail: string | null;
    inviteExpiresAt: string | null;
    joinedAt: string | null;
    lastActiveAt: string | null;
    createdAt: string;
    updatedAt: string;
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
    branchId: string;
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

// ─── Legal Process ────────────────────────────────────────────────────────────

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
    createdBy: string;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
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

export interface TimeEntry
{
    id: string;
    numId: number;
    processId: string;
    userId: string;
    firmId: string;
    type: TimeEntryType;
    description: string | null;
    startedAt: string;
    endedAt: string | null;
    durationMinutes: number | null;
    createdAt: string;
    updatedAt: string;
    user: { firstName: string; lastName: string; hourlyRate: number | null };
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
