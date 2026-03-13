import { BaseService } from '../../core/base-service.js'
import type { PaginatedList, PaginationParams } from '../../core/pagination.js'
import type { PixKeyStatus, PixKeyType } from './types.js'

// --- Input types ---

export interface PixKeyCreateParams {
  type: PixKeyType
}

export type PixKeyListParams = PaginationParams

// --- Response types ---

export interface PixKey {
  id: string
  key?: string
  type?: PixKeyType
  status?: PixKeyStatus
  dateCreated?: string
  canBeDeleted?: boolean
  cannotBeDeletedReason?: string | null
  qrCode?: { encodedImage?: string; payload?: string } | null
}

export interface PixKeyRemoveResult {
  id: string
  deleted: boolean
}

// --- Service ---

export class PixKeysService extends BaseService {
  create(params: PixKeyCreateParams): Promise<PixKey> {
    return this._request({
      method: 'POST',
      path: '/pix/addressKeys',
      body: params,
    })
  }

  list(params?: PixKeyListParams): Promise<PaginatedList<PixKey>> {
    const { offset, limit } = params ?? {}
    return this._list('/pix/addressKeys', { offset, limit })
  }

  get(id: string): Promise<PixKey> {
    return this._request({ method: 'GET', path: `/pix/addressKeys/${id}` })
  }

  remove(id: string): Promise<PixKeyRemoveResult> {
    return this._request({ method: 'DELETE', path: `/pix/addressKeys/${id}` })
  }
}
