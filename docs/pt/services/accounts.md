# Contas e Notificações

Os serviços de Contas cobrem o gerenciamento de clientes, provisionamento de subcontas, registro de contas e configurações de notificações. Essas são operações fundamentais para gerenciar sua integração com o Asaas no nível de conta e cliente.

## Clientes

Clientes são a base das operações financeiras no Asaas. Antes de criar pagamentos, assinaturas ou faturas, você deve ter um identificador de cliente (`cus_...`).

### Conceitos-Chave

- **Exclusão Suave**: Clientes removidos podem ser restaurados usando o método `restore()`
- **Notificações Automáticas**: Quando você cria um cliente, o Asaas cria automaticamente um conjunto padrão de notificações para eventos do ciclo de vida do pagamento
- **Referência Externa**: Use `externalReference` para vincular clientes aos identificadores do seu sistema
- **Requisito de CPF/CNPJ**: O campo `cpfCnpj` é obrigatório mesmo para clientes estrangeiros

### Métodos

| Método | Descrição |
|--------|-------------|
| `create(params)` | Criar um novo cliente (obrigatório: name, cpfCnpj) |
| `list(params?)` | Listar clientes com filtros opcionais (paginado) |
| `get(id)` | Recuperar um único cliente por ID |
| `update(id, params)` | Atualizar um cliente existente |
| `remove(id)` | Excluir um cliente de forma suave |
| `restore(id)` | Restaurar um cliente excluído |
| `listNotifications(id)` | Listar configurações de notificação de um cliente |

### Exemplos

#### Criando um Cliente

```typescript
import { AsaasClient } from 'asaas-sdk';

const client = new AsaasClient({
  accessToken: 'your-access-token',
  environment: 'SANDBOX'
});

// Create a customer with minimal required fields
const result = await client.customers.create({
  name: 'João Silva',
  cpfCnpj: '12345678909',
});

console.log('Customer ID:', result.id);
console.log('Customer created:', result.dateCreated);
```

#### Criando um Cliente com Endereço Completo

```typescript
const customer = await client.customers.create({
  name: 'Maria Santos',
  cpfCnpj: '98765432100',
  email: 'maria.santos@example.com',
  phone: '1133334444',
  mobilePhone: '11999998888',
  address: 'Avenida Paulista',
  addressNumber: '1000',
  complement: 'Conjunto 101',
  province: 'Bela Vista',
  postalCode: '01310-100',
  externalReference: 'CRM-2026-001',
  notificationDisabled: false,
  observations: 'Cliente preferencial, cobranças via email'
});

console.log('Customer created:', customer.id);
```

#### Listando Clientes

```typescript
// List all customers (paginated)
const result = await client.customers.list();

for await (const customer of result) {
  console.log(`${customer.name} - ${customer.cpfCnpj}`);
}
```

#### Filtrando Clientes

```typescript
// Filter by CPF/CNPJ
const result = await client.customers.list({
  cpfCnpj: '12345678909',
  limit: 10
});

for await (const customer of result) {
  console.log('Found:', customer.name);
}

// Filter by email
const byEmail = await client.customers.list({
  email: 'maria@example.com'
});

// Filter by external reference
const byRef = await client.customers.list({
  externalReference: 'CRM-2026-001'
});
```

#### Atualizando um Cliente

```typescript
// Update customer information
const updated = await client.customers.update('cus_abc123', {
  email: 'newemail@example.com',
  mobilePhone: '11988887777',
  observations: 'Email atualizado em 2026-03-13'
});

console.log('Customer updated:', updated.id);
```

#### Removendo e Restaurando Clientes

```typescript
// Soft delete a customer
const removed = await client.customers.remove('cus_abc123');
console.log('Customer deleted:', removed.deleted); // true

// Restore a deleted customer
const restored = await client.customers.restore('cus_abc123');
console.log('Customer restored:', restored.deleted); // false
console.log('Customer name:', restored.name);
```

#### Recuperando Notificações do Cliente

