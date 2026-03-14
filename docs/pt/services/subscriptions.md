# Assinaturas

O serviço de Assinaturas (`client.subscriptions`) gerencia assinaturas de pagamentos recorrentes, permitindo cobrar clientes periodicamente. Este guia cobre o gerenciamento do ciclo de vida de assinaturas, manipulação de cartões de crédito, rastreamento de pagamentos e configuração de notas fiscais.

## Índice

- [Conceitos Principais](#conceitos-principais)
- [Serviço de Assinaturas](#serviço-de-assinaturas)
- [Configurações de Nota Fiscal](#configurações-de-nota-fiscal)
- [Limitações do Sandbox](#limitações-do-sandbox)
- [Recursos Relacionados](#recursos-relacionados)

## Conceitos Principais

### Tipos de Ciclo

Assinaturas suportam múltiplos ciclos de cobrança:

- `WEEKLY` - Cobrar a cada 7 dias
- `BIWEEKLY` - Cobrar a cada 14 dias
- `MONTHLY` - Cobrar a cada 30 dias
- `BIMONTHLY` - Cobrar a cada 60 dias
- `QUARTERLY` - Cobrar a cada 90 dias
- `SEMIANNUALLY` - Cobrar a cada 180 dias
- `YEARLY` - Cobrar a cada 365 dias

### Ciclo de Vida do Status

Assinaturas progridem através dos seguintes status:

- `ACTIVE` - Assinatura está gerando cobranças
- `INACTIVE` - Assinatura está pausada e não está gerando cobranças
- `EXPIRED` - Assinatura terminou (atingiu `endDate` ou `maxPayments`)

Você pode atualizar o status entre `ACTIVE` e `INACTIVE` para pausar ou retomar uma assinatura.

### Tipos de Cobrança

Ao criar uma assinatura, você pode especificar:

- `UNDEFINED` - Cliente escolhe a forma de pagamento
- `BOLETO` - Boleto bancário
- `CREDIT_CARD` - Cartão de crédito
- `PIX` - Pagamento instantâneo

Ao ler dados de assinatura, tipos adicionais podem ser retornados:

- `DEBIT_CARD` - Cartão de débito
- `TRANSFER` - Transferência bancária
- `DEPOSIT` - Depósito

### Fluxo de Assinatura com Cartão de Crédito

Para assinaturas pagas com cartão de crédito, use o método dedicado `createWithCreditCard()`. Este método:

1. Cria a assinatura
2. Tokeniza o cartão de crédito
3. Processa a primeira cobrança imediatamente
4. Armazena o cartão para cobranças recorrentes futuras

Para atualizar o cartão sem cobrar, use `updateCreditCard()`. Isso atualiza tanto a assinatura quanto quaisquer cobranças pendentes vinculadas a ela.

### Regra de Bloqueio de Split

Ao usar split em assinaturas, o Asaas valida que o valor total do split não excede o valor líquido recebível. Se a validação falhar:

1. A assinatura é bloqueada
2. O split é desabilitado automaticamente
3. Nenhuma nova cobrança recorrente é gerada

Isso previne sobre-alocação de fundos entre os destinatários do split.

### Exclusão Suave

Assinaturas usam exclusão suave. Use `remove()` para marcar como deletado. Diferente de clientes e pagamentos, **assinaturas não possuem um endpoint de restauração** na versão atual da API.

## Serviço de Assinaturas

### Referência de Métodos

| Método | Descrição |
|--------|-----------|
| `create(params)` | Criar uma nova assinatura |
| `createWithCreditCard(params)` | Criar assinatura com dados de cartão de crédito |
| `get(id)` | Recuperar uma assinatura por ID |
| `list(params?)` | Listar assinaturas com filtros (paginado) |
| `update(id, params)` | Atualizar uma assinatura existente |
| `updateCreditCard(id, params)` | Atualizar cartão de crédito sem cobrar |
| `remove(id)` | Deletar uma assinatura (soft-delete) |
| `listPayments(id, params?)` | Listar pagamentos gerados pela assinatura (paginado) |
| `downloadPaymentBook(id)` | Baixar carnê de pagamento da assinatura em PDF |
| `listInvoices(id, params?)` | Listar notas fiscais das cobranças da assinatura (paginado) |

### Exemplos

#### Criar uma Assinatura Mensal

```typescript
import { AsaasClient } from 'asaas-sdk';

const client = new AsaasClient({
  accessToken: process.env.ASAAS_ACCESS_TOKEN!,
  environment: 'SANDBOX',
});

const subscription = await client.subscriptions.create({
  customer: 'cus_000005836142',
  billingType: 'BOLETO',
  value: 99.90,
  nextDueDate: '2026-04-01',
  cycle: 'MONTHLY',
  description: 'Plano Premium - Assinatura Mensal',
  externalReference: 'SUB-2026-001',
});

console.log('ID da Assinatura:', subscription.id);
console.log('Status:', subscription.status);
console.log('Próximo vencimento:', subscription.nextDueDate);
```

#### Criar Assinatura com Cartão de Crédito

```typescript
const creditCardSubscription = await client.subscriptions.createWithCreditCard({
  customer: 'cus_000005836142',
  billingType: 'CREDIT_CARD',
  value: 149.90,
  nextDueDate: '2026-04-01',
  cycle: 'MONTHLY',
  description: 'Plano Pro - Compromisso Anual',
  creditCard: {
    holderName: 'João Silva',
    number: '5162306219378829',
    expiryMonth: '12',
    expiryYear: '2028',
    ccv: '318',
  },
  creditCardHolderInfo: {
    name: 'João Silva',
    email: 'joao.silva@example.com',
    cpfCnpj: '12345678901',
    postalCode: '01310-100',
    addressNumber: '1578',
    addressComplement: 'Apto 123',
    province: 'Bela Vista',
    phone: '11987654321',
  },
  remoteIp: '192.168.1.100',
});

console.log('Assinatura criada:', creditCardSubscription.id);
console.log('Status do primeiro pagamento:', creditCardSubscription.status);
```

#### Atualizar Cartão de Crédito Sem Cobrar

```typescript
// Atualizar o cartão para cobranças futuras sem processar uma cobrança imediata
await client.subscriptions.updateCreditCard(subscription.id, {
  creditCard: {
    holderName: 'João Silva',
    number: '5162306219378829',
    expiryMonth: '06',
    expiryYear: '2029',
    ccv: '456',
  },
  creditCardHolderInfo: {
    name: 'João Silva',
    email: 'joao.silva@example.com',
    cpfCnpj: '12345678901',
    postalCode: '01310-100',
    addressNumber: '1578',
    phone: '11987654321',
  },
  remoteIp: '192.168.1.100',
});

console.log('Cartão de crédito atualizado com sucesso');
```

#### Atualizar Detalhes da Assinatura

```typescript
const updated = await client.subscriptions.update(subscription.id, {
  value: 119.90,
  description: 'Plano Premium - Preço atualizado',
  cycle: 'QUARTERLY',
  updatePendingPayments: true, // Aplicar mudanças às cobranças pendentes
});

console.log('Valor atualizado:', updated.value);
console.log('Ciclo atualizado:', updated.cycle);
```

#### Pausar e Retomar Assinatura

```typescript
// Pausar assinatura (parar de gerar cobranças)
await client.subscriptions.update(subscription.id, {
  status: 'INACTIVE',
});

console.log('Assinatura pausada');

// Retomar assinatura
await client.subscriptions.update(subscription.id, {
  status: 'ACTIVE',
});

console.log('Assinatura retomada');
```

#### Listar Pagamentos da Assinatura

```typescript
// Listar todos os pagamentos gerados por esta assinatura
const result = await client.subscriptions.listPayments(subscription.id, {
  status: 'PENDING',
});

for await (const payment of result) {
  console.log('ID do Pagamento:', payment.id);
  console.log('  Vencimento:', payment.dueDate);
  console.log('  Valor:', payment.value);
  console.log('  Status:', payment.status);
  console.log('  Tipo de cobrança:', payment.billingType);
}
```

#### Filtrar Lista de Assinaturas

```typescript
// Listar assinaturas ativas para um cliente específico
const activeSubscriptions = await client.subscriptions.list({
  customer: 'cus_000005836142',
  status: 'ACTIVE',
  billingType: 'CREDIT_CARD',
  limit: 20,
});

for await (const sub of activeSubscriptions) {
  console.log(`Assinatura ${sub.id}:`);
  console.log(`  Valor: R$ ${sub.value}`);
  console.log(`  Ciclo: ${sub.cycle}`);
  console.log(`  Próximo vencimento: ${sub.nextDueDate}`);
}
```

#### Baixar Carnê de Pagamento

O carnê de pagamento é um PDF contendo todos os boletos de pagamento da assinatura.

```typescript
import { writeFile } from 'fs/promises';

const paymentBook = await client.subscriptions.downloadPaymentBook(subscription.id);

// BinaryResponse contém: data (Buffer), filename, contentType
await writeFile(
  paymentBook.filename || 'subscription-payment-book.pdf',
  paymentBook.data
);

console.log('Carnê de pagamento salvo:', paymentBook.filename);
console.log('Tipo de conteúdo:', paymentBook.contentType);
console.log('Tamanho do arquivo:', paymentBook.data.length, 'bytes');
```

#### Criar Assinatura com Split

```typescript
const splitSubscription = await client.subscriptions.create({
  customer: 'cus_000005836142',
  billingType: 'PIX',
  value: 200.00,
  nextDueDate: '2026-04-15',
  cycle: 'MONTHLY',
  description: 'Assinatura de Comissão de Marketplace',
  split: [
    {
      walletId: 'wal_000001111111',
      fixedValue: 30.00,
      description: 'Taxa da plataforma',
    },
    {
      walletId: 'wal_000002222222',
      percentualValue: 15.00, // 15% do valor líquido
      description: 'Comissão do parceiro',
    },
  ],
});

console.log('Assinatura com split criada:', splitSubscription.id);
console.log('Configuração de split:', splitSubscription.split);
```

#### Definir Data de Término da Assinatura

```typescript
// Encerrar assinatura após data específica
const timedSubscription = await client.subscriptions.create({
  customer: 'cus_000005836142',
  billingType: 'BOLETO',
  value: 79.90,
  nextDueDate: '2026-04-01',
  cycle: 'MONTHLY',
  endDate: '2026-12-31', // Assinatura termina nesta data
  description: 'Promoção anual - termina em Dez 2026',
});

// Ou limitar por número de pagamentos
const countedSubscription = await client.subscriptions.create({
  customer: 'cus_000005836142',
  billingType: 'CREDIT_CARD',
  value: 299.90,
  nextDueDate: '2026-04-01',
  cycle: 'MONTHLY',
  maxPayments: 12, // Gerar exatamente 12 pagamentos
  description: 'Plano de compromisso de 12 meses',
  creditCardToken: 'tok_000001234567',
  remoteIp: '192.168.1.100',
});
```

## Configurações de Nota Fiscal

O sub-serviço de configurações de nota fiscal (`client.subscriptions.invoiceSettings`) configura a geração automática de nota fiscal para cobranças de assinatura.

### Referência de Métodos

| Método | Descrição |
|--------|-----------|
| `create(subscriptionId, params)` | Criar configurações de nota fiscal para assinatura |
| `get(subscriptionId)` | Recuperar configurações de nota fiscal |
| `update(subscriptionId, params)` | Atualizar configurações de nota fiscal |
| `remove(subscriptionId)` | Remover configurações de nota fiscal |

### Exemplos

#### Configurar Geração Automática de Nota Fiscal

```typescript
const invoiceSettings = await client.subscriptions.invoiceSettings.create(
  subscription.id,
  {
    municipalServiceId: '1234',
    municipalServiceCode: '01.07',
    municipalServiceName: 'Desenvolvimento de software sob encomenda',
    effectiveDatePeriod: 'ON_PAYMENT_CONFIRMATION',
    receivedOnly: true,
    observations: 'Serviço de desenvolvimento de software personalizado',
    taxes: {
      retainIss: false,
      iss: 2.00,
      cofins: 3.00,
      csll: 1.00,
      inss: 0.00,
      ir: 0.00,
      pis: 0.65,
    },
  }
);

console.log('Configurações de nota fiscal criadas');
console.log('Serviço municipal:', invoiceSettings.municipalServiceName);
```

#### Obter Configurações de Nota Fiscal

```typescript
const settings = await client.subscriptions.invoiceSettings.get(subscription.id);

console.log('ID do serviço municipal:', settings.municipalServiceId);
console.log('Período de criação da nota fiscal:', settings.invoiceCreationPeriod);
console.log('Impostos:', settings.taxes);
console.log('Deduções:', settings.deductions);
```

#### Atualizar Configurações de Nota Fiscal

```typescript
await client.subscriptions.invoiceSettings.update(subscription.id, {
  municipalServiceName: 'Consultoria em TI',
  effectiveDatePeriod: 'ON_PAYMENT_DUE_DATE',
  observations: 'Serviços de consultoria técnica especializada',
  taxes: {
    retainIss: true,
    iss: 5.00,
    cofins: 3.00,
    csll: 1.00,
    inss: 0.00,
    ir: 0.00,
    pis: 0.65,
  },
});

console.log('Configurações de nota fiscal atualizadas');
```

#### Listar Notas Fiscais da Assinatura

```typescript
// Listar todas as notas fiscais geradas para cobranças da assinatura
const invoices = await client.subscriptions.listInvoices(subscription.id, {
  status: 'AUTHORIZED',
  effectiveDateGe: '2026-01-01',
  effectiveDateLe: '2026-12-31',
});

for await (const invoice of invoices) {
  console.log('ID da Nota Fiscal:', invoice.id);
  console.log('  Status:', invoice.status);
  console.log('  Data de emissão:', invoice.effectiveDate);
  console.log('  Valor do serviço:', invoice.serviceAmount);
}
```

#### Remover Configurações de Nota Fiscal

```typescript
await client.subscriptions.invoiceSettings.remove(subscription.id);
console.log('Configurações de nota fiscal removidas - notas fiscais não serão mais geradas');
```

### Períodos de Data Efetiva da Nota Fiscal

O parâmetro `effectiveDatePeriod` controla quando as notas fiscais são emitidas:

- `ON_PAYMENT_CONFIRMATION` - Gerar nota fiscal quando o pagamento for confirmado
- `ON_PAYMENT_DUE_DATE` - Gerar nota fiscal na data de vencimento
- `BEFORE_PAYMENT_DUE_DATE` - Gerar nota fiscal antes da data de vencimento (usar com `daysBeforeDueDate`)
- `ON_DUE_DATE_MONTH` - Gerar nota fiscal no mês da data de vencimento
- `ON_NEXT_MONTH` - Gerar nota fiscal no próximo mês

**Importante**: O parâmetro de requisição é `effectiveDatePeriod`, mas o campo de resposta é `invoiceCreationPeriod`. Esta é uma peculiaridade da API que o SDK preserva como está.

### Configuração de Impostos

O objeto `taxes` suporta os seguintes tipos de impostos brasileiros:

- `retainIss` - Se deve reter o imposto ISS (boolean)
- `iss` - Porcentagem de ISS (0-100)
- `cofins` - Porcentagem de COFINS
- `csll` - Porcentagem de CSLL
- `inss` - Porcentagem de INSS
- `ir` - Porcentagem de IR
- `pis` - Porcentagem de PIS

Todas as porcentagens de impostos são valores decimais (ex: `2.00` para 2%).

## Limitações do Sandbox

O ambiente sandbox suporta totalmente testes de assinatura com as seguintes observações:

### Gerando Novas Cobranças

De acordo com a documentação do Asaas, **para testar a geração de novas cobranças de assinatura no sandbox**, você deve baixar o carnê de pagamento usando `downloadPaymentBook()`. Isso aciona a geração da próxima cobrança na sequência.

```typescript
// Acionar geração da próxima cobrança no sandbox
const paymentBook = await client.subscriptions.downloadPaymentBook(subscription.id);
console.log('Carnê de pagamento gerado - próxima cobrança deve ser criada');

// Aguarde um momento, depois verifique novos pagamentos
const payments = await client.subscriptions.listPayments(subscription.id);
console.log('Total de pagamentos gerados:', payments.totalCount);
```

### Funcionalidades Totalmente Testáveis

- Criação de assinatura (todos os tipos de cobrança)
- Assinaturas com cartão de crédito e atualizações de cartão
- Atualizações de assinatura e mudanças de status
- Exclusão suave
- Configuração de split
- Configuração de notas fiscais
- Listagem de pagamentos

### Não Testável no Sandbox

As seguintes funcionalidades não podem ser totalmente testadas no sandbox e requerem validação em produção:

- Geração de cobrança recorrente real conforme agendado (use o download do carnê de pagamento para simular)
- Emissão real de nota fiscal com as autoridades fiscais
- Validação de bloqueio de split em cenários de produção

## Recursos Relacionados

- [Serviço de Pagamentos](./payments.md) - Trabalhar com cobranças individuais de pagamento
- [Guia de Paginação](../pagination.md) - Lidar com respostas de lista paginadas
- [Tratamento de Erros](../error-handling.md) - Entender padrões de tratamento de erros
- [Documentação Oficial de Assinaturas do Asaas](https://docs.asaas.com/docs/assinaturas) - Referência completa da API

## Boas Práticas

1. **Sempre use `createWithCreditCard()` para assinaturas com cartão** em vez de misturar métodos de criação e pagamento
2. **Defina `updatePendingPayments: true`** ao atualizar valores de assinatura para aplicar mudanças às cobranças pendentes
3. **Monitore alocações de split** para evitar bloqueio de assinatura devido a sobre-alocação
4. **Use `externalReference`** para vincular assinaturas ao seu sistema interno de cobrança
5. **Configure as configurações de nota fiscal cedo** se você precisar de geração automática de nota fiscal
6. **Teste a geração de cobranças** no sandbox usando a técnica de download do carnê de pagamento
7. **Use `endDate` ou `maxPayments`** para criar assinaturas com prazo limitado
8. **Pause assinaturas** com `status: INACTIVE` em vez de deletar quando for necessária uma suspensão temporária
9. **Liste pagamentos regularmente** para rastrear histórico e status de cobranças de assinatura
10. **Trate erros de bloqueio de split** graciosamente ajustando a configuração de split ou valor da assinatura
