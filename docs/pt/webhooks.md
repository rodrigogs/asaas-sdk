# Webhooks

## Visão Geral

O Asaas envia notificações via webhook para seu endpoint quando eventos ocorrem (pagamento recebido, assinatura renovada, transferência concluída, etc.). O SDK fornece uma constante para o header de autenticação do webhook.

Webhooks permitem construir integrações orientadas a eventos que reagem a mudanças na sua conta Asaas em tempo real, sem necessidade de polling constante.

## Autenticação de Webhooks

O Asaas autentica requisições de webhook usando um token enviado em um header customizado.

O SDK exporta o nome do header como constante:

```typescript
import { ASAAS_WEBHOOK_AUTH_HEADER } from '@rodrigogs/asaas-sdk'
// Valor: 'asaas-access-token'
```

Ao criar um webhook no Asaas (via painel ou API), você configura um token de autenticação. O Asaas envia esse token no header `asaas-access-token` em cada requisição de webhook.

### Express

```typescript
import { ASAAS_WEBHOOK_AUTH_HEADER } from '@rodrigogs/asaas-sdk'

app.post('/webhooks/asaas', (req, res) => {
  const token = req.headers[ASAAS_WEBHOOK_AUTH_HEADER]

  if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return res.status(401).send('Unauthorized')
  }

  const event = req.body
  // Handle event...

  res.status(200).send('OK')
})
```

### Next.js Route Handler

```typescript
import { ASAAS_WEBHOOK_AUTH_HEADER } from '@rodrigogs/asaas-sdk'

export async function POST(request: Request) {
  const token = request.headers.get(ASAAS_WEBHOOK_AUTH_HEADER)

  if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return new Response('Unauthorized', { status: 401 })
  }

  const event = await request.json()
  // Handle event...

  return new Response('OK', { status: 200 })
}
```

### Fastify

```typescript
import { ASAAS_WEBHOOK_AUTH_HEADER } from '@rodrigogs/asaas-sdk'

fastify.post('/webhooks/asaas', async (request, reply) => {
  const token = request.headers[ASAAS_WEBHOOK_AUTH_HEADER]

  if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return reply.status(401).send('Unauthorized')
  }

  const event = request.body
  // Handle event...

  return reply.status(200).send('OK')
})
```

## Configurando Webhooks

Endpoints de webhook são configurados pelo painel do Asaas ou durante a criação de subcontas. Ao criar uma subconta via SDK, você pode incluir a configuração de webhook na requisição de criação:

```typescript
const subaccount = await client.subaccounts.create({
  name: 'Loja Exemplo',
  email: 'loja@example.com',
  cpfCnpj: '12345678901',
  mobilePhone: '11987654321',
  incomeValue: 5000,
  address: 'Av. Paulista',
  addressNumber: '1000',
  province: 'Bela Vista',
  postalCode: '01310-100',
  webhooks: [
    {
      url: 'https://seuapp.com/webhooks/subconta',
      email: 'alertas@seuapp.com',
      apiVersion: 3,
      enabled: true,
      authToken: 'seu-token-secreto',
      sendType: 'SEQUENTIALLY',
    },
  ],
})
```

