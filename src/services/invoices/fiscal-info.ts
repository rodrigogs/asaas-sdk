import { BaseService } from '../../core/base-service.js'
import type { PaginatedList } from '../../core/pagination.js'
import type {
  FiscalInfo,
  FiscalInfoUpsertParams,
  MunicipalOptions,
  MunicipalServiceItem,
  MunicipalServiceListParams,
  NationalPortalConfig,
  NationalPortalParams,
  TaxSituationCode,
  TaxSituationCodeListParams,
} from './types.js'

export class FiscalInfoService extends BaseService {
  getMunicipalOptions(): Promise<MunicipalOptions> {
    return this._request({
      method: 'GET',
      path: '/fiscalInfo/municipalOptions',
    })
  }

  upsert(params: FiscalInfoUpsertParams): Promise<FiscalInfo> {
    const formData = new FormData()
    formData.append('email', params.email)
    formData.append('simplesNacional', String(params.simplesNacional))
    if (params.municipalInscription)
      formData.append('municipalInscription', params.municipalInscription)
    if (params.culturalProjectsPromoter != null)
      formData.append(
        'culturalProjectsPromoter',
        String(params.culturalProjectsPromoter),
      )
    if (params.cnae) formData.append('cnae', params.cnae)
    if (params.specialTaxRegime)
      formData.append('specialTaxRegime', params.specialTaxRegime)
    if (params.serviceListItem)
      formData.append('serviceListItem', params.serviceListItem)
    if (params.nbsCode) formData.append('nbsCode', params.nbsCode)
    if (params.rpsSerie) formData.append('rpsSerie', params.rpsSerie)
    if (params.rpsNumber != null)
      formData.append('rpsNumber', String(params.rpsNumber))
    if (params.loteNumber != null)
      formData.append('loteNumber', String(params.loteNumber))
    if (params.username) formData.append('username', params.username)
    if (params.password) formData.append('password', params.password)
    if (params.accessToken) formData.append('accessToken', params.accessToken)
    if (params.certificateFile)
      formData.append('certificateFile', params.certificateFile)
    if (params.certificatePassword)
      formData.append('certificatePassword', params.certificatePassword)
    if (params.nationalPortalTaxCalculationRegime)
      formData.append(
        'nationalPortalTaxCalculationRegime',
        params.nationalPortalTaxCalculationRegime,
      )

    return this._requestMultipart({
      method: 'POST',
      path: '/fiscalInfo',
      formData,
    })
  }

  get(): Promise<FiscalInfo> {
    return this._request({ method: 'GET', path: '/fiscalInfo' })
  }

  configureNationalPortal(
    params: NationalPortalParams,
  ): Promise<NationalPortalConfig> {
    return this._request({
      method: 'POST',
      path: '/fiscalInfo/nationalPortal',
      body: params,
    })
  }

  listMunicipalServices(
    params?: MunicipalServiceListParams,
  ): Promise<PaginatedList<MunicipalServiceItem>> {
    const { offset, limit, ...filters } = params ?? {}
    return this._list('/fiscalInfo/services', { offset, limit, ...filters })
  }

  listTaxSituationCodes(
    params?: TaxSituationCodeListParams,
  ): Promise<PaginatedList<TaxSituationCode>> {
    const { offset, limit, ...filters } = params ?? {}
    return this._list('/fiscalInfo/taxSituationCodes', {
      offset,
      limit,
      ...filters,
    })
  }
}
