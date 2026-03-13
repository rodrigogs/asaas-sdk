import { describe, expect, it } from 'vitest'

import { PaginatedList } from '../../core/pagination.js'
import { createMockFetch, createTestOptions } from '../../core/test-helpers.js'
import { ApiKeysService } from './api-keys.js'
import { MyAccountService } from './my-account.js'
import { SubaccountsService } from './service.js'
import type {
  AccessToken,
  AccountRegistrationStatusResult,
  DocumentGroupList,
  Subaccount,
  SubaccountCommercialInfo,
  SubaccountRemoveResult,
} from './types.js'

function createSubaccountsService(fetch: typeof globalThis.fetch) {
  return new SubaccountsService(createTestOptions({ fetch }))
}

function createMyAccountService(fetch: typeof globalThis.fetch) {
  return new MyAccountService(createTestOptions({ fetch }))
}

// --- SubaccountsService (root context: /accounts) ---

describe('SubaccountsService', () => {
  describe('create', () => {
    it('sends POST /accounts with subaccount data', async () => {
      const mockResponse: Subaccount = {
        id: 'acc_123',
        name: 'Test Shop',
        email: 'test@shop.com',
        cpfCnpj: '12345678900',
        walletId: 'wallet_abc',
        apiKey: 'aact_abc123',
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createSubaccountsService(fetch)

      const result = await service.create({
        name: 'Test Shop',
        email: 'test@shop.com',
        cpfCnpj: '12345678900',
        mobilePhone: '11999999999',
        incomeValue: 5000,
        address: 'Rua Teste',
        addressNumber: '100',
        province: 'Centro',
        postalCode: '01000000',
      })

      expect(result).toEqual(mockResponse)
      expect(result.apiKey).toBe('aact_abc123')
      expect(result.walletId).toBe('wallet_abc')
      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/accounts')
      expect(init.method).toBe('POST')
      const body = JSON.parse(init.body as string)
      expect(body.name).toBe('Test Shop')
      expect(body.incomeValue).toBe(5000)
    })
  })

  describe('list', () => {
    it('sends GET /accounts with filters and returns PaginatedList', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: {
          object: 'list',
          hasMore: false,
          totalCount: 1,
          offset: 0,
          limit: 10,
          data: [
            {
              id: 'acc_123',
              name: 'Test Shop',
              cpfCnpj: '12345678900',
            },
          ],
        },
      })
      const service = createSubaccountsService(fetch)

      const result = await service.list({
        cpfCnpj: '12345678900',
        limit: 10,
      })

      expect(result).toBeInstanceOf(PaginatedList)
      expect(result.data).toHaveLength(1)
      expect(result.data[0]!.id).toBe('acc_123')

      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('cpfCnpj=12345678900')
      expect(url).toContain('limit=10')
    })

    it('uses default pagination when called without params', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: {
          object: 'list',
          hasMore: false,
          totalCount: 0,
          offset: 0,
          limit: 20,
          data: [],
        },
      })
      const service = createSubaccountsService(fetch)

      const result = await service.list()

      expect(result).toBeInstanceOf(PaginatedList)
      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('offset=0')
      expect(url).toContain('limit=20')
    })
  })

  describe('get', () => {
    it('sends GET /accounts/{id}', async () => {
      const mockResponse: Subaccount = {
        id: 'acc_123',
        name: 'Test Shop',
        walletId: 'wallet_abc',
        personType: 'FISICA',
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createSubaccountsService(fetch)

      const result = await service.get('acc_123')

      expect(result).toEqual(mockResponse)
      expect(spy.mock.calls[0][0].toString()).toContain('/accounts/acc_123')
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })

  it('lazily instantiates apiKeys sub-service', () => {
    const { fetch } = createMockFetch()
    const service = createSubaccountsService(fetch)
    expect(service.apiKeys).toBeInstanceOf(ApiKeysService)
    expect(service.apiKeys).toBe(service.apiKeys)
  })
})

// --- ApiKeysService (root context: /accounts/{id}/accessTokens) ---

describe('ApiKeysService', () => {
  function createService(fetch: typeof globalThis.fetch) {
    return new ApiKeysService(createTestOptions({ fetch }))
  }

  describe('list', () => {
    it('sends GET /accounts/{id}/accessTokens', async () => {
      const mockResponse = {
        accessTokens: [
          {
            id: 'token_1',
            name: 'Production Key',
            enabled: true,
          },
        ],
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createService(fetch)

      const result = await service.list('acc_123')

      expect(result.accessTokens).toHaveLength(1)
      expect(result.accessTokens![0]!.id).toBe('token_1')
      expect(spy.mock.calls[0][0].toString()).toContain(
        '/accounts/acc_123/accessTokens',
      )
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('create', () => {
    it('sends POST /accounts/{id}/accessTokens with body', async () => {
      const mockResponse: AccessToken = {
        id: 'token_2',
        name: 'New Key',
        apiKey: 'aact_new123',
        enabled: true,
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createService(fetch)

      const result = await service.create('acc_123', {
        name: 'New Key',
        expirationDate: '2027-01-01',
      })

      expect(result.apiKey).toBe('aact_new123')
      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/accounts/acc_123/accessTokens')
      expect(init.method).toBe('POST')
      expect(JSON.parse(init.body as string)).toEqual({
        name: 'New Key',
        expirationDate: '2027-01-01',
      })
    })
  })

  describe('update', () => {
    it('sends PUT /accounts/{id}/accessTokens/{accessTokenId}', async () => {
      const mockResponse: AccessToken = {
        id: 'token_1',
        name: 'Updated Key',
        enabled: false,
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createService(fetch)

      const result = await service.update('acc_123', 'token_1', {
        name: 'Updated Key',
        enabled: false,
      })

      expect(result.name).toBe('Updated Key')
      expect(result.enabled).toBe(false)
      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/accounts/acc_123/accessTokens/token_1')
      expect(init.method).toBe('PUT')
    })
  })

  describe('remove', () => {
    it('sends DELETE /accounts/{id}/accessTokens/{accessTokenId}', async () => {
      const { fetch, spy } = createMockFetch({ status: 200, body: {} })
      const service = createService(fetch)

      await service.remove('acc_123', 'token_1')

      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/accounts/acc_123/accessTokens/token_1')
      expect(init.method).toBe('DELETE')
    })
  })
})

// --- MyAccountService (child context: /myAccount) ---

describe('MyAccountService', () => {
  describe('getRegistrationStatus', () => {
    it('sends GET /myAccount/status/', async () => {
      const mockResponse: AccountRegistrationStatusResult = {
        commercialInfo: 'APPROVED',
        bankAccountInfo: 'APPROVED',
        documentation: 'PENDING',
        general: 'AWAITING_APPROVAL',
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createMyAccountService(fetch)

      const result = await service.getRegistrationStatus()

      expect(result).toEqual(mockResponse)
      expect(spy.mock.calls[0][0].toString()).toContain('/myAccount/status/')
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('listPendingDocuments', () => {
    it('sends GET /myAccount/documents', async () => {
      const mockResponse: DocumentGroupList = {
        rejectReasons: null,
        data: [
          {
            id: 'docgroup_1',
            status: 'NOT_SENT',
            type: 'IDENTIFICATION',
            title: 'Identification',
            onboardingUrl: null,
          },
        ],
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createMyAccountService(fetch)

      const result = await service.listPendingDocuments()

      expect(result.data).toHaveLength(1)
      expect(result.data![0]!.type).toBe('IDENTIFICATION')
      expect(spy.mock.calls[0][0].toString()).toContain('/myAccount/documents')
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('sendDocument', () => {
    it('sends POST /myAccount/documents/{id}', async () => {
      const mockResponse: DocumentGroupList = {
        data: [{ id: 'docgroup_1', status: 'PENDING' }],
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createMyAccountService(fetch)

      const result = await service.sendDocument('docgroup_1', {
        documentFile: 'base64data',
        type: 'IDENTIFICATION',
      })

      expect(result.data![0]!.status).toBe('PENDING')
      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/myAccount/documents/docgroup_1')
      expect(init.method).toBe('POST')
    })
  })

  describe('getDocumentFile', () => {
    it('sends GET /myAccount/documents/files/{id}', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: { id: 'file_1', type: 'IDENTIFICATION' },
      })
      const service = createMyAccountService(fetch)

      const result = await service.getDocumentFile('file_1')

      expect(result.id).toBe('file_1')
      expect(spy.mock.calls[0][0].toString()).toContain(
        '/myAccount/documents/files/file_1',
      )
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('updateDocumentFile', () => {
    it('sends POST /myAccount/documents/files/{id}', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: { id: 'file_1', type: 'IDENTIFICATION' },
      })
      const service = createMyAccountService(fetch)

      const result = await service.updateDocumentFile('file_1', {
        documentFile: 'newbase64data',
        type: 'IDENTIFICATION',
      })

      expect(result.id).toBe('file_1')
      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/myAccount/documents/files/file_1')
      expect(init.method).toBe('POST')
    })
  })

  describe('removeDocumentFile', () => {
    it('sends DELETE /myAccount/documents/files/{id}', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: { deleted: true },
      })
      const service = createMyAccountService(fetch)

      await service.removeDocumentFile('file_1')

      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/myAccount/documents/files/file_1')
      expect(init.method).toBe('DELETE')
    })
  })

  describe('getCommercialInfo', () => {
    it('sends GET /myAccount/commercialInfo/', async () => {
      const mockResponse: SubaccountCommercialInfo = {
        status: 'APPROVED',
        personType: 'FISICA',
        cpfCnpj: '12345678900',
        name: 'Test Shop',
        incomeValue: 5000,
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createMyAccountService(fetch)

      const result = await service.getCommercialInfo()

      expect(result).toEqual(mockResponse)
      expect(spy.mock.calls[0][0].toString()).toContain(
        '/myAccount/commercialInfo/',
      )
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('updateCommercialInfo', () => {
    it('sends POST /myAccount/commercialInfo/ with body', async () => {
      const mockResponse: SubaccountCommercialInfo = {
        status: 'PENDING',
        personType: 'FISICA',
        incomeValue: 8000,
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createMyAccountService(fetch)

      const result = await service.updateCommercialInfo({
        incomeValue: 8000,
        personType: 'FISICA',
      })

      expect(result.incomeValue).toBe(8000)
      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/myAccount/commercialInfo/')
      expect(init.method).toBe('POST')
      expect(JSON.parse(init.body as string)).toEqual({
        incomeValue: 8000,
        personType: 'FISICA',
      })
    })
  })

  describe('deleteWhiteLabelSubaccount', () => {
    it('sends DELETE /myAccount/ with removeReason query', async () => {
      const mockResponse: SubaccountRemoveResult = { deleted: true }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createMyAccountService(fetch)

      const result =
        await service.deleteWhiteLabelSubaccount('Customer requested')

      expect(result.deleted).toBe(true)
      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/myAccount/')
      expect(url.toString()).toContain('removeReason=Customer+requested')
      expect(init.method).toBe('DELETE')
    })

    it('sends DELETE /myAccount/ without reason', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: { deleted: true },
      })
      const service = createMyAccountService(fetch)

      await service.deleteWhiteLabelSubaccount()

      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/myAccount/')
      expect(init.method).toBe('DELETE')
    })
  })
})
