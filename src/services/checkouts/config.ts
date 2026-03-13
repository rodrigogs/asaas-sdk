import { BaseService } from '../../core/base-service.js'
import type { CheckoutConfig, CheckoutConfigSaveParams } from './types.js'

export class CheckoutConfigService extends BaseService {
  get(): Promise<CheckoutConfig> {
    return this._request({
      method: 'GET',
      path: '/myAccount/paymentCheckoutConfig/',
    })
  }

  save(params: CheckoutConfigSaveParams): Promise<CheckoutConfig> {
    const formData = new FormData()
    formData.append('logoBackgroundColor', params.logoBackgroundColor)
    formData.append('infoBackgroundColor', params.infoBackgroundColor)
    formData.append('fontColor', params.fontColor)
    if (params.enabled !== undefined) {
      formData.append('enabled', String(params.enabled))
    }
    if (params.logoFile) {
      formData.append('logoFile', params.logoFile)
    }
    return this._requestMultipart({
      method: 'POST',
      path: '/myAccount/paymentCheckoutConfig/',
      formData,
    })
  }
}
