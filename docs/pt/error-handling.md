# Tratamento de Erros

O asaas-sdk fornece uma hierarquia estruturada de erros para facilitar o tratamento de diferentes cenários de falha ao interagir com a API do Asaas.

## Hierarquia de Erros

```
AsaasError (base)
├── AsaasApiError      (erros HTTP da API)
├── AsaasTimeoutError  (timeout de requisição)
└── AsaasConnectionError (falhas de rede)
```

Todos os erros estendem a classe nativa `Error` e são exportados pelo pacote principal:

```typescript
import { AsaasApiError, AsaasTimeoutError, AsaasConnectionError } from 'asaas-sdk'
```

## AsaasApiError

O tipo de erro mais comum. Lançado quando a API do Asaas retorna uma resposta HTTP de erro (status 4xx ou 5xx).

### Propriedades

- `status` (number) — Código de status HTTP
- `body` (unknown) — Corpo bruto da resposta da API
- `issues` (AsaasErrorIssue[]) — Array de detalhes do erro
  - Cada issue possui campos opcionais `code` e `description`
- `message` (string) — Descrições unidas dos issues, ou "HTTP {status}" como fallback

### Getters de Conveniência

- `isAuth` — `true` quando o status é 401 ou 403
- `isRateLimit` — `true` quando o status é 429
- `isServer` — `true` quando o status é >= 500
- `isRetryable` — `true` quando `isRateLimit` ou `isServer`

### Exemplos

#### Try/Catch Básico

```typescript
import { AsaasClient, AsaasApiError } from 'asaas-sdk'

const client = new AsaasClient({ accessToken: process.env.ASAAS_ACCESS_TOKEN! })

try {
  const customer = await client.customers.create({
    name: 'João Silva',
    cpfCnpj: '12345678901',
  })
} catch (error) {
  if (error instanceof AsaasApiError) {
    console.error(`Erro da API (${error.status}):`, error.message)
  } else {
    console.error('Erro inesperado:', error)
  }
}
```

#### Verificando o Tipo de Erro

```typescript
try {
  const payment = await client.payments.create({
    customer: 'cus_000000000000',
    billingType: 'BOLETO',
    value: 100.00,
    dueDate: '2026-03-20',
  })
} catch (error) {
  if (error instanceof AsaasApiError) {
    if (error.isAuth) {
      console.error('Autenticação falhou. Verifique sua chave de API.')
    } else if (error.isRateLimit) {
      console.error('Limite de requisições excedido. Aguarde antes de tentar novamente.')
    } else if (error.isServer) {
      console.error('Erro no servidor do Asaas. Tente novamente mais tarde.')
    } else {
      console.error('Erro do cliente:', error.message)
    }
  }
}
```

#### Usando Getters para Lógica de Retry

```typescript
async function createPaymentWithRetry(paymentData: any, maxRetries = 3) {
  let attempt = 0

  while (attempt < maxRetries) {
    try {
      return await client.payments.create(paymentData)
    } catch (error) {
      if (error instanceof AsaasApiError && error.isRetryable) {
        attempt++
        if (attempt >= maxRetries) {
          throw error
        }

        const delay = Math.pow(2, attempt) * 1000 // Backoff exponencial
        console.log(`Retentando em ${delay}ms (tentativa ${attempt}/${maxRetries})...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        throw error // Não retentável, falhar imediatamente
      }
    }
  }
}
```

#### Acessando Issues de Validação

Ao criar ou atualizar recursos, a API pode retornar múltiplos erros de validação no array `issues`:

```typescript
try {
  const customer = await client.customers.create({
    name: 'João Silva',
    cpfCnpj: '111.111.111-11', // CPF inválido
    email: 'invalid-email', // Formato de email inválido
  })
} catch (error) {
  if (error instanceof AsaasApiError) {
    console.error(`Validação falhou (${error.status}):`)

    error.issues.forEach((issue, index) => {
      console.error(`  ${index + 1}. [${issue.code || 'N/A'}] ${issue.description}`)
    })

    // Exemplo de saída:
    // Validação falhou (400):
    //   1. [invalid_cpf_cnpj] CPF/CNPJ inválido
    //   2. [invalid_email] Email inválido
  }
}
```

## AsaasTimeoutError

Lançado quando uma requisição excede o timeout configurado. O timeout padrão é 30 segundos, mas o Asaas recomenda 60 segundos para operações com cartão de crédito.

### Propriedades

- `timeoutMs` (number) — O valor do timeout que foi excedido

### Exemplo

```typescript
import { AsaasClient, AsaasTimeoutError } from 'asaas-sdk'

// Configurar timeout maior para operações com cartão
const client = new AsaasClient({
  accessToken: process.env.ASAAS_ACCESS_TOKEN!,
  timeout: 60000, // 60 segundos
})

try {
  const payment = await client.payments.create({
    customer: 'cus_000000000000',
    billingType: 'CREDIT_CARD',
    value: 100.00,
    creditCard: {
      holderName: 'João Silva',
      number: '5162306219378829',
      expiryMonth: '12',
      expiryYear: '2028',
      ccv: '123',
    },
    creditCardHolderInfo: {
      name: 'João Silva',
      cpfCnpj: '12345678901',
      postalCode: '01310-100',
      addressNumber: '123',
      phone: '11999999999',
    },
  })
} catch (error) {
  if (error instanceof AsaasTimeoutError) {
    console.error(`Requisição excedeu o timeout de ${error.timeoutMs}ms`)
    console.error('Considere aumentar o timeout para operações com cartão de crédito')
  }
}
```

## AsaasConnectionError

Lançado quando a requisição falha por problemas de rede como falha na resolução DNS, conexão recusada ou outros erros de transporte. O erro original está disponível na propriedade `cause`.

### Exemplo

```typescript
import { AsaasClient, AsaasConnectionError } from 'asaas-sdk'

