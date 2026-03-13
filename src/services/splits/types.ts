// --- Enums ---

export type SplitStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PROCESSING_REFUND'
  | 'AWAITING_CREDIT'
  | 'CANCELLED'
  | 'DONE'
  | 'REFUNDED'
  | 'BLOCKED_BY_VALUE_DIVERGENCE'
  | (string & {})

export type SplitCancellationReason =
  | 'PAYMENT_DELETED'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_RECEIVED_IN_CASH'
  | 'PAYMENT_REFUNDED'
  | 'VALUE_DIVERGENCE_BLOCK'
  | 'WALLET_UNABLE_TO_RECEIVE'
  | (string & {})

// --- Split response ---

export interface Split {
  id: string
  walletId?: string
  fixedValue?: number
  percentualValue?: number
  totalValue?: number
  cancellationReason?: SplitCancellationReason | null
  status?: SplitStatus
  externalReference?: string | null
  description?: string | null
}

// --- Split list params (shared by paid and received) ---

export interface SplitListParams {
  'offset'?: number
  'limit'?: number
  'paymentId'?: string
  'status'?: SplitStatus
  'paymentConfirmedDate[ge]'?: string
  'paymentConfirmedDate[le]'?: string
  'creditDate[ge]'?: string
  'creditDate[le]'?: string
}

// --- Installment split update ---

export interface InstallmentSplitItem {
  walletId: string
  fixedValue?: number
  percentualValue?: number
  totalFixedValue?: number
  externalReference?: string
  description?: string
  installmentNumber?: number
}

export interface InstallmentSplitUpdateParams {
  splits: InstallmentSplitItem[]
}

// --- Statistics ---

export interface SplitStatistics {
  income?: number
  value?: number
}
