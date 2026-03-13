import { describe, expect, it } from 'vitest'

import * as asaas from './index.js'

describe('public API surface of @repo/asaas', () => {
  it('exports the AsaasClient class', () => {
    expect(asaas.AsaasClient).toBeDefined()
    expect(typeof asaas.AsaasClient).toBe('function')
  })

  it('exports the error hierarchy', () => {
    expect(asaas.AsaasError).toBeDefined()
    expect(asaas.AsaasApiError).toBeDefined()
    expect(asaas.AsaasTimeoutError).toBeDefined()
    expect(asaas.AsaasConnectionError).toBeDefined()
  })

  it('exports the webhook auth header constant', () => {
    expect(asaas.ASAAS_WEBHOOK_AUTH_HEADER).toBe('asaas-access-token')
  })

  it('does not export internal implementation details', () => {
    const exports = Object.keys(asaas)

    expect(exports).not.toContain('request')
    expect(exports).not.toContain('requestBinary')
    expect(exports).not.toContain('BaseService')
    expect(exports).not.toContain('normalizeOptions')
  })
})
