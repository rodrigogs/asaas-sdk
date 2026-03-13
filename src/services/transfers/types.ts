import type { PaginationParams } from '../../core/pagination.js'
import type { PixKeyType } from '../pix/types.js'

// --- Enums ---

export type TransferType = 'PIX' | 'TED' | 'INTERNAL' | (string & {})

export type TransferStatus =
  | 'PENDING'
  | 'BANK_PROCESSING'
  | 'DONE'
  | 'CANCELLED'
  | 'FAILED'
  | (string & {})

export type TransferOperationType = 'PIX' | 'TED' | (string & {})

export type BankAccountType =
  | 'CONTA_CORRENTE'
  | 'CONTA_POUPANCA'
  | (string & {})

export type TransferRecurringFrequency = 'WEEKLY' | 'MONTHLY' | (string & {})

// --- Shared types ---

export interface TransferBankAccount {
  bank?: { code?: string; ispb?: string; name?: string } | null
  accountName?: string | null
  ownerName?: string | null
  cpfCnpj?: string | null
  agency?: string | null
  agencyDigit?: string | null
  account?: string | null
  accountDigit?: string | null
  pixAddressKey?: string | null
}

// --- Input types ---

export interface TransferBankAccountParams {
  bank: { code: string }
  ownerName: string
  cpfCnpj: string
  agency: string
  account: string
  accountDigit: string
  accountName?: string
  ownerBirthDate?: string
  bankAccountType?: BankAccountType
  ispb?: string
}

export interface TransferRecurringParams {
  frequency: TransferRecurringFrequency
  quantity: number
}

export interface TransferCreateParams {
  value: number
  bankAccount?: TransferBankAccountParams
  operationType?: TransferOperationType
  pixAddressKey?: string
  pixAddressKeyType?: PixKeyType
  description?: string
  scheduleDate?: string
  externalReference?: string
  recurring?: TransferRecurringParams
}

export interface TransferToAsaasAccountParams {
  value: number
  walletId: string
  externalReference?: string
}

export interface TransferListParams extends PaginationParams {
  'dateCreated[ge]'?: string
  'dateCreated[le]'?: string
  'transferDate[ge]'?: string
  'transferDate[le]'?: string
  'type'?: TransferType
}

// --- Response types ---

export interface Transfer {
  object?: string
  id: string
  type?: TransferType
  dateCreated?: string
  value?: number
  netValue?: number
  status?: TransferStatus
  transferFee?: number
  effectiveDate?: string | null
  scheduleDate?: string | null
  endToEndIdentifier?: string | null
  authorized?: boolean
  failReason?: string | null
  externalReference?: string | null
  transactionReceiptUrl?: string | null
  operationType?: TransferType
  description?: string | null
  recurring?: string | null
  bankAccount?: TransferBankAccount | null
  walletId?: string | null
  account?: string | null
}

export interface Wallet {
  id: string
}
