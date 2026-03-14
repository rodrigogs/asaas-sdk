# Pix

O serviço Pix oferece funcionalidade abrangente para gerenciar pagamentos Pix, chaves, transações e recursos avançados como Pix Automático e Pix Recorrente na plataforma Asaas.

## Conceitos Principais

### QR Codes Dinâmicos vs Estáticos

**QR Code Dinâmico**: Gerado quando você cria um pagamento com `billingType: 'PIX'` através do serviço de Pagamentos. Cada pagamento recebe um QR code único que expira após um tempo específico.

**QR Code Estático**: QR codes reutilizáveis que podem aceitar múltiplos pagamentos. Ideais para lojas físicas, materiais impressos ou cenários de pagamentos recorrentes.

### Tipos de Chave Pix

Ao criar uma chave Pix através da API, apenas o tipo `EVP` (Endereço Virtual de Pagamento) é atualmente suportado. Isso gera uma chave aleatória gerenciada pela plataforma Asaas.

Outros tipos de chave (CPF, CNPJ, e-mail, telefone) podem ser registrados através do painel Asaas, mas não estão disponíveis via endpoint da API.

### Status de Transações

As transações Pix passam por vários estados:

- `AWAITING_BALANCE_VALIDATION` - Verificando saldo da conta
- `SCHEDULED` - Pagamento agendado para data futura
- `REQUESTED` - Solicitação de pagamento enviada
- `DONE` - Transação concluída com sucesso
- `REFUSED` - Transação recusada
- `CANCELLED` - Transação cancelada

### Pix Automático vs Pix Recorrente

**Pix Automático**: Um modelo de autorização recorrente onde o pagador pré-autoriza cobranças em intervalos definidos. O pagador inicia a autorização via QR code, e as cobranças subsequentes acontecem automaticamente sem intervenção manual.

**Pix Recorrente**: Um modelo de pagamento agendado onde você configura pagamentos recorrentes para contas externas. O sistema executa automaticamente as transferências na frequência especificada.

Esses são produtos distintos com casos de uso diferentes e não devem ser confundidos.

## Chaves Pix

Gerenciar chaves Pix registradas na sua conta Asaas.

### Métodos

| Método | Descrição |
|--------|-----------|
| `client.pix.keys.create(params)` | Registrar uma nova chave Pix (apenas tipo EVP) |
| `client.pix.keys.list(params?)` | Listar todas as chaves Pix registradas (paginado) |
| `client.pix.keys.get(id)` | Recuperar uma chave Pix específica por ID |
| `client.pix.keys.remove(id)` | Excluir uma chave Pix |

### Exemplos

**Criando uma Chave Pix**

```typescript
import { AsaasClient } from '@rodrigogs/asaas-sdk';

const client = new AsaasClient({
  accessToken: 'your_access_token',
  environment: 'SANDBOX'
});

// Registrar uma chave EVP
const key = await client.pix.keys.create({
  type: 'EVP'
});

console.log('New Pix key:', key.key);
console.log('Status:', key.status); // AWAITING_ACTIVATION
```

**Listando Chaves Pix**

```typescript
const result = await client.pix.keys.list();

for await (const key of result) {
  console.log('Key:', key.key);
  console.log('Type:', key.type);
  console.log('Status:', key.status);
  console.log('Can be deleted:', key.canBeDeleted);
  if (!key.canBeDeleted) {
    console.log('Reason:', key.cannotBeDeletedReason);
  }
}
```

**Obtendo uma Chave Específica**

```typescript
const key = await client.pix.keys.get('key_123456');

console.log('Key details:', {
  id: key.id,
  key: key.key,
  type: key.type,
  status: key.status,
  dateCreated: key.dateCreated
});

// Verificar se o QR code está disponível
if (key.qrCode) {
  console.log('QR Code payload:', key.qrCode.payload);
}
```

**Removendo uma Chave Pix**

```typescript
try {
  const result = await client.pix.keys.remove('key_123456');
  if (result.deleted) {
    console.log('Key successfully deleted');
  }
} catch (error) {
  if (error.isValidation) {
    console.error('Cannot delete key:', error.message);
  }
}
```

## QR Codes Estáticos

Criar e gerenciar QR codes estáticos para receber pagamentos Pix.

### Métodos

