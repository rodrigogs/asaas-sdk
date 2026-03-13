import { BaseService } from '../../core/base-service.js'
import { PixAutomaticService } from './automatic.js'
import { PixKeysService } from './keys.js'
import type { PixQrCode } from './qr-codes.js'
import { PixQrCodesService, PixStaticQrCodesService } from './qr-codes.js'
import { PixRecurringService } from './recurring.js'
import { PixTransactionsService } from './transactions.js'

export class PixService extends BaseService {
  getPaymentQrCode(paymentId: string): Promise<PixQrCode> {
    return this._request({
      method: 'GET',
      path: `/payments/${paymentId}/pixQrCode`,
    })
  }

  private _keys?: PixKeysService
  get keys(): PixKeysService {
    return (this._keys ??= new PixKeysService(this.options))
  }

  private _staticQrCodes?: PixStaticQrCodesService
  get staticQrCodes(): PixStaticQrCodesService {
    return (this._staticQrCodes ??= new PixStaticQrCodesService(this.options))
  }

  private _qrCodes?: PixQrCodesService
  get qrCodes(): PixQrCodesService {
    return (this._qrCodes ??= new PixQrCodesService(this.options))
  }

  private _transactions?: PixTransactionsService
  get transactions(): PixTransactionsService {
    return (this._transactions ??= new PixTransactionsService(this.options))
  }

  private _automatic?: PixAutomaticService
  get automatic(): PixAutomaticService {
    return (this._automatic ??= new PixAutomaticService(this.options))
  }

  private _recurring?: PixRecurringService
  get recurring(): PixRecurringService {
    return (this._recurring ??= new PixRecurringService(this.options))
  }
}
