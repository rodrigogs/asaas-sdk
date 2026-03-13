import { describe, expect, it } from 'vitest'

import { PaginatedList } from '../../core/pagination.js'
import { createMockFetch, createTestOptions } from '../../core/test-helpers.js'
import { TransfersService } from './service.js'
import type { Transfer, Wallet } from './types.js'

function createService(fetch: typeof globalThis.fetch) {
  return new TransfersService(createTestOptions({ fetch }))
}

describe('TransfersService', () => {
  describe('createExternal', () => {
    it('sends POST /transfers with Pix transfer data', async () => {
      const mockResponse: Transfer = {
        id: 'trf_123',
        type: 'PIX',
        status: 'PENDING',
        value: 150.0,
        authorized: false,
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createService(fetch)

      const result = await service.createExternal({
        value: 150.0,
        pixAddressKey: 'email@test.com',
        pixAddressKeyType: 'EMAIL',
        description: 'Payment to supplier',
      })

      expect(result).toEqual(mockResponse)
      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/transfers')
      expect(init.method).toBe('POST')
      expect(JSON.parse(init.body as string)).toEqual({
        value: 150.0,
        pixAddressKey: 'email@test.com',
        pixAddressKeyType: 'EMAIL',
        description: 'Payment to supplier',
      })
    })

    it('sends POST /transfers with TED bank account data', async () => {
      const mockResponse: Transfer = {
        id: 'trf_456',
        type: 'TED',
        status: 'PENDING',
        value: 500.0,
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createService(fetch)

      const result = await service.createExternal({
        value: 500.0,
        operationType: 'TED',
        bankAccount: {
          bank: { code: '341' },
          ownerName: 'John Doe',
          cpfCnpj: '12345678900',
          agency: '0001',
          account: '12345',
          accountDigit: '6',
          bankAccountType: 'CONTA_CORRENTE',
        },
      })

      expect(result.id).toBe('trf_456')
      expect(result.type).toBe('TED')
      const body = JSON.parse(spy.mock.calls[0][1].body as string)
      expect(body.bankAccount.bank.code).toBe('341')
      expect(body.operationType).toBe('TED')
    })
  })

  describe('createToAsaasAccount', () => {
    it('sends POST /transfers with trailing slash for internal transfer', async () => {
      const mockResponse: Transfer = {
        id: 'trf_789',
        type: 'INTERNAL',
        status: 'DONE',
        value: 200.0,
        walletId: 'wallet_abc',
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createService(fetch)

      const result = await service.createToAsaasAccount({
        value: 200.0,
        walletId: 'wallet_abc',
      })

      expect(result).toEqual(mockResponse)
      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toMatch(/\/transfers\/$/)
      expect(init.method).toBe('POST')
      expect(JSON.parse(init.body as string)).toEqual({
        value: 200.0,
        walletId: 'wallet_abc',
      })
    })
  })

  describe('list', () => {
    it('sends GET /transfers with filters and returns PaginatedList', async () => {
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
              id: 'trf_123',
              type: 'PIX',
              status: 'DONE',
              value: 150.0,
            },
          ],
        },
      })
      const service = createService(fetch)

      const result = await service.list({
        type: 'PIX',
        limit: 10,
      })

      expect(result).toBeInstanceOf(PaginatedList)
      expect(result.data).toHaveLength(1)
      expect(result.data[0]!.id).toBe('trf_123')

      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('type=PIX')
      expect(url).toContain('limit=10')
    })

    it('sends GET /transfers with date range filters', async () => {
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
      const service = createService(fetch)

      await service.list({
        'dateCreated[ge]': '2026-01-01',
        'dateCreated[le]': '2026-03-13',
      })

      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('dateCreated%5Bge%5D=2026-01-01')
      expect(url).toContain('dateCreated%5Ble%5D=2026-03-13')
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
      const service = createService(fetch)

      const result = await service.list()

      expect(result).toBeInstanceOf(PaginatedList)
      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('offset=0')
      expect(url).toContain('limit=20')
    })
  })

  describe('get', () => {
    it('sends GET /transfers/{id}', async () => {
      const mockResponse: Transfer = {
        id: 'trf_123',
        type: 'PIX',
        status: 'DONE',
        value: 150.0,
        effectiveDate: '2026-03-13',
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createService(fetch)

      const result = await service.get('trf_123')

      expect(result).toEqual(mockResponse)
      expect(spy.mock.calls[0][0].toString()).toContain('/transfers/trf_123')
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('cancel', () => {
    it('sends DELETE /transfers/{id}/cancel', async () => {
      const mockResponse: Transfer = {
        id: 'trf_123',
        status: 'CANCELLED',
        value: 150.0,
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createService(fetch)

      const result = await service.cancel('trf_123')

      expect(result.status).toBe('CANCELLED')
      expect(spy.mock.calls[0][0].toString()).toContain(
        '/transfers/trf_123/cancel',
      )
      expect(spy.mock.calls[0][1].method).toBe('DELETE')
    })
  })

  describe('listWallets', () => {
    it('sends GET /wallets/', async () => {
      const mockResponse: Wallet[] = [
        { id: 'wallet_abc' },
        { id: 'wallet_def' },
      ]
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createService(fetch)

      const result = await service.listWallets()

      expect(result).toEqual(mockResponse)
      expect(spy.mock.calls[0][0].toString()).toContain('/wallets/')
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })
})
