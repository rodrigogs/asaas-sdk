# Serviços Financeiros

O módulo de Serviços Financeiros oferece capacidades abrangentes de gestão de dinheiro incluindo transferências, pagamentos de boletos, gestão de garantia (escrow), divisões (splits) e antecipações. Esses serviços gerenciam tanto fluxos de entrada quanto saída de dinheiro com rastreamento e controle detalhados.

## Transferências

As transferências permitem mover dinheiro da sua conta Asaas para outros destinos: contas bancárias, chaves Pix ou outras contas Asaas dentro da sua operação.

### Conceitos-Chave

**Tipos de Transferência:**
- **Transferência Bancária**: Envie dinheiro para contas bancárias externas via TED ou Pix
- **Transferência Pix**: Envie dinheiro usando chaves Pix (CPF, CNPJ, email, telefone, EVP)
- **Transferência Interna**: Transfira entre contas Asaas na sua operação (requer `walletId`)

**Regras Importantes:**
- TEDs solicitadas após 15:00 são automaticamente agendadas para o próximo dia útil
- Transferências internas entre contas Asaas são tipicamente processadas imediatamente
- Transferências Pix são geralmente instantâneas quando nenhum agendamento é aplicado
- Transferências podem requerer autorização crítica (SMS/Token App) dependendo das configurações da conta
- Webhook de validação de transferência pode ser usado para fluxos de aprovação automatizados

**Status de Transferência:**
- `PENDING`: Transferência criada, aguardando processamento
- `BANK_PROCESSING`: Sendo processada pelo banco
- `DONE`: Concluída com sucesso
- `CANCELLED`: Cancelada antes da conclusão
- `FAILED`: Falha na conclusão

**Recursos de Segurança:**
- Lista branca de IPs para transferências automatizadas sem aprovação manual
- Webhook de validação de transferência (POST enviado ~5 segundos após criação)
- Autorização crítica via Token SMS ou Token APP
- Campo `authorized` indica se a transferência requer aprovação manual

### Métodos

| Método | Descrição |
|--------|-----------|
| `toBank(params)` | Transferir para conta bancária ou chave Pix |
| `toAsaasAccount(params)` | Transferir para outra conta Asaas (requer walletId) |
| `list(params?)` | Listar todas as transferências com filtros opcionais |
| `get(id)` | Obter uma única transferência por ID |
| `cancel(id)` | Cancelar uma transferência pendente |
| `listWallets()` | Listar carteiras para obter walletId para transferências internas |

### Exemplos

#### Transferir para Conta Bancária

```typescript
import { AsaasClient } from 'asaas-sdk'

const client = new AsaasClient({
  accessToken: process.env.ASAAS_ACCESS_TOKEN,
  environment: 'SANDBOX'
})

// Transfer via TED to bank account
const transfer = await client.transfers.toBank({
  value: 150.00,
  bankAccount: {
    bank: {
      code: '341' // Itaú
    },
    accountName: 'João Silva',
    ownerName: 'João Silva',
    ownerBirthDate: '1990-05-15',
    cpfCnpj: '12345678901',
    agency: '1234',
    account: '56789',
    accountDigit: '0',
    bankAccountType: 'CONTA_CORRENTE'
  },
  operationType: 'TED', // or 'PIX' for automatic selection
  description: 'Pagamento de fornecedor',
  scheduleDate: '2026-03-20', // optional scheduling
  externalReference: 'INV-2026-001'
})

console.log(transfer.id)
console.log(transfer.status) // PENDING, BANK_PROCESSING, DONE
console.log(transfer.authorized) // true if no manual approval needed
console.log(transfer.transactionReceiptUrl) // Download receipt when available
```

#### Transferir via Chave Pix

```typescript
// Transfer using CPF as Pix key
const pixTransfer = await client.transfers.toBank({
  value: 250.50,
  pixAddressKey: '12345678901',
  pixAddressKeyType: 'CPF',
  operationType: 'PIX',
  description: 'Reembolso cliente',
  externalReference: 'REFUND-789'
})

// Transfer using email as Pix key
const emailTransfer = await client.transfers.toBank({
  value: 100.00,
  pixAddressKey: 'joao@exemplo.com.br',
  pixAddressKeyType: 'EMAIL',
  description: 'Pagamento freelancer'
})

// Transfer using phone (11 digits with area code)
const phoneTransfer = await client.transfers.toBank({
  value: 75.00,
  pixAddressKey: '11987654321',
  pixAddressKeyType: 'PHONE'
})

// Transfer using random key (EVP)
const evpTransfer = await client.transfers.toBank({
  value: 300.00,
  pixAddressKey: '123e4567-e89b-12d3-a456-426614174000',
  pixAddressKeyType: 'EVP',
  description: 'Pagamento parceiro'
})
```

