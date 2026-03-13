import { BaseService } from '../../core/base-service.js'
import type { PaginatedList } from '../../core/pagination.js'
import type {
  BillPayment,
  BillPaymentCreateParams,
  BillPaymentListParams,
  BillPaymentSimulateParams,
} from './types.js'

export class BillService extends BaseService {
  simulate(params: BillPaymentSimulateParams): Promise<BillPayment> {
    return this._request({
      method: 'POST',
      path: '/bill/simulate',
      body: params,
    })
  }

  create(params: BillPaymentCreateParams): Promise<BillPayment> {
    return this._request({ method: 'POST', path: '/bill', body: params })
  }

  list(params?: BillPaymentListParams): Promise<PaginatedList<BillPayment>> {
    const { offset, limit } = params ?? {}
    return this._list('/bill', { offset, limit })
  }

  get(id: string): Promise<BillPayment> {
    return this._request({ method: 'GET', path: `/bill/${id}` })
  }

  cancel(id: string): Promise<BillPayment> {
    return this._request({ method: 'POST', path: `/bill/${id}/cancel` })
  }
}
