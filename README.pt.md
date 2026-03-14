# @rodrigogs/asaas-sdk

[![CI](https://github.com/rodrigogs/asaas-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/rodrigogs/asaas-sdk/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/%40rodrigogs%2Fasaas-sdk)](https://www.npmjs.com/package/@rodrigogs/asaas-sdk)
[![npm downloads](https://img.shields.io/npm/dm/%40rodrigogs%2Fasaas-sdk)](https://www.npmjs.com/package/@rodrigogs/asaas-sdk)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](./LICENSE)
[![Coverage](https://img.shields.io/badge/coverage-100%25-2ea44f)](./vitest.config.ts)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-339933)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)](https://www.typescriptlang.org/)
[![ESM only](https://img.shields.io/badge/module-ESM-1f6feb)](https://nodejs.org/api/esm.html)
[![Zero runtime deps](https://img.shields.io/badge/dependencies-zero_runtime-2ea44f)](./package.json)

SDK TypeScript para a API da plataforma de pagamentos Asaas.

[English version](./README.md)

## Funcionalidades

- Zero dependências de runtime
- Suporte completo a TypeScript com tipagem forte
- ESM-only, compatível com projetos modernos
- Paginação automática com `AsyncIterable`
- Tratamento robusto de erros com classes especializadas
- Ambientes SANDBOX e PRODUCTION
- Timeout configurável (padrão: 30 segundos)
- Lazy-loading de serviços para melhor performance
- Suporte nativo a Node.js >= 20 (fetch, AbortSignal, FormData)

## Instalação

Pacote no npm: [`@rodrigogs/asaas-sdk`](https://www.npmjs.com/package/@rodrigogs/asaas-sdk)

```bash
npm install @rodrigogs/asaas-sdk
```

```bash
yarn add @rodrigogs/asaas-sdk
```

```bash
pnpm add @rodrigogs/asaas-sdk
```

## Início Rápido

```typescript
import { AsaasClient } from '@rodrigogs/asaas-sdk'

// Criar cliente (ambiente SANDBOX para testes)
const client = new AsaasClient({
  accessToken: 'seu_access_token_aqui',
  environment: 'SANDBOX',
})

// Criar um cliente
const customer = await client.customers.create({
  name: 'João Silva',
  cpfCnpj: '12345678901',
  email: 'joao.silva@example.com',
  phone: '11987654321',
})

// Criar uma cobrança
const payment = await client.payments.create({
  customer: customer.id,
  billingType: 'BOLETO',
  value: 150.00,
  dueDate: '2026-03-20',
  description: 'Serviço de manutenção',
})

console.log('Cobrança criada:', payment.id)
console.log('Link do boleto:', payment.bankSlipUrl)
```

## Configuração

### Opções do Cliente

```typescript
const client = new AsaasClient({
  // Obrigatório: Token de acesso da API
  accessToken: process.env.ASAAS_ACCESS_TOKEN,

  // Opcional: Ambiente (padrão: 'PRODUCTION')
  environment: 'SANDBOX', // ou 'PRODUCTION'

  // Opcional: URL base customizada
  baseUrl: 'https://api-sandbox.asaas.com/v3',

  // Opcional: Timeout em milissegundos (padrão: 30000)
  timeout: 60000,

  // Opcional: Implementação customizada de fetch
  fetch: customFetch,

  // Opcional: User-Agent customizado
  userAgent: 'MeuApp/1.0',
})
```

### Variáveis de Ambiente

```bash
# .env
ASAAS_ACCESS_TOKEN=seu_token_aqui
ASAAS_ENVIRONMENT=SANDBOX
```

```typescript
const client = new AsaasClient({
  accessToken: process.env.ASAAS_ACCESS_TOKEN!,
  environment: process.env.ASAAS_ENVIRONMENT as 'SANDBOX' | 'PRODUCTION',
})
```

## Visão Geral dos Serviços

| Serviço | Descrição | Exemplo |
|---------|-----------|---------|
| `customers` | Gerenciamento de clientes (CRUD, restauração, notificações) | `client.customers.create(...)` |
| `payments` | Criação de cobranças, consultas, estornos, confirmações | `client.payments.create(...)` |
| `cards` | Tokenização e pagamento com cartão de crédito | `client.cards.tokenize(...)` |
| `installments` | Parcelamentos e carnês | `client.installments.create(...)` |
| `chargebacks` | Listagem e disputa de chargebacks | `client.chargebacks.list()` |
| `paymentDocuments` | Upload e gerenciamento de documentos de cobrança | `client.paymentDocuments.upload(...)` |
| `pix` | Serviços Pix (chaves, QR codes, transações) | `client.pix.qrCodes.create(...)` |
| `subscriptions` | Assinaturas recorrentes | `client.subscriptions.create(...)` |
| `transfers` | Transferências bancárias e para contas Asaas | `client.transfers.create(...)` |
| `subaccounts` | Gerenciamento de subcontas | `client.subaccounts.create(...)` |
| `myAccount` | Informações e webhooks da conta atual | `client.myAccount.getCommercialInfo()` |
| `notifications` | Notificações de clientes | `client.notifications.list(...)` |
| `paymentLinks` | Links de pagamento | `client.paymentLinks.create(...)` |
| `checkouts` | Checkouts personalizados | `client.checkouts.create(...)` |
| `checkoutConfig` | Configuração de checkout | `client.checkoutConfig.update(...)` |
| `splits` | Consultas de split de pagamento | `client.splits.listReceived()` |
| `anticipations` | Solicitação e simulação de antecipações | `client.anticipations.create(...)` |
| `anticipationConfig` | Configuração de antecipação automática | `client.anticipationConfig.update(...)` |
| `bill` | Pagamento de contas | `client.bill.create(...)` |
| `escrow` | Configuração de conta escrow | `client.escrow.getConfig()` |
| `fiscalInfo` | Informações fiscais e tributárias | `client.fiscalInfo.getMunicipalServices()` |
| `invoices` | Emissão de notas fiscais | `client.invoices.schedule(...)` |

## Tratamento de Erros

```typescript
import { AsaasApiError, AsaasTimeoutError, AsaasConnectionError } from '@rodrigogs/asaas-sdk'

try {
  const payment = await client.payments.create({
    customer: 'cus_000000000000',
    billingType: 'PIX',
    value: 100.00,
    dueDate: '2026-03-20',
  })
} catch (error) {
  if (error instanceof AsaasApiError) {
    console.error('Erro da API:', error.message)
    console.error('Status:', error.status)
    console.error('Detalhes:', error.issues)

    // Verificações de tipo específicas
    if (error.isAuth) {
      console.error('Erro de autenticação - verifique seu token')
    } else if (error.isRateLimit) {
      console.error('Limite de taxa excedido - aguarde antes de tentar novamente')
    } else if (error.isRetryable) {
      console.error('Erro recuperável - considere tentar novamente')
    }
  } else if (error instanceof AsaasTimeoutError) {
    console.error(`Timeout após ${error.timeoutMs}ms`)
  } else if (error instanceof AsaasConnectionError) {
    console.error('Erro de conexão:', error.message)
  }
}
```

## Paginação

Todos os métodos `.list()` retornam um `PaginatedList<T>` que é iterável e suporta auto-paginação.

### Iteração Automática

```typescript
// Iterar sobre todas as páginas automaticamente
const customers = await client.customers.list({ limit: 100 })
for await (const customer of customers) {
  console.log(customer.name, customer.email)
}
```

### Conversão para Array

```typescript
// Buscar até 500 registros e converter para array
const result = await client.customers.list()
const allCustomers = await result.toArray({ limit: 500 })

console.log(`Total de clientes: ${allCustomers.length}`)
```

### Acesso Manual

```typescript
const result = await client.customers.list({ limit: 10, offset: 0 })

console.log('Registros:', result.data)
console.log('Tem mais?', result.hasMore)
console.log('Total:', result.totalCount)
```

## Verificação de Webhooks

Para autenticação de webhooks, exemplos por framework e detalhes de configuração,
veja o [guia de Webhooks](./docs/pt/webhooks.md).

## Exemplos Adicionais

### Criar Cobrança Pix

```typescript
const pixPayment = await client.payments.create({
  customer: 'cus_000000000000',
  billingType: 'PIX',
  value: 250.50,
  dueDate: '2026-03-15',
  description: 'Pagamento via Pix',
})

console.log('QR Code:', pixPayment.pixTransaction?.qrCode)
console.log('Copia e Cola:', pixPayment.pixTransaction?.payload)
```

### Criar Assinatura Recorrente

```typescript
const subscription = await client.subscriptions.create({
  customer: 'cus_000000000000',
  billingType: 'CREDIT_CARD',
  value: 99.90,
  nextDueDate: '2026-04-01',
  cycle: 'MONTHLY',
  description: 'Assinatura Premium',
})

console.log('Assinatura criada:', subscription.id)
console.log('Status:', subscription.status)
```

### Tokenizar e Pagar com Cartão

```typescript
// 1. Tokenizar cartão
const token = await client.cards.tokenize({
  customer: 'cus_000000000000',
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
    phone: '11987654321',
  },
})

// 2. Criar cobrança com token
const payment = await client.payments.create({
  customer: 'cus_000000000000',
  billingType: 'CREDIT_CARD',
  value: 150.00,
  dueDate: '2026-03-20',
  creditCard: {
    creditCardToken: token.creditCardToken,
  },
  creditCardHolderInfo: token.creditCardHolderInfo,
})
```

### Transferência para Conta Bancária

```typescript
const transfer = await client.transfers.create({
  value: 500.00,
  bankAccount: {
    bank: {
      code: '341', // Itaú
    },
    accountName: 'Maria Santos',
    ownerName: 'Maria Santos',
    cpfCnpj: '98765432100',
    agency: '1234',
    account: '56789',
    accountDigit: '0',
  },
})

console.log('Transferência criada:', transfer.id)
console.log('Status:', transfer.status)
```

## Documentação

### Guias
- [Início Rápido](./docs/pt/getting-started.md)
- [Tratamento de Erros](./docs/pt/error-handling.md)
- [Paginação](./docs/pt/pagination.md)
- [Webhooks](./docs/pt/webhooks.md)
- [Limites de Requisições](./docs/pt/rate-limits.md)
- [Sandbox](./docs/pt/sandbox.md)
- [Segurança](./docs/pt/security.md)

### Serviços
- [Cobranças, Cartões, Parcelamentos & Chargebacks](./docs/pt/services/payments.md)
- [Pix](./docs/pt/services/pix.md)
- [Assinaturas](./docs/pt/services/subscriptions.md)
- [Transferências, Pague Contas, Escrow, Splits & Antecipações](./docs/pt/services/financial.md)
- [Clientes, Subcontas & Notificações](./docs/pt/services/accounts.md)
- [Links de Pagamento, Checkouts & Notas Fiscais](./docs/pt/services/commerce.md)

- [Documentação Oficial da API Asaas](https://docs.asaas.com/)

## Requisitos

- Node.js >= 18.0.0
- TypeScript >= 5.0 (recomendado para projetos TypeScript)

O SDK utiliza APIs nativas do Node.js 18+:
- `fetch` global
- `AbortSignal.timeout()`
- `FormData` e `Blob` nativos

## Contribuindo

Contribuições são bem-vindas! Por favor, abra uma issue ou pull request no repositório.

## Licença

[Apache License 2.0](./LICENSE)

---

Desenvolvido com TypeScript para a comunidade brasileira de desenvolvedores.
