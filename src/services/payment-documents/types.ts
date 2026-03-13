// --- Input types ---

export interface PaymentDocumentUploadParams {
  availableAfterPayment: boolean
  type: string
  file: Blob
}

export interface PaymentDocumentUpdateParams {
  availableAfterPayment?: boolean
  type?: string
}

// --- Response types ---

export interface PaymentDocument {
  id: string
  type?: string | null
  availableAfterPayment?: boolean
  [key: string]: unknown
}

export interface PaymentDocumentRemoveResult {
  id: string
  deleted: boolean
}
