// ─── Subscription ────────────────────────────────────────────────────────────

export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'enterprise'
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing'

export interface SubscriptionLimits {
  maxLawyers: number
  maxCases: number
  maxDocuments: number
  uyapAccess: 'none' | 'read' | 'full'
  whatsappPerMonth: number
  aiAssistant: boolean
  storageGB: number
}

// Plan adları (vitrin): free=Ücretsiz, starter=Solo, pro=Profesyonel, enterprise=Büro
// Solo→Profesyonel arası kullanıcı, kendi planındaki tüm hakları rahatça kullanır.
// (-1 = sınırsız)
export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free:       { maxLawyers: 1,  maxCases: 10,  maxDocuments: 100,  uyapAccess: 'none', whatsappPerMonth: 0,    aiAssistant: false, storageGB: 5 },
  starter:    { maxLawyers: 1,  maxCases: 100, maxDocuments: 1000, uyapAccess: 'full', whatsappPerMonth: 250,  aiAssistant: false, storageGB: 50 },
  pro:        { maxLawyers: 3,  maxCases: -1,  maxDocuments: -1,   uyapAccess: 'full', whatsappPerMonth: 1000, aiAssistant: true,  storageGB: 150 },
  enterprise: { maxLawyers: 10, maxCases: -1,  maxDocuments: -1,   uyapAccess: 'full', whatsappPerMonth: 5000, aiAssistant: true,  storageGB: 500 },
}

export function checkFeature(tier: SubscriptionTier, feature: keyof SubscriptionLimits): SubscriptionLimits[typeof feature] {
  return SUBSCRIPTION_LIMITS[tier][feature]
}

// ─── Organization ─────────────────────────────────────────────────────────────

export interface Organization {
  id: string
  name: string
  slug: string
  country_code: string
  locale: string
  subscription_tier: SubscriptionTier
  subscription_status: SubscriptionStatus
  iyzico_subscription_reference_code: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'lawyer' | 'assistant'

export interface Profile {
  id: string
  organization_id: string | null
  full_name: string | null
  bar_number: string | null
  role: UserRole
  phone: string | null
  avatar_url: string | null
  locale: string
  whatsapp_phone: string | null
  created_at: string
}

// ─── Client ───────────────────────────────────────────────────────────────────

export type ClientType = 'individual' | 'corporate'

export interface Client {
  id: string
  organization_id: string
  type: ClientType
  full_name: string
  tc_kimlik_no: string | null
  tax_number: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  country: string
  whatsapp_opted_in: boolean
  notes: string | null
  tags: string[]
  created_at: string
  created_by: string | null
}

// ─── Case ─────────────────────────────────────────────────────────────────────

export type CaseStatus = 'active' | 'closed' | 'pending' | 'archived'
export type CaseType = 'civil' | 'criminal' | 'administrative' | 'commercial' | 'family' | 'labor' | 'other'

export interface Case {
  id: string
  organization_id: string
  client_id: string
  assigned_lawyer_id: string | null
  title: string
  case_number: string | null
  uyap_case_id: string | null
  case_type: CaseType | null
  court_name: string | null
  court_file_number: string | null
  status: CaseStatus
  stage: string | null
  description: string | null
  opened_at: string | null
  closed_at: string | null
  next_hearing_at: string | null
  fee_arrangement: FeeArrangement | null
  tags: string[]
  created_at: string
  updated_at: string
}

export type FeeType = 'hourly' | 'fixed' | 'percentage' | 'contingency'

export interface FeeArrangement {
  type: FeeType
  amount: number
  currency: string
  percentage?: number
}

// ─── Hearing ──────────────────────────────────────────────────────────────────

export interface Hearing {
  id: string
  case_id: string
  organization_id: string
  scheduled_at: string
  court_name: string | null
  courtroom: string | null
  judge_name: string | null
  hearing_type: string | null
  outcome: string | null
  notes: string | null
  uyap_synced: boolean
  reminder_sent: boolean
  created_at: string
}

// ─── Document ─────────────────────────────────────────────────────────────────

export type DocumentSource = 'upload' | 'uyap' | 'email' | 'whatsapp'

export interface Document {
  id: string
  organization_id: string
  case_id: string | null
  client_id: string | null
  name: string
  file_path: string
  file_type: string | null
  file_size: number | null
  mime_type: string | null
  ocr_text: string | null
  uyap_document_id: string | null
  source: DocumentSource
  tags: string[]
  uploaded_by: string | null
  created_at: string
}

// ─── Message (Unified Inbox) ──────────────────────────────────────────────────

export type MessageChannel = 'whatsapp' | 'gmail' | 'sms'
export type MessageDirection = 'inbound' | 'outbound'
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface Message {
  id: string
  organization_id: string
  client_id: string | null
  case_id: string | null
  channel: MessageChannel
  direction: MessageDirection
  external_message_id: string | null
  from_address: string | null
  to_address: string | null
  subject: string | null
  body: string | null
  body_html: string | null
  attachments: MessageAttachment[]
  status: MessageStatus
  sent_at: string | null
  received_at: string | null
  created_at: string
}

export interface MessageAttachment {
  name: string
  mime_type: string
  size: number
  url: string
}

// ─── Invoice ──────────────────────────────────────────────────────────────────

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'canceled'
export type PaymentMethod = 'iyzico' | 'stripe' | 'bank_transfer' | 'cash'

export interface Invoice {
  id: string
  organization_id: string
  client_id: string
  case_id: string | null
  invoice_number: string
  status: InvoiceStatus
  currency: string
  amount: number
  tax_amount: number
  total_amount: number
  payment_method: PaymentMethod | null
  iyzico_payment_id: string | null
  stripe_payment_intent_id: string | null
  due_date: string | null
  paid_at: string | null
  items: InvoiceItem[]
  created_at: string
}

export interface InvoiceItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

// ─── UYAP ────────────────────────────────────────────────────────────────────

export interface UyapCase {
  uyapCaseId: string
  esasNo: string
  mahkeme: string
  davaYonu: string
  davaKonusu: string
  durum: string
  acilisTarihi: string
  sonIslemTarihi: string
}

export interface UyapHearing {
  uyapCaseId: string
  durusmaTarihi: string
  saat: string
  mahkemeSalonu: string
  durusmaNo: number
}

export interface UyapSyncResult {
  success: boolean
  caseId: string
  hearingsFound: number
  documentsFound: number
  error?: string
}

// ─── Search ──────────────────────────────────────────────────────────────────

export interface SearchResult {
  type: 'case' | 'client' | 'document' | 'law'
  id: string
  title: string
  subtitle: string | null
  highlight: string | null
  url: string
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
