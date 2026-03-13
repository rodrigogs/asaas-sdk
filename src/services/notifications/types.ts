import type { CustomerNotification } from '../customers/types.js'

// --- Input types ---

export interface NotificationUpdateParams {
  enabled?: boolean
  emailEnabledForProvider?: boolean
  smsEnabledForProvider?: boolean
  emailEnabledForCustomer?: boolean
  smsEnabledForCustomer?: boolean
  phoneCallEnabledForCustomer?: boolean
  whatsappEnabledForCustomer?: boolean
  scheduleOffset?: number
}

export interface NotificationBatchUpdateItem extends NotificationUpdateParams {
  id: string
}

export interface NotificationBatchUpdateParams {
  customer: string
  notifications: NotificationBatchUpdateItem[]
}

// --- Response types ---

export type {
  CustomerNotification,
  CustomerNotificationEvent,
} from '../customers/types.js'

export type NotificationBatchUpdateResult = CustomerNotification[]
