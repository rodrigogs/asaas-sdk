import { BaseService } from '../../core/base-service.js'
import type { PaginatedList, PaginationParams } from '../../core/pagination.js'
import type {
  PixAutomaticAuthorizationStatus,
  PixAutomaticFrequency,
  PixAutomaticPaymentInstructionStatus,
} from './types.js'

// --- Input types ---

export interface PixAutomaticAuthorizationCreateParams {
  frequency: PixAutomaticFrequency
  contractId: string
  startDate: string
  customerId: string
  immediateQrCode: boolean
  finishDate?: string
  value?: number
  description?: string
  minLimitValue?: number
}

export type PixAutomaticAuthorizationListParams = PaginationParams

export interface PixAutomaticPaymentInstructionListParams extends PaginationParams {
  authorizationId?: string
  customerId?: string
  paymentId?: string
  status?: PixAutomaticPaymentInstructionStatus
}

// --- Response types ---

export interface PixAutomaticAuthorization {
  id: string
  minLimitValue?: number | null
  cancellationDate?: string | null
  cancellationReason?: string | null
  contractId?: string | null
  customerId?: string | null
  description?: string | null
  finishDate?: string | null
  frequency?: PixAutomaticFrequency | null
  endToEndIdentifier?: string | null
  startDate?: string | null
  status?: PixAutomaticAuthorizationStatus | null
  value?: number | null
  payload?: string | null
  encodedImage?: string | null
  immediateQrCode?: boolean | null
  originType?: string | null
  subscriptionId?: string | null
}

export interface PixAutomaticPaymentInstruction {
  id: string
  endToEndIdentifier?: string | null
  authorization?: string | null
  dueDate?: string | null
  status?: PixAutomaticPaymentInstructionStatus | null
  paymentId?: string | null
}

// --- Services ---

export class PixAutomaticAuthorizationsService extends BaseService {
  create(
    params: PixAutomaticAuthorizationCreateParams,
  ): Promise<PixAutomaticAuthorization> {
    return this._request({
      method: 'POST',
      path: '/pix/automatic/authorizations',
      body: params,
    })
  }

  list(
    params?: PixAutomaticAuthorizationListParams,
  ): Promise<PaginatedList<PixAutomaticAuthorization>> {
    const { offset, limit } = params ?? {}
    return this._list('/pix/automatic/authorizations', { offset, limit })
  }

  get(id: string): Promise<PixAutomaticAuthorization> {
    return this._request({
      method: 'GET',
      path: `/pix/automatic/authorizations/${id}`,
    })
  }

  cancel(id: string): Promise<PixAutomaticAuthorization> {
    return this._request({
      method: 'DELETE',
      path: `/pix/automatic/authorizations/${id}`,
    })
  }
}

export class PixAutomaticPaymentInstructionsService extends BaseService {
  list(
    params?: PixAutomaticPaymentInstructionListParams,
  ): Promise<PaginatedList<PixAutomaticPaymentInstruction>> {
    const { offset, limit, ...filters } = params ?? {}
    return this._list('/pix/automatic/paymentInstructions', {
      offset,
      limit,
      ...filters,
    })
  }

  get(id: string): Promise<PixAutomaticPaymentInstruction> {
    return this._request({
      method: 'GET',
      path: `/pix/automatic/paymentInstructions/${id}`,
    })
  }
}

export class PixAutomaticService extends BaseService {
  private _authorizations?: PixAutomaticAuthorizationsService
  get authorizations(): PixAutomaticAuthorizationsService {
    return (this._authorizations ??= new PixAutomaticAuthorizationsService(
      this.options,
    ))
  }

  private _paymentInstructions?: PixAutomaticPaymentInstructionsService
  get paymentInstructions(): PixAutomaticPaymentInstructionsService {
    return (this._paymentInstructions ??=
      new PixAutomaticPaymentInstructionsService(this.options))
  }
}
