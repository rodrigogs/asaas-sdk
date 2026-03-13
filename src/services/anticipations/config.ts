import { BaseService } from '../../core/base-service.js'
import type {
  AnticipationConfig,
  AnticipationConfigUpdateParams,
} from './types.js'

export class AnticipationConfigService extends BaseService {
  get(): Promise<AnticipationConfig> {
    return this._request({
      method: 'GET',
      path: '/anticipations/configurations',
    })
  }

  update(params: AnticipationConfigUpdateParams): Promise<AnticipationConfig> {
    return this._request({
      method: 'PUT',
      path: '/anticipations/configurations',
      body: params,
    })
  }
}