| Método | Descrição |
|--------|-----------|
| `client.pix.staticQrCodes.create(params)` | Criar um QR code estático |
| `client.pix.staticQrCodes.remove(id)` | Excluir um QR code estático |

### Exemplos

**Criando um QR Code Estático**

```typescript
// QR code estático básico
const qrCode = await client.pix.staticQrCodes.create({
  addressKey: 'your-pix-key@example.com',
  description: 'Pagamento de serviços',
  value: 150.00,
  format: 'ALL' // Retorna tanto imagem quanto payload
});

console.log('QR Code ID:', qrCode.id);
console.log('Payload:', qrCode.payload);
console.log('Base64 Image:', qrCode.encodedImage);
```

**Criando um QR Code Reutilizável**

```typescript
// QR code que aceita múltiplos pagamentos
const qrCode = await client.pix.staticQrCodes.create({
  addressKey: 'your-pix-key',
  description: 'Pagamento de mensalidade',
  value: 299.90,
  format: 'ALL',
  allowsMultiplePayments: true,
  expirationDate: '2026-12-31',
  externalReference: 'MEMBERSHIP-2026'
});

console.log('Reusable QR Code:', qrCode.id);
console.log('Allows multiple payments:', qrCode.allowsMultiplePayments);
console.log('External reference:', qrCode.externalReference);
```

**Criando um QR Code com Expiração**

```typescript
// QR code que expira após 24 horas
const qrCode = await client.pix.staticQrCodes.create({
  addressKey: 'your-pix-key',
  description: 'Pagamento de produto',
  value: 89.90,
  format: 'PAYLOAD', // Retorna apenas payload, sem imagem
  expirationSeconds: 86400 // 24 horas
});

console.log('QR Code expires in 24 hours');
console.log('Payload:', qrCode.payload);
```

**Removendo um QR Code Estático**

```typescript
const result = await client.pix.staticQrCodes.remove('qr_123456');

if (result.deleted) {
  console.log('Static QR code successfully removed');
}
```

## Operações com QR Code

Decodificar e pagar QR codes Pix.

### Métodos

| Método | Descrição |
|--------|-----------|
| `client.pix.getPaymentQrCode(paymentId)` | Obter QR code para um pagamento Pix dinâmico |
| `client.pix.qrCodes.decode(params)` | Decodificar um payload de QR code Pix |
| `client.pix.qrCodes.pay(params)` | Pagar um QR code Pix |

### Exemplos

**Obtendo um QR Code de Pagamento**

```typescript
// Primeiro, criar um pagamento Pix
const payment = await client.payments.create({
  customer: 'cus_123456',
  billingType: 'PIX',
  value: 250.00,
  dueDate: '2026-03-20'
});

// Então obter o QR code
const qrCode = await client.pix.getPaymentQrCode(payment.id);

console.log('QR Code payload:', qrCode.payload);
console.log('Base64 image:', qrCode.encodedImage);
console.log('Expires at:', qrCode.expirationDate);
console.log('Description:', qrCode.description);
```

**Decodificando um QR Code**

```typescript
const decoded = await client.pix.qrCodes.decode({
  payload: '00020126580014br.gov.bcb.pix...'
});

console.log('QR Code type:', decoded.type);
console.log('Pix key:', decoded.pixKey);
console.log('Value:', decoded.value);
console.log('Total value:', decoded.totalValue);
console.log('Can be paid:', decoded.canBePaid);

if (!decoded.canBePaid) {
  console.log('Reason:', decoded.cannotBePaidReason);
}

// Verificar detalhes do recebedor
if (decoded.receiver) {
  console.log('Receiver name:', decoded.receiver.name);
  console.log('Receiver document:', decoded.receiver.cpfCnpj);
}
```

**Decodificando com Valor de Troco**

```typescript
// Decodificar com um valor diferente (para QR codes flexíveis)
const decoded = await client.pix.qrCodes.decode({
  payload: '00020126580014br.gov.bcb.pix...',
  changeValue: 150.00,
  expectedPaymentDate: '2026-03-15'
});

console.log('Original value:', decoded.value);
console.log('Change value:', decoded.changeValue);
console.log('Total to pay:', decoded.totalValue);
```

**Pagando um QR Code**

