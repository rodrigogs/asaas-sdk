import { BaseService } from '../../core/base-service.js'
import type { PaginatedList } from '../../core/pagination.js'
import type {
  Customer,
  CustomerCreateParams,
  CustomerListParams,
  CustomerNotification,
  CustomerRemoveResult,
  CustomerUpdateParams,
} from './types.js'

export class CustomersService extends BaseService {
  create(params: CustomerCreateParams): Promise<Customer> {
    return this._request({ method: 'POST', path: '/customers', body: params })
  }

  get(id: string): Promise<Customer> {
    return this._request({ method: 'GET', path: `/customers/${id}` })
  }

  list(params?: CustomerListParams): Promise<PaginatedList<Customer>> {
    const { offset, limit, ...filters } = params ?? {}
    return this._list('/customers', {
      offset,
      limit,
      ...filters,
    })
  }

  update(id: string, params: CustomerUpdateParams): Promise<Customer> {
    return this._request({
      method: 'PUT',
      path: `/customers/${id}`,
      body: params,
    })
  }

  remove(id: string): Promise<CustomerRemoveResult> {
    return this._request({ method: 'DELETE', path: `/customers/${id}` })
  }

  restore(id: string): Promise<Customer> {
    return this._request({
      method: 'POST',
      path: `/customers/${id}/restore`,
    })
  }

  listNotifications(
    customerId: string,
  ): Promise<PaginatedList<CustomerNotification>> {
    return this._list(`/customers/${customerId}/notifications`)
  }
}
