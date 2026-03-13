import { BaseService } from '../../core/base-service.js'
import type { PixTransaction } from './transactions.js'
import type { PixStaticQrCodeFormat } from './types.js'

// --- Input types ---

export interface PixStaticQrCodeCreateParams {
  addressKey: string
  description?: string
  value?: number
  format?: PixStaticQrCodeFormat
  expirationDate?: string
  expirationSeconds?: number
  allowsMultiplePayments?: boolean
  externalReference?: string
}

export interface PixQrCodeDecodeParams {
  payload: string
  changeValue?: number
  expectedPaymentDate?: string
}

export interface PixQrCodePayParams {
  qrCode: string
  value: number
  description?: string
  scheduleDate?: string
}

// --- Response types ---

export interface PixQrCode {
  encodedImage?: string
  payload?: string
  expirationDate?: string
  description?: string | null
}

export interface PixStaticQrCode {
  id: string
  encodedImage?: string | null
  payload?: string | null
  allowsMultiplePayments?: boolean
  expirationDate?: string | null
  externalReference?: string | null
  description?: string | null
}

export interface PixStaticQrCodeRemoveResult {
  id: string
  deleted: boolean
}

export interface PixQrCodeDecodeResult {
  payload?: string
  type?: string
  transactionOriginType?: string
  pixKey?: string | null
  conciliationIdentifier?: string | null
  dueDate?: string | null
  expirationDate?: string | null
  value?: number | null
  changeValue?: number | null
  interest?: number | null
  fine?: number | null
  discount?: number | null
  totalValue?: number | null
  receiver?: Record<string, unknown> | null
  payer?: Record<string, unknown> | null
  description?: string | null
  canBePaid?: boolean
  cannotBePaidReason?: string | null
}

// --- Services ---

export class PixStaticQrCodesService extends BaseService {
  create(params: PixStaticQrCodeCreateParams): Promise<PixStaticQrCode> {
    return this._request({
      method: 'POST',
      path: '/pix/qrCodes/static',
      body: params,
    })
  }

  remove(id: string): Promise<PixStaticQrCodeRemoveResult> {
    return this._request({
      method: 'DELETE',
      path: `/pix/qrCodes/static/${id}`,
    })
  }
}

export class PixQrCodesService extends BaseService {
  decode(params: PixQrCodeDecodeParams): Promise<PixQrCodeDecodeResult> {
    return this._request({
      method: 'POST',
      path: '/pix/qrCodes/decode',
      body: params,
    })
  }

  pay(params: PixQrCodePayParams): Promise<PixTransaction> {
    return this._request({
      method: 'POST',
      path: '/pix/qrCodes/pay',
      body: params,
    })
  }
}