```typescript
// List all notification settings for a customer
const notifications = await client.customers.listNotifications('cus_abc123');

console.log('Total notifications:', notifications.totalCount);

for await (const notification of notifications) {
  console.log(`Event: ${notification.event}`);
  console.log(`Email enabled: ${notification.emailEnabledForCustomer}`);
  console.log(`SMS enabled: ${notification.smsEnabledForCustomer}`);
  console.log(`Schedule offset: ${notification.scheduleOffset} days`);
  console.log('---');
}
```

## Subcontas

Subcontas são contas filhas vinculadas à sua conta raiz. Elas têm seu próprio `apiKey` e `walletId`, possibilitando integrações de plataforma com contextos isolados.

### Conceitos-Chave

- **Segurança da apiKey**: A `apiKey` da subconta é retornada apenas durante a criação. Armazene-a com segurança - você não pode recuperá-la depois sem usar endpoints privilegiados de gerenciamento de chaves de API
- **walletId**: Usado para splits e transferências internas entre contas Asaas
- **Dois Tipos**: Subcontas padrão (usuários acessam a interface Asaas) e subcontas White Label (totalmente integradas, sem marca Asaas)
- **Contexto de Autenticação Duplo**: Endpoints `/accounts` usam credenciais da conta raiz, endpoints `/myAccount` usam as credenciais da subconta
- **Expiração de Dados Comerciais**: Subcontas devem confirmar informações comerciais anualmente (`commercialInfoExpiration`)

### Métodos

| Método | Descrição |
|--------|-------------|
| `create(params)` | Criar uma nova subconta (retorna apiKey + walletId) |
| `list(params?)` | Listar subcontas com filtros opcionais (paginado) |
| `get(id)` | Recuperar uma única subconta por ID |
| `apiKeys.list(subaccountId)` | Listar chaves de API de uma subconta (privilegiado) |
| `apiKeys.create(subaccountId, params)` | Criar uma nova chave de API (privilegiado) |
| `apiKeys.update(subaccountId, accessTokenId, params)` | Atualizar uma chave de API (privilegiado) |
| `apiKeys.remove(subaccountId, accessTokenId)` | Remover uma chave de API (privilegiado) |

### Exemplos

#### Criando uma Subconta

```typescript
// Create a subaccount with required fields
const subaccount = await client.subaccounts.create({
  name: 'Carlos Ferreira',
  email: 'carlos@example.com',
  cpfCnpj: '12345678909',
  mobilePhone: '11988887777',
  incomeValue: 5000.00,
  address: 'Rua Augusta',
  addressNumber: '1500',
  province: 'Consolação',
  postalCode: '01304-000'
});

// CRITICAL: Store these values immediately
console.log('Subaccount ID:', subaccount.id);
console.log('API Key:', subaccount.apiKey); // Only available now!
console.log('Wallet ID:', subaccount.walletId); // For splits/transfers
console.log('Account Number:', subaccount.accountNumber);
console.log('Commercial Info Expires:', subaccount.commercialInfoExpiration?.scheduledDate);
```

#### Criando uma Subconta com Webhooks (White Label)

```typescript
// For white label integrations, configure webhooks during creation
const whitelabel = await client.subaccounts.create({
  name: 'Empresa Demo LTDA',
  email: 'contato@demo.com.br',
  cpfCnpj: '12345678000190',
  mobilePhone: '1133334444',
  incomeValue: 10000.00,
  companyType: 'LIMITED',
  address: 'Avenida Brigadeiro Faria Lima',
  addressNumber: '3000',
  province: 'Itaim Bibi',
  postalCode: '01451-000',
  webhooks: [
    {
      name: 'Account Status Webhook',
      url: 'https://api.yourplatform.com/webhooks/asaas',
      email: 'tech@yourplatform.com',
      sendType: 'SEQUENTIALLY',
      apiVersion: 3,
      enabled: true,
      interrupted: false,
      authToken: 'your-webhook-secret',
      events: [
        'ACCOUNT_STATUS_GENERAL_APPROVAL_APPROVED',
        'ACCOUNT_STATUS_GENERAL_APPROVAL_REJECTED',
        'ACCOUNT_STATUS_COMMERCIAL_INFO_EXPIRED'
      ]
    }
  ]
});

console.log('White label subaccount created:', whitelabel.id);
console.log('Store this API key:', whitelabel.apiKey);
```

