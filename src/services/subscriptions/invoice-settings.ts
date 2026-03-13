import { BaseService } from '../../core/base-service.js'
import type {
  InvoiceSettings,
  InvoiceSettingsCreateParams,
  InvoiceSettingsRemoveResult,
  InvoiceSettingsUpdateParams,
} from './types.js'

export class SubscriptionInvoiceSettingsService extends BaseService {
  create(
    subscriptionId: string,
    params: InvoiceSettingsCreateParams,
  ): Promise<InvoiceSettings> {
    return this._request({
      method: 'POST',
      path: `/subscriptions/${subscriptionId}/invoiceSettings`,
      body: params,
    })
  }

  get(subscriptionId: string): Promise<InvoiceSettings> {
    return this._request({
      method: 'GET',
      path: `/subscriptions/${subscriptionId}/invoiceSettings`,
    })
  }

  update(
    subscriptionId: string,
    params: InvoiceSettingsUpdateParams,
  ): Promise<InvoiceSettings> {
    return this._request({
      method: 'PUT',
      path: `/subscriptions/${subscriptionId}/invoiceSettings`,
      body: params,
    })
  }

  remove(subscriptionId: string): Promise<InvoiceSettingsRemoveResult> {
    return this._request({
      method: 'DELETE',
      path: `/subscriptions/${subscriptionId}/invoiceSettings`,
    })
  }
}
