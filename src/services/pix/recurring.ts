import { BaseService } from '../../core/base-service.js'
import type { PaginatedList, PaginationParams } from '../../core/pagination.js'
import type {
  PixAutomaticFrequency,
  PixExternalAccount,
  PixRecurringStatus,
} from './types.js'

// --- Input types ---

export interface PixRecurringListParams extends PaginationParams {
  status?: PixRecurringStatus
  value?: number
  searchText?: string
}

export type PixRecurringItemListParams = PaginationParams

// --- Response types ---

export interface PixRecurring {
  id: string
  status?: PixRecurringStatus
  origin?: string | null
  value?: number
  frequency?: PixAutomaticFrequency | null
  quantity?: number | null
  startDate?: string | null
  finishDate?: string | null
  canBeCancelled?: boolean
  externalAccount?: PixExternalAccount | null
}

export interface PixRecurringItem {
  id: string
  status?: PixRecurringStatus | null
  scheduledDate?: string | null
  canBeCancelled?: boolean
  recurrenceNumber?: number | null
  quantity?: number | null
  value?: number | null
  refusalReasonDescription?: string | null
  externalAccount?: PixExternalAccount | null
}

// --- Service ---

export class PixRecurringService extends BaseService {
  list(params?: PixRecurringListParams): Promise<PaginatedList<PixRecurring>> {
    const { offset, limit, ...filters } = params ?? {}
    return this._list('/pix/transactions/recurrings', {
      offset,
      limit,
      ...filters,
    })
  }

  get(id: string): Promise<PixRecurring> {
    return this._request({
      method: 'GET',
      path: `/pix/transactions/recurrings/${id}`,
    })
  }

  cancel(id: string): Promise<PixRecurring> {
    return this._request({
      method: 'POST',
      path: `/pix/transactions/recurrings/${id}/cancel`,
    })
  }

  listItems(
    id: string,
    params?: PixRecurringItemListParams,
  ): Promise<PaginatedList<PixRecurringItem>> {
    const { offset, limit } = params ?? {}
    return this._list(`/pix/transactions/recurrings/${id}/items`, {
      offset,
      limit,
    })
  }

  cancelItem(itemId: string): Promise<PixRecurringItem> {
    return this._request({
      method: 'POST',
      path: `/pix/transactions/recurrings/items/${itemId}/cancel`,
    })
  }
}
