import type { PaginationParams } from '../../core/pagination.js'

// --- Enums ---

export type ChargebackStatus =
  | 'REQUESTED'
  | 'IN_DISPUTE'
  | 'DISPUTE_LOST'
  | 'REVERSED'
  | 'DONE'
  | (string & {})

// --- Input types ---

export interface ChargebackListParams extends PaginationParams {
  status?: ChargebackStatus
  payment?: string
}

// --- Response types ---

export interface Chargeback {
  id: string
  payment?: string | null
  installment?: string | null
  customerAccount?: string | null
  status?: ChargebackStatus
  reason?: string | null
  disputeStartDate?: string | null
  value?: number
  paymentDate?: string | null
  disputeStatus?: string | null
  deadlineToSendDisputeDocuments?: string | null
  [key: string]: unknown
}
