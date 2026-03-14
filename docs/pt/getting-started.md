# Primeiros Passos

Este guia apresenta os conceitos básicos para começar a usar o `@rodrigogs/asaas-sdk`, um SDK TypeScript completo para a API da plataforma de pagamentos Asaas.

## Pré-requisitos

Antes de começar, certifique-se de ter:

- **Node.js >= 18** - Necessário para `fetch` nativo, `AbortSignal.timeout`, `FormData` e `Blob`
- **Uma conta Asaas** - Ambiente sandbox ou produção
- **Uma chave de API** - Obtida no painel do Asaas em **Integrações > Chave de API**

## Instalação

Instale o pacote via npm:

```bash
npm install @rodrigogs/asaas-sdk
```

Ou usando outros gerenciadores de pacotes:

```bash
# Yarn
yarn add @rodrigogs/asaas-sdk

# pnpm
pnpm add @rodrigogs/asaas-sdk
```

## Criando o Cliente

A primeira etapa é instanciar o `AsaasClient` com sua chave de API:

```ts
import { AsaasClient } from '@rodrigogs/asaas-sdk'

const asaas = new AsaasClient({
  accessToken: process.env.ASAAS_API_KEY!,
  environment: 'SANDBOX', // ou 'PRODUCTION' (padrão)
})
```

O cliente agora está pronto para realizar requisições à API do Asaas.

## Opções de Configuração

O construtor do `AsaasClient` aceita as seguintes opções:

| Opção | Tipo | Obrigatório | Padrão | Descrição |
|-------|------|-------------|--------|-----------|
| `accessToken` | `string` | Sim | - | Sua chave de API do Asaas |
| `environment` | `'SANDBOX'` \| `'PRODUCTION'` | Não | `'PRODUCTION'` | Ambiente da API a ser utilizado |
| `baseUrl` | `string` | Não | (automático) | Sobrescreve completamente a URL base da API |
| `timeout` | `number` | Não | `30000` | Timeout das requisições em milissegundos |
| `fetch` | `typeof globalThis.fetch` | Não | `globalThis.fetch` | Implementação customizada de fetch |
| `userAgent` | `string` | Não | - | Sufixo customizado para o header `User-Agent` |

**Exemplo com configurações avançadas:**

```ts
const asaas = new AsaasClient({
  accessToken: process.env.ASAAS_API_KEY!,
  environment: 'SANDBOX',
  timeout: 60000, // 60 segundos
  userAgent: 'MeuApp/1.0.0',
})
```

## Sua Primeira Requisição

Vamos criar um cliente e emitir uma cobrança para ele:

```ts
import { AsaasClient } from '@rodrigogs/asaas-sdk'

const asaas = new AsaasClient({
  accessToken: process.env.ASAAS_API_KEY!,
  environment: 'SANDBOX',
})

async function exemplo() {
  // 1. Criar um cliente
  const cliente = await asaas.customers.create({
    name: 'João Silva',
    cpfCnpj: '12345678909',
    email: 'joao.silva@email.com',
    mobilePhone: '11987654321',
    address: 'Avenida Paulista',
    addressNumber: '1000',
    complement: 'Apto 101',
    province: 'Bela Vista',
    postalCode: '01310-100',
  })

  console.log('Cliente criado:', cliente.id)

  // 2. Criar uma cobrança para o cliente
  const cobranca = await asaas.payments.create({
    customer: cliente.id,
    billingType: 'BOLETO',
    value: 150.00,
    dueDate: '2026-04-15',
    description: 'Mensalidade - Abril/2026',
  })

  console.log('Cobrança criada:', cobranca.id)
  console.log('Link do boleto:', cobranca.bankSlipUrl)
}

exemplo().catch(console.error)
```

## Ambientes

O Asaas oferece dois ambientes distintos:

### Sandbox

