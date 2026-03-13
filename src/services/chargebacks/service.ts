import { BaseService } from '../../core/base-service.js'
import type { PaginatedList } from '../../core/pagination.js'
import type { Chargeback, ChargebackListParams } from './types.js'

export class ChargebacksService extends BaseService {
  get(id: string): Promise<Chargeback> {
    return this._request({ method: 'GET', path: `/chargebacks/${id}` })
  }

  list(params?: ChargebackListParams): Promise<PaginatedList<Chargeback>> {
    const { offset, limit, ...filters } = params ?? {}
    return this._list('/chargebacks', { offset, limit, ...filters })
  }

  dispute(id: string, files: Blob[]): Promise<Chargeback> {
    const formData = new FormData()
    for (const file of files) {
      formData.append('files', file)
    }
    return this._requestMultipart({
      method: 'POST',
      path: `/chargebacks/${id}/dispute`,
      formData,
    })
  }
}
