import { describe, expect, it } from 'vitest'

import { PaginatedList } from '../../core/pagination.js'
import { createMockFetch, createTestOptions } from '../../core/test-helpers.js'
import type {
  PixTransaction,
  PixTransactionListParams,
} from './transactions.js'
import { PixTransactionsService } from './transactions.js'

function createService(fetch: typeof globalThis.fetch) {
  return new PixTransactionsService(createTestOptions({ fetch }))
}

describe('PixTransactionsService', () => {
  it('sends GET /pix/transactions with filters', async () => {
    const params: PixTransactionListParams = {
      status: 'DONE',
      type: 'CREDIT',
      limit: 10,
    }
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
            id: 'txn_1',
            value: 100.0,
            status: 'DONE',
            type: 'CREDIT',
            endToEndIdentifier: 'E123',
          },
        ],
      },
    })
    const service = createService(fetch)

    const result = await service.list(params)

    expect(result).toBeInstanceOf(PaginatedList)
    expect(result.data).toHaveLength(1)
    expect(result.data[0]!.id).toBe('txn_1')
    const url = spy.mock.calls[0][0].toString()
    expect(url).toContain('/pix/transactions')
    expect(url).toContain('status=DONE')
    expect(url).toContain('type=CREDIT')
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

    await service.list()

    const url = spy.mock.calls[0][0].toString()
    expect(url).toContain('offset=0')
    expect(url).toContain('limit=20')
  })

  it('sends GET /pix/transactions/{id}', async () => {
    const mockResponse: PixTransaction = {
      id: 'txn_1',
      value: 100.0,
      status: 'DONE',
      type: 'CREDIT',
    }
    const { fetch, spy } = createMockFetch({ status: 200, body: mockResponse })
    const service = createService(fetch)

    const result = await service.get('txn_1')

    expect(result).toEqual(mockResponse)
    const [url, init] = spy.mock.calls[0]
    expect(url.toString()).toContain('/pix/transactions/txn_1')
    expect(init.method).toBe('GET')
  })

  it('sends POST /pix/transactions/{id}/cancel', async () => {
    const mockResponse: PixTransaction = {
      id: 'txn_1',
      value: 100.0,
      status: 'CANCELLED',
      type: 'DEBIT',
    }
    const { fetch, spy } = createMockFetch({ status: 200, body: mockResponse })
    const service = createService(fetch)

    const result = await service.cancel('txn_1')

    expect(result).toEqual(mockResponse)
    const [url, init] = spy.mock.calls[0]
    expect(url.toString()).toContain('/pix/transactions/txn_1/cancel')
    expect(init.method).toBe('POST')
  })
})
