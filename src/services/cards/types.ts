// --- Input types ---

export interface CreditCardData {
  holderName: string
  number: string
  expiryMonth: string
  expiryYear: string
  ccv: string
}

export interface CreditCardHolderInfo {
  name: string
  email: string
  cpfCnpj: string
  postalCode: string
  addressNumber: string
  phone?: string
  mobilePhone?: string
  addressComplement?: string
}

export interface PayWithCreditCardParams {
  creditCard?: CreditCardData
  creditCardHolderInfo?: CreditCardHolderInfo
  creditCardToken?: string
  remoteIp: string
}

export interface TokenizeParams {
  customer: string
  creditCard: CreditCardData
  creditCardHolderInfo: CreditCardHolderInfo
  remoteIp: string
}

// --- Response types ---

export interface TokenizeResult {
  creditCardNumber?: string
  creditCardBrand?: string
  creditCardToken?: string
}

export interface PreAuthorizationConfig {
  [key: string]: unknown
}