#### Listando Subcontas

```typescript
// List all subaccounts
const result = await client.subaccounts.list();

for await (const account of result) {
  console.log(`${account.name} - Wallet: ${account.walletId}`);
}

// Filter by CPF/CNPJ
const filtered = await client.subaccounts.list({
  cpfCnpj: '12345678000190',
  limit: 20
});

// Filter by wallet ID
const byWallet = await client.subaccounts.list({
  walletId: 'wal_abc123'
});
```

#### Gerenciando Chaves de API (Operação Privilegiada)

```typescript
// List existing API keys for a subaccount
const keys = await client.subaccounts.apiKeys.list('acc_abc123');
console.log('Total keys:', keys.accessTokens.length);

for (const key of keys.accessTokens) {
  console.log(`Key: ${key.name} - Enabled: ${key.enabled}`);
  console.log(`Created: ${key.dateCreated}`);
  console.log(`Expires: ${key.expirationDate || 'Never'}`);
}

// Create a new API key
const newKey = await client.subaccounts.apiKeys.create('acc_abc123', {
  name: 'Production API Key',
  expirationDate: '2027-12-31'
});

console.log('New API Key:', newKey.apiKey); // Store this immediately!
console.log('Key ID:', newKey.id);

// Update an API key
await client.subaccounts.apiKeys.update('acc_abc123', 'token_xyz', {
  name: 'Updated Key Name',
  enabled: false,
  expirationDate: '2027-06-30'
});

// Remove an API key
await client.subaccounts.apiKeys.remove('acc_abc123', 'token_xyz');
console.log('API key revoked');
```

**Importante**: Endpoints de gerenciamento de chaves de API requerem:
- Habilitação temporária via interface Asaas (janela de 2 horas)
- Lista de IPs permitidos ativa
- Credenciais da conta raiz

## MyAccount

O serviço `myAccount` é usado pelas subcontas para gerenciar seu próprio registro, documentos e informações comerciais. Esses endpoints devem ser chamados usando a `apiKey` da subconta.

### Conceitos-Chave

- **Contexto de Autenticação**: Use as credenciais da subconta, não da conta raiz
- **Requisito White Label**: Essencial para integrações white label onde os usuários não acessam a interface Asaas
- **Fluxo de Onboarding**: Após criar uma subconta, aguarde pelo menos 15 segundos antes de verificar os documentos (permite validação da Receita Federal)
- **Roteamento de Documentos**: Se `onboardingUrl` existir, use esse link; caso contrário, envie via API
- **Confirmação Anual**: Informações comerciais devem ser confirmadas anualmente para evitar restrições na API

### Métodos

| Método | Descrição |
|--------|-------------|
| `getRegistrationStatus()` | Verificar status de registro da conta (commercialInfo, documentation, bankAccountInfo, general) |
| `listPendingDocuments()` | Listar grupos de documentos pendentes e seus status |
| `sendDocument(groupId, params)` | Enviar um arquivo de documento (multipart) |
| `viewSentDocument(fileId)` | Visualizar um documento enviado anteriormente |
| `updateSentDocument(fileId, params)` | Atualizar um documento enviado |
| `removeSentDocument(fileId)` | Remover um documento enviado |
| `getCommercialInfo()` | Obter dados pessoais/empresariais |
| `updateCommercialInfo(params)` | Atualizar dados pessoais/empresariais (confirmação anual) |
| `deleteWhiteLabelSubaccount(reason?)` | Excluir subconta white label |

### Exemplos

#### Verificando Status de Registro

