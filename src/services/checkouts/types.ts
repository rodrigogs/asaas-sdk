// --- Enums ---

export type CheckoutBillingType = 'CREDIT_CARD' | 'PIX' | (string & {})

export type CheckoutChargeType =
  | 'DETACHED'
  | 'RECURRENT'
  | 'INSTALLMENT'
  | (string & {})

export type CheckoutConfigStatus =
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | (string & {})

// --- Input types ---

export interface CheckoutCallback {
  successUrl: string
  cancelUrl?: string
  expiredUrl?: string
}

export interface CheckoutItem {
  imageBase64: string
  name: string
  quantity: number
  value: number
}

export interface CheckoutCustomerData {
  name?: string
  cpfCnpj?: string
  email?: string
  phone?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  postalCode?: string
  city?: string
}

export interface CheckoutSubscriptionConfig {
  cycle: string
}

export interface CheckoutInstallmentConfig {
  maxInstallmentCount: number
}

export interface CheckoutSplitItem {
  walletId: string
  fixedValue?: number
  percentageValue?: number
  totalFixedValue?: number
}

export interface CheckoutCreateParams {
  billingTypes: CheckoutBillingType[]
  chargeTypes: CheckoutChargeType[]
  callback: CheckoutCallback
  items: CheckoutItem[]
  minutesToExpire?: number
  externalReference?: string
  customerData?: CheckoutCustomerData
  subscription?: CheckoutSubscriptionConfig
  installment?: CheckoutInstallmentConfig
  splits?: CheckoutSplitItem[]
}

export interface CheckoutConfigSaveParams {
  logoBackgroundColor: string
  infoBackgroundColor: string
  fontColor: string
  enabled?: boolean
  logoFile?: Blob
}

// --- Response types ---

export interface Checkout {
  id?: string
  url?: string
  billingTypes?: CheckoutBillingType[]
  chargeTypes?: CheckoutChargeType[]
  minutesToExpire?: number
  externalReference?: string | null
  callback?: CheckoutCallback
  items?: CheckoutItem[]
  customerData?: CheckoutCustomerData | null
  subscription?: CheckoutSubscriptionConfig | null
  installment?: CheckoutInstallmentConfig | null
  split?: CheckoutSplitItem[]
}

export interface CheckoutConfig {
  logoBackgroundColor?: string
  infoBackgroundColor?: string
  fontColor?: string
  enabled?: boolean
  logoUrl?: string | null
  observations?: string | null
  status?: CheckoutConfigStatus
}
