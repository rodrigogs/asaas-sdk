import { describe, expect, it } from 'vitest'

import { createMockFetch, createTestOptions } from '../../core/test-helpers.js'
import { SubscriptionInvoiceSettingsService } from './invoice-settings.js'
import { SubscriptionsService } from './service.js'
import type { Subscription } from './types.js'

function createService(body: unknown) {
  const { fetch, spy } = createMockFetch({ status: 200, body })
  return {
    service: new SubscriptionsService(createTestOptions({ fetch })),
    spy,
  }
}

const MOCK_SUBSCRIPTION: Subscription = {
  object: 'subscription',
  id: 'sub_123',
  dateCreated: '2026-01-01',
  customer: 'cus_123',
  billingType: 'CREDIT_CARD',
  cycle: 'MONTHLY',
  value: 99.9,
  nextDueDate: '2026-02-01',
  status: 'ACTIVE',
  deleted: false,
}

describe('SubscriptionsService', () => {
  describe('create', () => {
    it('sends POST to /subscriptions with body', async () => {
      const params = {
        customer: 'cus_123',
        billingType: 'CREDIT_CARD' as const,
        value: 99.9,
        nextDueDate: '2026-02-01',
        cycle: 'MONTHLY' as const,
      }
      const { service, spy } = createService(MOCK_SUBSCRIPTION)

      const result = await service.create(params)

      expect(result).toEqual(MOCK_SUBSCRIPTION)
      const [url, init] = spy.mock.calls[0]
      expect(init.method).toBe('POST')
      expect(url.toString()).toContain('/subscriptions')
      expect(url.toString()).not.toMatch(/\/subscriptions\/$/)
    })
  })

  describe('createWithCreditCard', () => {
    it('sends POST to /subscriptions/ (trailing slash) with card data', async () => {
      const params = {
        customer: 'cus_123',
        billingType: 'CREDIT_CARD' as const,
        value: 99.9,
        nextDueDate: '2026-02-01',
        cycle: 'MONTHLY' as const,
        creditCard: {
          holderName: 'John',
          number: '4111111111111111',
          expiryMonth: '12',
          expiryYear: '2030',
          ccv: '123',
        },
        creditCardHolderInfo: {
          name: 'John',
          email: 'j@e.com',
          cpfCnpj: '12345678901',
          postalCode: '01001000',
          addressNumber: '123',
        },
        remoteIp: '1.2.3.4',
      }
      const { service, spy } = createService(MOCK_SUBSCRIPTION)

      const result = await service.createWithCreditCard(params)

      expect(result).toEqual(MOCK_SUBSCRIPTION)
      const [url, init] = spy.mock.calls[0]
      expect(init.method).toBe('POST')
      expect(url.toString()).toMatch(/\/subscriptions\/$/)
    })
  })

  describe('list', () => {
    it('returns paginated list of subscriptions', async () => {
      const body = {
        object: 'list',
        hasMore: false,
        totalCount: 1,
        offset: 0,
        limit: 20,
        data: [MOCK_SUBSCRIPTION],
      }
      const { service, spy } = createService(body)

      const result = await service.list({
        customer: 'cus_123',
        status: 'ACTIVE',
      })

      expect(result.data).toEqual([MOCK_SUBSCRIPTION])
      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('/subscriptions')
      expect(url).toContain('customer=cus_123')
      expect(url).toContain('status=ACTIVE')
    })

    it('uses default pagination when called without params', async () => {
      const body = {
        object: 'list',
        hasMore: false,
        totalCount: 0,
        offset: 0,
        limit: 20,
        data: [],
      }
      const { service, spy } = createService(body)

      await service.list()

      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('offset=0')
      expect(url).toContain('limit=20')
    })
  })

  describe('get', () => {
    it('sends GET to /subscriptions/{id}', async () => {
      const { service, spy } = createService(MOCK_SUBSCRIPTION)

      const result = await service.get('sub_123')

      expect(result).toEqual(MOCK_SUBSCRIPTION)
      const [url, init] = spy.mock.calls[0]
      expect(init.method).toBe('GET')
      expect(url.toString()).toContain('/subscriptions/sub_123')
    })
  })

  describe('update', () => {
    it('sends PUT to /subscriptions/{id} with body', async () => {
      const params = {
        status: 'INACTIVE' as const,
        updatePendingPayments: true,
      }
      const { service, spy } = createService(MOCK_SUBSCRIPTION)

      const result = await service.update('sub_123', params)

      expect(result).toEqual(MOCK_SUBSCRIPTION)
      const [url, init] = spy.mock.calls[0]
      expect(init.method).toBe('PUT')
      expect(url.toString()).toContain('/subscriptions/sub_123')
      expect(JSON.parse(init.body as string)).toEqual(params)
    })
  })

  describe('updateCreditCard', () => {
    it('sends PUT to /subscriptions/{id}/creditCard with body', async () => {
      const params = {
        creditCard: {
          holderName: 'John',
          number: '4111111111111111',
          expiryMonth: '12',
          expiryYear: '2030',
          ccv: '123',
        },
        creditCardHolderInfo: {
          name: 'John',
          email: 'j@e.com',
          cpfCnpj: '12345678901',
          postalCode: '01001000',
          addressNumber: '123',
        },
        remoteIp: '1.2.3.4',
      }
      const { service, spy } = createService(MOCK_SUBSCRIPTION)

      const result = await service.updateCreditCard('sub_123', params)

      expect(result).toEqual(MOCK_SUBSCRIPTION)
      const [url, init] = spy.mock.calls[0]
      expect(init.method).toBe('PUT')
      expect(url.toString()).toContain('/subscriptions/sub_123/creditCard')
    })
  })

  describe('remove', () => {
    it('sends DELETE to /subscriptions/{id}', async () => {
      const response = { id: 'sub_123', deleted: true }
      const { service, spy } = createService(response)

      const result = await service.remove('sub_123')

      expect(result).toEqual(response)
      const [url, init] = spy.mock.calls[0]
      expect(init.method).toBe('DELETE')
      expect(url.toString()).toContain('/subscriptions/sub_123')
    })
  })

  describe('listPayments', () => {
    it('returns paginated list of payments for subscription', async () => {
      const payment = {
        id: 'pay_1',
        customer: 'cus_123',
        value: 99.9,
        billingType: 'CREDIT_CARD',
        status: 'PENDING',
        dueDate: '2026-02-01',
      }
      const body = {
        object: 'list',
        hasMore: false,
        totalCount: 1,
        offset: 0,
        limit: 20,
        data: [payment],
      }
      const { service, spy } = createService(body)

      const result = await service.listPayments('sub_123', {
        status: 'PENDING',
      })

      expect(result.data).toEqual([payment])
      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('/subscriptions/sub_123/payments')
      expect(url).toContain('status=PENDING')
    })

    it('uses default pagination when called without params', async () => {
      const body = {
        object: 'list',
        hasMore: false,
        totalCount: 0,
        offset: 0,
        limit: 20,
        data: [],
      }
      const { service, spy } = createService(body)

      await service.listPayments('sub_123')

      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('/subscriptions/sub_123/payments')
      expect(url).toContain('offset=0')
    })
  })

  describe('downloadPaymentBook', () => {
    it('sends GET /subscriptions/{id}/paymentBook as binary', async () => {
      const pdfBytes = new Uint8Array([37, 80, 68, 70])
      const mockFetch = (async () =>
        new Response(pdfBytes, {
          status: 200,
          headers: { 'content-type': 'application/pdf' },
        })) as unknown as typeof globalThis.fetch

      const service = new SubscriptionsService(
        createTestOptions({ fetch: mockFetch }),
      )
      const result = await service.downloadPaymentBook('sub_123')
      expect(result.contentType).toBe('application/pdf')
    })
  })

  describe('listInvoices', () => {
    it('returns paginated list of invoices', async () => {
      const invoice = { id: 'inv_1', status: 'AUTHORIZED' }
      const body = {
        object: 'list',
        hasMore: false,
        totalCount: 1,
        offset: 0,
        limit: 20,
        data: [invoice],
      }
      const { service, spy } = createService(body)

      const result = await service.listInvoices('sub_123', {
        status: 'AUTHORIZED',
      })

      expect(result.data).toEqual([invoice])
      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('/subscriptions/sub_123/invoices')
      expect(url).toContain('status=AUTHORIZED')
    })

    it('uses default pagination when called without params', async () => {
      const body = {
        object: 'list',
        hasMore: false,
        totalCount: 0,
        offset: 0,
        limit: 20,
        data: [],
      }
      const { service, spy } = createService(body)

      await service.listInvoices('sub_123')

      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('/subscriptions/sub_123/invoices')
      expect(url).toContain('offset=0')
    })
  })

  describe('invoiceSettings', () => {
    it('returns a memoized SubscriptionInvoiceSettingsService instance', () => {
      const { service } = createService(null)
      const settings = service.invoiceSettings
      expect(settings).toBeInstanceOf(SubscriptionInvoiceSettingsService)
      expect(service.invoiceSettings).toBe(settings)
    })
  })
})
