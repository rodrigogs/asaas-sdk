import { describe, expect, it } from 'vitest'

import { BaseService } from './base-service.js'
import { PaginatedList } from './pagination.js'
import { createMockFetch, createTestOptions } from './test-helpers.js'

class TestService extends BaseService {
  getItem(id: string) {
    return this._request<{ id: string }>({
      method: 'GET',
      path: `/items/${id}`,
    })
  }

  listItems(params?: { offset?: number; limit?: number }) {
    return this._list<{ id: string }>('/items', params)
  }

  downloadItem(id: string) {
    return this._requestBinary({ method: 'GET', path: `/items/${id}/download` })
  }
}

describe('BaseService', () => {
  it('delegates _request to the HTTP layer', async () => {
    const { fetch, spy } = createMockFetch({
      status: 200,
      body: { id: 'item_1' },
    })
    const options = createTestOptions({ fetch })
    const service = new TestService(options)

    const result = await service.getItem('item_1')

    expect(result).toEqual({ id: 'item_1' })
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].toString()).toContain('/items/item_1')
  })

  it('delegates _list and returns a PaginatedList', async () => {
    const { fetch } = createMockFetch({
      status: 200,
      body: {
        object: 'list',
        hasMore: false,
        totalCount: 2,
        offset: 0,
        limit: 10,
        data: [{ id: '1' }, { id: '2' }],
      },
    })
    const options = createTestOptions({ fetch })
    const service = new TestService(options)

    const result = await service.listItems()

    expect(result).toBeInstanceOf(PaginatedList)
    expect(result.data).toEqual([{ id: '1' }, { id: '2' }])
    expect(result.totalCount).toBe(2)
    expect(result.hasMore).toBe(false)
  })

  it('passes pagination params to _list', async () => {
    const { fetch, spy } = createMockFetch({
      status: 200,
      body: {
        object: 'list',
        hasMore: false,
        totalCount: 0,
        offset: 20,
        limit: 5,
        data: [],
      },
    })
    const options = createTestOptions({ fetch })
    const service = new TestService(options)

    await service.listItems({ offset: 20, limit: 5 })

    const url = spy.mock.calls[0][0].toString()
    expect(url).toContain('offset=20')
    expect(url).toContain('limit=5')
  })

  it('delegates _requestBinary to the HTTP binary layer', async () => {
    const pdfBytes = new Uint8Array([37, 80, 68, 70])
    const mockFetch = (async () =>
      new Response(pdfBytes, {
        status: 200,
        headers: { 'content-type': 'application/pdf' },
      })) as unknown as typeof globalThis.fetch

    const options = createTestOptions({ fetch: mockFetch })
    const service = new TestService(options)

    const result = await service.downloadItem('item_1')

    expect(result.contentType).toBe('application/pdf')
  })
})
