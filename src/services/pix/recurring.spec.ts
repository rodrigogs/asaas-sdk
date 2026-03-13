import { describe, expect, it } from 'vitest'

import { PaginatedList } from '../../core/pagination.js'
import { createMockFetch, createTestOptions } from '../../core/test-helpers.js'
import type {
  PixRecurring,
  PixRecurringItem,
  PixRecurringListParams,
} from './recurring.js'
import { PixRecurringService } from './recurring.js'

function createService(fetch: typeof globalThis.fetch) {
  return new PixRecurringService(createTestOptions({ fetch }))
}

describe('PixRecurringService', () => {
  it('sends GET /pix/transactions/recurrings with filters', async () => {
    const params: PixRecurringListParams = { status: 'DONE', limit: 10 }
    const { fetch, spy } = createMockFetch({
      status: 200,
      body: {
        object: 'list',
        hasMore: false,
        totalCount: 1,
        offset: 0,
        limit: 10,
        data: [{ id: 'rec_1', status: 'DONE', value: 100.0 }],
      },
    })
    const service = createService(fetch)

    const result = await service.list(params)

    expect(result).toBeInstanceOf(PaginatedList)
    expect(result.data).toHaveLength(1)
    expect(result.data[0]!.id).toBe('rec_1')
    const url = spy.mock.calls[0][0].toString()
    expect(url).toContain('/pix/transactions/recurrings')
    expect(url).toContain('status=DONE')
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

  it('sends GET /pix/transactions/recurrings/{id}', async () => {
    const mockResponse: PixRecurring = {
      id: 'rec_1',
      status: 'DONE',
      value: 100.0,
    }
    const { fetch, spy } = createMockFetch({ status: 200, body: mockResponse })
    const service = createService(fetch)

    const result = await service.get('rec_1')

    expect(result).toEqual(mockResponse)
    const [url, init] = spy.mock.calls[0]
    expect(url.toString()).toContain('/pix/transactions/recurrings/rec_1')
    expect(init.method).toBe('GET')
  })

  it('sends POST /pix/transactions/recurrings/{id}/cancel', async () => {
    const mockResponse: PixRecurring = { id: 'rec_1', status: 'CANCELLED' }
    const { fetch, spy } = createMockFetch({ status: 200, body: mockResponse })
    const service = createService(fetch)

    const result = await service.cancel('rec_1')

    expect(result).toEqual(mockResponse)
    const [url, init] = spy.mock.calls[0]
    expect(url.toString()).toContain(
      '/pix/transactions/recurrings/rec_1/cancel',
    )
    expect(init.method).toBe('POST')
  })

  it('sends GET /pix/transactions/recurrings/{id}/items', async () => {
    const { fetch, spy } = createMockFetch({
      status: 200,
      body: {
        object: 'list',
        hasMore: false,
        totalCount: 2,
        offset: 0,
        limit: 20,
        data: [
          { id: 'item_1', scheduledDate: '2026-04-01', status: 'DONE' },
          { id: 'item_2', scheduledDate: '2026-05-01', status: 'SCHEDULED' },
        ],
      },
    })
    const service = createService(fetch)

    const result = await service.listItems('rec_1')

    expect(result).toBeInstanceOf(PaginatedList)
    expect(result.data).toHaveLength(2)
    expect(result.data[0]!.id).toBe('item_1')
    const url = spy.mock.calls[0][0].toString()
    expect(url).toContain('/pix/transactions/recurrings/rec_1/items')
  })

  it('sends POST /pix/transactions/recurrings/items/{id}/cancel', async () => {
    const mockResponse: PixRecurringItem = { id: 'item_1', status: 'CANCELLED' }
    const { fetch, spy } = createMockFetch({ status: 200, body: mockResponse })
    const service = createService(fetch)

    const result = await service.cancelItem('item_1')

    expect(result).toEqual(mockResponse)
    const [url, init] = spy.mock.calls[0]
    expect(url.toString()).toContain(
      '/pix/transactions/recurrings/items/item_1/cancel',
    )
    expect(init.method).toBe('POST')
  })

  it('uses default pagination for listItems when called without params', async () => {
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

    await service.listItems('rec_1')

    const url = spy.mock.calls[0][0].toString()
    expect(url).toContain('offset=0')
    expect(url).toContain('limit=20')
  })
})
