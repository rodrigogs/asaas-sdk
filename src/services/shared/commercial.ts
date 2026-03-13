/* v8 ignore start -- type-only file, no runtime code */

export type PersonType = 'FISICA' | 'JURIDICA' | (string & {})

export type CompanyType =
  | 'MEI'
  | 'LIMITED'
  | 'INDIVIDUAL'
  | 'ASSOCIATION'
  | (string & {})

export type MunicipalService = {
  code?: string | null
  description?: string | null
  name?: string | null
}

export type CommercialInfo = {
  personType?: PersonType | null
  companyType?: CompanyType | null
  cpfCnpj?: string | null
  municipalInscription?: string | null
  municipalRegistration?: string | null
}
