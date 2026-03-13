import { describe, expect, it } from 'vitest'

import { createMockFetch, createTestOptions } from '../../core/test-helpers.js'
import { PixAutomaticService } from './automatic.js'
import { PixKeysService } from './keys.js'
import type { PixQrCode } from './qr-codes.js'
import { PixQrCodesService, PixStaticQrCodesService } from './qr-codes.js'
import { PixRecurringService } from './recurring.js'
import { PixService } from './service.js'
import { PixTransactionsService } from './transactions.js'

function createService(fetch: typeof globalThis.fetch) {
  return new PixService(createTestOptions({ fetch }))
}

describe('PixService', () => {
  it('sends GET /payments/{id}/pixQrCode', async () => {
    const mockResponse: PixQrCode = {
      encodedImage: 'base64...',
      payload: 'pix-payload',
      expirationDate: '2026-04-01',
    }
    const { fetch, spy } = createMockFetch({ status: 200, body: mockResponse })
    const service = createService(fetch)

    const result = await service.getPaymentQrCode('pay_1')

    expect(result).toEqual(mockResponse)
    const [url, init] = spy.mock.calls[0]
    expect(url.toString()).toContain('/payments/pay_1/pixQrCode')
    expect(init.method).toBe('GET')
  })

  it('lazily instantiates keys sub-service', () => {
    const { fetch } = createMockFetch()
    const service = createService(fetch)
    expect(service.keys).toBeInstanceOf(PixKeysService)
    expect(service.keys).toBe(service.keys)
  })

  it('lazily instantiates staticQrCodes sub-service', () => {
    const { fetch } = createMockFetch()
    const service = createService(fetch)
    expect(service.staticQrCodes).toBeInstanceOf(PixStaticQrCodesService)
    expect(service.staticQrCodes).toBe(service.staticQrCodes)
  })

  it('lazily instantiates qrCodes sub-service', () => {
    const { fetch } = createMockFetch()
    const service = createService(fetch)
    expect(service.qrCodes).toBeInstanceOf(PixQrCodesService)
    expect(service.qrCodes).toBe(service.qrCodes)
  })

  it('lazily instantiates transactions sub-service', () => {
    const { fetch } = createMockFetch()
    const service = createService(fetch)
    expect(service.transactions).toBeInstanceOf(PixTransactionsService)
    expect(service.transactions).toBe(service.transactions)
  })

  it('lazily instantiates automatic sub-service', () => {
    const { fetch } = createMockFetch()
    const service = createService(fetch)
    expect(service.automatic).toBeInstanceOf(PixAutomaticService)
    expect(service.automatic).toBe(service.automatic)
  })

  it('lazily instantiates recurring sub-service', () => {
    const { fetch } = createMockFetch()
    const service = createService(fetch)
    expect(service.recurring).toBeInstanceOf(PixRecurringService)
    expect(service.recurring).toBe(service.recurring)
  })
})
