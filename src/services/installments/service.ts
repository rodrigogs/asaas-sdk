import { BaseService } from '../../core/base-service.js'
import type { BinaryResponse } from '../../core/http.js'
import type { PaginatedList } from '../../core/pagination.js'
import type { Payment } from '../payments/index.js'
import type {
  Installment,
  InstallmentCreateParams,
  InstallmentListParams,
  InstallmentRefundParams,
  InstallmentRemoveResult,
} from './types.js'

export class InstallmentsService extends BaseService {
  create(params: InstallmentCreateParams): Promise<Installment> {
    return this._request({
      method: 'POST',
      path: '/installments',
      body: params,
    })
  }

  get(id: string): Promise<Installment> {
    return this._request({ method: 'GET', path: `/installments/${id}` })
  }

  list(params?: InstallmentListParams): Promise<PaginatedList<Installment>> {
    const { offset, limit, ...filters } = params ?? {}
    return this._list('/installments', { offset, limit, ...filters })
  }

  remove(id: string): Promise<InstallmentRemoveResult> {
    return this._request({ method: 'DELETE', path: `/installments/${id}` })
  }

  listPayments(id: string): Promise<PaginatedList<Payment>> {
    return this._list(`/installments/${id}/payments`)
  }

  cancelPendingCharges(id: string): Promise<Record<string, unknown>> {
    return this._request({
      method: 'DELETE',
      path: `/installments/${id}/payments`,
    })
  }

  refund(
    id: string,
    params?: InstallmentRefundParams,
  ): Promise<Record<string, unknown>> {
    return this._request({
      method: 'POST',
      path: `/installments/${id}/refund`,
      body: params,
    })
  }

  downloadPaymentBook(id: string): Promise<BinaryResponse> {
    return this._requestBinary({
      method: 'GET',
      path: `/installments/${id}/paymentBook`,
    })
  }
}