#### Transferir para Conta Asaas

```typescript
// First, get the walletId of the destination account
const wallets = await client.transfers.listWallets()
const destinationWallet = wallets.data.find(w => w.id === 'wallet_abc123')

// Transfer to another Asaas account in your operation
const internalTransfer = await client.transfers.toAsaasAccount({
  value: 500.00,
  walletId: destinationWallet.id,
  externalReference: 'INT-TRANSFER-2026-03'
})

console.log(internalTransfer.status) // Usually DONE immediately
console.log(internalTransfer.type) // INTERNAL
```

#### Listar e Filtrar Transferências

```typescript
// List all transfers with pagination
const result = await client.transfers.list({
  limit: 20,
  offset: 0
})

for await (const transfer of result) {
  console.log(`${transfer.id}: ${transfer.value} - ${transfer.status}`)
  console.log(`Type: ${transfer.type}`) // PIX, TED, INTERNAL
  console.log(`Effective Date: ${transfer.effectiveDate}`)
}

// Filter by date range and type
const filtered = await client.transfers.list({
  'dateCreated[ge]': '2026-03-01',
  'dateCreated[le]': '2026-03-31',
  type: 'PIX',
  limit: 50
})

for await (const transfer of filtered) {
  if (transfer.status === 'DONE') {
    console.log(`Completed: ${transfer.endToEndIdentifier}`)
  }
}
```

#### Obter e Cancelar Transferência

```typescript
// Get single transfer details
const transfer = await client.transfers.get('transf_abc123')

console.log(transfer.value)
console.log(transfer.netValue) // value minus fees
console.log(transfer.transferFee)
console.log(transfer.failReason) // if status is FAILED

// Cancel pending transfer
if (transfer.status === 'PENDING') {
  const cancelled = await client.transfers.cancel(transfer.id)
  console.log(cancelled.status) // CANCELLED
}
```

#### Transferência Pix Recorrente

```typescript
// Create recurring Pix transfer (weekly or monthly)
const recurringTransfer = await client.transfers.toBank({
  value: 100.00,
  pixAddressKey: 'fornecedor@empresa.com.br',
  pixAddressKeyType: 'EMAIL',
  operationType: 'PIX',
  description: 'Pagamento mensal fornecedor',
  recurring: {
    frequency: 'MONTHLY', // or 'WEEKLY'
    quantity: 11 // max 11 for MONTHLY, 51 for WEEKLY
  }
})

console.log(recurringTransfer.recurring)
```

### Limitações no Sandbox

- **Transferências Pix**: Funcionam com chaves BACEN fictícias e são concluídas imediatamente com sucesso
- **Transferências TED**: Requerem controles manuais na interface Asaas para simular sucesso/falha
- **Transferências internas**: Podem ser totalmente testadas no ambiente sandbox
- Aprovação automática ainda pode requerer etapas manuais dependendo da configuração da conta

## Pagamentos de Boletos

Os pagamentos de boletos permitem pagar contas usando o campo de identificação do código de barras (linha digitável). O saldo da conta Asaas é debitado para pagar boletos de terceiros.

### Conceitos-Chave

**Fluxo de Pagamento:**
1. Simule o pagamento do boleto para validar e obter informações de taxa
2. Crie o pagamento do boleto com o campo de identificação
3. Acompanhe o status do pagamento através de webhooks ou polling
4. Baixe o comprovante quando o pagamento for concluído

**Regras de Agendamento:**
- Se `scheduleDate` for fornecida, o pagamento é agendado para aquela data
- Se a data cair em dia não útil, o pagamento ocorre no próximo dia útil
- Se `scheduleDate` não for fornecida, o pagamento ocorre na data de vencimento do boleto
- Boletos vencidos não podem ser agendados e são pagos imediatamente

