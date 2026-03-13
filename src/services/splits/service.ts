import { BaseService } from '../../core/base-service.js'
import type { PaginatedList } from '../../core/pagination.js'
import type {
  InstallmentSplitUpdateParams,
  Split,
  SplitListParams,
  SplitStatistics,
} from './types.js'

export class SplitsService extends BaseService {
  listPaid(params?: SplitListParams): Promise<PaginatedList<Split>> {
    const { offset, limit, ...filters } = params ?? {}
    return this._list('/payments/splits/paid', { offset, limit, ...filters })
  }

  getPaid(id: string): Promise<Split> {
    return this._request({ method: 'GET', path: `/payments/splits/paid/${id}` })
  }

  listReceived(params?: SplitListParams): Promise<PaginatedList<Split>> {
    const { offset, limit, ...filters } = params ?? {}
    return this._list('/payments/splits/received', {
      offset,
      limit,
      ...filters,
    })
  }

  getReceived(id: string): Promise<Split> {
    return this._request({
      method: 'GET',
      path: `/payments/splits/received/${id}`,
    })
  }

  getStatistics(): Promise<SplitStatistics> {
    return this._request({
      method: 'GET',
      path: '/finance/split/statistics',
    })
  }

  updateInstallment<T = Record<string, unknown>>(
    installmentId: string,
    params: InstallmentSplitUpdateParams,
  ): Promise<T> {
    return this._request({
      method: 'PUT',
      path: `/installments/${installmentId}/splits`,
      body: params,
    })
  }
}
