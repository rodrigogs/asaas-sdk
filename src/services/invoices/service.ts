import { BaseService } from '../../core/base-service.js'
import type { PaginatedList } from '../../core/pagination.js'
import type {
  Invoice,
  InvoiceCancelParams,
  InvoiceCreateParams,
  InvoiceListParams,
  InvoiceUpdateParams,
} from './types.js'

export class InvoicesService extends BaseService {
  create(params: InvoiceCreateParams): Promise<Invoice> {
    return this._request({ method: 'POST', path: '/invoices', body: params })
  }

  list(params?: InvoiceListParams): Promise<PaginatedList<Invoice>> {
    const { offset, limit, ...filters } = params ?? {}
    return this._list('/invoices', { offset, limit, ...filters })
  }

  get(id: string): Promise<Invoice> {
    return this._request({ method: 'GET', path: `/invoices/${id}` })
  }

  update(id: string, params: InvoiceUpdateParams): Promise<Invoice> {
    return this._request({
      method: 'PUT',
      path: `/invoices/${id}`,
      body: params,
    })
  }

  authorize(id: string): Promise<Invoice> {
    return this._request({
      method: 'POST',
      path: `/invoices/${id}/authorize`,
    })
  }

  cancel(id: string, params?: InvoiceCancelParams): Promise<Invoice> {
    return this._request({
      method: 'POST',
      path: `/invoices/${id}/cancel`,
      body: params,
    })
  }
}
