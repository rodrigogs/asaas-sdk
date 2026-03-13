// --- Key enums ---

export type PixKeyType =
  | 'CPF'
  | 'CNPJ'
  | 'EMAIL'
  | 'PHONE'
  | 'EVP'
  | (string & {})

export type PixKeyStatus =
  | 'AWAITING_ACTIVATION'
  | 'ACTIVE'
  | 'AWAITING_DELETION'
  | 'AWAITING_ACCOUNT_DELETION'
  | 'DELETED'
  | 'ERROR'
  | (string & {})

// --- Transaction enums ---

export type PixTransactionStatus =
  | 'AWAITING_BALANCE_VALIDATION'
  | 'AWAITING_INSTANT_PAYMENT_ACCOUNT_BALANCE'
  | 'AWAITING_CRITICAL_ACTION_AUTHORIZATION'
  | 'AWAITING_CHECKOUT_RISK_ANALYSIS_REQUEST'
  | 'AWAITING_CASH_IN_RISK_ANALYSIS_REQUEST'
  | 'SCHEDULED'
  | 'AWAITING_REQUEST'
  | 'REQUESTED'
  | 'DONE'
  | 'REFUSED'
  | 'CANCELLED'
  | (string & {})

export type PixTransactionType =
  | 'DEBIT'
  | 'CREDIT'
  | 'CREDIT_REFUND'
  | 'DEBIT_REFUND'
  | 'DEBIT_REFUND_CANCELLATION'
  | (string & {})

// --- QR Code enums ---

export type PixStaticQrCodeFormat = 'ALL' | 'IMAGE' | 'PAYLOAD' | (string & {})

// --- Automatic enums ---

export type PixAutomaticAuthorizationStatus =
  | 'CREATED'
  | 'ACTIVE'
  | 'CANCELLED'
  | 'REFUSED'
  | 'EXPIRED'
  | (string & {})

export type PixAutomaticPaymentInstructionStatus =
  | 'AWAITING_REQUEST'
  | 'SCHEDULED'
  | 'DONE'
  | 'CANCELLED'
  | 'REFUSED'
  | (string & {})

export type PixAutomaticFrequency =
  | 'WEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'SEMIANNUALLY'
  | 'ANNUALLY'
  | (string & {})

// --- Recurring enums ---

export type PixRecurringStatus =
  | 'AWAITING_CRITICAL_ACTION_AUTHORIZATION'
  | 'PENDING'
  | 'SCHEDULED'
  | 'CANCELLED'
  | 'DONE'
  | (string & {})

// --- Shared types ---

export interface PixExternalAccount {
  ispb?: string
  ispbName?: string
  name?: string
  cpfCnpj?: string
  addressKey?: string
  addressKeyType?: PixKeyType
}
