// --- Enums ---

export type BillPaymentStatus =
  | 'PENDING'
  | 'BANK_PROCESSING'
  | 'PAID'
  | 'CANCELLED'
  | 'FAILED'
  | 'REFUNDED'
  | 'AWAITING_CHECKOUT_RISK_ANALYSIS_REQUEST'
  | (string & {})

// --- Request params ---

export interface BillPaymentCreateParams {
  identificationField: string
  scheduleDate?: string
  description?: string
  discount?: number
  interest?: number
  fine?: number
  dueDate?: string
  value?: number
  externalReference?: string
}

export interface BillPaymentSimulateParams {
  identificationField: string
}

export interface BillPaymentListParams {
  offset?: number
  limit?: number
}

// --- Response types ---

export interface BillPayment {
  id: string
  status?: BillPaymentStatus
  identificationField?: string
  value?: number
  discount?: number
  interest?: number
  fine?: number
  description?: string | null
  scheduleDate?: string | null
  dueDate?: string | null
  externalReference?: string | null
  canBeCancelled?: boolean
  failReasons?: string | null
  transactionReceiptUrl?: string | null
}