```typescript
const transaction = await client.pix.qrCodes.pay({
  qrCode: {
    payload: '00020126580014br.gov.bcb.pix...'
  },
  value: 150.00,
  description: 'Pagamento de fornecedor'
});

console.log('Transaction ID:', transaction.id);
console.log('End-to-end ID:', transaction.endToEndIdentifier);
console.log('Status:', transaction.status);
console.log('Effective date:', transaction.effectiveDate);

if (transaction.transactionReceiptUrl) {
  console.log('Receipt:', transaction.transactionReceiptUrl);
}
```

**Agendando um Pagamento via QR Code**

```typescript
const transaction = await client.pix.qrCodes.pay({
  qrCode: {
    payload: '00020126580014br.gov.bcb.pix...'
  },
  value: 200.00,
  description: 'Pagamento agendado',
  scheduleDate: '2026-03-20'
});

console.log('Scheduled for:', transaction.scheduledDate);
console.log('Can be cancelled:', transaction.canBeCanceled);
```

## Transações

Listar, recuperar e cancelar transações Pix.

### Métodos

| Método | Descrição |
|--------|-----------|
| `client.pix.transactions.list(params?)` | Listar transações Pix (paginado) |
| `client.pix.transactions.get(id)` | Recuperar uma transação específica |
| `client.pix.transactions.cancel(id)` | Cancelar uma transação agendada |

### Exemplos

**Listando Transações**

```typescript
const result = await client.pix.transactions.list();

for await (const transaction of result) {
  console.log('Transaction:', transaction.id);
  console.log('Type:', transaction.type); // DEBIT, CREDIT, etc.
  console.log('Status:', transaction.status);
  console.log('Value:', transaction.value);
  console.log('Effective date:', transaction.effectiveDate);
}
```

**Filtrando Transações**

```typescript
// Filtrar por status e tipo
const result = await client.pix.transactions.list({
  status: 'DONE',
  type: 'CREDIT',
  limit: 50
});

for await (const transaction of result) {
  console.log('Completed credit:', {
    id: transaction.id,
    value: transaction.value,
    effectiveDate: transaction.effectiveDate,
    endToEndIdentifier: transaction.endToEndIdentifier
  });
}
```

**Obtendo Detalhes de Transação**

```typescript
const transaction = await client.pix.transactions.get('txn_123456');

console.log('Transaction details:', {
  id: transaction.id,
  endToEndIdentifier: transaction.endToEndIdentifier,
  value: transaction.value,
  status: transaction.status,
  type: transaction.type,
  originType: transaction.originType,
  description: transaction.description,
  effectiveDate: transaction.effectiveDate
});

// Verificar detalhes da conta externa
if (transaction.externalAccount) {
  console.log('External account:', {
    name: transaction.externalAccount.name,
    cpfCnpj: transaction.externalAccount.cpfCnpj,
    pixKey: transaction.externalAccount.pixKey
  });
}

// Verificar se o reembolso é possível
if (transaction.canBeRefunded) {
  console.log('Transaction can be refunded');
} else if (transaction.refundDisabledReason) {
  console.log('Refund disabled:', transaction.refundDisabledReason);
}
```

**Cancelando uma Transação Agendada**

```typescript
try {
  const result = await client.pix.transactions.cancel('txn_123456');

  console.log('Transaction cancelled:', result.id);
  console.log('New status:', result.status); // CANCELLED
} catch (error) {
  if (error.isValidation) {
    console.error('Cannot cancel:', error.message);
  }
}
```

## Pix Automático

Gerenciar autorizações de Pix Automático e instruções de pagamento para cobranças recorrentes.

### Métodos

| Método | Descrição |
|--------|-----------|
| `client.pix.automatic.authorizations.create(params)` | Criar uma autorização |
| `client.pix.automatic.authorizations.list(params?)` | Listar autorizações (paginado) |
| `client.pix.automatic.authorizations.get(id)` | Recuperar uma autorização |
| `client.pix.automatic.authorizations.cancel(id)` | Cancelar uma autorização |
| `client.pix.automatic.paymentInstructions.list(params?)` | Listar instruções de pagamento |
| `client.pix.automatic.paymentInstructions.get(id)` | Obter detalhes da instrução |

### Exemplos

**Criando uma Autorização de Pix Automático**

