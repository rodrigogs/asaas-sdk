import { BaseService } from '../../core/base-service.js'
import type { PaginatedList } from '../../core/pagination.js'
import type {
  Anticipation,
  AnticipationCreateParams,
  AnticipationLimits,
  AnticipationListParams,
  AnticipationSimulateParams,
  AnticipationSimulation,
} from './types.js'

export class AnticipationsService extends BaseService {
  request(params: AnticipationCreateParams): Promise<Anticipation> {
    const formData = new FormData()
    if (params.payment) formData.append('payment', params.payment)
    if (params.installment) formData.append('installment', params.installment)
    if (params.documents) {
      params.documents.forEach((doc, i) => {
        formData.append(`documents[${i}]`, doc)
      })
    }
    return this._requestMultipart({
      method: 'POST',
      path: '/anticipations',
      formData,
    })
  }

  list(params?: AnticipationListParams): Promise<PaginatedList<Anticipation>> {
    const { offset, limit, ...filters } = params ?? {}
    return this._list('/anticipations', { offset, limit, ...filters })
  }

  get(id: string): Promise<Anticipation> {
    return this._request({ method: 'GET', path: `/anticipations/${id}` })
  }

  simulate(
    params: AnticipationSimulateParams,
  ): Promise<AnticipationSimulation> {
    return this._request({
      method: 'POST',
      path: '/anticipations/simulate',
      body: params,
    })
  }

  cancel(id: string): Promise<Anticipation> {
    return this._request({
      method: 'POST',
      path: `/anticipations/${id}/cancel`,
    })
  }

  getLimits(): Promise<AnticipationLimits> {
    return this._request({
      method: 'GET',
      path: '/anticipations/limits',
    })
  }
}
