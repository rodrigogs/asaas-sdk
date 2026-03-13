import { describe, expect, it } from 'vitest'

import { PaginatedList } from '../../core/pagination.js'
import { createMockFetch, createTestOptions } from '../../core/test-helpers.js'
import { NotificationsService } from './service.js'
import type { CustomerNotification } from './types.js'

function createService(fetch: typeof globalThis.fetch) {
  return new NotificationsService(createTestOptions({ fetch }))
}

describe('NotificationsService', () => {
  describe('list', () => {
    it('sends GET /customers/{id}/notifications and returns PaginatedList', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: {
          object: 'list',
          hasMore: false,
          totalCount: 2,
          offset: 0,
          limit: 20,
          data: [
            {
              id: 'nfi_1',
              customer: 'cus_123',
              enabled: true,
              event: 'PAYMENT_CREATED',
              scheduleOffset: 0,
            },
            {
              id: 'nfi_2',
              customer: 'cus_123',
              enabled: true,
              event: 'PAYMENT_OVERDUE',
              scheduleOffset: 7,
            },
          ],
        },
      })
      const service = createService(fetch)

      const result = await service.list('cus_123')

      expect(result).toBeInstanceOf(PaginatedList)
      expect(result.data).toHaveLength(2)
      expect(result.data[0]!.event).toBe('PAYMENT_CREATED')
      expect(result.data[1]!.scheduleOffset).toBe(7)

      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('/customers/cus_123/notifications')
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('update', () => {
    it('sends PUT /notifications/{id} with channel flags', async () => {
      const mockResponse: CustomerNotification = {
        id: 'nfi_1',
        customer: 'cus_123',
        enabled: true,
        emailEnabledForProvider: true,
        smsEnabledForProvider: false,
        emailEnabledForCustomer: true,
        smsEnabledForCustomer: false,
        phoneCallEnabledForCustomer: false,
        whatsappEnabledForCustomer: true,
        event: 'PAYMENT_CREATED',
        scheduleOffset: 0,
        deleted: false,
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createService(fetch)

      const result = await service.update('nfi_1', {
        enabled: true,
        emailEnabledForCustomer: true,
        whatsappEnabledForCustomer: true,
        smsEnabledForCustomer: false,
      })

      expect(result).toEqual(mockResponse)
      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/notifications/nfi_1')
      expect(init.method).toBe('PUT')
      const body = JSON.parse(init.body as string)
      expect(body.enabled).toBe(true)
      expect(body.emailEnabledForCustomer).toBe(true)
      expect(body.whatsappEnabledForCustomer).toBe(true)
    })

    it('sends PUT /notifications/{id} with scheduleOffset', async () => {
      const mockResponse: CustomerNotification = {
        id: 'nfi_3',
        event: 'PAYMENT_DUEDATE_WARNING',
        scheduleOffset: 5,
        enabled: true,
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createService(fetch)

      const result = await service.update('nfi_3', {
        scheduleOffset: 5,
      })

      expect(result.scheduleOffset).toBe(5)
      const body = JSON.parse(spy.mock.calls[0][1].body as string)
      expect(body.scheduleOffset).toBe(5)
    })
  })

  describe('updateBatch', () => {
    it('sends PUT /notifications/batch with customer and notifications array', async () => {
      const mockResponse: CustomerNotification[] = [
        {
          id: 'nfi_1',
          customer: 'cus_123',
          enabled: false,
          event: 'PAYMENT_CREATED',
          scheduleOffset: 0,
        },
        {
          id: 'nfi_2',
          customer: 'cus_123',
          enabled: true,
          event: 'PAYMENT_OVERDUE',
          scheduleOffset: 7,
        },
      ]
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createService(fetch)

      const result = await service.updateBatch({
        customer: 'cus_123',
        notifications: [
          { id: 'nfi_1', enabled: false },
          { id: 'nfi_2', enabled: true, scheduleOffset: 7 },
        ],
      })

      expect(result).toHaveLength(2)
      expect(result[0]!.enabled).toBe(false)
      expect(result[1]!.scheduleOffset).toBe(7)

      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/notifications/batch')
      expect(init.method).toBe('PUT')
      const body = JSON.parse(init.body as string)
      expect(body.customer).toBe('cus_123')
      expect(body.notifications).toHaveLength(2)
      expect(body.notifications[0].id).toBe('nfi_1')
      expect(body.notifications[1].scheduleOffset).toBe(7)
    })
  })
})
