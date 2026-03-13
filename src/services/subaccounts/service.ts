import { BaseService } from '../../core/base-service.js'
import type { PaginatedList } from '../../core/pagination.js'
import { ApiKeysService } from './api-keys.js'
import type {
  Subaccount,
  SubaccountCreateParams,
  SubaccountListParams,
} from './types.js'

export class SubaccountsService extends BaseService {
  create(params: SubaccountCreateParams): Promise<Subaccount> {
    return this._request({
      method: 'POST',
      path: '/accounts',
      body: params,
    })
  }

  list(params?: SubaccountListParams): Promise<PaginatedList<Subaccount>> {
    const { offset, limit, ...filters } = params ?? {}
    return this._list('/accounts', { offset, limit, ...filters })
  }

  get(id: string): Promise<Subaccount> {
    return this._request({
      method: 'GET',
      path: `/accounts/${id}`,
    })
  }

  private _apiKeys?: ApiKeysService
  get apiKeys(): ApiKeysService {
    return (this._apiKeys ??= new ApiKeysService(this.options))
  }
}
