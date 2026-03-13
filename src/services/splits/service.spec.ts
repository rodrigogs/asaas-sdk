import { describe, expect, it } from 'vitest'

import { PaginatedList } from '../../core/pagination.js'
import { createMockFetch, createTestOptions } from '../../core/test-helpers.js'
import { SplitsService } from './service.js'

function createService(fetch: typeof globalThis.fetch) {
  return new SplitsService(createTestOptions({ fetch }))
}

describe('SplitsService', () => {
  describe('listPaid', () => {
    it('sends GET /payments/splits/paid and returns PaginatedList', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: {
          object: 'list',
          hasMore: false,
          totalCount: 1,
          offset: 0,
          limit: 20,
          data: [
            {
              id: 'split_1',
              walletId: 'wal_abc',
              fixedValue: 50,
              status: 'DONE',
            },
          ],
        },
      })
      const service = createService(fetch)

      const result = await service.listPaid()

      expect(result).toBeInstanceOf(PaginatedList)
      expect(result.data).toHaveLength(1)
      expect(result.data[0]!.walletId).toBe('wal_abc')
      expect(result.data[0]!.status).toBe('DONE')

      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('/payments/splits/paid')
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })

    it('passes date range and status filters as query params', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: {
          object: 'list',
          hasMore: false,
          totalCount: 0,
          offset: 0,
          limit: 10,
          data: [],
        },
      })
      const service = createService(fetch)

      await service.listPaid({
        'limit': 10,
        'status': 'PENDING',
        'paymentConfirmedDate[ge]': '2026-01-01',
        'creditDate[le]': '2026-03-31',
      })

      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('status=PENDING')
      expect(url).toContain('paymentConfirmedDate%5Bge%5D=2026-01-01')
      expect(url).toContain('creditDate%5Ble%5D=2026-03-31')
    })
  })

  describe('getPaid', () => {
    it('sends GET /payments/splits/paid/{id}', async () => {
      const mockSplit = {
        id: 'split_1',
        walletId: 'wal_abc',
        fixedValue: 100,
        percentualValue: 10,
        status: 'DONE',
        externalReference: 'ref_123',
        description: 'Partner split',
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockSplit,
      })
      const service = createService(fetch)

      const result = await service.getPaid('split_1')

      expect(result).toEqual(mockSplit)
      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('/payments/splits/paid/split_1')
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('listReceived', () => {
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

      await service.listReceived()

      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('/payments/splits/received')
      expect(url).toContain('offset=0')
      expect(url).toContain('limit=20')
    })

    it('sends GET /payments/splits/received and returns PaginatedList', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: {
          object: 'list',
          hasMore: true,
          totalCount: 50,
          offset: 0,
          limit: 20,
          data: [
            {
              id: 'split_r1',
              walletId: 'wal_xyz',
              status: 'AWAITING_CREDIT',
              totalValue: 200,
            },
          ],
        },
      })
      const service = createService(fetch)

      const result = await service.listReceived({ paymentId: 'pay_123' })

      expect(result).toBeInstanceOf(PaginatedList)
      expect(result.hasMore).toBe(true)
      expect(result.data[0]!.status).toBe('AWAITING_CREDIT')

      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('/payments/splits/received')
      expect(url).toContain('paymentId=pay_123')
    })
  })

  describe('getReceived', () => {
    it('sends GET /payments/splits/received/{id}', async () => {
      const mockSplit = {
        id: 'split_r1',
        walletId: 'wal_xyz',
        fixedValue: 75,
        status: 'DONE',
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockSplit,
      })
      const service = createService(fetch)

      const result = await service.getReceived('split_r1')

      expect(result).toEqual(mockSplit)
      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('/payments/splits/received/split_r1')
    })
  })

  describe('getStatistics', () => {
    it('sends GET /finance/split/statistics', async () => {
      const mockStats = { income: 5000, value: 3200 }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockStats,
      })
      const service = createService(fetch)

      const result = await service.getStatistics()

      expect(result).toEqual(mockStats)
      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('/finance/split/statistics')
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('updateInstallment', () => {
    it('sends PUT /installments/{id}/splits with splits array', async () => {
      const mockResponse = {
        id: 'inst_1',
        status: 'ACTIVE',
        value: 1000,
        installmentCount: 3,
        split: [
          {
            id: 'split_new',
            walletId: 'wal_abc',
            fixedValue: 100,
          },
        ],
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createService(fetch)

      const result = await service.updateInstallment('inst_1', {
        splits: [
          {
            walletId: 'wal_abc',
            fixedValue: 100,
            externalReference: 'ext_1',
          },
        ],
      })

      expect(result.split).toHaveLength(1)
      expect(result.split[0].walletId).toBe('wal_abc')

      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/installments/inst_1/splits')
      expect(init.method).toBe('PUT')
      const body = JSON.parse(init.body as string)
      expect(body.splits).toHaveLength(1)
      expect(body.splits[0].walletId).toBe('wal_abc')
      expect(body.splits[0].fixedValue).toBe(100)
    })

    it('supports totalFixedValue and installmentNumber in split items', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: { id: 'inst_2', split: [] },
      })
      const service = createService(fetch)

      await service.updateInstallment('inst_2', {
        splits: [
          {
            walletId: 'wal_abc',
            totalFixedValue: 300,
          },
          {
            walletId: 'wal_def',
            fixedValue: 50,
            installmentNumber: 2,
          },
        ],
      })

      const body = JSON.parse(spy.mock.calls[0][1].body as string)
      expect(body.splits).toHaveLength(2)
      expect(body.splits[0].totalFixedValue).toBe(300)
      expect(body.splits[1].installmentNumber).toBe(2)
    })
  })
})