**Status de Pagamento de Boleto:**
- `PENDING`: Pagamento criado, aguardando processamento
- `BANK_PROCESSING`: Sendo processado pelo banco
- `PAID`: Pago com sucesso
- `CANCELLED`: Cancelado antes do processamento
- `FAILED`: Falha na conclusão
- `REFUNDED`: Pagamento foi reembolsado
- `AWAITING_CHECKOUT_RISK_ANALYSIS_REQUEST`: Sob análise de risco

### Métodos

| Método | Descrição |
|--------|-----------|
| `simulate(params)` | Simular pagamento de boleto para validar e obter taxas |
| `create(params)` | Criar um pagamento de boleto |
| `list(params?)` | Listar todos os pagamentos de boleto com paginação |
| `get(id)` | Obter um único pagamento de boleto por ID |
| `cancel(id)` | Cancelar um pagamento de boleto pendente |

### Exemplos

#### Simular Pagamento de Boleto

```typescript
import { AsaasClient } from 'asaas-sdk'

const client = new AsaasClient({
  accessToken: process.env.ASAAS_ACCESS_TOKEN,
  environment: 'SANDBOX'
})

// Simulate payment to validate barcode and get fee estimate
const simulation = await client.bill.simulate({
  identificationField: '34191790010104351004791020150008291070026000'
})

console.log(simulation.value) // Bill amount
console.log(simulation.discount) // Available discount
console.log(simulation.interest) // Interest charged
console.log(simulation.fine) // Fine charged
console.log(simulation.netValue) // Total to be paid
console.log(simulation.bankSlipFee) // Asaas processing fee
```

#### Criar Pagamento de Boleto

```typescript
// Pay immediately (on due date if not overdue)
const payment = await client.bill.create({
  identificationField: '34191790010104351004791020150008291070026000',
  description: 'Pagamento conta de luz - Março 2026',
  externalReference: 'BILL-LUZ-03-2026'
})

console.log(payment.id)
console.log(payment.status) // PENDING
console.log(payment.canBeCancelled) // true if cancellation is allowed

// Schedule payment for specific date
const scheduledPayment = await client.bill.create({
  identificationField: '34191790010104351004791020150008291070026000',
  scheduleDate: '2026-03-25',
  description: 'Pagamento agendado - Fornecedor XYZ'
})

console.log(scheduledPayment.scheduleDate)
```

#### Informações Manuais do Boleto

Para boletos que não têm informações incorporadas (como faturas de cartão de crédito):

```typescript
// Provide manual bill details
const manualBill = await client.bill.create({
  identificationField: '34191790010104351004791020150008291070026000',
  value: 350.75,
  dueDate: '2026-03-30',
  description: 'Fatura cartão corporativo',
  discount: 0,
  interest: 0,
  fine: 0
})
```

#### Listar Pagamentos de Boletos

```typescript
// List all bill payments with pagination
const result = await client.bill.list({
  limit: 20,
  offset: 0
})

for await (const bill of result) {
  console.log(`${bill.id}: R$ ${bill.value} - ${bill.status}`)
  console.log(`Description: ${bill.description}`)
  if (bill.transactionReceiptUrl) {
    console.log(`Receipt: ${bill.transactionReceiptUrl}`)
  }
}

console.log(`Total: ${result.totalCount}`)
console.log(`Has more: ${result.hasMore}`)
```

#### Obter e Cancelar Pagamento de Boleto

```typescript
// Get single bill payment details
const bill = await client.bill.get('bill_abc123')

console.log(bill.status)
console.log(bill.value)
console.log(bill.netValue) // includes fees

if (bill.canBeCancelled) {
  // Cancel pending payment
  const cancelled = await client.bill.cancel(bill.id)
  console.log(cancelled.status) // CANCELLED
}

// Check failure reasons if payment failed
if (bill.status === 'FAILED' && bill.failReasons) {
  console.error('Payment failed:', bill.failReasons)
}
```

### Limitações no Sandbox

- Pagamentos de boleto podem ser testados no sandbox com formatos de código de barras válidos
- Simulação de sucesso/falha pode requerer controles manuais na interface Asaas
- Alguns estados podem ser observados apenas no ambiente de produção

## Garantia (Escrow)

A garantia (escrow) permite reter fundos de pagamentos em uma conta garantida antes de liberá-los para subcontas. Isso fornece segurança transacional garantindo que os fundos sejam liberados apenas quando as condições forem atendidas.

### Conceitos-Chave