```typescript
// Create a client with the subaccount's credentials
const subaccountClient = new AsaasClient({
  accessToken: 'subaccount-api-key-here',
  environment: 'SANDBOX'
});

// Check overall registration status
const status = await subaccountClient.myAccount.getRegistrationStatus();

console.log('Commercial Info:', status.commercialInfo); // PENDING, APPROVED, REJECTED, AWAITING_APPROVAL
console.log('Documentation:', status.documentation);
console.log('Bank Account:', status.bankAccountInfo);
console.log('General Status:', status.general); // APPROVED means fully activated

if (status.general === 'APPROVED') {
  console.log('Account fully approved and ready for all products!');
}
```

#### Listando Documentos Pendentes

```typescript
// Wait at least 15 seconds after subaccount creation
await new Promise(resolve => setTimeout(resolve, 15000));

// List pending document groups
const docs = await subaccountClient.myAccount.listPendingDocuments();

if (docs.rejectReasons && docs.rejectReasons.length > 0) {
  console.log('Rejection reasons:', docs.rejectReasons);
}

for (const group of docs.data) {
  console.log(`\nGroup: ${group.title}`);
  console.log(`Type: ${group.type}`);
  console.log(`Status: ${group.status}`);
  console.log(`Description: ${group.description}`);

  if (group.onboardingUrl) {
    console.log('Use this link to upload:', group.onboardingUrl);
    console.log('Link expires:', group.onboardingUrlExpirationDate);
  } else {
    console.log('Upload via API - Group ID:', group.id);
  }

  if (group.documents && group.documents.length > 0) {
    console.log('Submitted documents:', group.documents.length);
  }
}
```

#### Enviando Documentos via API

```typescript
import { readFileSync } from 'fs';

// Only send via API if onboardingUrl is NOT present
const documentFile = readFileSync('/path/to/document.pdf');

const result = await subaccountClient.myAccount.sendDocument('doc_group_123', {
  documentFile: documentFile,
  type: 'IDENTIFICATION' // Must match document group type
});

console.log('Document sent:', result.id);
console.log('Status:', result.status);
```

#### Gerenciando Documentos Enviados

```typescript
// View a sent document
const document = await subaccountClient.myAccount.viewSentDocument('file_abc123');
console.log('Document type:', document.type);
console.log('Status:', document.status);

// Update a sent document
await subaccountClient.myAccount.updateSentDocument('file_abc123', {
  documentFile: updatedFileBuffer,
  type: 'IDENTIFICATION'
});

// Remove a sent document
await subaccountClient.myAccount.removeSentDocument('file_abc123');
console.log('Document removed');
```

#### Gerenciando Informações Comerciais

```typescript
// Get current commercial information
const info = await subaccountClient.myAccount.getCommercialInfo();

console.log('Status:', info.status);
console.log('Person Type:', info.personType);
console.log('Name:', info.name);
console.log('Income:', info.incomeValue);
console.log('Expiration:', info.commercialInfoExpiration);

if (info.denialReason) {
  console.log('Denial reason:', info.denialReason);
}

// Update commercial information (annual confirmation)
const updated = await subaccountClient.myAccount.updateCommercialInfo({
  incomeValue: 6000.00,
  email: 'newemail@example.com',
  mobilePhone: '11999998888',
  address: 'Rua Nova',
  addressNumber: '100',
  province: 'Centro',
  postalCode: '01000-000'
});

console.log('Commercial info updated:', updated.status);
console.log('New expiration:', updated.commercialInfoExpiration);
```

#### Excluindo uma Subconta White Label

```typescript
// Delete the white label subaccount (called by the subaccount itself)
await subaccountClient.myAccount.deleteWhiteLabelSubaccount(
  'Customer requested account closure'
);

console.log('White label subaccount deleted');
```

## Notificações

Notificações são configurações fixas anexadas a cada cliente que controlam quando o Asaas envia mensagens relacionadas a pagamentos via email, SMS, WhatsApp ou chamadas de voz.

