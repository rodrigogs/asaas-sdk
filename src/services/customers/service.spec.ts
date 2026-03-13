import { describe, expect, it } from 'vitest'

import { PaginatedList } from '../../core/pagination.js'
import { createMockFetch, createTestOptions } from '../../core/test-helpers.js'
import { CustomersService } from './service.js'

function createService(fetch: typeof globalThis.fetch) {
  return new CustomersService(createTestOptions({ fetch }))
}

describe('CustomersService', () => {
  describe('create', () => {
    it('sends POST /customers with required and optional fields', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: { id: 'cus_new', name: 'PitStop', cpfCnpj: '12345678000100' },
      })
      const service = createService(fetch)

      const result = await service.create({
        name: 'PitStop',
        cpfCnpj: '12345678000100',
        email: 'contato@pitstop.com',
      })

      expect(result.id).toBe('cus_new')
      expect(result.name).toBe('PitStop')

      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/customers')
      expect(init.method).toBe('POST')
      expect(JSON.parse(init.body as string)).toEqual({
        name: 'PitStop',
        cpfCnpj: '12345678000100',
        email: 'contato@pitstop.com',
      })
    })
  })

  describe('get', () => {
    it('sends GET /customers/{id}', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: { id: 'cus_1', name: 'PitStop', deleted: false },
      })
      const service = createService(fetch)

      const result = await service.get('cus_1')

      expect(result.id).toBe('cus_1')
      expect(spy.mock.calls[0][0].toString()).toContain('/customers/cus_1')
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('list', () => {
    it('sends GET /customers with filters and returns PaginatedList', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: {
          object: 'list',
          hasMore: false,
          totalCount: 1,
          offset: 0,
          limit: 10,
          data: [{ id: 'cus_1', name: 'PitStop' }],
        },
      })
      const service = createService(fetch)

      const result = await service.list({ name: 'PitStop', limit: 10 })

      expect(result).toBeInstanceOf(PaginatedList)
      expect(result.data).toHaveLength(1)
      expect(result.data[0]!.name).toBe('PitStop')

      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('name=PitStop')
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
      const service = createService(fetch)

      const result = await service.list()

      expect(result).toBeInstanceOf(PaginatedList)
      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('offset=0')
      expect(url).toContain('limit=20')
    })
  })

  describe('update', () => {
    it('sends PUT /customers/{id} with partial fields', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: { id: 'cus_1', name: 'PitStop Novo', email: 'novo@pitstop.com' },
      })
      const service = createService(fetch)

      const result = await service.update('cus_1', {
        name: 'PitStop Novo',
        email: 'novo@pitstop.com',
      })

      expect(result.name).toBe('PitStop Novo')
      expect(spy.mock.calls[0][0].toString()).toContain('/customers/cus_1')
      expect(spy.mock.calls[0][1].method).toBe('PUT')
    })
  })

  describe('remove', () => {
    it('sends DELETE /customers/{id} and returns deletion result', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: { id: 'cus_1', deleted: true },
      })
      const service = createService(fetch)

      const result = await service.remove('cus_1')

      expect(result).toEqual({ id: 'cus_1', deleted: true })
      expect(spy.mock.calls[0][0].toString()).toContain('/customers/cus_1')
      expect(spy.mock.calls[0][1].method).toBe('DELETE')
    })
  })

  describe('restore', () => {
    it('sends POST /customers/{id}/restore and returns customer', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: { id: 'cus_1', name: 'PitStop', deleted: false },
      })
      const service = createService(fetch)

      const result = await service.restore('cus_1')

      expect(result.id).toBe('cus_1')
      expect(result.deleted).toBe(false)
      expect(spy.mock.calls[0][0].toString()).toContain(
        '/customers/cus_1/restore',
      )
      expect(spy.mock.calls[0][1].method).toBe('POST')
    })
  })

  describe('listNotifications', () => {
    it('sends GET /customers/{id}/notifications', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: {
          object: 'list',
          hasMore: false,
          totalCount: 2,
          offset: 0,
          limit: 10,
          data: [
            { id: 'not_1', event: 'PAYMENT_CREATED', enabled: true },
            { id: 'not_2', event: 'PAYMENT_OVERDUE', enabled: false },
          ],
        },
      })
      const service = createService(fetch)

      const result = await service.listNotifications('cus_1')

      expect(result).toBeInstanceOf(PaginatedList)
      expect(result.data).toHaveLength(2)
      expect(result.data[0]!.event).toBe('PAYMENT_CREATED')
      expect(spy.mock.calls[0][0].toString()).toContain(
        '/customers/cus_1/notifications',
      )
    })
  })
})
