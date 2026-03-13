// --- Config params (shared by default and per-subaccount) ---

export interface EscrowConfigParams {
  daysToExpire: number
  enabled?: boolean
  isFeePayer?: boolean
}

// --- Response types ---

export interface EscrowConfig {
  daysToExpire?: number
  enabled?: boolean
  isFeePayer?: boolean
}

export interface PaymentEscrow {
  id: string
  status?: string
  value?: number
  description?: string | null
}
