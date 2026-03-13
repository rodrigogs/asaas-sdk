import { BaseService } from '../../core/base-service.js'
import type {
  EscrowConfig,
  EscrowConfigParams,
  PaymentEscrow,
} from './types.js'

export class EscrowService extends BaseService {
  setDefaultConfig(params: EscrowConfigParams): Promise<EscrowConfig> {
    return this._request({
      method: 'POST',
      path: '/accounts/escrow',
      body: params,
    })
  }

  getDefaultConfig(): Promise<EscrowConfig> {
    return this._request({ method: 'GET', path: '/accounts/escrow' })
  }

  setSubaccountConfig(
    accountId: string,
    params: EscrowConfigParams,
  ): Promise<EscrowConfig> {
    return this._request({
      method: 'POST',
      path: `/accounts/${accountId}/escrow`,
      body: params,
    })
  }

  getSubaccountConfig(accountId: string): Promise<EscrowConfig> {
    return this._request({
      method: 'GET',
      path: `/accounts/${accountId}/escrow`,
    })
  }

  getPayment(paymentId: string): Promise<PaymentEscrow> {
    return this._request({
      method: 'GET',
      path: `/payments/${paymentId}/escrow`,
    })
  }

  finish(escrowId: string): Promise<PaymentEscrow> {
    return this._request({
      method: 'POST',
      path: `/escrow/${escrowId}/finish`,
    })
  }
}