**Níveis de Configuração:**
- **Configuração Padrão**: Aplicada a todas as subcontas por padrão
- **Configuração de Subconta**: Sobrescrever configurações padrão para subconta específica

**Fluxo de Garantia:**
1. Configure as configurações de garantia (dias para expirar, status habilitado, pagador da taxa)
2. Quando a subconta recebe pagamento, os fundos são retidos em garantia
3. Os fundos são liberados automaticamente após o período de expiração
4. Ou finalize manualmente a garantia para liberar fundos imediatamente

**Configurações-Chave:**
- `daysToExpire`: Número de dias até a garantia expirar e os fundos serem liberados
- `enabled`: Se a garantia está ativa para a conta/subconta
- `isFeePayer`: Se verdadeiro, a subconta paga a taxa de garantia; se falso, a conta principal paga

### Métodos

| Método | Descrição |
|--------|-----------|
| `getConfig()` | Obter configuração de garantia padrão para todas as subcontas |
| `updateConfig(params)` | Atualizar configuração de garantia padrão |
| `getSubaccountConfig(subaccountId)` | Obter configuração de garantia para subconta específica |
| `updateSubaccountConfig(subaccountId, params)` | Atualizar configuração para subconta específica |
| `getPaymentEscrow(paymentId)` | Obter detalhes de garantia para um pagamento específico |
| `finishPaymentEscrow(paymentId)` | Liberar fundos de garantia imediatamente |

### Exemplos

#### Configurar Garantia Padrão

```typescript
import { AsaasClient } from 'asaas-sdk'

const client = new AsaasClient({
  accessToken: process.env.ASAAS_ACCESS_TOKEN,
  environment: 'SANDBOX'
})

// Set default escrow configuration for all subaccounts
const config = await client.escrow.updateConfig({
  daysToExpire: 15, // Hold funds for 15 days
  enabled: true,
  isFeePayer: false // Main account pays escrow fees
})

console.log(config.daysToExpire)
console.log(config.enabled)

// Get current default configuration
const currentConfig = await client.escrow.getConfig()
console.log('Default escrow days:', currentConfig.daysToExpire)
```

#### Configurar Garantia de Subconta

```typescript
// Override escrow settings for specific subaccount
const subaccountConfig = await client.escrow.updateSubaccountConfig(
  'acc_abc123',
  {
    daysToExpire: 30, // Hold for 30 days for this subaccount
    enabled: true,
    isFeePayer: true // This subaccount pays its own escrow fees
  }
)

console.log('Subaccount escrow configured')

// Get subaccount-specific configuration
const config = await client.escrow.getSubaccountConfig('acc_abc123')
console.log(`Days to expire: ${config.daysToExpire}`)
console.log(`Fee payer: ${config.isFeePayer ? 'Subaccount' : 'Main account'}`)
```

#### Desabilitar Garantia

```typescript
// Disable escrow for all new subaccounts
await client.escrow.updateConfig({
  daysToExpire: 0,
  enabled: false
})

// Disable escrow for specific subaccount
await client.escrow.updateSubaccountConfig('acc_abc123', {
  daysToExpire: 0,
  enabled: false
})
```

#### Gerenciar Garantia de Pagamento

```typescript
// Get escrow details for a specific payment
const paymentEscrow = await client.escrow.getPaymentEscrow('pay_xyz789')

console.log(paymentEscrow.value) // Amount held in escrow
console.log(paymentEscrow.expirationDate) // When funds will be released
console.log(paymentEscrow.status) // Escrow status

// Release escrow funds immediately (before expiration)
const finished = await client.escrow.finishPaymentEscrow('pay_xyz789')
console.log('Escrow finished, funds released to subaccount')
```

### Casos de Uso

**Transações de Marketplace:**
```typescript
// Hold payment for 7 days after delivery
await client.escrow.updateConfig({
  daysToExpire: 7,
  enabled: true,
  isFeePayer: false
})

// When customer confirms receipt, release immediately
await client.escrow.finishPaymentEscrow(paymentId)
```

**Subcontas de Alto Risco:**
```typescript
// Extended hold period for new subaccount
await client.escrow.updateSubaccountConfig('acc_new_vendor', {
  daysToExpire: 45,
  enabled: true,
  isFeePayer: true
})
```

## Divisões (Splits)

As divisões (splits) permitem distribuir automaticamente valores de pagamento entre múltiplas carteiras. Quando um pagamento é recebido, ele pode ser dividido entre sua conta principal e outras contas Asaas na sua operação.

