export interface AsaasErrorIssue {
  code?: string
  description?: string
}

export class AsaasError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'AsaasError'
  }
}

export class AsaasApiError extends AsaasError {
  readonly status: number
  readonly body: unknown
  readonly issues: AsaasErrorIssue[]

  constructor(params: {
    status: number
    body?: unknown
    issues?: AsaasErrorIssue[]
  }) {
    const detail = params.issues
      ?.map((i) => i.description?.trim())
      .filter((d): d is string => Boolean(d))
      .join('; ')

    super(detail || `HTTP ${params.status}`)
    this.name = 'AsaasApiError'
    this.status = params.status
    this.body = params.body ?? null
    this.issues = params.issues ?? []
  }

  get isAuth(): boolean {
    return this.status === 401 || this.status === 403
  }

  get isRateLimit(): boolean {
    return this.status === 429
  }

  get isServer(): boolean {
    return this.status >= 500
  }

  get isRetryable(): boolean {
    return this.isRateLimit || this.isServer
  }
}

export class AsaasTimeoutError extends AsaasError {
  readonly timeoutMs: number

  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`)
    this.name = 'AsaasTimeoutError'
    this.timeoutMs = timeoutMs
  }
}

export class AsaasConnectionError extends AsaasError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'AsaasConnectionError'
  }
}
