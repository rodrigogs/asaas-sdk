import { BaseService } from '../../core/base-service.js'
import type { PaymentLinkImage, PaymentLinkImageUploadParams } from './types.js'

export class PaymentLinkImagesService extends BaseService {
  add(
    paymentLinkId: string,
    params: PaymentLinkImageUploadParams,
  ): Promise<PaymentLinkImage> {
    const formData = new FormData()
    if (params.main !== undefined) {
      formData.append('main', String(params.main))
    }
    formData.append('image', params.image)
    return this._requestMultipart({
      method: 'POST',
      path: `/paymentLinks/${paymentLinkId}/images`,
      formData,
    })
  }

  list(paymentLinkId: string): Promise<PaymentLinkImage[]> {
    return this._request({
      method: 'GET',
      path: `/paymentLinks/${paymentLinkId}/images`,
    })
  }

  get(paymentLinkId: string, imageId: string): Promise<PaymentLinkImage> {
    return this._request({
      method: 'GET',
      path: `/paymentLinks/${paymentLinkId}/images/${imageId}`,
    })
  }

  remove(paymentLinkId: string, imageId: string): Promise<void> {
    return this._request({
      method: 'DELETE',
      path: `/paymentLinks/${paymentLinkId}/images/${imageId}`,
    })
  }

  setMain(paymentLinkId: string, imageId: string): Promise<PaymentLinkImage> {
    return this._request({
      method: 'PUT',
      path: `/paymentLinks/${paymentLinkId}/images/${imageId}/setAsMain`,
    })
  }
}
