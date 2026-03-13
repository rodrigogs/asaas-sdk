import { describe, expect, it } from 'vitest'

import { PaginatedList } from '../../core/pagination.js'
import { createMockFetch, createTestOptions } from '../../core/test-helpers.js'
import type {
  PixAutomaticAuthorization,
  PixAutomaticAuthorizationCreateParams,
  PixAutomaticPaymentInstruction,
} from './automatic.js'
import {
  PixAutomaticAuthorizationsService,
  PixAutomaticPaymentInstructionsService,
  PixAutomaticService,
} from './automatic.js'

function createAutomaticService(fetch: typeof globalThis.fetch) {
  return new PixAutomaticService(createTestOptions({ fetch }))
}

function createAuthService(fetch: typeof globalThis.fetch) {
  return new PixAutomaticAuthorizationsService(createTestOptions({ fetch }))
}

function createInstructionsService(fetch: typeof globalThis.fetch) {
  return new PixAutomaticPaymentInstructionsService(
    createTestOptions({ fetch }),
  )
}

describe('PixAutomaticAuthorizationsService', () => {
  it('sends POST /pix/automatic/authorizations', async () => {
    const params: PixAutomaticAuthorizationCreateParams = {
      frequency: 'MONTHLY',
      contractId: 'contract_1',
      startDate: '2026-04-01',
      customerId: 'cus_123',
      immediateQrCode: true,
    }
    const mockResponse: PixAutomaticAuthorization = {
      id: 'auth_1',
      frequency: 'MONTHLY',
      contractId: 'contract_1',
      status: 'AWAITING_AUTHORIZATION',
    }
    const { fetch, spy } = createMockFetch({ status: 200, body: mockResponse })
    const service = createAuthService(fetch)

    const result = await service.create(params)

    expect(result).toEqual(mockResponse)
    const [url, init] = spy.mock.calls[0]
    expect(url.toString()).toContain('/pix/automatic/authorizations')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual(params)
  })

  it('sends GET /pix/automatic/authorizations with pagination', async () => {
    const { fetch, spy } = createMockFetch({
      status: 200,
      body: {
        object: 'list',
        hasMore: false,
        totalCount: 1,
        offset: 0,
        limit: 10,
        data: [{ id: 'auth_1', frequency: 'MONTHLY', status: 'ACTIVE' }],
      },
    })
    const service = createAuthService(fetch)

    const result = await service.list({ limit: 10 })

    expect(result).toBeInstanceOf(PaginatedList)
    expect(result.data).toHaveLength(1)
    expect(result.data[0]!.id).toBe('auth_1')
    const url = spy.mock.calls[0][0].toString()
    expect(url).toContain('/pix/automatic/authorizations')
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
    const service = createAuthService(fetch)

    await service.list()

    const url = spy.mock.calls[0][0].toString()
    expect(url).toContain('offset=0')
    expect(url).toContain('limit=20')
  })

  it('sends GET /pix/automatic/authorizations/{id}', async () => {
    const mockResponse: PixAutomaticAuthorization = {
      id: 'auth_1',
      frequency: 'MONTHLY',
      status: 'ACTIVE',
    }
    const { fetch, spy } = createMockFetch({ status: 200, body: mockResponse })
    const service = createAuthService(fetch)

    const result = await service.get('auth_1')

    expect(result).toEqual(mockResponse)
    const [url, init] = spy.mock.calls[0]
    expect(url.toString()).toContain('/pix/automatic/authorizations/auth_1')
    expect(init.method).toBe('GET')
  })

  it('sends DELETE /pix/automatic/authorizations/{id}', async () => {
    const mockResponse: PixAutomaticAuthorization = {
      id: 'auth_1',
      status: 'CANCELLED',
    }
    const { fetch, spy } = createMockFetch({ status: 200, body: mockResponse })
    const service = createAuthService(fetch)

    const result = await service.cancel('auth_1')

    expect(result).toEqual(mockResponse)
    const [url, init] = spy.mock.calls[0]
    expect(url.toString()).toContain('/pix/automatic/authorizations/auth_1')
    expect(init.method).toBe('DELETE')
  })
})

describe('PixAutomaticPaymentInstructionsService', () => {
  it('sends GET /pix/automatic/paymentInstructions with filters', async () => {
    const { fetch, spy } = createMockFetch({
      status: 200,
      body: {
        object: 'list',
        hasMore: false,
        totalCount: 1,
        offset: 0,
        limit: 10,
        data: [{ id: 'instr_1', dueDate: '2026-05-01', status: 'PENDING' }],
      },
    })
    const service = createInstructionsService(fetch)

    const result = await service.list({ authorizationId: 'auth_1', limit: 10 })

    expect(result).toBeInstanceOf(PaginatedList)
    expect(result.data).toHaveLength(1)
    expect(result.data[0]!.id).toBe('instr_1')
    const url = spy.mock.calls[0][0].toString()
    expect(url).toContain('/pix/automatic/paymentInstructions')
    expect(url).toContain('authorizationId=auth_1')
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
    const service = createInstructionsService(fetch)

    await service.list()

    const url = spy.mock.calls[0][0].toString()
    expect(url).toContain('offset=0')
    expect(url).toContain('limit=20')
  })

  it('sends GET /pix/automatic/paymentInstructions/{id}', async () => {
    const mockResponse: PixAutomaticPaymentInstruction = {
      id: 'instr_1',
      dueDate: '2026-05-01',
      status: 'DONE',
    }
    const { fetch, spy } = createMockFetch({ status: 200, body: mockResponse })
    const service = createInstructionsService(fetch)

    const result = await service.get('instr_1')

    expect(result).toEqual(mockResponse)
    const [url, init] = spy.mock.calls[0]
    expect(url.toString()).toContain(
      '/pix/automatic/paymentInstructions/instr_1',
    )
    expect(init.method).toBe('GET')
  })
})

describe('PixAutomaticService', () => {
  it('lazily instantiates authorizations sub-service', () => {
    const { fetch } = createMockFetch()
    const service = createAutomaticService(fetch)
    expect(service.authorizations).toBeInstanceOf(
      PixAutomaticAuthorizationsService,
    )
    expect(service.authorizations).toBe(service.authorizations)
  })

  it('lazily instantiates paymentInstructions sub-service', () => {
    const { fetch } = createMockFetch()
    const service = createAutomaticService(fetch)
    expect(service.paymentInstructions).toBeInstanceOf(
      PixAutomaticPaymentInstructionsService,
    )
    expect(service.paymentInstructions).toBe(service.paymentInstructions)
  })
})
