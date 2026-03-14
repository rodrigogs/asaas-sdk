# Comércio e Faturamento

Este guia cobre os cinco serviços que compõem o domínio de Comércio e Faturamento no SDK Asaas: Links de Pagamento, Checkouts, Configuração de Checkout, Notas Fiscais e Informações Fiscais.

## Índice

- [Serviço de Links de Pagamento](#serviço-de-links-de-pagamento)
- [Serviço de Checkouts](#serviço-de-checkouts)
- [Serviço de Configuração de Checkout](#serviço-de-configuração-de-checkout)
- [Serviço de Notas Fiscais](#serviço-de-notas-fiscais)
- [Serviço de Informações Fiscais](#serviço-de-informações-fiscais)
- [Recursos Relacionados](#recursos-relacionados)

## Serviço de Links de Pagamento

O serviço de Links de Pagamento (`client.paymentLinks`) gerencia links de pagamento persistentes e compartilháveis que os clientes podem usar para gerar cobranças, assinaturas ou parcelamentos.

### Conceitos-Chave

**Links de Pagamento vs Checkouts**

- **Links de Pagamento** são recursos persistentes e reutilizáveis com uma URL pública que podem gerar múltiplas cobranças ao longo do tempo
- **Checkouts** são sessões efêmeras para compras específicas com itens, callbacks e tempo de vida limitado

**Tipos de Cobrança**

Ao criar um link de pagamento, especifique o tipo de cobrança:
- `DETACHED` - Cobranças de pagamento único
- `RECURRENT` - Cobranças recorrentes de assinatura
- `INSTALLMENT` - Planos de pagamento parcelado

**Tipos de Faturamento**

- `UNDEFINED` - Cliente escolhe o método de pagamento
- `BOLETO` - Boleto bancário
- `CREDIT_CARD` - Cartão de crédito
- `PIX` - Pagamento instantâneo

**Ciclos de Assinatura** (para links `RECURRENT`)

- `WEEKLY`, `BIWEEKLY`, `MONTHLY`, `BIMONTHLY`, `QUARTERLY`, `SEMIANNUALLY`, `YEARLY`

**Exclusão Suave**

Links de pagamento usam exclusão suave. Use `remove()` para desativar e `restore()` para reativar.

**Sub-Serviço de Imagens**

Cada link de pagamento suporta até 5 imagens. Use o sub-serviço `images` para adicionar fotos de produtos, definir uma imagem principal e gerenciar a experiência de pagamento hospedada.

**Comportamento Importante**

Cada pagamento feito através de um link cria um novo cliente no Asaas. Isso pode causar clientes duplicados se a mesma pessoa pagar múltiplas vezes.

### Referência de Métodos

| Método | Descrição |
|--------|-----------|
| `create(params)` | Criar um novo link de pagamento |
| `list(params?)` | Listar links de pagamento com filtros (paginado) |
| `get(id)` | Recuperar um link de pagamento por ID |
| `update(id, params)` | Atualizar um link de pagamento existente |
| `remove(id)` | Excluir suavemente um link de pagamento |
| `restore(id)` | Restaurar um link previamente excluído |
| `images.add(linkId, params)` | Adicionar imagem ao link de pagamento (multipart) |
| `images.list(linkId)` | Listar todas as imagens de um link (paginado) |
| `images.get(linkId, imageId)` | Obter uma imagem específica |
| `images.remove(linkId, imageId)` | Remover uma imagem |
| `images.setMain(linkId, imageId)` | Definir uma imagem como principal |

### Exemplos

#### Criar um Link de Pagamento para Pagamentos Únicos

```typescript
import { AsaasClient } from 'asaas-sdk';

const client = new AsaasClient({
  accessToken: process.env.ASAAS_ACCESS_TOKEN!,
  environment: 'SANDBOX',
});

const link = await client.paymentLinks.create({
  name: 'Consultoria em TI',
  billingType: 'PIX',
  chargeType: 'DETACHED',
  value: 500.00,
  description: 'Serviço de consultoria técnica',
  notificationEnabled: true,
  callback: {
    successUrl: 'https://myapp.com/success',
  },
});

console.log('Payment link URL:', link.url);
console.log('Link ID:', link.id);
console.log('Charge type:', link.chargeType);
```

#### Criar um Link de Pagamento de Assinatura

```typescript
const subscriptionLink = await client.paymentLinks.create({
  name: 'Plano Premium Mensal',
  billingType: 'CREDIT_CARD',
  chargeType: 'RECURRENT',
  value: 99.90,
  subscriptionCycle: 'MONTHLY',
  description: 'Assinatura mensal do plano premium',
  dueDateLimitDays: 5,
  notificationEnabled: true,
});

console.log('Subscription link:', subscriptionLink.url);
console.log('Cycle:', subscriptionLink.subscriptionCycle);
```

#### Criar um Link de Pagamento Parcelado

```typescript
const installmentLink = await client.paymentLinks.create({
  name: 'Curso Online - 12x',
  billingType: 'BOLETO',
  chargeType: 'INSTALLMENT',
  value: 1200.00,
  maxInstallmentCount: 12,
  description: 'Curso completo de desenvolvimento web',
  endDate: '2026-12-31',
});

console.log('Installment link:', installmentLink.url);
console.log('Max installments:', installmentLink.maxInstallmentCount);
```

#### Listar Links de Pagamento

```typescript
const result = await client.paymentLinks.list({
  active: true,
});

for await (const link of result) {
  console.log('Link:', link.name);
  console.log('  Type:', link.chargeType);
  console.log('  Views:', link.viewCount);
  console.log('  Active:', link.active);
}
```

#### Atualizar um Link de Pagamento

```typescript
const updated = await client.paymentLinks.update(link.id, {
  name: 'Consultoria em TI - Atualizado',
  value: 550.00,
  description: 'Serviço de consultoria técnica especializada',
  active: true,
});

console.log('Updated link:', updated.name);
```

#### Exclusão Suave e Restauração

```typescript
// Soft delete
await client.paymentLinks.remove(link.id);
console.log('Link deactivated');

// Restore
const restored = await client.paymentLinks.restore(link.id);
console.log('Link restored:', restored.active);
```

#### Adicionar Imagens ao Link de Pagamento

```typescript
import { readFile } from 'fs/promises';

const imageData = await readFile('./product-photo.jpg');
const imageBlob = new Blob([imageData], { type: 'image/jpeg' });

const image = await client.paymentLinks.images.add(link.id, {
  image: imageBlob,
  main: true, // Set as main image
});

console.log('Image ID:', image.id);
console.log('Is main:', image.main);
console.log('Preview URL:', image.image.previewUrl);
console.log('Download URL:', image.image.downloadUrl);
```

#### Gerenciar Imagens do Link

```typescript
// List all images
const images = await client.paymentLinks.images.list(link.id);

for await (const img of images) {
  console.log('Image:', img.id);
  console.log('  Main:', img.main);
  console.log('  Size:', img.image.size, 'bytes');
  console.log('  Extension:', img.image.extension);
}

// Get specific image
const specificImage = await client.paymentLinks.images.get(link.id, image.id);
console.log('Image URL:', specificImage.image.downloadUrl);

// Set different image as main
await client.paymentLinks.images.setMain(link.id, 'img_000002');
console.log('Main image updated');

// Remove image
await client.paymentLinks.images.remove(link.id, image.id);
console.log('Image removed');
```

## Serviço de Checkouts

O serviço de Checkouts (`client.checkouts`) gerencia sessões de checkout hospedadas para compras baseadas em carrinho com detalhes de itens, dados do cliente e redirecionamentos pós-pagamento.

### Conceitos-Chave

**Sessões de Checkout**

Checkouts são sessões efêmeras que expiram após um tempo definido (padrão: 60 minutos). São ideais para fluxos baseados em carrinho que requerem:
- Múltiplos itens com imagens e quantidades
- Coleta de dados do cliente
- Redirecionamentos de URLs de sucesso/cancelamento/expiração
- Configuração de split de pagamento

**Tipos de Faturamento**

Atualmente suportados em checkouts:
- `CREDIT_CARD`
- `PIX`

**Tipos de Cobrança**

- `DETACHED` - Pagamento único
- `RECURRENT` - Assinatura (requer parâmetros de `subscription`)
- `INSTALLMENT` - Plano parcelado (requer parâmetros de `installment`)

**Itens**

Cada item requer:
- `name` - Nome do produto/serviço
- `value` - Preço unitário
- `quantity` - Quantidade
- `imageBase64` - Imagem do produto codificada em Base64

**Nota Importante**

A API Asaas atualmente não documenta endpoints `GET /v3/checkouts` ou `GET /v3/checkouts/{id}`. O rastreamento de checkout depende principalmente de callbacks, `externalReference` e webhooks (`CHECKOUT_CREATED`, `CHECKOUT_CANCELED`, `CHECKOUT_EXPIRED`, `CHECKOUT_PAID`).

### Referência de Métodos

| Método | Descrição |
|--------|-----------|
| `create(params)` | Criar uma nova sessão de checkout |
| `list(params?)` | Listar checkouts com filtros (paginado) |
| `get(id)` | Recuperar um checkout por ID |
| `cancel(id)` | Cancelar uma sessão de checkout |

### Exemplos

#### Criar um Checkout Simples

```typescript
const checkout = await client.checkouts.create({
  billingTypes: ['CREDIT_CARD', 'PIX'],
  chargeTypes: ['DETACHED'],
  callback: {
    successUrl: 'https://mystore.com/success',
    cancelUrl: 'https://mystore.com/cancel',
    expiredUrl: 'https://mystore.com/expired',
  },
  items: [
    {
      name: 'Notebook Dell Inspiron 15',
      value: 3500.00,
      quantity: 1,
      imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    },
    {
      name: 'Mouse Logitech',
      value: 150.00,
      quantity: 2,
      imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    },
  ],
  minutesToExpire: 120,
  externalReference: 'ORDER-2026-001',
});

console.log('Checkout ID:', checkout.id);
console.log('Expires in:', checkout.minutesToExpire, 'minutes');
```

#### Criar Checkout com Dados do Cliente

```typescript
const checkoutWithCustomer = await client.checkouts.create({
  billingTypes: ['CREDIT_CARD'],
  chargeTypes: ['DETACHED'],
  callback: {
    successUrl: 'https://mystore.com/success',
  },
  items: [
    {
      name: 'Curso de Python Avançado',
      value: 497.00,
      quantity: 1,
      imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    },
  ],
  customerData: {
    name: 'Maria Silva',
    cpfCnpj: '12345678901',
    email: 'maria@example.com',
    phone: '11987654321',
    address: 'Rua Augusta',
    addressNumber: '1500',
    complement: 'Apto 42',
    province: 'Consolação',
    postalCode: '01304-001',
    city: 'São Paulo',
  },
  externalReference: 'CURSO-001',
});

console.log('Checkout with customer:', checkoutWithCustomer.id);
```

#### Criar Checkout de Assinatura

```typescript
const subscriptionCheckout = await client.checkouts.create({
  billingTypes: ['CREDIT_CARD'],
  chargeTypes: ['RECURRENT'],
  callback: {
    successUrl: 'https://myapp.com/subscription/success',
  },
  items: [
    {
      name: 'Plano Profissional',
      value: 149.90,
      quantity: 1,
      imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    },
  ],
  subscription: {
    cycle: 'MONTHLY',
    value: 149.90,
    description: 'Assinatura mensal plano profissional',
  },
  externalReference: 'SUB-PRO-001',
});

console.log('Subscription checkout:', subscriptionCheckout.id);
```

#### Criar Checkout Parcelado

```typescript
const installmentCheckout = await client.checkouts.create({
  billingTypes: ['CREDIT_CARD'],
  chargeTypes: ['INSTALLMENT'],
  callback: {
    successUrl: 'https://mystore.com/success',
  },
  items: [
    {
      name: 'Smartphone Samsung Galaxy',
      value: 2400.00,
      quantity: 1,
      imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    },
  ],
  installment: {
    installmentCount: 12,
    value: 2400.00,
  },
  externalReference: 'PHONE-12X-001',
});

console.log('Installment checkout:', installmentCheckout.id);
```

#### Criar Checkout com Split

```typescript
const splitCheckout = await client.checkouts.create({
  billingTypes: ['CREDIT_CARD', 'PIX'],
  chargeTypes: ['DETACHED'],
  callback: {
    successUrl: 'https://marketplace.com/success',
  },
  items: [
    {
      name: 'Produto do Vendedor A',
      value: 1000.00,
      quantity: 1,
      imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    },
  ],
  splits: [
    {
      walletId: 'wal_000001234567',
      percentageValue: 80.0, // 80% for seller
    },
    {
      walletId: 'wal_000007654321',
      percentageValue: 20.0, // 20% marketplace fee
    },
  ],
  externalReference: 'MARKETPLACE-SALE-001',
});

console.log('Split checkout created:', splitCheckout.id);
```

#### Listar e Cancelar Checkouts

```typescript
// List checkouts
const checkouts = await client.checkouts.list();

for await (const checkout of checkouts) {
  console.log('Checkout:', checkout.id);
  console.log('  External ref:', checkout.externalReference);
  console.log('  Items:', checkout.items?.length);
}

// Cancel a checkout
await client.checkouts.cancel(checkout.id);
console.log('Checkout cancelled');
```

## Serviço de Configuração de Checkout

O serviço de Configuração de Checkout (`client.checkoutConfig`) gerencia a personalização visual da experiência de checkout hospedada no nível da conta.

### Conceitos-Chave

**Configuração no Nível da Conta**

A personalização se aplica a todos os checkouts da conta. As configurações incluem:
- Upload de arquivo de logo
- Cores de fundo
- Cores de fonte

**Status de Aprovação**

Após enviar a personalização, o Asaas revisa as alterações. Valores de status:
- `AWAITING_APPROVAL` - Pendente de revisão
- `APPROVED` - Personalização ativa
- `REJECTED` - Rejeitada com observações

**Nota Importante**

Esta NÃO é a configuração de sessões de checkout individuais—é o tema visual em toda a conta para todas as páginas de checkout hospedadas.

### Referência de Métodos

| Método | Descrição |
|--------|-----------|
| `get()` | Obter personalização de checkout atual |
| `update(params)` | Atualizar configuração de checkout (cores, logo) |

### Exemplos

#### Obter Configuração Atual

```typescript
const config = await client.checkoutConfig.get();

console.log('Enabled:', config.enabled);
console.log('Logo URL:', config.logoUrl);
console.log('Background color:', config.logoBackgroundColor);
console.log('Info background:', config.infoBackgroundColor);
console.log('Font color:', config.fontColor);
console.log('Status:', config.status);
if (config.observations) {
  console.log('Observations:', config.observations);
}
```

#### Atualizar Configuração de Checkout

```typescript
import { readFile } from 'fs/promises';

const logoData = await readFile('./company-logo.png');
const logoBlob = new Blob([logoData], { type: 'image/png' });

const updated = await client.checkoutConfig.update({
  enabled: true,
  logoFile: logoBlob,
  logoBackgroundColor: '#1E40AF', // Blue
  infoBackgroundColor: '#F3F4F6', // Light gray
  fontColor: '#111827', // Dark gray
});

console.log('Configuration updated');
console.log('Status:', updated.status); // Likely AWAITING_APPROVAL
console.log('Logo URL:', updated.logoUrl);
```

#### Atualizar Apenas Cores

```typescript
const colorsUpdated = await client.checkoutConfig.update({
  logoBackgroundColor: '#10B981', // Green
  infoBackgroundColor: '#FFFFFF', // White
  fontColor: '#000000', // Black
});

console.log('Colors updated:', colorsUpdated.status);
```

## Serviço de Notas Fiscais

O serviço de Notas Fiscais (`client.invoices`) gerencia o ciclo de vida completo da emissão de NFS-e (Nota Fiscal de Serviço Eletrônica) brasileira, incluindo agendamento, autorização, atualizações e cancelamento.

### Conceitos-Chave

**Ciclo de Vida da Nota Fiscal**

1. **Agendar** - Criar nota fiscal com `effectiveDate`
2. **Emissão Automática** - Se `effectiveDate` for hoje, emitida em até 15 minutos
3. **Autorização Manual** - Use `authorize()` para emitir antes do agendado
4. **Cancelamento** - Cancelar notas fiscais emitidas (dependente do município)

**Status da Nota Fiscal**

- `SCHEDULED` - Agendada para emissão futura
- `AUTHORIZED` - Emitida com sucesso
- `SYNCHRONIZED` - Sincronizada com sistema municipal
- `PROCESSING_CANCELLATION` - Cancelamento em andamento
- `CANCELED` - Cancelada com sucesso
- `CANCELLATION_DENIED` - Cancelamento rejeitado pelo município
- `ERROR` - Erro na emissão

**Transição da Reforma Tributária**

A API está em transição para suportar IBS (Imposto sobre Bens e Serviços) e CBS (Contribuição sobre Bens e Serviços) da reforma tributária do Brasil. O objeto `taxes` atual inclui campos legados e novos campos da reforma.

**Requisito de Contexto**

Notas fiscais devem estar vinculadas a:
- `payment` - Um ID de pagamento, OU
- `installment` - Um ID de parcela, OU
- `customer` - Um ID de cliente (para notas fiscais independentes)

**Serviços Municipais**

Identifique serviços usando:
- `municipalServiceId` - Do catálogo de serviços (preferido), OU
- `municipalServiceCode` - Código manual quando catálogo indisponível (ex: Portal Nacional)

### Referência de Métodos

| Método | Descrição |
|--------|-----------|
| `schedule(params)` | Agendar uma nota fiscal para emissão |
| `list(params?)` | Listar notas fiscais com filtros (paginado) |
| `get(id)` | Recuperar uma nota fiscal por ID |
| `update(id, params)` | Atualizar uma nota fiscal agendada |
| `authorize(id)` | Autorizar/emitir uma nota fiscal imediatamente |
| `cancel(id, params?)` | Cancelar uma nota fiscal emitida |

### Exemplos

#### Agendar uma Nota Fiscal para um Pagamento

```typescript
const invoice = await client.invoices.schedule({
  payment: 'pay_000001234567',
  serviceDescription: 'Desenvolvimento de aplicativo web personalizado',
  observations: 'Projeto concluído conforme especificações',
  value: 5000.00,
  deductions: 0.00,
  effectiveDate: '2026-03-20',
  municipalServiceId: 'svc_000001',
  taxes: {
    retainIss: false,
    iss: 2.5,
    pis: 0.65,
    cofins: 3.0,
    csll: 1.0,
    inss: 0.0,
    ir: 0.0,
  },
});

console.log('Invoice ID:', invoice.id);
console.log('Status:', invoice.status); // SCHEDULED
console.log('Effective date:', invoice.effectiveDate);
```

#### Agendar Nota Fiscal com Código de Serviço Manual

```typescript
const invoiceWithCode = await client.invoices.schedule({
  customer: 'cus_000005836142',
  serviceDescription: 'Consultoria em tecnologia da informação',
  observations: 'Serviço prestado em março de 2026',
  value: 2500.00,
  deductions: 0.00,
  effectiveDate: '2026-03-15',
  municipalServiceCode: '01.07', // Manual code for IT consulting
  municipalServiceName: 'Suporte técnico em informática',
  taxes: {
    retainIss: true,
    iss: 3.0,
    pis: 0.65,
    cofins: 3.0,
    csll: 1.0,
    inss: 0.0,
    ir: 1.5,
  },
});

console.log('Invoice scheduled:', invoiceWithCode.id);
```

#### Agendar Nota Fiscal com Campos da Reforma Tributária

```typescript
const modernInvoice = await client.invoices.schedule({
  payment: 'pay_000002345678',
  serviceDescription: 'Desenvolvimento e manutenção de software',
  observations: 'Nota fiscal com adequação à Reforma Tributária',
  value: 10000.00,
  deductions: 500.00,
  effectiveDate: '2026-03-25',
  municipalServiceId: 'svc_000005',
  taxes: {
    retainIss: false,
    iss: 2.0,
    pis: 0.65,
    cofins: 3.0,
    csll: 1.0,
    inss: 0.0,
    ir: 0.0,
    // Tax reform fields
    nbsCode: '1.0401.30.00',
    taxSituationCode: '01',
    taxClassificationCode: 'T01',
    operationIndicatorCode: '01',
  },
});

console.log('Modern invoice:', modernInvoice.id);
console.log('NBS Code:', modernInvoice.taxes?.nbsCode);
```

#### Listar Notas Fiscais

```typescript
const result = await client.invoices.list({
  status: 'AUTHORIZED',
  effectiveDateGe: '2026-03-01',
  effectiveDateLe: '2026-03-31',
});

for await (const invoice of result) {
  console.log('Invoice:', invoice.id);
  console.log('  Number:', invoice.number);
  console.log('  Customer:', invoice.customer);
  console.log('  Value:', invoice.value);
  console.log('  Status:', invoice.status);
  console.log('  PDF:', invoice.pdfUrl);
  console.log('  XML:', invoice.xmlUrl);
}
```

#### Atualizar uma Nota Fiscal Agendada

```typescript
const updated = await client.invoices.update(invoice.id, {
  serviceDescription: 'Desenvolvimento de aplicativo web - ATUALIZADO',
  value: 5500.00,
  observations: 'Valor atualizado após revisão do escopo',
  taxes: {
    retainIss: false,
    iss: 2.5,
    pis: 0.65,
    cofins: 3.0,
    csll: 1.0,
    inss: 0.0,
    ir: 0.0,
  },
});

console.log('Invoice updated:', updated.id);
console.log('New value:', updated.value);
```

#### Autorizar Nota Fiscal Imediatamente

```typescript
// Issue a scheduled invoice ahead of its effectiveDate
const authorized = await client.invoices.authorize(invoice.id);

console.log('Invoice authorized:', authorized.id);
console.log('Status:', authorized.status); // AUTHORIZED or PROCESSING
console.log('Invoice number:', authorized.number);
console.log('Validation code:', authorized.validationCode);
console.log('PDF URL:', authorized.pdfUrl);
console.log('XML URL:', authorized.xmlUrl);
```

#### Cancelar uma Nota Fiscal

```typescript
// Cancel on Asaas only (doesn't communicate with municipality)
await client.invoices.cancel(invoice.id, {
  cancelOnlyOnAsaas: true,
});

console.log('Invoice cancelled on Asaas');

// Full cancellation (attempts to cancel with municipality)
await client.invoices.cancel(invoice.id, {
  cancelOnlyOnAsaas: false,
});

console.log('Invoice cancellation requested with municipality');
```

#### Obter Detalhes da Nota Fiscal

```typescript
const details = await client.invoices.get(invoice.id);

console.log('Invoice:', details.id);
console.log('Type:', details.type);
console.log('Status:', details.status);
console.log('Status description:', details.statusDescription);
console.log('RPS:', `${details.rpsSerie}-${details.rpsNumber}`);
console.log('Invoice number:', details.number);
console.log('Value:', details.value);
console.log('Deductions:', details.deductions);
console.log('Estimated taxes:', details.estimatedTaxesDescription);
console.log('External reference:', details.externalReference);

// Tax details
if (details.taxes) {
  console.log('ISS:', details.taxes.iss, '%');
  console.log('PIS:', details.taxes.pis, '%');
  console.log('COFINS:', details.taxes.cofins, '%');

  // Tax reform fields (if available)
  if (details.taxes.municipalIbsValue) {
    console.log('Municipal IBS:', details.taxes.municipalIbsValue);
  }
  if (details.taxes.cbsValue) {
    console.log('CBS:', details.taxes.cbsValue);
  }
}
```

## Serviço de Informações Fiscais

O serviço de Informações Fiscais (`client.fiscalInfo`) gerencia a configuração fiscal da conta necessária antes de emitir notas fiscais, incluindo credenciais municipais, regimes tributários e catálogos de serviços.

### Conceitos-Chave

**Sequência de Integração**

Antes de emitir notas fiscais, você deve:
1. Verificar requisitos municipais com `getMunicipalServices()` (opcional para descoberta)
2. Inserir/atualizar informações fiscais com `upsert()`
3. Buscar códigos de serviço com `getMunicipalServices()` se necessário
4. Agendar notas fiscais

**Tipos de Autenticação**

Municípios requerem um de:
- `CERTIFICATE` - Arquivo de certificado digital + senha
- `TOKEN` - Token de acesso
- `USER_AND_PASSWORD` - Nome de usuário + senha

**Portal Nacional**

Alguns municípios integram via Portal Nacional do Brasil para emissão de notas fiscais. Quando habilitado:
- Catálogo de serviços municipal pode não estar disponível via API
- Você deve fornecer `municipalServiceCode` manualmente ao agendar notas fiscais

**Padrão Upsert**

`fiscalInfo.upsert()` cria OU atualiza informações fiscais em uma única chamada. A API usa multipart/form-data para uploads de arquivos de certificado.

**Nota de Segurança**

Campos sensíveis (senha, token de acesso, certificado) não são retornados em respostas GET. Em vez disso, flags booleanas indicam o que foi definido: `passwordSent`, `accessTokenSent`, `certificateSent`.

### Referência de Métodos

| Método | Descrição |
|--------|-----------|
| `getInfo()` | Obter informações fiscais atuais |
| `upsert(params)` | Criar ou atualizar informações fiscais (multipart) |
| `getMunicipalServices(params?)` | Buscar códigos de serviço municipal (paginado) |
| `getNationalPortalConfig()` | Obter configuração do Portal Nacional |
| `updateNationalPortalConfig(params)` | Habilitar/desabilitar Portal Nacional |

### Exemplos

#### Obter Informações Fiscais Atuais

```typescript
const fiscalInfo = await client.fiscalInfo.getInfo();

console.log('Email:', fiscalInfo.email);
console.log('Simples Nacional:', fiscalInfo.simplesNacional);
console.log('Municipal inscription:', fiscalInfo.municipalInscription);
console.log('CNAE:', fiscalInfo.cnae);
console.log('Special tax regime:', fiscalInfo.specialTaxRegime);
console.log('Service list item:', fiscalInfo.serviceListItem);

// Credential flags (actual values not returned)
console.log('Password configured:', fiscalInfo.passwordSent);
console.log('Access token configured:', fiscalInfo.accessTokenSent);
console.log('Certificate configured:', fiscalInfo.certificateSent);
```

#### Configurar Informações Fiscais com Usuário/Senha

```typescript
const fiscalConfig = await client.fiscalInfo.upsert({
  email: 'fiscal@minhaempresa.com.br',
  simplesNacional: true,
  municipalInscription: '12345678',
  cnae: '6201-5/00',
  specialTaxRegime: 'MUNICIPAL_TAX_REGIME_1',
  serviceListItem: '01.07',
  username: 'empresa.cnpj',
  password: 'senha-municipal-segura',
});

console.log('Fiscal info configured');
console.log('Email:', fiscalConfig.email);
console.log('Password sent:', fiscalConfig.passwordSent);
```

#### Configurar Informações Fiscais com Token de Acesso

```typescript
const fiscalWithToken = await client.fiscalInfo.upsert({
  email: 'fiscal@mycompany.com',
  simplesNacional: false,
  municipalInscription: '87654321',
  cnae: '6202-3/00',
  accessToken: 'municipal-access-token-here',
  nationalPortalTaxCalculationRegime: 'LUCRO_PRESUMIDO',
});

console.log('Fiscal info configured with token');
console.log('Token sent:', fiscalWithToken.accessTokenSent);
```

#### Configurar Informações Fiscais com Certificado Digital

```typescript
import { readFile } from 'fs/promises';

const certData = await readFile('./certificado-empresa.pfx');
const certBlob = new Blob([certData], { type: 'application/x-pkcs12' });

const fiscalWithCert = await client.fiscalInfo.upsert({
  email: 'fiscal@empresa.com.br',
  simplesNacional: true,
  municipalInscription: '98765432',
  cnae: '6201-5/00',
  certificateFile: certBlob,
  certificatePassword: 'senha-certificado',
  rpsSerie: 'A',
  rpsNumber: 1,
  loteNumber: 1,
});

console.log('Fiscal info with certificate configured');
console.log('Certificate sent:', fiscalWithCert.certificateSent);
```

#### Buscar Serviços Municipais

```typescript
// Search services by description
const services = await client.fiscalInfo.getMunicipalServices({
  description: 'desenvolvimento',
  limit: 10,
});

for await (const service of services) {
  console.log('Service:', service.id);
  console.log('  Description:', service.description);
  console.log('  ISS Tax:', service.issTax, '%');
}

// Use service ID when scheduling invoice
const invoice = await client.invoices.schedule({
  payment: 'pay_000001234567',
  serviceDescription: 'Desenvolvimento de software',
  municipalServiceId: services.data[0].id, // Use found service
  value: 5000.00,
  // ... rest of params
});
```

#### Configurar Portal Nacional

```typescript
// Check current configuration
const portalConfig = await client.fiscalInfo.getNationalPortalConfig();
console.log('National Portal enabled:', portalConfig.enabled);

// Enable National Portal
await client.fiscalInfo.updateNationalPortalConfig({
  enabled: true,
});

console.log('National Portal enabled for invoice issuance');

// Disable National Portal
await client.fiscalInfo.updateNationalPortalConfig({
  enabled: false,
});

console.log('National Portal disabled');
```

### Limitações do Sandbox

Ao testar operações fiscais no ambiente sandbox, observe as seguintes limitações:

**Totalmente Testável:**
- Configuração de informações fiscais (upsert)
- Buscas de serviços municipais
- Agendamento de notas fiscais
- Autorização de notas fiscais
- Consultas de status de notas fiscais

**NÃO Testável (Somente Produção):**
- Emissão real de NFS-e com municípios
- Geração real de PDF/XML com layout municipal
- Fluxos de cancelamento municipal
- Integração com Portal Nacional

Para testes em sandbox, notas fiscais atingirão o status `AUTHORIZED` mas não gerarão documentos municipais reais. Use o sandbox para validar seu fluxo de integração, depois teste de ponta a ponta em produção com pequenas notas fiscais de teste.

## Recursos Relacionados

- [Guia de Paginação](../pagination.md) - Aprenda como lidar com respostas paginadas
- [Tratamento de Erros](../error-handling.md) - Entenda padrões de tratamento de erros
- [Serviço de Clientes](./customers.md) - Gerenciar registros de clientes
- [Serviço de Pagamentos](./payments.md) - Criar pagamentos vinculados a notas fiscais
- [Serviço de Assinaturas](./subscriptions.md) - Configurar emissão automática de notas fiscais para assinaturas
- [Documentação Oficial do Asaas](https://docs.asaas.com) - Referência completa da API

## Melhores Práticas

1. **Escolha a ferramenta certa**: Use links de pagamento para links persistentes e reutilizáveis; use checkouts para compras baseadas em carrinho com callbacks
2. **Defina URLs de callback**: Sempre forneça URLs de sucesso/cancelamento/expiração em sessões de checkout para fluxo adequado do cliente
3. **Use referências externas**: Rastreie checkouts e notas fiscais com seus IDs internos de pedido/transação
4. **Gerencie imagens de links de pagamento**: Use até 5 imagens de alta qualidade e defina uma imagem principal para melhor conversão
5. **Configure informações fiscais cedo**: Complete a configuração fiscal antes de agendar sua primeira nota fiscal
6. **Busque códigos de serviço**: Use `getMunicipalServices()` para encontrar IDs de serviço corretos para cálculo preciso de impostos
7. **Trate status de notas fiscais**: Monitore mudanças de status de notas fiscais via webhooks (`INVOICE_SYNCHRONIZED`, etc.)
8. **Teste tempo de autorização**: Agende notas fiscais com data de hoje para emissão automática, ou use `authorize()` para processamento imediato
9. **Respeite limites municipais**: Verifique se seu município suporta cancelamento antes de depender do fluxo de cancelamento
10. **Prepare-se para reforma tributária**: Inclua campos da reforma tributária (`nbsCode`, `taxSituationCode`, etc.) na criação de notas fiscais para conformidade
11. **Use multipart corretamente**: Lembre-se que informações fiscais e imagens requerem multipart/form-data, não JSON
12. **Rastreie sessões de checkout**: Dependa de callbacks e webhooks para estado de checkout—endpoints GET podem não estar disponíveis
