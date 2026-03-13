import { describe, expect, it } from 'vitest'

import { createMockFetch, createTestOptions } from '../../core/test-helpers.js'
import { CheckoutConfigService } from './config.js'
import { CheckoutsService } from './service.js'
import type { Checkout, CheckoutConfig } from './types.js'

function createService(fetch: typeof globalThis.fetch) {
  return new CheckoutsService(createTestOptions({ fetch }))
}

function createConfigService(fetch: typeof globalThis.fetch) {
  return new CheckoutConfigService(createTestOptions({ fetch }))
}

// --- CheckoutsService ---

describe('CheckoutsService', () => {
  describe('create', () => {
    it('sends POST /checkouts with items, callback, and billing/charge types', async () => {
      const mockResponse: Checkout = {
        id: 'chk_1',
        billingTypes: ['PIX', 'CREDIT_CARD'],
        chargeTypes: ['DETACHED'],
        callback: {
          successUrl: 'https://shop.com/ok',
          cancelUrl: 'https://shop.com/cancel',
        },
        items: [
          {
            imageBase64: 'base64data',
            name: 'Troca de óleo',
            quantity: 1,
            value: 150,
          },
        ],
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createService(fetch)

      const result = await service.create({
        billingTypes: ['PIX', 'CREDIT_CARD'],
        chargeTypes: ['DETACHED'],
        callback: {
          successUrl: 'https://shop.com/ok',
          cancelUrl: 'https://shop.com/cancel',
        },
        items: [
          {
            imageBase64: 'base64data',
            name: 'Troca de óleo',
            quantity: 1,
            value: 150,
          },
        ],
        minutesToExpire: 60,
      })

      expect(result.id).toBe('chk_1')
      expect(result.items).toHaveLength(1)
      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/checkouts')
      expect(init.method).toBe('POST')
      const body = JSON.parse(init.body as string)
      expect(body.billingTypes).toEqual(['PIX', 'CREDIT_CARD'])
      expect(body.chargeTypes).toEqual(['DETACHED'])
      expect(body.minutesToExpire).toBe(60)
      expect(body.items[0].name).toBe('Troca de óleo')
    })

    it('sends POST /checkouts with customerData and splits', async () => {
      const mockResponse: Checkout = { id: 'chk_2' }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createService(fetch)

      await service.create({
        billingTypes: ['PIX'],
        chargeTypes: ['DETACHED'],
        callback: { successUrl: 'https://shop.com/ok' },
        items: [
          {
            imageBase64: 'img',
            name: 'Item',
            quantity: 1,
            value: 100,
          },
        ],
        customerData: { name: 'João', cpfCnpj: '12345678900' },
        splits: [{ walletId: 'w_1', percentageValue: 10 }],
      })

      const body = JSON.parse(spy.mock.calls[0][1].body as string)
      expect(body.customerData.name).toBe('João')
      expect(body.splits[0].walletId).toBe('w_1')
    })
  })

  describe('cancel', () => {
    it('sends POST /checkouts/{id}/cancel', async () => {
      const { fetch, spy } = createMockFetch({ status: 200, body: {} })
      const service = createService(fetch)

      await service.cancel('chk_1')

      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/checkouts/chk_1/cancel')
      expect(init.method).toBe('POST')
    })
  })
})

// --- CheckoutConfigService ---

describe('CheckoutConfigService', () => {
  describe('get', () => {
    it('sends GET /myAccount/paymentCheckoutConfig/', async () => {
      const mockResponse: CheckoutConfig = {
        logoBackgroundColor: '#FFFFFF',
        infoBackgroundColor: '#000000',
        fontColor: '#333333',
        enabled: true,
        status: 'APPROVED',
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createConfigService(fetch)

      const result = await service.get()

      expect(result).toEqual(mockResponse)
      expect(result.status).toBe('APPROVED')
      expect(spy.mock.calls[0][0].toString()).toContain(
        '/myAccount/paymentCheckoutConfig/',
      )
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('save', () => {
    it('sends POST /myAccount/paymentCheckoutConfig/ with multipart form data', async () => {
      const mockResponse: CheckoutConfig = {
        logoBackgroundColor: '#FF0000',
        infoBackgroundColor: '#00FF00',
        fontColor: '#0000FF',
        enabled: true,
        status: 'AWAITING_APPROVAL',
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createConfigService(fetch)

      const result = await service.save({
        logoBackgroundColor: '#FF0000',
        infoBackgroundColor: '#00FF00',
        fontColor: '#0000FF',
        enabled: true,
      })

      expect(result.status).toBe('AWAITING_APPROVAL')
      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/myAccount/paymentCheckoutConfig/')
      expect(init.method).toBe('POST')
      expect(init.body).toBeInstanceOf(FormData)
    })

    it('includes logoFile in multipart when provided', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: {
          logoBackgroundColor: '#FFF',
          infoBackgroundColor: '#000',
          fontColor: '#333',
        },
      })
      const service = createConfigService(fetch)
      const logo = new Blob(['img'], { type: 'image/png' })

      await service.save({
        logoBackgroundColor: '#FFF',
        infoBackgroundColor: '#000',
        fontColor: '#333',
        logoFile: logo,
      })

      const formData = spy.mock.calls[0][1].body as FormData
      expect(formData.get('logoFile')).toBeInstanceOf(Blob)
    })
  })
})