```typescript
const authorization = await client.pix.automatic.authorizations.create({
  frequency: 'MONTHLY',
  contractId: 'CONTRACT-2026-001',
  startDate: '2026-04-01',
  customerId: 'cus_123456',
  immediateQrCode: true,
  value: 99.90,
  description: 'Assinatura mensal de software',
  finishDate: '2027-03-31'
});

console.log('Authorization ID:', authorization.id);
console.log('QR Code payload:', authorization.payload);
console.log('Base64 image:', authorization.encodedImage);
console.log('Status:', authorization.status);
```

**Criando com Limite Mínimo**

```typescript
const authorization = await client.pix.automatic.authorizations.create({
  frequency: 'WEEKLY',
  contractId: 'CONTRACT-2026-002',
  startDate: '2026-03-20',
  customerId: 'cus_789012',
  immediateQrCode: true,
  value: 49.90,
  minLimitValue: 30.00,
  description: 'Assinatura semanal'
});

console.log('Authorization created with minimum limit:', authorization.minLimitValue);
```

**Listando Autorizações**

```typescript
const result = await client.pix.automatic.authorizations.list();

for await (const auth of result) {
  console.log('Authorization:', {
    id: auth.id,
    customerId: auth.customerId,
    frequency: auth.frequency,
    value: auth.value,
    status: auth.status,
    startDate: auth.startDate,
    finishDate: auth.finishDate
  });
}
```

**Obtendo Detalhes de Autorização**

```typescript
const auth = await client.pix.automatic.authorizations.get('auth_123456');

console.log('Authorization:', {
  id: auth.id,
  contractId: auth.contractId,
  frequency: auth.frequency,
  value: auth.value,
  status: auth.status,
  endToEndIdentifier: auth.endToEndIdentifier
});

if (auth.cancellationDate) {
  console.log('Cancelled on:', auth.cancellationDate);
  console.log('Reason:', auth.cancellationReason);
}
```

**Cancelando uma Autorização**

```typescript
const result = await client.pix.automatic.authorizations.cancel('auth_123456');

if (result.deleted) {
  console.log('Authorization successfully cancelled');
}
```

**Listando Instruções de Pagamento**

```typescript
// Listar todas as instruções para uma autorização específica
const result = await client.pix.automatic.paymentInstructions.list({
  authorizationId: 'auth_123456'
});

for await (const instruction of result) {
  console.log('Instruction:', {
    id: instruction.id,
    endToEndIdentifier: instruction.endToEndIdentifier,
    dueDate: instruction.dueDate,
    status: instruction.status,
    paymentId: instruction.paymentId
  });
}
```

**Filtrando Instruções por Cliente**

```typescript
const result = await client.pix.automatic.paymentInstructions.list({
  customerId: 'cus_123456',
  status: 'PENDING'
});

for await (const instruction of result) {
  console.log('Pending instruction for customer:', instruction.id);
}
```

**Obtendo Detalhes de Instrução**

```typescript
const instruction = await client.pix.automatic.paymentInstructions.get('inst_123456');

console.log('Payment instruction:', {
  id: instruction.id,
  authorization: instruction.authorization,
  dueDate: instruction.dueDate,
  status: instruction.status,
  paymentId: instruction.paymentId
});
```

## Pix Recorrente

Gerenciar pagamentos Pix Recorrentes e seus itens individuais.

### Métodos

| Método | Descrição |
|--------|-----------|
| `client.pix.recurring.list(params?)` | Listar pagamentos recorrentes (paginado) |
| `client.pix.recurring.get(id)` | Recuperar um pagamento recorrente |
| `client.pix.recurring.cancel(id)` | Cancelar um pagamento recorrente |
| `client.pix.recurring.listItems(id, params?)` | Listar itens de um pagamento recorrente |
| `client.pix.recurring.cancelItem(itemId)` | Cancelar um item específico |

### Exemplos

**Listando Pagamentos Recorrentes**

```typescript
const result = await client.pix.recurring.list();

for await (const recurring of result) {
  console.log('Recurring payment:', {
    id: recurring.id,
    status: recurring.status,
    value: recurring.value,
    frequency: recurring.frequency,
    quantity: recurring.quantity,
    startDate: recurring.startDate,
    finishDate: recurring.finishDate
  });
}
```

**Filtrando por Status**

