import { describe, expect, it } from 'vitest'

import { PaginatedList } from '../../core/pagination.js'
import { createMockFetch, createTestOptions } from '../../core/test-helpers.js'
import { AnticipationConfigService } from './config.js'
import { AnticipationsService } from './service.js'

function createService(fetch: typeof globalThis.fetch) {
  return new AnticipationsService(createTestOptions({ fetch }))
}

function createConfigService(fetch: typeof globalThis.fetch) {
  return new AnticipationConfigService(createTestOptions({ fetch }))
}

describe('AnticipationsService', () => {
  describe('request', () => {
    it('sends POST /anticipations as multipart with payment', async () => {
      const mockAnticipation = {
        id: 'ant_1',
        payment: 'pay_123',
        status: 'PENDING',
        value: 500,
        fee: 25,
        netValue: 475,
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockAnticipation,
      })
      const service = createService(fetch)

      const result = await service.request({ payment: 'pay_123' })

      expect(result).toEqual(mockAnticipation)
      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/anticipations')
      expect(init.method).toBe('POST')
      expect(init.body).toBeInstanceOf(FormData)
      const formData = init.body as FormData
      expect(formData.get('payment')).toBe('pay_123')
    })

    it('sends POST /anticipations as multipart with installment and documents', async () => {
      const mockAnticipation = {
        id: 'ant_2',
        installment: 'inst_456',
        status: 'PENDING',
        value: 2000,
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockAnticipation,
      })
      const service = createService(fetch)

      const doc = new Blob(['pdf content'], { type: 'application/pdf' })
      const result = await service.request({
        installment: 'inst_456',
        documents: [doc],
      })

      expect(result.installment).toBe('inst_456')
      const formData = spy.mock.calls[0][1].body as FormData
      expect(formData.get('installment')).toBe('inst_456')
      expect(formData.get('documents[0]')).toBeInstanceOf(Blob)
    })
  })

  describe('list', () => {
    it('sends GET /anticipations and returns PaginatedList', async () => {
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
              id: 'ant_1',
              status: 'CREDITED',
              value: 1000,
              fee: 50,
              netValue: 950,
            },
          ],
        },
      })
      const service = createService(fetch)

      const result = await service.list()

      expect(result).toBeInstanceOf(PaginatedList)
      expect(result.data).toHaveLength(1)
      expect(result.data[0]!.status).toBe('CREDITED')

      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('/anticipations')
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })

    it('passes payment, installment, and status as query filters', async () => {
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

      await service.list({
        limit: 10,
        payment: 'pay_123',
        status: 'PENDING',
      })

      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('payment=pay_123')
      expect(url).toContain('status=PENDING')
    })
  })

  describe('get', () => {
    it('sends GET /anticipations/{id}', async () => {
      const mockAnticipation = {
        id: 'ant_1',
        payment: 'pay_123',
        status: 'CREDITED',
        anticipationDate: '2026-03-15',
        dueDate: '2026-04-15',
        requestDate: '2026-03-10',
        fee: 50,
        anticipationDays: 31,
        netValue: 950,
        totalValue: 1000,
        value: 1000,
        denialObservation: null,
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockAnticipation,
      })
      const service = createService(fetch)

      const result = await service.get('ant_1')

      expect(result).toEqual(mockAnticipation)
      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('/anticipations/ant_1')
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('simulate', () => {
    it('sends POST /anticipations/simulate with payment', async () => {
      const mockSimulation = {
        anticipationDate: '2026-03-15',
        dueDate: '2026-04-15',
        fee: 50,
        anticipationDays: 31,
        netValue: 950,
        totalValue: 1000,
        value: 1000,
        isDocumentationRequired: false,
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockSimulation,
      })
      const service = createService(fetch)

      const result = await service.simulate({ payment: 'pay_123' })

      expect(result).toEqual(mockSimulation)
      expect(result.isDocumentationRequired).toBe(false)

      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/anticipations/simulate')
      expect(init.method).toBe('POST')
      const body = JSON.parse(init.body as string)
      expect(body.payment).toBe('pay_123')
    })

    it('sends POST /anticipations/simulate with installment', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: {
          fee: 100,
          isDocumentationRequired: true,
        },
      })
      const service = createService(fetch)

      await service.simulate({ installment: 'inst_456' })

      const body = JSON.parse(spy.mock.calls[0][1].body as string)
      expect(body.installment).toBe('inst_456')
    })
  })

  describe('cancel', () => {
    it('sends POST /anticipations/{id}/cancel', async () => {
      const mockAnticipation = {
        id: 'ant_1',
        status: 'CANCELLED',
        value: 1000,
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockAnticipation,
      })
      const service = createService(fetch)

      const result = await service.cancel('ant_1')

      expect(result.status).toBe('CANCELLED')
      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/anticipations/ant_1/cancel')
      expect(init.method).toBe('POST')
    })
  })

  describe('getLimits', () => {
    it('sends GET /anticipations/limits', async () => {
      const mockLimits = {
        creditCard: { total: 10000, available: 7500 },
        bankSlip: { total: 5000, available: 5000 },
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockLimits,
      })
      const service = createService(fetch)

      const result = await service.getLimits()

      expect(result.creditCard?.total).toBe(10000)
      expect(result.creditCard?.available).toBe(7500)
      expect(result.bankSlip?.total).toBe(5000)

      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('/anticipations/limits')
    })
  })
})

describe('AnticipationConfigService', () => {
  describe('get', () => {
    it('sends GET /anticipations/configurations', async () => {
      const mockConfig = { creditCardAutomaticEnabled: true }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockConfig,
      })
      const service = createConfigService(fetch)

      const result = await service.get()

      expect(result.creditCardAutomaticEnabled).toBe(true)
      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('/anticipations/configurations')
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('update', () => {
    it('sends PUT /anticipations/configurations with config', async () => {
      const mockConfig = { creditCardAutomaticEnabled: false }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockConfig,
      })
      const service = createConfigService(fetch)

      const result = await service.update({
        creditCardAutomaticEnabled: false,
      })

      expect(result.creditCardAutomaticEnabled).toBe(false)
      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/anticipations/configurations')
      expect(init.method).toBe('PUT')
      const body = JSON.parse(init.body as string)
      expect(body.creditCardAutomaticEnabled).toBe(false)
    })
  })
})
