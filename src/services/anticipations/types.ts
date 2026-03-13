// --- Enums ---

export type AnticipationStatus =
  | 'PENDING'
  | 'DENIED'
  | 'CREDITED'
  | 'DEBITED'
  | 'CANCELLED'
  | 'OVERDUE'
  | 'SCHEDULED'
  | (string & {})

// --- Request params ---

export interface AnticipationCreateParams {
  installment?: string
  payment?: string
  documents?: Blob[]
}

export interface AnticipationSimulateParams {
  installment?: string
  payment?: string
}

export interface AnticipationListParams {
  offset?: number
  limit?: number
  payment?: string
  installment?: string
  status?: AnticipationStatus
}

// --- Response types ---

export interface Anticipation {
  id: string
  installment?: string | null
  payment?: string | null
  status?: AnticipationStatus
  anticipationDate?: string | null
  dueDate?: string | null
  requestDate?: string | null
  fee?: number
  anticipationDays?: number
  netValue?: number
  totalValue?: number
  value?: number
  denialObservation?: string | null
}

export interface AnticipationSimulation {
  anticipationDate?: string
  dueDate?: string
  fee?: number
  anticipationDays?: number
  netValue?: number
  totalValue?: number
  value?: number
  isDocumentationRequired?: boolean
}

// --- Limits ---

export interface AnticipationLimitBlock {
  total?: number
  available?: number
}

export interface AnticipationLimits {
  creditCard?: AnticipationLimitBlock
  bankSlip?: AnticipationLimitBlock
}

// --- Automatic anticipation config ---

export interface AnticipationConfig {
  creditCardAutomaticEnabled?: boolean
}

export interface AnticipationConfigUpdateParams {
  creditCardAutomaticEnabled: boolean
}
