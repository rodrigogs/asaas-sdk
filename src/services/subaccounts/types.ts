import type { PaginationParams } from '../../core/pagination.js'
import type { CompanyType, PersonType } from '../shared/index.js'

// --- Enums ---

export type AccountRegistrationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'AWAITING_APPROVAL'
  | (string & {})

export type CommercialInfoStatus =
  | 'APPROVED'
  | 'AWAITING_ACTION_AUTHORIZATION'
  | 'DENIED'
  | 'PENDING'
  | (string & {})

export type DocumentGroupStatus =
  | 'NOT_SENT'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'IGNORED'
  | (string & {})

export type DocumentGroupType =
  | 'IDENTIFICATION'
  | 'IDENTIFICATION_SELFIE'
  | 'SOCIAL_CONTRACT'
  | 'MINUTES_OF_ELECTION'
  | 'MEI_CERTIFICATE'
  | 'POWER_OF_ATTORNEY'
  | 'CUSTOM'
  | (string & {})

// --- Shared types ---

export interface CommercialInfoExpiration {
  isExpired?: boolean
  scheduledDate?: string | null
}

// --- Input types (root context: /accounts) ---

export interface SubaccountWebhookParams {
  url: string
  email: string
  apiVersion?: number
  enabled?: boolean
  interrupted?: boolean
  authToken?: string
  sendType?: string
  events?: string[]
}

export interface SubaccountCreateParams {
  name: string
  email: string
  cpfCnpj: string
  mobilePhone: string
  incomeValue: number
  address: string
  addressNumber: string
  province: string
  postalCode: string
  loginEmail?: string
  birthDate?: string
  companyType?: CompanyType
  phone?: string
  site?: string
  complement?: string
  webhooks?: SubaccountWebhookParams[]
}

export interface SubaccountListParams extends PaginationParams {
  cpfCnpj?: string
  email?: string
  name?: string
  walletId?: string
}

// --- Input types (root context: /accounts/{id}/accessTokens) ---

export interface AccessTokenCreateParams {
  name: string
  expirationDate?: string
}

export interface AccessTokenUpdateParams {
  name: string
  enabled: boolean
  expirationDate?: string
}

// --- Input types (myAccount context) ---

export interface CommercialInfoUpdateParams {
  personType?: PersonType
  cpfCnpj?: string
  birthDate?: string
  companyType?: CompanyType
  companyName?: string
  incomeValue?: number
  email?: string
  phone?: string
  mobilePhone?: string
  site?: string
  postalCode?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
}

// --- Response types ---

export interface Subaccount {
  object?: string
  id: string
  name?: string
  email?: string
  loginEmail?: string | null
  cpfCnpj?: string
  personType?: PersonType | null
  companyType?: CompanyType | null
  walletId?: string
  accountNumber?: {
    agency?: string
    account?: string
    accountDigit?: string
  } | null
  commercialInfoExpiration?: CommercialInfoExpiration | null
  apiKey?: string | null
  accessToken?: string | null
  phone?: string | null
  mobilePhone?: string | null
  address?: string | null
  addressNumber?: string | null
  complement?: string | null
  province?: string | null
  postalCode?: string | null
  city?: number | null
  state?: string | null
  country?: string | null
  site?: string | null
  incomeValue?: number | null
  birthDate?: string | null
}

export interface AccessToken {
  id: string
  name?: string | null
  enabled?: boolean
  expirationDate?: string | null
  dateCreated?: string | null
  projectedExpirationDateByLackOfUse?: string | null
  apiKey?: string | null
}

export interface AccessTokenList {
  accessTokens?: AccessToken[]
}

export interface AccountRegistrationStatusResult {
  commercialInfo?: AccountRegistrationStatus | null
  bankAccountInfo?: AccountRegistrationStatus | null
  documentation?: AccountRegistrationStatus | null
  general?: AccountRegistrationStatus | null
}

export interface DocumentFile {
  id?: string
  type?: DocumentGroupType | null
}

export interface DocumentGroup {
  id: string
  status?: DocumentGroupStatus | null
  type?: DocumentGroupType | null
  title?: string | null
  description?: string | null
  responsible?: string | null
  onboardingUrl?: string | null
  onboardingUrlExpirationDate?: string | null
  documents?: DocumentFile[] | null
}

export interface DocumentGroupList {
  rejectReasons?: string | null
  data?: DocumentGroup[]
}

export interface SubaccountCommercialInfo {
  status?: CommercialInfoStatus | null
  personType?: PersonType | null
  cpfCnpj?: string | null
  name?: string | null
  birthDate?: string | null
  companyName?: string | null
  companyType?: CompanyType | null
  incomeValue?: number | null
  email?: string | null
  phone?: string | null
  mobilePhone?: string | null
  postalCode?: string | null
  address?: string | null
  addressNumber?: string | null
  complement?: string | null
  province?: string | null
  city?: string | null
  denialReason?: string | null
  tradingName?: string | null
  site?: string | null
  availableCompanyNames?: string[] | null
  commercialInfoExpiration?: CommercialInfoExpiration | null
}

export interface SubaccountRemoveResult {
  deleted: boolean
}
