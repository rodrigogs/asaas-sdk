import type { PaginationParams } from '../../core/pagination.js'
import type { CreditCardData, CreditCardHolderInfo } from '../cards/index.js'

// --- Enums (open to API evolution) ---

export type BillingType =
  | 'UNDEFINED'
  | 'BOLETO'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'TRANSFER'
  | 'DEPOSIT'
  | 'PIX'
  | (string & {})

export type PaymentStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'CONFIRMED'
  | 'OVERDUE'
  | 'REFUNDED'
  | 'RECEIVED_IN_CASH'
  | 'REFUND_REQUESTED'
  | 'REFUND_IN_PROGRESS'
  | 'CHARGEBACK_REQUESTED'
  | 'CHARGEBACK_DISPUTE'
  | 'AWAITING_CHARGEBACK_REVERSAL'
  | 'DUNNING_REQUESTED'
  | 'DUNNING_RECEIVED'
  | 'AWAITING_RISK_ANALYSIS'
  | 'AUTHORIZED'
  | (string & {})

// --- Shared sub-types ---

export interface Discount {
  value: number
  dueDateLimitDays?: number
  type?: 'FIXED' | 'PERCENTAGE' | (string & {})
}

export interface Interest {
  value: number
  type?: 'PERCENTAGE' | (string & {})
}

export interface Fine {
  value: number
  type?: 'FIXED' | 'PERCENTAGE' | (string & {})
}

export interface SplitItem {
  walletId: string
  fixedValue?: number
  percentualValue?: number
  totalFixedValue?: number
  externalReference?: string
  description?: string
}

// --- Input types ---

export interface PaymentCreateParams {
  customer: string
  billingType: BillingType
  value: number
  dueDate: string
  description?: string
  daysAfterDueDateToRegistrationCancellation?: number
  externalReference?: string
  installmentCount?: number
  totalValue?: number
  installmentValue?: number
  discount?: Discount
  interest?: Interest
  fine?: Fine
  postalService?: boolean
  split?: SplitItem[]
  callback?: { successUrl: string; autoRedirect?: boolean }
  creditCard?: CreditCardData
  creditCardHolderInfo?: CreditCardHolderInfo
  creditCardToken?: string
  remoteIp?: string
  authorizedOnly?: boolean
  pixAutomaticAuthorizationId?: string
}

export interface PaymentUpdateParams {
  description?: string
  dueDate?: string
  value?: number
  discount?: Discount
  interest?: Interest
  fine?: Fine
  externalReference?: string
  installmentCount?: number
  totalValue?: number
  installmentValue?: number
  postalService?: boolean
  split?: SplitItem[]
}

export interface PaymentListParams extends PaginationParams {
  'customer'?: string
  'customerGroupName'?: string
  'subscription'?: string
  'installment'?: string
  'externalReference'?: string
  'billingType'?: BillingType
  'status'?: PaymentStatus
  'dateCreated[ge]'?: string
  'dateCreated[le]'?: string
  'paymentDate[ge]'?: string
  'paymentDate[le]'?: string
  'dueDate[ge]'?: string
  'dueDate[le]'?: string
  'paymentDate'?: string
  'estimatedCreditDate'?: string
  'estimatedCreditDate[ge]'?: string
  'estimatedCreditDate[le]'?: string
  'checkoutSession'?: string
  'invoiceStatus'?: string
  'pixQrCodeId'?: string
  'anticipated'?: boolean
  'anticipable'?: boolean
  'user'?: string
}

export interface CashReceiptParams {
  paymentDate?: string
  value?: number
  notifyCustomer?: boolean
}

export interface SplitRefundItem {
  walletId: string
  value: number
}

export interface RefundParams {
  value?: number
  description?: string
  splitRefunds?: SplitRefundItem[]
}

export interface SimulateParams {
  value: number
  installmentCount?: number
  billingTypes?: BillingType[]
}

// --- Response types ---

export interface Payment {
  id: string
  customer: string
  subscription?: string | null
  installment?: string | null
  paymentLink?: string | null
  value: number
  netValue?: number
  originalValue?: number | null
  interestValue?: number | null
  billingType: BillingType
  status: PaymentStatus
  dueDate: string
  paymentDate?: string | null
  invoiceUrl?: string | null
  invoiceNumber?: string | null
  externalReference?: string | null
  bankSlipUrl?: string | null
  nossoNumero?: string | null
  transactionReceiptUrl?: string | null
  description?: string | null
  discount?: Discount | null
  fine?: Fine | null
  interest?: Interest | null
  split?: SplitItem[] | null
  checkoutSession?: string | null
  pixTransaction?: string | null
  pixQrCodeId?: string | null
  creditCard?: Record<string, unknown> | null
  chargeback?: Record<string, unknown> | null
  escrow?: Record<string, unknown> | null
  refunds?: Record<string, unknown>[] | null
  deleted?: boolean
  dateCreated?: string
  [key: string]: unknown
}

export interface PaymentRemoveResult {
  id: string
  deleted: boolean
}

export interface PaymentStatusResult {
  status: PaymentStatus
}

export interface IdentificationField {
  identificationField: string
  nossoNumero: string
  barCode?: string
}

export type RefundStatus = 'PENDING' | 'CANCELLED' | 'DONE' | (string & {})

export interface Refund {
  dateCreated?: string
  status?: RefundStatus
  value?: number
  endToEndIdentifier?: string | null
  description?: string | null
  effectiveDate?: string | null
  transactionReceiptUrl?: string | null
  refundedSplits?: Record<string, unknown>[] | null
}

export interface SimulationResult {
  creditCard?: unknown
  bankSlip?: unknown
  pix?: unknown
  [key: string]: unknown
}

export interface PaymentLimits {
  [key: string]: unknown
}
