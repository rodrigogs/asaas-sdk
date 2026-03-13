import type { PaginationParams } from '../../core/pagination.js'

// --- Enums ---

export type PaymentLinkBillingType =
  | 'UNDEFINED'
  | 'BOLETO'
  | 'CREDIT_CARD'
  | 'PIX'
  | (string & {})

export type PaymentLinkChargeType =
  | 'DETACHED'
  | 'RECURRENT'
  | 'INSTALLMENT'
  | (string & {})

export type PaymentLinkSubscriptionCycle =
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'BIMONTHLY'
  | 'QUARTERLY'
  | 'SEMIANNUALLY'
  | 'YEARLY'
  | (string & {})

// --- Input types ---

export interface PaymentLinkCallback {
  successUrl: string
  autoRedirect?: boolean
}

export interface PaymentLinkCreateParams {
  name: string
  billingType: PaymentLinkBillingType
  chargeType: PaymentLinkChargeType
  description?: string
  endDate?: string
  value?: number
  dueDateLimitDays?: number
  subscriptionCycle?: PaymentLinkSubscriptionCycle
  maxInstallmentCount?: number
  externalReference?: string
  notificationEnabled?: boolean
  callback?: PaymentLinkCallback
  isAddressRequired?: boolean
}

// Asymmetric: update does NOT accept isAddressRequired
export interface PaymentLinkUpdateParams {
  name?: string
  description?: string
  endDate?: string
  value?: number
  active?: boolean
  billingType?: PaymentLinkBillingType
  chargeType?: PaymentLinkChargeType
  dueDateLimitDays?: number
  subscriptionCycle?: PaymentLinkSubscriptionCycle
  maxInstallmentCount?: number
  externalReference?: string
  notificationEnabled?: boolean
  callback?: PaymentLinkCallback
}

export interface PaymentLinkListParams extends PaginationParams {
  name?: string
  active?: boolean
  includeDeleted?: boolean
}

export interface PaymentLinkImageUploadParams {
  main?: boolean
  image: Blob
}

// --- Response types ---

export interface PaymentLink {
  id: string
  name?: string
  value?: number | null
  active?: boolean
  chargeType?: PaymentLinkChargeType
  url?: string
  billingType?: PaymentLinkBillingType
  subscriptionCycle?: PaymentLinkSubscriptionCycle | null
  description?: string | null
  endDate?: string | null
  deleted?: boolean
  viewCount?: number
  maxInstallmentCount?: number | null
  dueDateLimitDays?: number
  notificationEnabled?: boolean
  isAddressRequired?: boolean
  externalReference?: string | null
}

export interface PaymentLinkRemoveResult {
  id: string
  deleted: boolean
}

export interface PaymentLinkImageFile {
  originalName?: string
  size?: number
  extension?: string
  previewUrl?: string
  downloadUrl?: string
}

export interface PaymentLinkImage {
  id: string
  main?: boolean
  image?: PaymentLinkImageFile
}
