import { BaseService } from '../../core/base-service.js'
import type { PaginatedList } from '../../core/pagination.js'
import type {
  CashReceiptParams,
  IdentificationField,
  Payment,
  PaymentCreateParams,
  PaymentLimits,
  PaymentListParams,
  PaymentRemoveResult,
  PaymentStatusResult,
  PaymentUpdateParams,
  Refund,
  RefundParams,
  SimulateParams,
  SimulationResult,
} from './types.js'

export class PaymentsService extends BaseService {
  create(params: PaymentCreateParams): Promise<Payment> {
    return this._request({ method: 'POST', path: '/payments', body: params })
  }

  get(id: string): Promise<Payment> {
    return this._request({ method: 'GET', path: `/payments/${id}` })
  }

  list(params?: PaymentListParams): Promise<PaginatedList<Payment>> {
    const { offset, limit, ...filters } = params ?? {}
    return this._list('/payments', { offset, limit, ...filters })
  }

  update(id: string, params: PaymentUpdateParams): Promise<Payment> {
    return this._request({
      method: 'PUT',
      path: `/payments/${id}`,
      body: params,
    })
  }

  remove(id: string): Promise<PaymentRemoveResult> {
    return this._request({ method: 'DELETE', path: `/payments/${id}` })
  }

  restore(id: string): Promise<Payment> {
    return this._request({ method: 'POST', path: `/payments/${id}/restore` })
  }

  getStatus(id: string): Promise<PaymentStatusResult> {
    return this._request({ method: 'GET', path: `/payments/${id}/status` })
  }

  getBillingInfo(id: string): Promise<Record<string, unknown>> {
    return this._request({ method: 'GET', path: `/payments/${id}/billingInfo` })
  }

  getIdentificationField(id: string): Promise<IdentificationField> {
    return this._request({
      method: 'GET',
      path: `/payments/${id}/identificationField`,
    })
  }

  getViewingInfo(id: string): Promise<Record<string, unknown>> {
    return this._request({ method: 'GET', path: `/payments/${id}/viewingInfo` })
  }

  confirmCashReceipt(id: string, params: CashReceiptParams): Promise<Payment> {
    return this._request({
      method: 'POST',
      path: `/payments/${id}/receiveInCash`,
      body: params,
    })
  }

  undoCashReceipt(id: string): Promise<Payment> {
    return this._request({
      method: 'POST',
      path: `/payments/${id}/undoReceivedInCash`,
    })
  }

  refund(id: string, params?: RefundParams): Promise<Payment> {
    return this._request({
      method: 'POST',
      path: `/payments/${id}/refund`,
      body: params,
    })
  }

  refundBankSlip(id: string): Promise<Record<string, unknown>> {
    return this._request({
      method: 'POST',
      path: `/payments/${id}/bankSlip/refund`,
    })
  }

  listRefunds(id: string): Promise<PaginatedList<Refund>> {
    return this._list(`/payments/${id}/refunds`)
  }

  getChargeback(id: string): Promise<Record<string, unknown>> {
    return this._request({ method: 'GET', path: `/payments/${id}/chargeback` })
  }

  simulate(params: SimulateParams): Promise<SimulationResult> {
    return this._request({
      method: 'POST',
      path: '/payments/simulate',
      body: params,
    })
  }

  getLimits(): Promise<PaymentLimits> {
    return this._request({ method: 'GET', path: '/payments/limits' })
  }
}