Para a conta principal, configure webhooks diretamente no [painel do Asaas](https://www.asaas.com).

## Catálogo de Eventos

O Asaas envia notificações para eventos em diferentes tipos de recursos. A tabela abaixo resume os principais eventos por domínio:

| Domínio | Evento | Descrição |
|---------|--------|-----------|
| **Cobranças** | `PAYMENT_CREATED` | Cobrança criada |
| | `PAYMENT_UPDATED` | Cobrança atualizada |
| | `PAYMENT_CONFIRMED` | Cobrança confirmada (cartão) |
| | `PAYMENT_RECEIVED` | Cobrança recebida e compensada |
| | `PAYMENT_OVERDUE` | Cobrança vencida |
| | `PAYMENT_REFUNDED` | Cobrança estornada |
| | `PAYMENT_DELETED` | Cobrança removida |
| | `PAYMENT_RESTORED` | Cobrança restaurada |
| | `PAYMENT_AWAITING_RISK_ANALYSIS` | Em análise de risco |
| | `PAYMENT_APPROVED_BY_RISK_ANALYSIS` | Aprovada após análise de risco |
| | `PAYMENT_REPROVED_BY_RISK_ANALYSIS` | Rejeitada pela análise de risco |
| **Assinaturas** | `SUBSCRIPTION_CREATED` | Assinatura criada |
| | `SUBSCRIPTION_UPDATED` | Assinatura atualizada |
| | `SUBSCRIPTION_DELETED` | Assinatura removida |
| **Transferências** | `TRANSFER_CREATED` | Transferência criada |
| | `TRANSFER_PENDING` | Transferência pendente |
| | `TRANSFER_DONE` | Transferência concluída |
| | `TRANSFER_FAILED` | Transferência falhou |
| **Notas Fiscais** | `INVOICE_CREATED` | Nota fiscal criada |
| | `INVOICE_UPDATED` | Nota fiscal atualizada |
| | `INVOICE_AUTHORIZED` | Nota fiscal autorizada |
| | `INVOICE_CANCELED` | Nota fiscal cancelada |
| **Pague Contas** | `BILL_PAYMENT_CREATED` | Pagamento de conta criado |
| | `BILL_PAYMENT_CONFIRMED` | Pagamento de conta confirmado |
| | `BILL_PAYMENT_FAILED` | Pagamento de conta falhou |
| **Antecipações** | `ANTICIPATION_CREATED` | Antecipação solicitada |
| | `ANTICIPATION_APPROVED` | Antecipação aprovada |
| | `ANTICIPATION_DENIED` | Antecipação negada |
| **Contas** | `ACCOUNT_STATUS_UPDATED` | Status da conta alterado |
| | `ACCOUNT_STATUS_COMMERCIAL_INFO_EXPIRING_SOON` | Dados comerciais expirando em 40 dias |
| | `ACCOUNT_STATUS_COMMERCIAL_INFO_EXPIRED` | Dados comerciais expirados |
| **Checkouts** | `CHECKOUT_VIEWED` | Página de checkout visualizada |
| **Pix Automático** | `PIX_AUTOMATIC_AUTHORIZATION_CREATED` | Autorização de Pix Automático criada |
| | `PIX_AUTOMATIC_AUTHORIZATION_CANCELLED` | Autorização cancelada |
| **Chaves de API** | `API_KEY_CREATED` | Chave de API criada |
| | `API_KEY_ENABLED` | Chave de API habilitada |
| | `API_KEY_DISABLED` | Chave de API desabilitada |
| | `API_KEY_DELETED` | Chave de API excluída |

Para a lista completa e mais atualizada, consulte a [Documentação Oficial de Webhooks do Asaas](https://docs.asaas.com/docs/webhook-para-cobrancas).

## Estrutura do Payload

Cada requisição de webhook contém um payload JSON com a seguinte estrutura:

```typescript
{
  "event": "PAYMENT_RECEIVED",
  "payment": {
    "id": "pay_abc123",
    "customer": "cus_xyz789",
    "value": 100.00,
    "netValue": 97.50,
    "billingType": "BOLETO",
    "status": "RECEIVED",
    // ... campos adicionais da cobrança
  }
}
```

A estrutura do payload varia conforme o tipo de evento. O objeto raiz sempre contém um campo `event` com o nome do evento, além de campos específicos para o tipo (por ex., `payment`, `subscription`, `transfer`, etc.).

## Boas Práticas

### Segurança

- **Sempre verifique o token de autenticação** antes de processar eventos. Nunca confie em dados de webhook sem autenticação.
- Armazene o token de webhook de forma segura como variável de ambiente, nunca no código.
- Use endpoints HTTPS para webhooks em produção.

### Performance

- **Retorne HTTP 200 rapidamente** — O Asaas espera uma resposta rápida. Processe eventos de forma assíncrona se sua lógica de negócio for demorada.
- Considere usar uma fila (Redis, SQS, etc.) para processar webhooks:

```typescript
app.post('/webhooks/asaas', async (req, res) => {
  const token = req.headers[ASAAS_WEBHOOK_AUTH_HEADER]

  if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return res.status(401).send('Unauthorized')
  }

  // Enfileirar o evento para processamento assíncrono
  await queue.add('asaas-webhook', req.body)

  // Retornar imediatamente
  res.status(200).send('OK')
})
```

### Confiabilidade

- **Implemente idempotência** usando um identificador único do evento para lidar com entregas duplicadas. O Asaas pode enviar o mesmo evento múltiplas vezes se seu endpoint não responder com sucesso. Use a combinação de tipo de evento + ID do recurso como chave de deduplicação — não apenas o ID do recurso, pois um pagamento pode disparar múltiplos eventos diferentes.

```typescript
// Use um armazenamento persistente (banco de dados, Redis) em produção
const processedEvents = new Set<string>()

app.post('/webhooks/asaas', async (req, res) => {
  const event = req.body

  // Construir chave de deduplicação a partir dos dados do evento
  const eventKey = `${event.event}:${event.payment?.id ?? event.transfer?.id}`

  if (processedEvents.has(eventKey)) {
    return res.status(200).send('OK')
  }

  // Processar evento...
  processedEvents.add(eventKey)

  res.status(200).send('OK')
})
```

- **Monitore a saúde da fila de webhooks** — O Asaas pode pausar sua fila após falhas repetidas. Configure alertas para falhas de webhook.
- Registre todos os webhooks recebidos para debugging e auditoria.

### Gerenciamento da Fila de Webhooks

O Asaas gerencia uma fila de entrega para cada endpoint de webhook. Comportamentos-chave:

- **Sistema de penalidade**: Se seu endpoint retornar respostas não-2xx repetidamente, o Asaas aplica atrasos crescentes entre as tentativas.
- **Pausa da fila**: Após falhas sustentadas, o Asaas pode pausar a fila de webhooks inteiramente. Você receberá uma notificação por email.
- **Reativação**: Filas pausadas podem ser reativadas pelo painel do Asaas após corrigir o problema no endpoint.
- **Ordem de entrega**: Use `SEQUENTIALLY` quando a ordem dos eventos importar (ex.: transições de estado de pagamento). Use `NON_SEQUENTIALLY` para maior throughput quando a ordem não importar.

### Tratamento de Erros

```typescript
app.post('/webhooks/asaas', async (req, res) => {
  const token = req.headers[ASAAS_WEBHOOK_AUTH_HEADER]

  if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return res.status(401).send('Unauthorized')
  }

  try {
    const event = req.body

    // Validar estrutura do evento
    if (!event.event || !event.payment) {
      logger.error('Payload de webhook inválido', { body: req.body })
      return res.status(400).send('Invalid payload')
    }

    // Processar evento
    await handleAsaasEvent(event)

    res.status(200).send('OK')
  } catch (error) {
    logger.error('Falha no processamento do webhook', { error, body: req.body })
    // Retornar 500 para que o Asaas retente
    res.status(500).send('Internal Server Error')
  }
})
```

## Testando Webhooks Localmente

Para desenvolvimento local, você pode usar ferramentas como ngrok ou localtunnel para expor seu servidor local à internet:

```bash
# Usando ngrok
ngrok http 3000

# Usando localtunnel
npx localtunnel --port 3000
```

Então configure a URL do webhook no Asaas apontando para a URL pública gerada (ex.: `https://abc123.ngrok.io/webhooks/asaas`).

Como alternativa, use o ambiente sandbox do Asaas para testar sem expor sua máquina local.
