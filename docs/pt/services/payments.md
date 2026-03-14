# Domínio de Pagamentos

Este guia cobre os cinco serviços que compõem o domínio de Pagamentos no SDK Asaas: Payments, Cards, Installments, Chargebacks e Payment Documents.

## Índice

- [Serviço de Pagamentos](#serviço-de-pagamentos)
- [Serviço de Cartões](#serviço-de-cartões)
- [Serviço de Parcelamentos](#serviço-de-parcelamentos)
- [Serviço de Chargebacks](#serviço-de-chargebacks)
- [Serviço de Documentos de Pagamento](#serviço-de-documentos-de-pagamento)
- [Recursos Relacionados](#recursos-relacionados)

## Serviço de Pagamentos

O serviço de Pagamentos (`client.payments`) gerencia o ciclo de vida completo das cobranças, incluindo criação, atualizações, exclusão suave, restauração e várias operações específicas de pagamento.

### Conceitos-Chave

**Tipos de Cobrança**

Ao criar um pagamento, você pode especificar:
- `UNDEFINED` - Cliente escolhe o método de pagamento
- `BOLETO` - Boleto bancário
- `CREDIT_CARD` - Cartão de crédito
- `PIX` - Pagamento instantâneo

Ao ler dados de pagamento, tipos adicionais podem ser retornados:
- `DEBIT_CARD` - Cartão de débito
- `TRANSFER` - Transferência bancária
- `DEPOSIT` - Depósito

**Status de Pagamento**

Pagamentos progridem por vários status. Note que isso é uma união de strings, não um enum fechado, já que o Asaas pode introduzir novos status:

- `PENDING` - Aguardando pagamento
- `RECEIVED` - Pagamento recebido
- `CONFIRMED` - Pagamento confirmado
- `OVERDUE` - Pagamento vencido
- `REFUNDED` - Pagamento reembolsado
- `RECEIVED_IN_CASH` - Pagamento em dinheiro recebido
- `REFUND_REQUESTED` - Reembolso solicitado
- `REFUND_IN_PROGRESS` - Reembolso em andamento
- `CHARGEBACK_REQUESTED` - Chargeback solicitado
- `CHARGEBACK_DISPUTE` - Chargeback em disputa
- `AWAITING_CHARGEBACK_REVERSAL` - Aguardando reversão de chargeback
- `DUNNING_REQUESTED` - Cobrança solicitada
- `DUNNING_RECEIVED` - Cobrança recebida
- `AWAITING_RISK_ANALYSIS` - Em análise de risco

**Fluxo de Boleto**

Ao criar um pagamento de boleto, a resposta inclui:
- `bankSlipUrl` - URL para visualizar/baixar o PDF do boleto
- `identificationField` - Código de barras/linha digitável para pagamento
- `nossoNumero` - Número de identificação bancária

**Fluxo de Cartão de Crédito**

Duas formas de processar pagamentos com cartão de crédito:

1. **Captura direta**: Inclua `creditCard`, `creditCardHolderInfo` e `remoteIp` na requisição de criação para processamento imediato. Recomendado timeout de 60 segundos.
2. **Redirecionamento**: Use a `invoiceUrl` retornada na resposta para redirecionar o cliente para a página de pagamento do Asaas.

**Exclusão Suave**

Pagamentos usam exclusão suave. Use `remove()` para marcar como excluído e `restore()` para reativar.

### Referência de Métodos

| Método | Descrição |
|--------|-------------|
| `create(params)` | Cria uma nova cobrança |
| `get(id)` | Recupera um pagamento por ID |
| `list(params?)` | Lista pagamentos com filtros opcionais (paginado) |
| `update(id, params)` | Atualiza um pagamento existente |
| `remove(id)` | Exclui um pagamento de forma suave |
| `restore(id)` | Restaura um pagamento previamente excluído |
| `getStatus(id)` | Obtém o status atual de um pagamento |
| `getBillingInfo(id)` | Recupera informações de cobrança |
| `getIdentificationField(id)` | Obtém código de barras/linha digitável do boleto |
| `getViewingInfo(id)` | Obtém informações de visualização do pagamento |
| `confirmCashReceipt(id, params)` | Confirma um recebimento em dinheiro |
| `undoCashReceipt(id)` | Desfaz uma confirmação de recebimento em dinheiro |
| `refund(id, params?)` | Reembolsa um pagamento (total ou parcial) |
| `refundBankSlip(id)` | Reembolsa especificamente um pagamento de boleto |
| `listRefunds(id)` | Lista todos os reembolsos de um pagamento (paginado) |
| `getChargeback(id)` | Obtém informações de chargeback de um pagamento |
| `simulate(params)` | Simula taxas de pagamento antes da criação |
| `getLimits()` | Obtém limites atuais de criação de pagamento |

### Exemplos

#### Criar um Pagamento de Boleto

```typescript
import { AsaasClient } from '@rodrigogs/asaas-sdk';

const client = new AsaasClient({
  accessToken: process.env.ASAAS_ACCESS_TOKEN!,
  environment: 'SANDBOX',
});

const payment = await client.payments.create({
  customer: 'cus_000005836142',
  billingType: 'BOLETO',
  value: 150.00,
  dueDate: '2026-04-15',
  description: 'Monthly service fee',
  externalReference: 'ORDER-12345',
});

console.log('Boleto URL:', payment.bankSlipUrl);
console.log('Barcode:', payment.identificationField);
console.log('Nosso Número:', payment.nossoNumero);
```

#### Criar um Pagamento PIX

```typescript
const pixPayment = await client.payments.create({
  customer: 'cus_000005836142',
  billingType: 'PIX',
  value: 250.00,
  dueDate: '2026-03-20',
  description: 'Product purchase',
});

// Get PIX QR Code information
const pixQrCode = await client.pix.getQrCode(pixPayment.id);
console.log('PIX QR Code:', pixQrCode.payload);
console.log('QR Code Image:', pixQrCode.encodedImage);
```

#### Criar Pagamento com Cartão de Crédito com Captura Direta

```typescript
const creditCardPayment = await client.payments.create({
  customer: 'cus_000005836142',
  billingType: 'CREDIT_CARD',
  value: 500.00,
  dueDate: '2026-03-25',
  description: 'Premium subscription',
  creditCard: {
    holderName: 'João Silva',
    number: '5162306219378829',
    expiryMonth: '12',
    expiryYear: '2028',
    ccv: '318',
  },
  creditCardHolderInfo: {
    name: 'João Silva',
    email: 'joao@example.com',
    cpfCnpj: '12345678901',
    postalCode: '01310-100',
    addressNumber: '123',
    phone: '11987654321',
  },
  remoteIp: '192.168.1.100',
});

console.log('Payment status:', creditCardPayment.status);
```

#### Reembolsar um Pagamento

```typescript
// Full refund
await client.payments.refund(payment.id);

// Partial refund
await client.payments.refund(payment.id, {
  value: 50.00,
  description: 'Partial refund for cancelled item',
});

// List all refunds for a payment
const refunds = await client.payments.listRefunds(payment.id);
for (const refund of refunds.data) {
  console.log(`Refund: ${refund.value} - Status: ${refund.status}`);
}
```

#### Atualizar Detalhes do Pagamento

```typescript
const updated = await client.payments.update(payment.id, {
  value: 175.00,
  dueDate: '2026-04-20',
  description: 'Updated monthly service fee',
});
```

#### Confirmar Recebimento em Dinheiro

```typescript
await client.payments.confirmCashReceipt(payment.id, {
  paymentDate: '2026-03-13',
  value: 150.00,
  notifyCustomer: true,
});

// If needed, undo the confirmation
await client.payments.undoCashReceipt(payment.id);
```

#### Simular Taxas de Pagamento

```typescript
const simulation = await client.payments.simulate({
  billingType: 'CREDIT_CARD',
  value: 1000.00,
  installmentCount: 3,
});

console.log('Net value:', simulation.netValue);
console.log('Fee:', simulation.fee);
console.log('Installments:', simulation.installments);
```

#### Verificar Limites de Pagamento

```typescript
const limits = await client.payments.getLimits();
console.log('Daily limit:', limits.dailyLimit);
console.log('Used today:', limits.dailyUsed);
console.log('Available:', limits.dailyAvailable);
```

### Testes em Sandbox

A maioria das operações de pagamento são totalmente testáveis no ambiente sandbox. No entanto, os seguintes recursos NÃO estão disponíveis para teste:

- Layout do QR Code do boleto
- Configurações de desconto no boleto
- Cálculos de juros e multa no boleto
- Cálculos de juros e multa no PIX

## Serviço de Cartões

O serviço de Cartões (`client.cards`) gerencia tokenização de cartão de crédito, processamento de pagamento e fluxos de pré-autorização.

### Conceitos-Chave

**Tokenização de Cartão**

Armazene dados de cartão de forma segura para uso futuro. Cartões tokenizados são vinculados a um cliente específico e não podem ser reutilizados em diferentes clientes.

**Pré-Autorização**

Crie um pagamento com `authorizedOnly: true` para pré-autorizar o valor sem capturar. Você deve capturar dentro de 3 dias ou a autorização expira.

**Requisitos de Segurança**

Ao capturar dados de cartão através de sua própria interface (não a página hospedada do Asaas), você DEVE usar HTTPS para garantir a transmissão segura de informações sensíveis de pagamento.

### Referência de Métodos

| Método | Descrição |
|--------|-------------|
| `payWithCreditCard(paymentId, params)` | Paga um pagamento existente usando cartão de crédito |
| `tokenize(params)` | Tokeniza um cartão de crédito para uso futuro |
| `captureAuthorizedPayment(paymentId)` | Captura um pagamento pré-autorizado |
| `getPreAuthorizationConfig()` | Obtém configuração de pré-autorização |
| `updatePreAuthorizationConfig(params)` | Atualiza configurações de pré-autorização |

### Exemplos

#### Tokenizar um Cartão de Crédito

```typescript
const tokenizedCard = await client.cards.tokenize({
  customer: 'cus_000005836142',
  creditCard: {
    holderName: 'Maria Santos',
    number: '5162306219378829',
    expiryMonth: '06',
    expiryYear: '2027',
    ccv: '123',
  },
  creditCardHolderInfo: {
    name: 'Maria Santos',
    email: 'maria@example.com',
    cpfCnpj: '98765432100',
    postalCode: '04567-890',
    addressNumber: '456',
    phone: '11912345678',
  },
  remoteIp: '192.168.1.50',
});

console.log('Card token:', tokenizedCard.creditCardToken);
```

#### Usar Cartão Tokenizado em Pagamento

```typescript
// Create payment with tokenized card
const payment = await client.payments.create({
  customer: 'cus_000005836142',
  billingType: 'CREDIT_CARD',
  value: 300.00,
  dueDate: '2026-03-20',
  creditCardToken: tokenizedCard.creditCardToken,
  remoteIp: '192.168.1.50',
});
```

#### Pagar Pagamento Existente com Cartão de Crédito

```typescript
// First create a payment without payment method
const payment = await client.payments.create({
  customer: 'cus_000005836142',
  billingType: 'UNDEFINED',
  value: 200.00,
  dueDate: '2026-03-25',
});

// Then pay with credit card
await client.cards.payWithCreditCard(payment.id, {
  creditCard: {
    holderName: 'Carlos Oliveira',
    number: '5162306219378829',
    expiryMonth: '09',
    expiryYear: '2026',
    ccv: '456',
  },
  creditCardHolderInfo: {
    name: 'Carlos Oliveira',
    email: 'carlos@example.com',
    cpfCnpj: '11122233344',
    postalCode: '05678-123',
    addressNumber: '789',
    phone: '11998765432',
  },
  remoteIp: '192.168.1.75',
});
```

#### Fluxo de Pré-Autorização

```typescript
// 1. Create pre-authorized payment
const preAuth = await client.payments.create({
  customer: 'cus_000005836142',
  billingType: 'CREDIT_CARD',
  value: 500.00,
  dueDate: '2026-03-20',
  creditCard: {
    holderName: 'Ana Costa',
    number: '5162306219378829',
    expiryMonth: '03',
    expiryYear: '2027',
    ccv: '789',
  },
  creditCardHolderInfo: {
    name: 'Ana Costa',
    email: 'ana@example.com',
    cpfCnpj: '55566677788',
    postalCode: '06789-456',
    addressNumber: '321',
    phone: '11987654321',
  },
  remoteIp: '192.168.1.100',
  authorizedOnly: true,
});

console.log('Pre-authorized:', preAuth.id);

// 2. Capture within 3 days
await client.cards.captureAuthorizedPayment(preAuth.id);
console.log('Payment captured');
```

#### Configurar Definições de Pré-Autorização

```typescript
// Get current configuration
const config = await client.cards.getPreAuthorizationConfig();
console.log('Pre-auth enabled:', config.enabled);

// Update configuration
await client.cards.updatePreAuthorizationConfig({
  enabled: true,
  captureAutomatically: false,
  daysToCapture: 2,
});
```

## Serviço de Parcelamentos

O serviço de Parcelamentos (`client.installments`) gerencia planos de parcelamento, que são recursos separados dos pagamentos individuais.

### Conceitos-Chave

Parcelamentos representam uma série de cobranças recorrentes. Cada parcelamento gera objetos de pagamento individuais que podem ser gerenciados independentemente.

**Campos Obrigatórios**

- `installmentCount` - Número de parcelas
- `customer` - ID do cliente
- `value` - Valor total (dividido entre as parcelas)
- `billingType` - Método de pagamento
- `dueDate` - Primeira data de vencimento

**Carnê de Pagamento**

O método `downloadPaymentBook()` retorna um `BinaryResponse` contendo os dados do arquivo PDF. Você deve lidar com o salvamento do arquivo manualmente.

### Referência de Métodos

| Método | Descrição |
|--------|-------------|
| `create(params)` | Cria um novo plano de parcelamento |
| `get(id)` | Recupera um parcelamento por ID |
| `list(params?)` | Lista parcelamentos com filtros (paginado) |
| `remove(id)` | Remove um plano de parcelamento |
| `listPayments(id)` | Lista todos os pagamentos em um parcelamento (paginado) |
| `cancelPendingCharges(id)` | Cancela cobranças pendentes no plano |
| `refund(id, params?)` | Reembolsa um plano de parcelamento |
| `downloadPaymentBook(id)` | Baixa o PDF do carnê de pagamento |

### Exemplos

#### Criar um Plano de Parcelamento

```typescript
const installment = await client.installments.create({
  customer: 'cus_000005836142',
  billingType: 'BOLETO',
  value: 1200.00,
  dueDate: '2026-04-01',
  installmentCount: 12,
  installmentValue: 100.00,
  description: 'Annual subscription - 12x',
  externalReference: 'SUB-2026-001',
});

console.log('Installment ID:', installment.id);
console.log('Total installments:', installment.installmentCount);
```

#### Listar Pagamentos em um Parcelamento

```typescript
const payments = await client.installments.listPayments(installment.id);

for (const payment of payments.data) {
  console.log(`Payment ${payment.installmentNumber}/${installment.installmentCount}`);
  console.log(`  Due: ${payment.dueDate}`);
  console.log(`  Value: ${payment.value}`);
  console.log(`  Status: ${payment.status}`);
}
```

#### Cancelar Cobranças Pendentes

```typescript
// Cancel all remaining unpaid installments
await client.installments.cancelPendingCharges(installment.id);
console.log('Pending charges cancelled');
```

#### Baixar Carnê de Pagamento

```typescript
import { writeFile } from 'fs/promises';

const paymentBook = await client.installments.downloadPaymentBook(installment.id);

// BinaryResponse contains: data (Buffer), filename, contentType
await writeFile(
  paymentBook.filename || 'payment-book.pdf',
  paymentBook.data
);

console.log('Payment book downloaded:', paymentBook.filename);
console.log('Content type:', paymentBook.contentType);
console.log('File size:', paymentBook.data.length, 'bytes');
```

#### Reembolsar um Parcelamento

```typescript
// Refund the entire installment plan
await client.installments.refund(installment.id);

// Partial refund
await client.installments.refund(installment.id, {
  value: 300.00,
  description: 'Partial refund for early cancellation',
});
```

## Serviço de Chargebacks

O serviço de Chargebacks (`client.chargebacks`) gerencia o gerenciamento de chargebacks e resolução de disputas.

### Conceitos-Chave

**Status de Chargeback**

Chargebacks progridem pelos seguintes status:

- `REQUESTED` - Chargeback iniciado pelo cliente
- `IN_DISPUTE` - Em disputa com documentação fornecida
- `DISPUTE_LOST` - Disputa perdida, chargeback confirmado
- `REVERSED` - Chargeback revertido a seu favor
- `DONE` - Processo concluído

**Documentação de Disputa**

Ao submeter uma disputa, você pode fazer upload de até 11 arquivos como evidência. Os arquivos devem ser fornecidos como objetos Blob (ou objetos File em navegadores).

### Referência de Métodos

| Método | Descrição |
|--------|-------------|
| `get(id)` | Recupera um chargeback por ID |
| `list(params?)` | Lista chargebacks com filtros (paginado) |
| `dispute(id, files)` | Submete disputa com upload de arquivos (máx. 11 Blobs) |

### Exemplos

#### Listar Chargebacks

```typescript
const chargebacks = await client.chargebacks.list({
  status: 'REQUESTED',
  dateCreatedGe: '2026-01-01',
  dateCreatedLe: '2026-03-31',
});

for (const chargeback of chargebacks.data) {
  console.log('Chargeback:', chargeback.id);
  console.log('  Payment:', chargeback.payment);
  console.log('  Status:', chargeback.status);
  console.log('  Value:', chargeback.value);
  console.log('  Reason:', chargeback.reason);
}
```

#### Obter Detalhes do Chargeback

```typescript
const chargeback = await client.chargebacks.get('chb_000001234567');

console.log('Chargeback ID:', chargeback.id);
console.log('Status:', chargeback.status);
console.log('Disputed:', chargeback.disputed);
console.log('Created:', chargeback.dateCreated);
```

#### Submeter Disputa com Arquivos

```typescript
import { readFile } from 'fs/promises';

// Load evidence files
const invoice = await readFile('./evidence/invoice.pdf');
const deliveryProof = await readFile('./evidence/delivery.pdf');
const contractSigned = await readFile('./evidence/contract.pdf');

// Create Blobs (Node.js v18+ or browser)
const files = [
  new Blob([invoice], { type: 'application/pdf' }),
  new Blob([deliveryProof], { type: 'application/pdf' }),
  new Blob([contractSigned], { type: 'application/pdf' }),
];

// Submit dispute
await client.chargebacks.dispute('chb_000001234567', files);
console.log('Dispute submitted with 3 documents');
```

#### Exemplo de Upload de Arquivo no Navegador

```typescript
// In a browser environment with file input
const handleDisputeSubmit = async (chargebackId: string, fileList: FileList) => {
  const files = Array.from(fileList).slice(0, 11); // Max 11 files

  await client.chargebacks.dispute(chargebackId, files);
  console.log(`Dispute submitted with ${files.length} files`);
};
```

## Serviço de Documentos de Pagamento

O serviço de Documentos de Pagamento (`client.paymentDocuments`) gerencia anexos de documentos para pagamentos.

### Conceitos-Chave

Documentos são carregados via multipart/form-data e anexados a pagamentos específicos. Isso é útil para documentação de suporte como notas fiscais, recibos ou contratos.

### Referência de Métodos

| Método | Descrição |
|--------|-------------|
| `upload(paymentId, params)` | Faz upload de um documento (multipart) |
| `list(paymentId)` | Lista todos os documentos de um pagamento (paginado) |
| `get(paymentId, documentId)` | Obtém um documento específico |
| `update(paymentId, documentId, params)` | Atualiza configurações do documento |
| `remove(paymentId, documentId)` | Remove um documento |

### Exemplos

#### Fazer Upload de um Documento

```typescript
import { readFile } from 'fs/promises';

const fileData = await readFile('./invoice.pdf');
const fileBlob = new Blob([fileData], { type: 'application/pdf' });

const document = await client.paymentDocuments.upload('pay_000001234567', {
  file: fileBlob,
  type: 'INVOICE',
  description: 'Service invoice',
  availableAfterPayment: true,
});

console.log('Document ID:', document.id);
console.log('Document URL:', document.publicUrl);
```

#### Listar Documentos de Pagamento

```typescript
const documents = await client.paymentDocuments.list('pay_000001234567');

for (const doc of documents.data) {
  console.log('Document:', doc.id);
  console.log('  Type:', doc.type);
  console.log('  Description:', doc.description);
  console.log('  URL:', doc.publicUrl);
}
```

#### Atualizar Configurações do Documento

```typescript
await client.paymentDocuments.update(
  'pay_000001234567',
  'doc_000001234567',
  {
    description: 'Updated service invoice',
    availableAfterPayment: false,
  }
);
```

#### Remover um Documento

```typescript
await client.paymentDocuments.remove(
  'pay_000001234567',
  'doc_000001234567'
);
console.log('Document removed');
```

## Recursos Relacionados

- [Guia de Paginação](../pagination.md) - Aprenda a lidar com respostas paginadas
- [Tratamento de Erros](../error-handling.md) - Entenda padrões de tratamento de erros
- [Serviço PIX](./pix.md) - Gere QR codes PIX para pagamentos
- [Documentação Oficial do Asaas](https://docs.asaas.com) - Referência completa da API

## Melhores Práticas

1. **Sempre defina timeouts** ao processar pagamentos com cartão de crédito (recomendado 60 segundos)
2. **Use tokenização** para pagamentos recorrentes para evitar armazenar dados sensíveis de cartão
3. **Implemente tratamento de erros adequado** para falhas de pagamento e retentativas
4. **Monitore o status de pagamento** usando webhooks para atualizações em tempo real
5. **Valide dados de cartão** antes da submissão para reduzir transações falhadas
6. **Use pré-autorização** para cenários que requerem confirmação de pagamento antes da captura
7. **Mantenha arquivos de evidência organizados** para tratamento eficiente de disputas de chargeback
8. **Teste minuciosamente no sandbox** antes de ir para produção
9. **Trate BinaryResponse adequadamente** ao baixar carnês de pagamento
10. **Defina descrições de reembolso apropriadas** para clareza do cliente e rastreamento interno
