import type { AsaasEnvironment } from './types.js'

export const ASAAS_BASE_URLS: Record<AsaasEnvironment, string> = {
  SANDBOX: 'https://api-sandbox.asaas.com/v3',
  PRODUCTION: 'https://api.asaas.com/v3',
}

export const ASAAS_WEBHOOK_AUTH_HEADER = 'asaas-access-token'

export const ASAAS_DEFAULT_TIMEOUT = 30_000

export const ASAAS_DEFAULT_ENVIRONMENT: AsaasEnvironment = 'PRODUCTION'
