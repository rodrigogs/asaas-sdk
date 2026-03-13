import type { PaginationParams } from '../../core/pagination.js'
import type { PersonType } from '../shared/index.js'

// --- Input types ---

export interface CustomerCreateParams {
  name: string
  cpfCnpj: string
  email?: string
  phone?: string
  mobilePhone?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  postalCode?: string
  externalReference?: string
  notificationDisabled?: boolean
  additionalEmails?: string
  municipalInscription?: string
  stateInscription?: string
  observations?: string
  groupName?: string
  company?: string
  foreignCustomer?: boolean
}

export type CustomerUpdateParams = Partial<CustomerCreateParams>

export interface CustomerListParams extends PaginationParams {
  name?: string
  email?: string
  cpfCnpj?: string
  groupName?: string
  externalReference?: string
}

// --- Response types ---

export interface Customer {
  object?: string
  id: string
  dateCreated?: string
  name: string
  email?: string | null
  phone?: string | null
  mobilePhone?: string | null
  address?: string | null
  addressNumber?: string | null
  complement?: string | null
  province?: string | null
  city?: number | null
  cityName?: string | null
  state?: string | null
  country?: string | null
  postalCode?: string | null
  cpfCnpj?: string | null
  personType?: PersonType | null
  deleted?: boolean
  additionalEmails?: string | null
  externalReference?: string | null
  notificationDisabled?: boolean
  observations?: string | null
  foreignCustomer?: boolean
}

export interface CustomerRemoveResult {
  id: string
  deleted: boolean
}

export type CustomerNotificationEvent =
  | 'PAYMENT_CREATED'
  | 'PAYMENT_UPDATED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_DUEDATE_WARNING'
  | 'SEND_LINHA_DIGITAVEL'

export interface CustomerNotification {
  id: string
  customer?: string
  enabled?: boolean
  emailEnabledForProvider?: boolean
  smsEnabledForProvider?: boolean
  emailEnabledForCustomer?: boolean
  smsEnabledForCustomer?: boolean
  phoneCallEnabledForCustomer?: boolean
  whatsappEnabledForCustomer?: boolean
  event?: CustomerNotificationEvent
  scheduleOffset?: number
  deleted?: boolean
}