### Conceitos-Chave

**Configuração de Divisão:**
- Divisões são configuradas ao criar pagamentos, parcelas, assinaturas ou links de checkout
- Pode especificar valores fixos ou porcentagens
- Múltiplas carteiras podem receber porções do mesmo pagamento
- Valores de divisão devem respeitar o valor líquido após antecipações (se houver)

**Visões de Divisão:**
- **Divisões Pagas**: Divisões que você envia para outras carteiras dos seus pagamentos
- **Divisões Recebidas**: Divisões que você recebe de pagamentos de outras contas

**Status de Divisão:**
- `PENDING`: Divisão criada, aguardando confirmação de pagamento
- `PROCESSING`: Pagamento confirmado, processando distribuição
- `AWAITING_CREDIT`: Aguardando transferência de fundos
- `DONE`: Divisão concluída com sucesso
- `CANCELLED`: Divisão foi cancelada
- `REFUNDED`: Pagamento foi reembolsado, divisão revertida
- `PROCESSING_REFUND`: Reembolso em andamento
- `BLOCKED_BY_VALUE_DIVERGENCE`: Bloqueada devido a divergência de valor (ex: após antecipação)

**Motivos de Cancelamento:**
- `PAYMENT_DELETED`: Pagamento pai foi deletado
- `PAYMENT_OVERDUE`: Pagamento ficou vencido
- `PAYMENT_RECEIVED_IN_CASH`: Pagamento recebido em dinheiro
- `PAYMENT_REFUNDED`: Pagamento foi reembolsado
- `VALUE_DIVERGENCE_BLOCK`: Valor da divisão não corresponde ao valor disponível
- `WALLET_UNABLE_TO_RECEIVE`: Carteira de destino não pode receber divisões

### Métodos

| Método | Descrição |
|--------|-----------|
| `listPaidSplits(params?)` | Listar divisões que você enviou para outras carteiras |
| `listReceivedSplits(params?)` | Listar divisões que você recebeu de outros |
| `getStatistics(params?)` | Obter estatísticas agregadas de divisão (entrada vs saída) |

### Exemplos

#### Listar Divisões Pagas

```typescript
import { AsaasClient } from 'asaas-sdk'

const client = new AsaasClient({
  accessToken: process.env.ASAAS_ACCESS_TOKEN,
  environment: 'SANDBOX'
})

// List all splits you've sent
const result = await client.splits.listPaidSplits({
  limit: 20,
  offset: 0
})

for await (const split of result) {
  console.log(`Split ${split.id}`)
  console.log(`  To wallet: ${split.walletId}`)
  console.log(`  Value: R$ ${split.totalValue}`)
  console.log(`  Status: ${split.status}`)
  console.log(`  Description: ${split.description || 'N/A'}`)
}

// Filter by status
const doneSplits = await client.splits.listPaidSplits({
  status: 'DONE',
  limit: 50
})

for await (const split of doneSplits) {
  console.log(`Completed split: R$ ${split.totalValue} to ${split.walletId}`)
}
```

#### Filtrar Divisões por Data

```typescript
// Splits confirmed in March 2026
const marchSplits = await client.splits.listPaidSplits({
  'paymentConfirmedDate[ge]': '2026-03-01',
  'paymentConfirmedDate[le]': '2026-03-31',
  limit: 100
})

let total = 0
for await (const split of marchSplits) {
  total += split.totalValue
}
console.log(`Total split in March: R$ ${total.toFixed(2)}`)

// Filter by credit date
const creditedSplits = await client.splits.listPaidSplits({
  'creditDate[ge]': '2026-03-15',
  'creditDate[le]': '2026-03-20'
})

for await (const split of creditedSplits) {
  console.log(`Credited on ${split.creditDate}: R$ ${split.totalValue}`)
}
```

#### Listar Divisões Recebidas

```typescript
// List splits you've received from other accounts
const receivedResult = await client.splits.listReceivedSplits({
  limit: 20,
  offset: 0
})

for await (const split of receivedResult) {
  console.log(`Received ${split.id}`)
  console.log(`  Value: R$ ${split.totalValue}`)
  console.log(`  Status: ${split.status}`)
  console.log(`  External ref: ${split.externalReference || 'N/A'}`)
}

// Filter by payment ID
const paymentSplits = await client.splits.listReceivedSplits({
  paymentId: 'pay_abc123'
})

for await (const split of paymentSplits) {
  if (split.fixedValue) {
    console.log(`Fixed: R$ ${split.fixedValue}`)
  }
  if (split.percentualValue) {
    console.log(`Percentage: ${split.percentualValue}%`)
  }
}
```

