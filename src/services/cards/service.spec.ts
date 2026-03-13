import { describe, expect, it } from 'vitest'

import { createMockFetch, createTestOptions } from '../../core/test-helpers.js'
import { CardsService } from './service.js'

function createService(fetch: typeof globalThis.fetch) {
  return new CardsService(createTestOptions({ fetch }))
}

describe('CardsService', () => {
  describe('payWithCreditCard', () => {
    it('sends POST /payments/{id}/payWithCreditCard with full credit card body', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: { id: 'pay_123', status: 'CONFIRMED' },
      })
      const service = createService(fetch)

      const result = await service.payWithCreditCard('pay_123', {
        creditCard: {
          holderName: 'John Doe',
          number: '5162306219378829',
          expiryMonth: '05',
          expiryYear: '2028',
          ccv: '318',
        },
        creditCardHolderInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          cpfCnpj: '24971563792',
          postalCode: '89223-005',
          addressNumber: '277',
          phone: '4738010919',
        },
        remoteIp: '192.168.1.1',
      })

      expect(result.id).toBe('pay_123')
      expect(result.status).toBe('CONFIRMED')

      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/payments/pay_123/payWithCreditCard')
      expect(init.method).toBe('POST')
      expect(JSON.parse(init.body as string)).toMatchObject({
        creditCard: {
          holderName: 'John Doe',
          number: '5162306219378829',
          expiryMonth: '05',
          expiryYear: '2028',
          ccv: '318',
        },
        remoteIp: '192.168.1.1',
      })
    })
  })

  describe('tokenize', () => {
    it('sends POST /creditCard/tokenizeCreditCard with customer + card + holder info', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: {
          creditCardNumber: '5162********8829',
          creditCardBrand: 'MASTERCARD',
          creditCardToken: 'tok_abc123',
        },
      })
      const service = createService(fetch)

      const result = await service.tokenize({
        customer: 'cus_123',
        creditCard: {
          holderName: 'John Doe',
          number: '5162306219378829',
          expiryMonth: '05',
          expiryYear: '2028',
          ccv: '318',
        },
        creditCardHolderInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          cpfCnpj: '24971563792',
          postalCode: '89223-005',
          addressNumber: '277',
        },
        remoteIp: '192.168.1.1',
      })

      expect(result.creditCardToken).toBe('tok_abc123')
      expect(result.creditCardBrand).toBe('MASTERCARD')

      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/creditCard/tokenizeCreditCard')
      expect(init.method).toBe('POST')
      expect(JSON.parse(init.body as string)).toMatchObject({
        customer: 'cus_123',
        creditCard: {
          holderName: 'John Doe',
          number: '5162306219378829',
        },
        remoteIp: '192.168.1.1',
      })
    })
  })

  describe('captureAuthorizedPayment', () => {
    it('sends POST /payments/{id}/captureAuthorizedPayment with no body', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: { id: 'pay_123', status: 'CONFIRMED' },
      })
      const service = createService(fetch)

      const result = await service.captureAuthorizedPayment('pay_123')

      expect(result.id).toBe('pay_123')
      expect(result.status).toBe('CONFIRMED')

      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain(
        '/payments/pay_123/captureAuthorizedPayment',
      )
      expect(init.method).toBe('POST')
    })
  })

  describe('getPreAuthorizationConfig', () => {
    it('sends GET /creditCard/preAuthorization', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: { enabled: true, maxDays: 3 },
      })
      const service = createService(fetch)

      const result = await service.getPreAuthorizationConfig()

      expect(result.enabled).toBe(true)
      expect(result.maxDays).toBe(3)

      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/creditCard/preAuthorization')
      expect(init.method).toBe('GET')
    })
  })

  describe('updatePreAuthorizationConfig', () => {
    it('sends POST /creditCard/preAuthorization with body', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: { enabled: false },
      })
      const service = createService(fetch)

      const result = await service.updatePreAuthorizationConfig({
        enabled: false,
      })

      expect(result.enabled).toBe(false)

      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/creditCard/preAuthorization')
      expect(init.method).toBe('POST')
      expect(JSON.parse(init.body as string)).toEqual({ enabled: false })
    })
  })
})