```typescript
const result = await client.pix.recurring.list({
  status: 'SCHEDULED',
  limit: 20
});

for await (const recurring of result) {
  console.log('Scheduled recurring:', recurring.id);
  console.log('Can be cancelled:', recurring.canBeCancelled);
}
```

**Buscando Pagamentos Recorrentes**

```typescript
const result = await client.pix.recurring.list({
  searchText: 'fornecedor xyz',
  value: 500.00
});

for await (const recurring of result) {
  console.log('Found:', recurring.id);
  if (recurring.externalAccount) {
    console.log('Account:', recurring.externalAccount.name);
  }
}
```

**Obtendo Detalhes de Pagamento Recorrente**

```typescript
const recurring = await client.pix.recurring.get('rec_123456');

console.log('Recurring payment:', {
  id: recurring.id,
  status: recurring.status,
  origin: recurring.origin,
  value: recurring.value,
  frequency: recurring.frequency,
  quantity: recurring.quantity,
  startDate: recurring.startDate,
  finishDate: recurring.finishDate,
  canBeCancelled: recurring.canBeCancelled
});

if (recurring.externalAccount) {
  console.log('External account:', {
    name: recurring.externalAccount.name,
    cpfCnpj: recurring.externalAccount.cpfCnpj,
    pixKey: recurring.externalAccount.pixKey
  });
}
```

**Cancelando um Pagamento Recorrente**

```typescript
const result = await client.pix.recurring.cancel('rec_123456');

if (result.deleted) {
  console.log('Recurring payment successfully cancelled');
}
```

**Listando Itens Recorrentes**

```typescript
const result = await client.pix.recurring.listItems('rec_123456');

for await (const item of result) {
  console.log('Item:', {
    id: item.id,
    status: item.status,
    scheduledDate: item.scheduledDate,
    recurrenceNumber: item.recurrenceNumber,
    quantity: item.quantity,
    value: item.value,
    canBeCancelled: item.canBeCancelled
  });

  if (item.refusalReasonDescription) {
    console.log('Refused:', item.refusalReasonDescription);
  }
}
```

**Filtrando Itens por Status**

```typescript
const result = await client.pix.recurring.listItems('rec_123456', {
  status: 'PENDING'
});

for await (const item of result) {
  console.log('Pending item:', item.id);
  console.log('Scheduled for:', item.scheduledDate);
}
```

**Cancelando um Item Recorrente**

```typescript
try {
  const result = await client.pix.recurring.cancelItem('item_123456');

  if (result.deleted) {
    console.log('Recurring item successfully cancelled');
  }
} catch (error) {
  if (error.isValidation) {
    console.error('Cannot cancel item:', error.message);
  }
}
```

## Limitações do Sandbox

### Registro de Chave Pix Obrigatório

Ao testar pagamentos via QR Code no ambiente Sandbox, você deve registrar uma chave Pix antes de tentar pagar. Sem uma chave registrada, a API retornará um erro `404 Not Found`.

**Fluxo correto de teste:**

```typescript
// 1. Registrar uma chave Pix primeiro
const key = await client.pix.keys.create({ type: 'EVP' });
console.log('Registered key:', key.key);

// 2. Aguardar ativação da chave (no sandbox, geralmente imediato)
await new Promise(resolve => setTimeout(resolve, 2000));

// 3. Agora você pode testar pagamentos via QR code
const qrCode = await client.pix.staticQrCodes.create({
  addressKey: key.key,
  value: 100.00,
  description: 'Test payment'
});

const transaction = await client.pix.qrCodes.pay({
  qrCode: { payload: qrCode.payload },
  value: 100.00
});
```

### Tratamento de Erros

```typescript
try {
  const transaction = await client.pix.qrCodes.pay({
    qrCode: { payload: 'some-payload' },
    value: 50.00
  });
} catch (error) {
  if (error.isNotFound) {
    console.error('No Pix key registered. Please create a key first.');
  } else if (error.isValidation) {
    console.error('Validation error:', error.message);
  } else {
    throw error;
  }
}
```

## Relacionados

- [Payments](./payments.md) - Criar pagamentos Pix com `billingType: 'PIX'`
- [Transfers](./transfers.md) - Transferências bancárias e pagamentos externos
- [Customers](./customers.md) - Gerenciar clientes para Pix Automático