#### Obter Estatísticas de Divisão

```typescript
// Get aggregated split values
const stats = await client.splits.getStatistics()

console.log('Split Statistics:')
console.log(`  To receive (income): R$ ${stats.income}`)
console.log(`  To send (value): R$ ${stats.value}`)

const netFlow = stats.income - stats.value
console.log(`  Net flow: R$ ${netFlow.toFixed(2)}`)

if (netFlow > 0) {
  console.log('  → You will receive more than you send')
} else {
  console.log('  → You will send more than you receive')
}
```

#### Lidar com Erros de Divisão

```typescript
// Check for blocked splits
const blockedSplits = await client.splits.listPaidSplits({
  status: 'BLOCKED_BY_VALUE_DIVERGENCE'
})

for await (const split of blockedSplits) {
  console.error(`Split ${split.id} blocked`)
  console.error(`  Reason: ${split.cancellationReason}`)
  console.error(`  Payment: ${split.paymentId}`)
  console.error(`  Expected: R$ ${split.totalValue}`)
  // May need to adjust split values or review anticipation impact
}

// Monitor cancelled splits
const cancelledSplits = await client.splits.listPaidSplits({
  status: 'CANCELLED'
})

for await (const split of cancelledSplits) {
  console.log(`Cancelled: ${split.id}`)
  console.log(`  Reason: ${split.cancellationReason}`)
}
```

## Antecipações

As antecipações permitem receber fundos de pagamentos antes da data de vencimento solicitando adiantamento de recebíveis (parcelas de cartão de crédito ou boletos bancários). Isso melhora o fluxo de caixa convertendo recebíveis futuros em fundos imediatos.

### Conceitos-Chave

**Tipos de Antecipação:**
- **Antecipação de Parcela**: Antecipar todas ou parcelas específicas de um plano de pagamento
- **Antecipação de Pagamento**: Antecipar um único recebível de pagamento

**Fluxo de Antecipação:**
1. Verifique os limites disponíveis para cartão de crédito e boleto bancário
2. Simule a antecipação para ver taxas e valor líquido
3. Crie solicitação de antecipação (pode requerer documentação)
4. Acompanhe o status até que os fundos sejam creditados
5. Cancele se necessário antes que o processamento seja concluído

**Status de Antecipação:**
- `PENDING`: Solicitação criada, sob análise
- `SCHEDULED`: Aprovada e agendada para crédito
- `CREDITED`: Fundos creditados na sua conta
- `DEBITED`: Recebível original foi debitado (quando devido)
- `DENIED`: Solicitação foi negada
- `CANCELLED`: Cancelada antes do processamento
- `OVERDUE`: Antecipação ficou vencida

**Considerações-Chave:**
- Taxas são cobradas baseadas nos dias antecipados e avaliação de risco
- Documentação pode ser requerida para certas antecipações
- Antecipação automática pode ser habilitada para recebíveis de cartão de crédito
- Pagamentos com divisão devem respeitar o valor líquido após antecipação

### Métodos

| Método | Descrição |
|--------|-----------|
| `simulate(params)` | Simular antecipação para obter taxas e valor líquido |
| `create(params)` | Solicitar antecipação (pode incluir documentos) |
| `list(params?)` | Listar todas as antecipações com filtros |
| `get(id)` | Obter uma única antecipação por ID |
| `cancel(id)` | Cancelar uma antecipação pendente |
| `getLimits()` | Obter limites de antecipação disponíveis por tipo |

### Exemplos

#### Verificar Limites de Antecipação

```typescript
import { AsaasClient } from 'asaas-sdk'

const client = new AsaasClient({
  accessToken: process.env.ASAAS_ACCESS_TOKEN,
  environment: 'SANDBOX'
})

// Check available limits
const limits = await client.anticipations.getLimits()

console.log('Anticipation Limits:')
console.log('Credit Card:')
console.log(`  Total: R$ ${limits.creditCard.total}`)
console.log(`  Available: R$ ${limits.creditCard.available}`)
console.log('Bank Slip:')
console.log(`  Total: R$ ${limits.bankSlip.total}`)
console.log(`  Available: R$ ${limits.bankSlip.available}`)
```