- **URL:** `https://api-sandbox.asaas.com/v3`
- **Uso:** Desenvolvimento e testes
- **Características:**
  - Não processa pagamentos reais
  - Permite simular fluxos completos
  - Algumas funcionalidades podem ter limitações (consulte a documentação oficial do Asaas)

### Produção

- **URL:** `https://api.asaas.com/v3`
- **Uso:** Aplicações em produção
- **Características:**
  - Processa pagamentos reais
  - Requer homologação para algumas funcionalidades
  - Todas as transações têm impacto financeiro real

**Recomendação:** Sempre desenvolva e teste no ambiente **SANDBOX** antes de migrar para produção.

```ts
// Desenvolvimento
const asaasDev = new AsaasClient({
  accessToken: process.env.ASAAS_SANDBOX_KEY!,
  environment: 'SANDBOX',
})

// Produção
const asaasProd = new AsaasClient({
  accessToken: process.env.ASAAS_PRODUCTION_KEY!,
  environment: 'PRODUCTION', // ou omitir (padrão)
})
```

## Usando um Fetch Customizado

Você pode fornecer uma implementação customizada de `fetch` para casos especiais como testes, mocks ou uso de bibliotecas alternativas:

```ts
import { AsaasClient } from '@rodrigogs/asaas-sdk'
import { fetch as undiciFetch } from 'undici'

// Exemplo: usando undici
const asaas = new AsaasClient({
  accessToken: process.env.ASAAS_API_KEY!,
  fetch: undiciFetch as typeof globalThis.fetch,
})

// Exemplo: mock para testes
const mockFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  return new Response(JSON.stringify({ id: 'mock-123' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

const asaasMock = new AsaasClient({
  accessToken: 'test-key',
  fetch: mockFetch,
})
```

## Serviços Disponíveis

O `AsaasClient` expõe os seguintes serviços para interagir com a API do Asaas:

| Serviço | Descrição |
|---------|-----------|
| `customers` | Gerenciamento de clientes |
| `payments` | Criação e gestão de cobranças |
| `cards` | Tokenização e gestão de cartões de crédito |
| `installments` | Parcelamentos de cobranças |
| `chargebacks` | Consulta e gestão de estornos |
| `paymentDocuments` | Upload de documentos de pagamento |
| `pix` | Funcionalidades Pix (chaves, QR codes estáticos e dinâmicos, transações, automático, recorrente) |
| `pix.keys` | Gerenciamento de chaves Pix |
| `pix.staticQrCodes` | QR codes Pix estáticos |
| `pix.qrCodes` | QR codes Pix dinâmicos |
| `pix.transactions` | Transações Pix |
| `pix.automatic` | Cobrança Pix automática |
| `pix.recurring` | Cobrança Pix recorrente |
| `subscriptions` | Assinaturas recorrentes |
| `transfers` | Transferências bancárias |
| `subaccounts` | Gestão de subcontas |
| `myAccount` | Dados da sua conta Asaas |
| `notifications` | Configuração de notificações |
| `paymentLinks` | Links de pagamento |
| `checkouts` | Checkouts personalizados |
| `checkoutConfig` | Configuração de checkout |
| `splits` | Split de pagamentos |
| `anticipations` | Antecipações de recebíveis |
| `anticipationConfig` | Configuração de antecipação |
| `bill` | Gestão de contas a pagar |
| `escrow` | Garantia (escrow) |
| `fiscalInfo` | Informações fiscais |
| `invoices` | Notas fiscais de serviço |

Cada serviço oferece métodos específicos para operações CRUD e funcionalidades especializadas.

## Próximos Passos

Agora que você configurou o cliente e realizou sua primeira requisição, explore os guias avançados:

- [Tratamento de Erros](./error-handling.md) - Como lidar com erros da API
- [Paginação](./pagination.md) - Trabalhando com listagens paginadas
- [Webhooks](./webhooks.md) - Recebendo notificações em tempo real

Para exemplos detalhados de cada serviço, consulte a documentação de referência da API.
