import { describe, expect, it, vi } from 'vitest'

import { PaginatedList, type PaginatedResponse } from './pagination.js'

function makePage<T>(
  data: T[],
  opts: {
    hasMore: boolean
    totalCount: number
    offset?: number
    limit?: number
  },
): PaginatedResponse<T> {
  return {
    object: 'list',
    hasMore: opts.hasMore,
    totalCount: opts.totalCount,
    offset: opts.offset ?? 0,
    limit: opts.limit ?? data.length,
    data,
  }
}

describe('PaginatedList', () => {
  it('exposes first page data, hasMore, and totalCount', () => {
    const page = makePage([{ id: '1' }, { id: '2' }], {
      hasMore: true,
      totalCount: 10,
    })
    const list = new PaginatedList(page, 2, vi.fn())

    expect(list.data).toEqual([{ id: '1' }, { id: '2' }])
    expect(list.hasMore).toBe(true)
    expect(list.totalCount).toBe(10)
  })

  it('iterates through all pages with for-await', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(
        makePage([{ id: '3' }, { id: '4' }], {
          hasMore: true,
          totalCount: 5,
          offset: 2,
        }),
      )
      .mockResolvedValueOnce(
        makePage([{ id: '5' }], {
          hasMore: false,
          totalCount: 5,
          offset: 4,
        }),
      )

    const firstPage = makePage([{ id: '1' }, { id: '2' }], {
      hasMore: true,
      totalCount: 5,
      limit: 2,
    })

    const list = new PaginatedList(firstPage, 2, fetchPage)
    const ids: string[] = []

    for await (const item of list) {
      ids.push((item as { id: string }).id)
    }

    expect(ids).toEqual(['1', '2', '3', '4', '5'])
    expect(fetchPage).toHaveBeenCalledTimes(2)
    expect(fetchPage).toHaveBeenCalledWith({ offset: 2, limit: 2 })
    expect(fetchPage).toHaveBeenCalledWith({ offset: 4, limit: 2 })
  })

  it('does not fetch more pages when hasMore is false', async () => {
    const fetchPage = vi.fn()
    const page = makePage([{ id: '1' }], {
      hasMore: false,
      totalCount: 1,
    })

    const list = new PaginatedList(page, 10, fetchPage)
    const items: unknown[] = []

    for await (const item of list) {
      items.push(item)
    }

    expect(items).toHaveLength(1)
    expect(fetchPage).not.toHaveBeenCalled()
  })

  it('collects items into an array with toArray', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(
        makePage([{ id: '3' }], { hasMore: false, totalCount: 3, offset: 2 }),
      )

    const firstPage = makePage([{ id: '1' }, { id: '2' }], {
      hasMore: true,
      totalCount: 3,
      limit: 2,
    })

    const list = new PaginatedList(firstPage, 2, fetchPage)
    const all = await list.toArray()

    expect(all).toEqual([{ id: '1' }, { id: '2' }, { id: '3' }])
  })

  it('respects the limit parameter in toArray', async () => {
    const firstPage = makePage(
      Array.from({ length: 10 }, (_, i) => ({ id: String(i) })),
      { hasMore: true, totalCount: 100, limit: 10 },
    )

    const list = new PaginatedList(firstPage, 10, vi.fn())
    const items = await list.toArray({ limit: 5 })

    expect(items).toHaveLength(5)
  })

  it('handles empty first page', async () => {
    const fetchPage = vi.fn()
    const page = makePage([], { hasMore: false, totalCount: 0 })

    const list = new PaginatedList(page, 10, fetchPage)
    const items: unknown[] = []

    for await (const item of list) {
      items.push(item)
    }

    expect(items).toHaveLength(0)
    expect(fetchPage).not.toHaveBeenCalled()
  })

  it('returns done when next() is called after exhaustion', async () => {
    const page = makePage([{ id: '1' }], {
      hasMore: false,
      totalCount: 1,
    })

    const list = new PaginatedList(page, 10, vi.fn())
    const iterator = list[Symbol.asyncIterator]()

    const first = await iterator.next()
    expect(first.done).toBe(false)

    const second = await iterator.next()
    expect(second.done).toBe(true)

    // Call next() again after exhaustion — should still return done
    const third = await iterator.next()
    expect(third.done).toBe(true)
  })
})