#### Simular Antecipação

```typescript
// Simulate installment anticipation
const installmentSim = await client.anticipations.simulate({
  installment: 'inst_abc123'
})

console.log('Simulation Results:')
console.log(`  Original value: R$ ${installmentSim.value}`)
console.log(`  Anticipation fee: R$ ${installmentSim.fee}`)
console.log(`  Net value: R$ ${installmentSim.netValue}`)
console.log(`  Days anticipated: ${installmentSim.anticipationDays}`)
console.log(`  Due date: ${installmentSim.dueDate}`)
console.log(`  Credit date: ${installmentSim.anticipationDate}`)
console.log(`  Documentation required: ${installmentSim.isDocumentationRequired}`)

// Simulate payment anticipation
const paymentSim = await client.anticipations.simulate({
  payment: 'pay_xyz789'
})

console.log(`Net to receive: R$ ${paymentSim.netValue}`)
```

#### Criar Antecipação

```typescript
// Simple anticipation without documents
const anticipation = await client.anticipations.create({
  installment: 'inst_abc123'
})

console.log(`Anticipation ${anticipation.id} created`)
console.log(`Status: ${anticipation.status}`)
console.log(`Net value: R$ ${anticipation.netValue}`)

// Anticipation for single payment
const paymentAnticipation = await client.anticipations.create({
  payment: 'pay_xyz789'
})

console.log(`Anticipated R$ ${paymentAnticipation.netValue}`)
```

#### Criar Antecipação com Documentos

```typescript
import * as fs from 'fs'

// When documentation is required
const simulation = await client.anticipations.simulate({
  installment: 'inst_abc123'
})

if (simulation.isDocumentationRequired) {
  // Create FormData with documents
  const formData = new FormData()
  formData.append('installment', 'inst_abc123')

  // Add document files
  const invoice = fs.readFileSync('./invoice.pdf')
  formData.append('documents', new Blob([invoice]), 'invoice.pdf')

  const contract = fs.readFileSync('./contract.pdf')
  formData.append('documents', new Blob([contract]), 'contract.pdf')

  // Create with documents
  const anticipation = await client.anticipations.create(formData)
  console.log('Anticipation with documents created:', anticipation.id)
}
```

#### Listar Antecipações

```typescript
// List all anticipations
const result = await client.anticipations.list({
  limit: 20,
  offset: 0
})

for await (const anticipation of result) {
  console.log(`${anticipation.id}: R$ ${anticipation.netValue}`)
  console.log(`  Status: ${anticipation.status}`)
  console.log(`  Request date: ${anticipation.requestDate}`)
  console.log(`  Credit date: ${anticipation.anticipationDate}`)
}

// Filter by status
const credited = await client.anticipations.list({
  status: 'CREDITED',
  limit: 50
})

let totalCredited = 0
for await (const anticipation of credited) {
  totalCredited += anticipation.netValue
}
console.log(`Total credited: R$ ${totalCredited.toFixed(2)}`)

// Filter by payment or installment
const paymentAnticipations = await client.anticipations.list({
  payment: 'pay_abc123'
})

for await (const anticipation of paymentAnticipations) {
  console.log(`Payment anticipation: ${anticipation.id}`)
}
```

#### Obter e Cancelar Antecipação

```typescript
// Get single anticipation details
const anticipation = await client.anticipations.get('antcp_abc123')

console.log(anticipation.status)
console.log(`Original value: R$ ${anticipation.totalValue}`)
console.log(`Fee: R$ ${anticipation.fee}`)
console.log(`Net received: R$ ${anticipation.netValue}`)
console.log(`Days anticipated: ${anticipation.anticipationDays}`)

if (anticipation.status === 'DENIED') {
  console.error('Denial reason:', anticipation.denialObservation)
}

// Cancel pending anticipation
if (anticipation.status === 'PENDING') {
  const cancelled = await client.anticipations.cancel(anticipation.id)
  console.log(cancelled.status) // CANCELLED
}
```

### Limitações no Sandbox

- Simulação de antecipação funciona completamente no sandbox
- Solicitações de antecipação reais podem requerer aprovação manual no sandbox
- Upload de documentação pode ser testado mas a aprovação é manual
- Limites refletem configuração do sandbox, não capacidade de produção

