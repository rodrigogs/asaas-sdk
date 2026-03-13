import { describe, expect, it } from 'vitest'

import { createMockFetch, createTestOptions } from '../../core/test-helpers.js'
import type {
  PixQrCodeDecodeParams,
  PixQrCodeDecodeResult,
  PixQrCodePayParams,
  PixStaticQrCode,
  PixStaticQrCodeCreateParams,
  PixStaticQrCodeRemoveResult,
} from './qr-codes.js'
import { PixQrCodesService, PixStaticQrCodesService } from './qr-codes.js'

function createStaticService(fetch: typeof globalThis.fetch) {
  return new PixStaticQrCodesService(createTestOptions({ fetch }))
}

function createQrService(fetch: typeof globalThis.fetch) {
  return new PixQrCodesService(createTestOptions({ fetch }))
}

describe('PixStaticQrCodesService', () => {
  it('sends POST /pix/qrCodes/static', async () => {
    const params: PixStaticQrCodeCreateParams = {
      addressKey: 'abc-def-123',
      description: 'Test QR',
      value: 50.0,
    }
    const mockResponse: PixStaticQrCode = {
      id: 'sqr_1',
      encodedImage: 'base64...',
      payload: 'pix-payload',
      allowsMultiplePayments: true,
    }
    const { fetch, spy } = createMockFetch({ status: 200, body: mockResponse })
    const service = createStaticService(fetch)

    const result = await service.create(params)

    expect(result).toEqual(mockResponse)
    const [url, init] = spy.mock.calls[0]
    expect(url.toString()).toContain('/pix/qrCodes/static')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual(params)
  })

  it('sends DELETE /pix/qrCodes/static/{id}', async () => {
    const mockResponse: PixStaticQrCodeRemoveResult = {
      id: 'sqr_1',
      deleted: true,
    }
    const { fetch, spy } = createMockFetch({ status: 200, body: mockResponse })
    const service = createStaticService(fetch)

    const result = await service.remove('sqr_1')

    expect(result).toEqual(mockResponse)
    const [url, init] = spy.mock.calls[0]
    expect(url.toString()).toContain('/pix/qrCodes/static/sqr_1')
    expect(init.method).toBe('DELETE')
  })
})

describe('PixQrCodesService', () => {
  it('sends POST /pix/qrCodes/decode', async () => {
    const params: PixQrCodeDecodeParams = {
      payload: 'pix-payload-string',
    }
    const mockResponse: PixQrCodeDecodeResult = {
      payload: 'pix-payload-string',
      type: 'STATIC',
      value: 50.0,
      canBePaid: true,
    }
    const { fetch, spy } = createMockFetch({ status: 200, body: mockResponse })
    const service = createQrService(fetch)

    const result = await service.decode(params)

    expect(result).toEqual(mockResponse)
    const [url, init] = spy.mock.calls[0]
    expect(url.toString()).toContain('/pix/qrCodes/decode')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual(params)
  })

  it('sends POST /pix/qrCodes/pay', async () => {
    const params: PixQrCodePayParams = {
      qrCode: 'pix-payload-string',
      value: 50.0,
      description: 'Test payment',
    }
    const mockResponse = {
      id: 'txn_1',
      value: 50.0,
      status: 'REQUESTED',
      type: 'DEBIT',
    }
    const { fetch, spy } = createMockFetch({ status: 200, body: mockResponse })
    const service = createQrService(fetch)

    const result = await service.pay(params)

    expect(result).toEqual(mockResponse)
    const [url, init] = spy.mock.calls[0]
    expect(url.toString()).toContain('/pix/qrCodes/pay')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual(params)
  })
})
