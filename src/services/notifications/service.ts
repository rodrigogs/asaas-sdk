import { BaseService } from '../../core/base-service.js'
import type { PaginatedList } from '../../core/pagination.js'
import type { CustomerNotification } from '../customers/types.js'
import type {
  NotificationBatchUpdateParams,
  NotificationBatchUpdateResult,
  NotificationUpdateParams,
} from './types.js'

export class NotificationsService extends BaseService {
  list(customerId: string): Promise<PaginatedList<CustomerNotification>> {
    return this._list(`/customers/${customerId}/notifications`)
  }

  update(
    id: string,
    params: NotificationUpdateParams,
  ): Promise<CustomerNotification> {
    return this._request({
      method: 'PUT',
      path: `/notifications/${id}`,
      body: params,
    })
  }

  updateBatch(
    params: NotificationBatchUpdateParams,
  ): Promise<NotificationBatchUpdateResult> {
    return this._request({
      method: 'PUT',
      path: '/notifications/batch',
      body: params,
    })
  }
}
