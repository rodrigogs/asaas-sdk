import type { PaginationParams } from '../../core/pagination.js'
import type { CreditCardData, CreditCardHolderInfo } from '../cards/index.js'
import type {
  BillingType,
  Discount,
  Fine,
  Interest,
  PaymentStatus,
  SplitItem,
} from '../payments/index.js'

// --- InvoiceSettings Enums (open to API evolution) ---

export type InvoiceSettingsEffectiveDatePeriod =
  | 'ON_PAYMENT_CONFIRMATION'
  | 'ON_PAYMENT_DUE_DATE'
  | 'BEFORE_PAYMENT_DUE_DATE'
  | 'ON_DUE_DATE_MONTH'
  | 'ON_NEXT_MONTH'
  | (string & {})

// --- InvoiceSettings Write model ---

export interface InvoiceSettingsTaxesParams {
  retainIss: boolean
  iss: number
  pis: number
  cofins: number
  csll: number
  inss: number
  ir: number
  nbsCode?: string
  taxSituationCode?: string
  taxClassificationCode?: string
  operationIndicatorCode?: string
  pisCofinsRetentionType?: string
  pisCofinsTaxStatus?: string
}

export interface InvoiceSettingsCreateParams {
  taxes: InvoiceSettingsTaxesParams
  municipalServiceId?: string
  municipalServiceCode?: string
  municipalServiceName?: string
  updatePayment?: boolean
  deductions?: number
  effectiveDatePeriod?: InvoiceSettingsEffectiveDatePeriod
  receivedOnly?: boolean
  daysBeforeDueDate?: number
  observations?: string
}

export type InvoiceSettingsUpdateParams = InvoiceSettingsCreateParams

// --- InvoiceSettings Read model ---

export interface InvoiceSettingsTaxes {
  retainIss: boolean
  iss: number
  pis: number
  cofins: number
  csll: number
  inss: number
  ir: number
}

export interface InvoiceSettings {
  municipalServiceId?: string | null
  municipalServiceCode?: string | null
  municipalServiceName?: string | null
  deductions?: number | null
  invoiceCreationPeriod?: InvoiceSettingsEffectiveDatePeriod | null
  daysBeforeDueDate?: number | null
  receivedOnly?: boolean | null
  observations?: string | null
  taxes: InvoiceSettingsTaxes
}

export interface InvoiceSettingsRemoveResult {
  id: string
  deleted: boolean
}

// --- Subscription Enums (open to API evolution) ---

export type SubscriptionCycle =
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'BIMONTHLY'
  | 'QUARTERLY'
  | 'SEMIANNUALLY'
  | 'YEARLY'
  | (string & {})

export type SubscriptionStatus =
  | 'ACTIVE'
  | 'EXPIRED'
  | 'INACTIVE'
  | (string & {})

export type SubscriptionUpdateStatus = 'ACTIVE' | 'INACTIVE' | (string & {})

export type SubscriptionInvoiceStatus =
  | 'SCHEDULED'
  | 'WAITING_OVERDUE_PAYMENT'
  | 'PENDING'
  | 'SYNCHRONIZED'
  | 'AUTHORIZED'
  | 'PROCESSING_CANCELLATION'
  | 'CANCELLED'
  | 'CANCELLATION_DENIED'
  | 'ERROR'
  | 'NONE'
  | 'CANCELED'
  | (string & {})

// --- Subscription Input types ---

export interface SubscriptionCreateParams {
  customer: string
  billingType: BillingType
  value: number
  nextDueDate: string
  cycle: SubscriptionCycle
  discount?: Discount
  interest?: Interest
  fine?: Fine
  description?: string
  endDate?: string
  maxPayments?: number
  externalReference?: string
  split?: SplitItem[]
  callback?: { successUrl: string; autoRedirect?: boolean }
}

export interface SubscriptionCreateWithCreditCardParams extends SubscriptionCreateParams {
  creditCard: CreditCardData
  creditCardHolderInfo: CreditCardHolderInfo
  remoteIp: string
  creditCardToken?: string
}

export interface SubscriptionUpdateParams {
  billingType?: BillingType
  status?: SubscriptionUpdateStatus
  nextDueDate?: string
  discount?: Discount
  interest?: Interest
  fine?: Fine
  cycle?: SubscriptionCycle
  description?: string
  endDate?: string
  updatePendingPayments?: boolean
  externalReference?: string
  split?: SplitItem[]
  callback?: { successUrl: string; autoRedirect?: boolean }
}

export interface SubscriptionUpdateCreditCardParams {
  creditCard: CreditCardData
  creditCardHolderInfo: CreditCardHolderInfo
  remoteIp: string
  creditCardToken?: string
}

export interface SubscriptionListParams extends PaginationParams {
  customer?: string
  customerGroupName?: string
  billingType?: BillingType
  status?: SubscriptionStatus
  deletedOnly?: boolean
  includeDeleted?: boolean
  externalReference?: string
  order?: string
  sort?: string
}

export interface SubscriptionPaymentListParams extends PaginationParams {
  status?: PaymentStatus
}

export interface SubscriptionInvoiceListParams extends PaginationParams {
  'effectiveDate[ge]'?: string
  'effectiveDate[le]'?: string
  'externalReference'?: string
  'status'?: SubscriptionInvoiceStatus
  'customer'?: string
}

// --- Subscription Response types ---

export interface Subscription {
  object: string
  id: string
  dateCreated: string
  customer: string
  paymentLink?: string | null
  billingType: BillingType
  cycle: SubscriptionCycle
  value: number
  nextDueDate: string
  endDate?: string | null
  description?: string | null
  status: SubscriptionStatus
  discount?: Discount | null
  fine?: Fine | null
  interest?: Interest | null
  deleted: boolean
  maxPayments?: number | null
  externalReference?: string | null
  checkoutSession?: string | null
  split?: SplitItem[] | null
  [key: string]: unknown
}

export interface SubscriptionRemoveResult {
  id: string
  deleted: boolean
}
