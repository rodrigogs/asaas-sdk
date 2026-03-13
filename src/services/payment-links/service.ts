import { BaseService } from '../../core/base-service.js'
import type { PaginatedList } from '../../core/pagination.js'
import { PaymentLinkImagesService } from './images.js'
import type {
  PaymentLink,
  PaymentLinkCreateParams,
  PaymentLinkListParams,
  PaymentLinkRemoveResult,
  PaymentLinkUpdateParams,
} from './types.js'

export class PaymentLinksService extends BaseService {
  create(params: PaymentLinkCreateParams): Promise<PaymentLink> {
    return this._request({
      method: 'POST',
      path: '/paymentLinks',
      body: params,
    })
  }

  list(params?: PaymentLinkListParams): Promise<PaginatedList<PaymentLink>> {
    const { offset, limit, ...filters } = params ?? {}
    return this._list('/paymentLinks', { offset, limit, ...filters })
  }

  get(id: string): Promise<PaymentLink> {
    return this._request({
      method: 'GET',
      path: `/paymentLinks/${id}`,
    })
  }

  update(id: string, params: PaymentLinkUpdateParams): Promise<PaymentLink> {
    return this._request({
      method: 'PUT',
      path: `/paymentLinks/${id}`,
      body: params,
    })
  }

  remove(id: string): Promise<PaymentLinkRemoveResult> {
    return this._request({
      method: 'DELETE',
      path: `/paymentLinks/${id}`,
    })
  }

  restore(id: string): Promise<PaymentLink> {
    return this._request({
      method: 'POST',
      path: `/paymentLinks/${id}/restore`,
    })
  }

  private _images?: PaymentLinkImagesService
  get images(): PaymentLinkImagesService {
    return (this._images ??= new PaymentLinkImagesService(this.options))
  }
}