### Conceitos-Chave

- **Criação Automática**: O Asaas cria um conjunto padrão de notificações quando você registra um cliente
- **Configuração Fixa**: Você não pode criar ou excluir notificações; você só pode atualizar o conjunto existente
- **Evento + Offset**: Notificações são identificadas por `event` + `scheduleOffset` (ex: `PAYMENT_DUEDATE_WARNING` com 10 dias antes do vencimento)
- **Canais**: Email, SMS, WhatsApp e chamadas de voz (suporte varia por ambiente)
- **Chave de Bloqueio do Cliente**: Use `notificationDisabled` nos registros de clientes para bloquear todas as notificações

### Conjunto Padrão de Notificações

Quando um cliente é criado, o Asaas cria automaticamente estas notificações:

- `PAYMENT_CREATED` (offset 0) - Quando o pagamento é criado
- `PAYMENT_UPDATED` (offset 0) - Quando o pagamento é atualizado
- `PAYMENT_RECEIVED` (offset 0) - Quando o pagamento é recebido
- `PAYMENT_OVERDUE` (offset 0) - Na data de vencimento quando vencido
- `PAYMENT_OVERDUE` (offset 7) - 7 dias após o vencimento
- `PAYMENT_DUEDATE_WARNING` (offset 0) - Na data de vencimento
- `PAYMENT_DUEDATE_WARNING` (offset 10) - 10 dias antes do vencimento
- `SEND_LINHA_DIGITAVEL` (offset 0) - Enviar código de barras do boleto

### Métodos

| Método | Descrição |
|--------|-------------|
| `listByCustomer(customerId)` | Listar todas as configurações de notificação de um cliente |
| `update(id, params)` | Atualizar uma única notificação |
| `updateBatch(params)` | Atualizar múltiplas notificações de uma vez (recomendado) |

### Exemplos

#### Listando Notificações do Cliente

```typescript
// List all notifications for a customer
const notifications = await client.notifications.listByCustomer('cus_abc123');

console.log('Total notifications:', notifications.totalCount);

for await (const notification of notifications) {
  console.log(`\nEvent: ${notification.event}`);
  console.log(`Enabled: ${notification.enabled}`);
  console.log(`Schedule offset: ${notification.scheduleOffset} days`);

  // Check channels
  if (notification.emailEnabledForCustomer) {
    console.log('  - Email to customer: enabled');
  }
  if (notification.smsEnabledForCustomer) {
    console.log('  - SMS to customer: enabled');
  }
  if (notification.whatsappEnabledForCustomer) {
    console.log('  - WhatsApp to customer: enabled');
  }
  if (notification.phoneCallEnabledForCustomer) {
    console.log('  - Voice call to customer: enabled');
  }

  // Provider notifications
  if (notification.emailEnabledForProvider) {
    console.log('  - Email to provider: enabled');
  }
  if (notification.smsEnabledForProvider) {
    console.log('  - SMS to provider: enabled');
  }
}
```

#### Atualizando uma Única Notificação

```typescript
// Disable SMS for overdue notifications
const updated = await client.notifications.update('not_xyz789', {
  smsEnabledForCustomer: false,
  emailEnabledForCustomer: true,
  whatsappEnabledForCustomer: true
});

console.log('Notification updated:', updated.event);
```

#### Atualização em Lote de Notificações (Recomendado)

```typescript
// First, get the current notifications
const current = await client.notifications.listByCustomer('cus_abc123');

// Build batch update array
const notifications = [];

for await (const notification of current) {
  // Disable all SMS, enable email for all payment events
  if (notification.event.startsWith('PAYMENT_')) {
    notifications.push({
      id: notification.id,
      smsEnabledForCustomer: false,
      emailEnabledForCustomer: true,
      whatsappEnabledForCustomer: false
    });
  }

  // Change schedule offset for due date warnings
  if (notification.event === 'PAYMENT_DUEDATE_WARNING' && notification.scheduleOffset === 10) {
    notifications.push({
      id: notification.id,
      scheduleOffset: 5, // Change from 10 days to 5 days
      emailEnabledForCustomer: true
    });
  }
}

// Apply all changes at once
await client.notifications.updateBatch({
  customer: 'cus_abc123',
  notifications: notifications
});

console.log(`Updated ${notifications.length} notifications`);
```

