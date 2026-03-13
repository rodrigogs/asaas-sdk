import type { PaginationParams } from '../../core/pagination.js'
import type {
  BillingType,
  Discount,
  Fine,
  Interest,
  SplitItem,
  SplitRefundItem,
} from '../payments/index.js'

// --- Input types ---

export interface InstallmentCreateParams {
  installmentCount: number
  customer: string
  value: number
  billingType: BillingType
  dueDate: string
  totalValue?: number
  description?: string
  postalService?: boolean
  daysAfterDueDateToRegistrationCancellation?: number
  paymentExternalReference?: string
  discount?: Discount
  interest?: Interest
  fine?: Fine
  splits?: SplitItem[]
}

export interface InstallmentListParams extends PaginationParams {
  customer?: string
}

export interface InstallmentRefundParams {
  value?: number
  description?: string
  splitRefunds?: SplitRefundItem[]
}

// --- Response types ---

export interface Installment {
  id: string
  value?: number
  netValue?: number
  paymentValue?: number
  installmentCount?: number
  billingType?: BillingType
  paymentDate?: string | null
  expirationDay?: number | null
  customer?: string
  chargeback?: Record<string, unknown> | null
  refunds?: Record<string, unknown>[] | null
  deleted?: boolean
  [key: string]: unknown
}

export interface InstallmentRemoveResult {
  id: string
  deleted: boolean
}
