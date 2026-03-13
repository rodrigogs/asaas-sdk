import { BaseService } from '../../core/base-service.js'
import type { PaginatedList } from '../../core/pagination.js'
import type {
  Transfer,
  TransferCreateParams,
  TransferListParams,
  TransferToAsaasAccountParams,
  Wallet,
} from './types.js'

export class TransfersService extends BaseService {
  createExternal(params: TransferCreateParams): Promise<Transfer> {
    return this._request({
      method: 'POST',
      path: '/transfers',
      body: params,
    })
  }

  createToAsaasAccount(
    params: TransferToAsaasAccountParams,
  ): Promise<Transfer> {
    return this._request({
      method: 'POST',
      path: '/transfers/',
      body: params,
    })
  }

  list(params?: TransferListParams): Promise<PaginatedList<Transfer>> {
    const { offset, limit, ...filters } = params ?? {}
    return this._list('/transfers', { offset, limit, ...filters })
  }

  get(id: string): Promise<Transfer> {
    return this._request({
      method: 'GET',
      path: `/transfers/${id}`,
    })
  }

  cancel(id: string): Promise<Transfer> {
    return this._request({
      method: 'DELETE',
      path: `/transfers/${id}/cancel`,
    })
  }

  listWallets(): Promise<Wallet[]> {
    return this._request({
      method: 'GET',
      path: '/wallets/',
    })
  }
}
