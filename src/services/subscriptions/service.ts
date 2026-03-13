import { BaseService } from '../../core/base-service.js'
import type { BinaryResponse } from '../../core/http.js'
import type { PaginatedList } from '../../core/pagination.js'
import type { Invoice } from '../invoices/index.js'
import type { Payment } from '../payments/index.js'
import { SubscriptionInvoiceSettingsService } from './invoice-settings.js'
import type {
  Subscription,
  SubscriptionCreateParams,
  SubscriptionCreateWithCreditCardParams,
  SubscriptionInvoiceListParams,
  SubscriptionListParams,
  SubscriptionPaymentListParams,
  SubscriptionRemoveResult,
  SubscriptionUpdateCreditCardParams,
  SubscriptionUpdateParams,
} from './types.js'

export class SubscriptionsService extends BaseService {
  create(params: SubscriptionCreateParams): Promise<Subscription> {
    return this._request({
      method: 'POST',
      path: '/subscriptions',
      body: params,
    })
  }

  createWithCreditCard(
    params: SubscriptionCreateWithCreditCardParams,
  ): Promise<Subscription> {
    return this._request({
      method: 'POST',
      path: '/subscriptions/',
      body: params,
    })
  }

  list(params?: SubscriptionListParams): Promise<PaginatedList<Subscription>> {
    const { offset, limit, ...filters } = params ?? {}
    return this._list('/subscriptions', { offset, limit, ...filters })
  }

  get(id: string): Promise<Subscription> {
    return this._request({ method: 'GET', path: `/subscriptions/${id}` })
  }

  update(id: string, params: SubscriptionUpdateParams): Promise<Subscription> {
    return this._request({
      method: 'PUT',
      path: `/subscriptions/${id}`,
      body: params,
    })
  }

  updateCreditCard(
    id: string,
    params: SubscriptionUpdateCreditCardParams,
  ): Promise<Subscription> {
    return this._request({
      method: 'PUT',
      path: `/subscriptions/${id}/creditCard`,
      body: params,
    })
  }

  remove(id: string): Promise<SubscriptionRemoveResult> {
    return this._request({ method: 'DELETE', path: `/subscriptions/${id}` })
  }

  listPayments(
    id: string,
    params?: SubscriptionPaymentListParams,
  ): Promise<PaginatedList<Payment>> {
    const { offset, limit, ...filters } = params ?? {}
    return this._list(`/subscriptions/${id}/payments`, {
      offset,
      limit,
      ...filters,
    })
  }

  downloadPaymentBook(id: string): Promise<BinaryResponse> {
    return this._requestBinary({
      method: 'GET',
      path: `/subscriptions/${id}/paymentBook`,
    })
  }

  listInvoices(
    id: string,
    params?: SubscriptionInvoiceListParams,
  ): Promise<PaginatedList<Invoice>> {
    const { offset, limit, ...filters } = params ?? {}
    return this._list(`/subscriptions/${id}/invoices`, {
      offset,
      limit,
      ...filters,
    })
  }

  private _invoiceSettings?: SubscriptionInvoiceSettingsService
  get invoiceSettings(): SubscriptionInvoiceSettingsService {
    return (this._invoiceSettings ??= new SubscriptionInvoiceSettingsService(
      this.options,
    ))
  }
}
