import { BaseService } from '../../core/base-service.js'
import type { Checkout, CheckoutCreateParams } from './types.js'

export class CheckoutsService extends BaseService {
  create(params: CheckoutCreateParams): Promise<Checkout> {
    return this._request({
      method: 'POST',
      path: '/checkouts',
      body: params,
    })
  }

  cancel(id: string): Promise<void> {
    return this._request({
      method: 'POST',
      path: `/checkouts/${id}/cancel`,
    })
  }
}
