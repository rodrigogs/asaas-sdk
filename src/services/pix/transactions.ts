import { BaseService } from '../../core/base-service.js'
import type { PaginatedList, PaginationParams } from '../../core/pagination.js'
import type {
  PixExternalAccount,
  PixKeyType,
  PixTransactionStatus,
  PixTransactionType,
} from './types.js'

// --- Response types ---

export interface PixTransaction {
  id: string
  endToEndIdentifier?: string | null
  finality?: string | null
  value?: number
  changeValue?: number | null
  refundedValue?: number | null
  effectiveDate?: string | null
  scheduledDate?: string | null
  status?: PixTransactionStatus
  type?: PixTransactionType
  originType?: string | null
  conciliationIdentifier?: string | null
  description?: string | null
  transactionReceiptUrl?: string | null
  refusalReason?: string | null
  canBeCanceled?: boolean
  originalTransaction?: string | null
  externalAccount?: PixExternalAccount | null
  qrCode?: { payload?: string; encodedImage?: string } | null
  payment?: string | null
  canBeRefunded?: boolean
  refundDisabledReason?: string | null
  chargedFeeValue?: number | null
  dateCreated?: string | null
  addressKey?: string | null
  addressKeyType?: PixKeyType | null
  transferId?: string | null
  externalReference?: string | null
}

// --- Input types ---

export interface PixTransactionListParams extends PaginationParams {
  status?: PixTransactionStatus
  type?: PixTransactionType
  endToEndIdentifier?: string
}

// --- Service ---

export class PixTransactionsService extends BaseService {
  list(
    params?: PixTransactionListParams,
  ): Promise<PaginatedList<PixTransaction>> {
    const { offset, limit, ...filters } = params ?? {}
    return this._list('/pix/transactions', { offset, limit, ...filters })
  }

  get(id: string): Promise<PixTransaction> {
    return this._request({ method: 'GET', path: `/pix/transactions/${id}` })
  }

  cancel(id: string): Promise<PixTransaction> {
    return this._request({
      method: 'POST',
      path: `/pix/transactions/${id}/cancel`,
    })
  }
}
