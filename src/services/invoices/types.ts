// ---------------------------------------------------------------------------
// Invoice Status
// ---------------------------------------------------------------------------

export type InvoiceStatus =
  | 'SCHEDULED'
  | 'AUTHORIZED'
  | 'PROCESSING_CANCELLATION'
  | 'CANCELED'
  | 'CANCELLATION_DENIED'
  | 'ERROR'
  | 'SYNCHRONIZED'
  | (string & {})

// ---------------------------------------------------------------------------
// Authentication type for municipal options
// ---------------------------------------------------------------------------

export type FiscalAuthenticationType =
  | 'CERTIFICATE'
  | 'TOKEN'
  | 'USER_AND_PASSWORD'
  | (string & {})

// ---------------------------------------------------------------------------
// Municipal Options (GET /fiscalInfo/municipalOptions)
// ---------------------------------------------------------------------------

export interface MunicipalOptions {
  authenticationType?: FiscalAuthenticationType
  supportsCancellation?: boolean
  usesSpecialTaxRegimes?: boolean
  usesServiceListItem?: boolean
  specialTaxRegimesList?: string[]
  nationalPortalTaxCalculationRegimeList?: string[]
  nationalPortalTaxCalculationRegimeHelp?: string | null
  municipalInscriptionHelp?: string | null
  specialTaxRegimeHelp?: string | null
  serviceListItemHelp?: string | null
  digitalCertificatedHelp?: string | null
  accessTokenHelp?: string | null
  municipalServiceCodeHelp?: string | null
}

// ---------------------------------------------------------------------------
// Fiscal Info (POST /fiscalInfo, GET /fiscalInfo)
// ---------------------------------------------------------------------------

export interface FiscalInfoUpsertParams {
  email: string
  simplesNacional: boolean
  municipalInscription?: string
  culturalProjectsPromoter?: boolean
  cnae?: string
  specialTaxRegime?: string
  serviceListItem?: string
  nbsCode?: string
  rpsSerie?: string
  rpsNumber?: number
  loteNumber?: number
  username?: string
  password?: string
  accessToken?: string
  certificateFile?: Blob
  certificatePassword?: string
  nationalPortalTaxCalculationRegime?: string
}

export interface FiscalInfo {
  email?: string
  simplesNacional?: boolean
  municipalInscription?: string | null
  culturalProjectsPromoter?: boolean
  cnae?: string | null
  specialTaxRegime?: string | null
  serviceListItem?: string | null
  nbsCode?: string | null
  rpsSerie?: string | null
  rpsNumber?: number | null
  loteNumber?: number | null
  passwordSent?: boolean
  accessTokenSent?: boolean
  certificateSent?: boolean
  nationalPortalTaxCalculationRegime?: string | null
}

// ---------------------------------------------------------------------------
// National Portal (POST /fiscalInfo/nationalPortal)
// ---------------------------------------------------------------------------

export interface NationalPortalParams {
  enabled: boolean
}

export interface NationalPortalConfig {
  enabled?: boolean
}

// ---------------------------------------------------------------------------
// Municipal Services catalog (GET /fiscalInfo/services)
// ---------------------------------------------------------------------------

export interface MunicipalServiceItem {
  id: string
  description?: string | null
  issTax?: number | null
}

export interface MunicipalServiceListParams {
  offset?: number
  limit?: number
  description?: string
}

// ---------------------------------------------------------------------------
// Tax Situation Codes catalog (GET /fiscalInfo/taxSituationCodes)
// ---------------------------------------------------------------------------

export interface TaxSituationCode {
  code: string
  description?: string | null
  isSubjectToIbsCbsTaxation?: boolean
  isBaseReductionPercentApplicable?: boolean
  isDefermentApplicable?: boolean
}

export interface TaxSituationCodeListParams {
  offset?: number
  limit?: number
  code?: string
  description?: string
}

// ---------------------------------------------------------------------------
// Invoice Taxes
// ---------------------------------------------------------------------------

export interface InvoiceTaxesInput {
  retainIss: boolean
  iss: number
  pis: number
  cofins: number
  csll: number
  inss: number
  ir: number
  nbsCode?: string
  taxSituationCode?: string
  taxClassificationCode?: string
  operationIndicatorCode?: string
  pisCofinsRetentionType?: string
  pisCofinsTaxStatus?: string
}

export interface InvoiceTaxes extends InvoiceTaxesInput {
  stateIbs?: number | null
  stateIbsValue?: number | null
  municipalIbs?: number | null
  municipalIbsValue?: number | null
  cbs?: number | null
  cbsValue?: number | null
}

// ---------------------------------------------------------------------------
// Invoice Create / Update / Response
// ---------------------------------------------------------------------------

export interface InvoiceCreateParams {
  serviceDescription: string
  observations: string
  value: number
  deductions: number
  effectiveDate: string
  municipalServiceName: string
  taxes: InvoiceTaxesInput
  payment?: string
  installment?: string
  customer?: string
  externalReference?: string
  municipalServiceId?: string
  municipalServiceCode?: string
  updatePayment?: boolean
}

export interface InvoiceUpdateParams {
  serviceDescription?: string
  observations?: string
  value?: number
  deductions?: number
  effectiveDate?: string
  updatePayment?: boolean
  externalReference?: string
  taxes?: Partial<InvoiceTaxesInput>
}

export interface Invoice {
  id: string
  status?: InvoiceStatus
  customer?: string | null
  payment?: string | null
  installment?: string | null
  type?: string | null
  statusDescription?: string | null
  serviceDescription?: string | null
  pdfUrl?: string | null
  xmlUrl?: string | null
  rpsSerie?: string | null
  rpsNumber?: string | null
  number?: string | null
  invoiceNumber?: string | null
  validationCode?: string | null
  value?: number
  deductions?: number
  effectiveDate?: string | null
  observations?: string | null
  estimatedTaxesDescription?: string | null
  externalReference?: string | null
  taxes?: InvoiceTaxes | null
  municipalServiceId?: string | null
  municipalServiceCode?: string | null
  municipalServiceName?: string | null
}

export interface InvoiceListParams {
  'offset'?: number
  'limit'?: number
  'effectiveDate[ge]'?: string
  'effectiveDate[le]'?: string
  'payment'?: string
  'installment'?: string
  'externalReference'?: string
  'status'?: InvoiceStatus
  'customer'?: string
}

export interface InvoiceCancelParams {
  cancelOnlyOnAsaas?: boolean
}