## Configuração de Antecipação

Configure ajustes de antecipação automática para antecipar automaticamente recebíveis de cartão de crédito assim que forem gerados.

### Conceitos-Chave

**Antecipação Automática:**
- Aplica-se apenas a recebíveis de cartão de crédito (limitação documentada)
- Quando habilitada, recebíveis elegíveis são antecipados automaticamente
- Economiza tempo eliminando solicitações de antecipação manual
- Taxas de antecipação padrão ainda se aplicam

**Configuração:**
- Alternância booleana única para antecipação automática de cartão de crédito
- Uma vez habilitada, aplica-se a todos os novos recebíveis elegíveis
- Pode ser desabilitada a qualquer momento

### Métodos

| Método | Descrição |
|--------|-----------|
| `get()` | Obter configuração atual de antecipação automática |
| `update(params)` | Habilitar ou desabilitar antecipação automática |

### Exemplos

#### Verificar Status de Antecipação Automática

```typescript
import { AsaasClient } from 'asaas-sdk'

const client = new AsaasClient({
  accessToken: process.env.ASAAS_ACCESS_TOKEN,
  environment: 'SANDBOX'
})

// Get current configuration
const config = await client.anticipationConfig.get()

console.log('Automatic Anticipation:')
console.log(`  Credit Card: ${config.creditCardAutomaticEnabled ? 'Enabled' : 'Disabled'}`)

if (config.creditCardAutomaticEnabled) {
  console.log('  → New credit card receivables will be automatically anticipated')
} else {
  console.log('  → Manual anticipation required')
}
```

#### Habilitar Antecipação Automática

```typescript
// Enable automatic anticipation for credit card
const updated = await client.anticipationConfig.update({
  creditCardAutomaticEnabled: true
})

console.log('Automatic anticipation enabled')
console.log('All future credit card receivables will be anticipated automatically')
```

#### Desabilitar Antecipação Automática

```typescript
// Disable automatic anticipation
const updated = await client.anticipationConfig.update({
  creditCardAutomaticEnabled: false
})

console.log('Automatic anticipation disabled')
console.log('Manual anticipation request required for new receivables')
```

#### Alternar Baseado em Lógica de Negócio

```typescript
// Enable during high-demand periods
async function enableAutoAnticipationForHighSeason() {
  const config = await client.anticipationConfig.get()

  if (!config.creditCardAutomaticEnabled) {
    await client.anticipationConfig.update({
      creditCardAutomaticEnabled: true
    })
    console.log('Auto-anticipation enabled for high season')
  }
}

// Disable during periods with good cash flow
async function disableAutoAnticipationForNormalPeriods() {
  const config = await client.anticipationConfig.get()

  if (config.creditCardAutomaticEnabled) {
    await client.anticipationConfig.update({
      creditCardAutomaticEnabled: false
    })
    console.log('Auto-anticipation disabled - normal cash flow')
  }
}
```

### Notas Importantes

1. **Limitação de Escopo**: A API atual suporta apenas antecipação automática para recebíveis de cartão de crédito. Antecipação automática de boleto bancário não está disponível através desta configuração.

2. **Taxas se Aplicam**: Antecipação automática ainda incorre em taxas de antecipação padrão baseadas em dias e avaliação de risco.

3. **Elegibilidade**: Nem todos os recebíveis podem ser elegíveis para antecipação automática. Verifique limites e resultados de simulação.

4. **Recebíveis Existentes**: Alterar a configuração afeta apenas novos recebíveis criados após a mudança.

### Limitações no Sandbox

- Configuração pode ser alternada no sandbox
- Comportamento de antecipação automática pode ser testado com pagamentos de cartão de crédito de teste
- Movimentação real de fundos no sandbox segue as mesmas regras da produção mas com temporização simulada

## Relacionado

- **[Pagamentos](./payments.md)**: Criar cobranças que geram recebíveis para antecipação
- **[Parcelas](./installments.md)**: Gerenciar planos de pagamento e divisão de antecipação
- **[Subcontas](./subaccounts.md)**: Configurar garantia e divisões para subcontas
- **[Webhooks](./webhooks.md)**: Acompanhar eventos de transferência, pagamento de boleto, divisão e antecipação
- **[Tratamento de Erros](../guides/error-handling.md)**: Lidar com erros de validação de transferência e autorização