const client = new AsaasClient({ accessToken: process.env.ASAAS_ACCESS_TOKEN! })

try {
  const customers = await client.customers.list()
} catch (error) {
  if (error instanceof AsaasConnectionError) {
    console.error('Falha na conexão de rede:', error.message)

    // Acessar o erro original para mais detalhes
    if (error.cause) {
      console.error('Causa:', error.cause)
    }

    // Possíveis causas:
    // - Sem conexão com a internet
    // - Falha na resolução DNS
    // - Firewall bloqueando a requisição
    // - API do Asaas inacessível
  }
}
```

## Erros de Rate Limit

Quando você excede os limites de requisições do Asaas, a API retorna HTTP 429. O SDK expõe isso pelo getter `isRateLimit`:

```typescript
try {
  const payment = await client.payments.create({ /* ... */ })
} catch (error) {
  if (error instanceof AsaasApiError && error.isRateLimit) {
    console.error('Limite de requisições excedido, aguarde antes de retentar')
  }
}
```

Alguns endpoints incluem headers de rate limit na resposta. Quando disponíveis, use-os para implementar throttling proativo:

- `RateLimit-Limit` — Máximo de requisições permitidas na janela
- `RateLimit-Remaining` — Requisições restantes antes do limite
- `RateLimit-Reset` — Segundos até o reset da janela

Para um helper completo de retry com backoff exponencial, consulte o guia de [Limites de Requisições](./rate-limits.md).

## Diferenciando Erros 403

Um status 403 pode significar duas coisas diferentes:

1. **Bloqueio por IP Whitelist** — Sua requisição veio de um IP que não está na lista permitida. Configure a whitelist de IPs no painel do Asaas.
2. **Permissão negada** — Sua chave de API não tem a permissão necessária para o endpoint.

Ambos retornam 403, mas o array `issues` pode conter descrições de erro diferentes. Verifique os detalhes:

```typescript
if (error instanceof AsaasApiError && error.status === 403) {
  const message = error.issues[0]?.description ?? error.message
  console.error('Acesso negado:', message)
  // Verificar se é bloqueio de IP whitelist ou permissão
}
```

Consulte o guia de [Segurança](./security.md) para detalhes sobre whitelist de IPs.

## Padrão de Retry

O SDK não inclui lógica de retry embutida. Para um helper completo `withRetry` com backoff exponencial, consulte o guia de [Limites de Requisições](./rate-limits.md#retry-pattern).

## Boas Práticas

1. **Sempre trate AsaasApiError** — É o tipo de erro mais comum e contém informações detalhadas.

2. **Verifique o array `issues` para erros de validação** — A API pode retornar múltiplos problemas de validação. Inspecione-os individualmente.

3. **Use `isRetryable` para decisões automáticas de retry** — O getter identifica erros que são transitórios e podem ser retentados.

4. **Defina timeouts apropriados para operações com cartão** — O Asaas recomenda 60 segundos para transações com cartão de crédito.

5. **Logue o `body` completo para debug** — O corpo bruto da resposta pode conter contexto adicional.

6. **Trate erros de autenticação** — Use `error.isAuth` para detectar chaves de API inválidas.

7. **Respeite os rate limits** — Ao encontrar erros 429, implemente backoff exponencial e considere cache.

8. **Monitore erros de servidor** — Se encontrar erros 500+ frequentes, verifique a [página de status do Asaas](https://status.asaas.com).

### Exemplo: Handler Completo de Erros

```typescript
import { AsaasApiError, AsaasTimeoutError, AsaasConnectionError } from 'asaas-sdk'

async function handleAsaasOperation<T>(
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (error instanceof AsaasApiError) {
      // Logar detalhes completos para debug
      console.error('Erro da API Asaas:', {
        status: error.status,
        message: error.message,
        issues: error.issues,
        body: error.body,
      })

      // Tratar casos específicos
      if (error.isAuth) {
        throw new Error('Chave de API inválida. Verifique suas credenciais.')
      }

      if (error.isRateLimit) {
        throw new Error('Limite de requisições excedido. Tente novamente mais tarde.')
      }

      if (error.isServer) {
        throw new Error('Serviço do Asaas temporariamente indisponível. Retente.')
      }

      // Erros do cliente (4xx) — mostrar mensagens de validação
      if (error.issues.length > 0) {
        const messages = error.issues
          .map(issue => issue.description)
          .join('; ')
        throw new Error(`Validação falhou: ${messages}`)
      }

      throw new Error(`Erro da API: ${error.message}`)
    } else if (error instanceof AsaasTimeoutError) {
      console.error(`Requisição excedeu o timeout de ${error.timeoutMs}ms`)
      throw new Error('Requisição demorou demais. Tente novamente.')
    } else if (error instanceof AsaasConnectionError) {
      console.error('Erro de conexão:', error.message, error.cause)
      throw new Error('Falha na conexão de rede. Verifique sua internet.')
    } else {
      // Erro inesperado
      console.error('Erro inesperado:', error)
      throw error
    }
  }
}

// Uso
const customer = await handleAsaasOperation(() =>
  client.customers.create({
    name: 'João Silva',
    cpfCnpj: '12345678901',
  })
)
```