#### Personalizando Notificações para Fluxo Somente Email

```typescript
// Disable all channels except email for a customer
const allNotifications = await client.notifications.listByCustomer('cus_abc123');

const updates = [];
for await (const notification of allNotifications) {
  updates.push({
    id: notification.id,
    enabled: true,
    emailEnabledForCustomer: true,
    smsEnabledForCustomer: false,
    whatsappEnabledForCustomer: false,
    phoneCallEnabledForCustomer: false,
    emailEnabledForProvider: false,
    smsEnabledForProvider: false
  });
}

await client.notifications.updateBatch({
  customer: 'cus_abc123',
  notifications: updates
});

console.log('Customer configured for email-only notifications');
```

#### Configurando Notificações de Lembrete

```typescript
// Configure payment reminders: 7 days before + 3 days after overdue
const notifications = await client.notifications.listByCustomer('cus_abc123');

const updates = [];
for await (const notification of notifications) {
  // Enable 7-day advance warning
  if (notification.event === 'PAYMENT_DUEDATE_WARNING' && notification.scheduleOffset === 10) {
    updates.push({
      id: notification.id,
      scheduleOffset: 7, // 7 days before
      emailEnabledForCustomer: true,
      smsEnabledForCustomer: true,
      whatsappEnabledForCustomer: false
    });
  }

  // Enable overdue notification after 3 days
  if (notification.event === 'PAYMENT_OVERDUE' && notification.scheduleOffset === 7) {
    updates.push({
      id: notification.id,
      scheduleOffset: 3, // 3 days after overdue
      emailEnabledForCustomer: true,
      smsEnabledForCustomer: false,
      whatsappEnabledForCustomer: true
    });
  }
}

await client.notifications.updateBatch({
  customer: 'cus_abc123',
  notifications: updates
});

console.log('Reminder schedule configured');
```

### Valores de Schedule Offset

Valores válidos de `scheduleOffset` são: **0, 1, 5, 7, 10, 15, 30**

O offset se aplica de forma diferente dependendo do evento:
- `PAYMENT_DUEDATE_WARNING`: dias **antes** da data de vencimento
- `PAYMENT_OVERDUE`: dias **após** a data de vencimento estar vencida

### Eventos de Notificação

| Evento | Descrição |
|-------|-------------|
| `PAYMENT_CREATED` | Pagamento foi criado |
| `PAYMENT_UPDATED` | Pagamento foi atualizado |
| `PAYMENT_RECEIVED` | Pagamento foi recebido/confirmado |
| `PAYMENT_OVERDUE` | Pagamento está vencido |
| `PAYMENT_DUEDATE_WARNING` | Data de vencimento está se aproximando |
| `SEND_LINHA_DIGITAVEL` | Enviar código de barras/link do boleto |

**Nota**: `PAYMENT_CREATED` não é enviado para pagamentos criados por assinaturas.

### Limitações do Sandbox

No ambiente sandbox:
- **Email**: Pode ser testado
- **SMS**: Pode ser testado
- **WhatsApp**: Não pode ser testado
- **Chamadas de voz**: Suporte de teste limitado/não claro

Comunicações de subcontas do sandbox são enviadas para o endereço de email da conta raiz.

## Relacionados

- [Payments](./payments.md) - Criar e gerenciar pagamentos de clientes
- [Subscriptions](./subscriptions.md) - Planos de pagamento recorrentes
- [Webhooks](./webhooks.md) - Notificações de eventos em tempo real para sua plataforma
- [Transfers](./transfers.md) - Transferências internas entre contas Asaas usando walletId
