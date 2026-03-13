import { BaseService } from '../../core/base-service.js'
import type {
  PayWithCreditCardParams,
  PreAuthorizationConfig,
  TokenizeParams,
  TokenizeResult,
} from './types.js'

export class CardsService extends BaseService {
  payWithCreditCard(
    paymentId: string,
    params: PayWithCreditCardParams,
  ): Promise<Record<string, unknown>> {
    return this._request({
      method: 'POST',
      path: `/payments/${paymentId}/payWithCreditCard`,
      body: params,
    })
  }

  tokenize(params: TokenizeParams): Promise<TokenizeResult> {
    return this._request({
      method: 'POST',
      path: '/creditCard/tokenizeCreditCard',
      body: params,
    })
  }

  captureAuthorizedPayment(
    paymentId: string,
  ): Promise<Record<string, unknown>> {
    return this._request({
      method: 'POST',
      path: `/payments/${paymentId}/captureAuthorizedPayment`,
    })
  }

  getPreAuthorizationConfig(): Promise<PreAuthorizationConfig> {
    return this._request({
      method: 'GET',
      path: '/creditCard/preAuthorization',
    })
  }

  updatePreAuthorizationConfig(
    params: PreAuthorizationConfig,
  ): Promise<PreAuthorizationConfig> {
    return this._request({
      method: 'POST',
      path: '/creditCard/preAuthorization',
      body: params,
    })
  }
}
