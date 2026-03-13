import { BaseService } from '../../core/base-service.js'
import type {
  AccessToken,
  AccessTokenCreateParams,
  AccessTokenList,
  AccessTokenUpdateParams,
} from './types.js'

export class ApiKeysService extends BaseService {
  list(accountId: string): Promise<AccessTokenList> {
    return this._request({
      method: 'GET',
      path: `/accounts/${accountId}/accessTokens`,
    })
  }

  create(
    accountId: string,
    params: AccessTokenCreateParams,
  ): Promise<AccessToken> {
    return this._request({
      method: 'POST',
      path: `/accounts/${accountId}/accessTokens`,
      body: params,
    })
  }

  update(
    accountId: string,
    accessTokenId: string,
    params: AccessTokenUpdateParams,
  ): Promise<AccessToken> {
    return this._request({
      method: 'PUT',
      path: `/accounts/${accountId}/accessTokens/${accessTokenId}`,
      body: params,
    })
  }

  remove(accountId: string, accessTokenId: string): Promise<void> {
    return this._request({
      method: 'DELETE',
      path: `/accounts/${accountId}/accessTokens/${accessTokenId}`,
    })
  }
}
