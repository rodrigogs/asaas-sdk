# Ambiente de Testes Sandbox

O Sandbox do Asaas é um ambiente de testes separado projetado para desenvolvimento de integração, testes e validação antes de implantar em produção. Ele fornece um espaço seguro para experimentar com a API sem afetar transações financeiras reais ou dados de clientes.

## Visão Geral

O ambiente Sandbox opera de forma independente da produção, com sua própria infraestrutura, URLs e chaves de API. Alterações feitas no Sandbox nunca são replicadas para produção, e vice-versa. Esse isolamento garante que atividades de desenvolvimento e testes não possam impactar operações ao vivo.

**Características Principais:**

- Endpoint de URL separado da produção
- Chaves de API independentes com prefixos distintos
- Contas de teste e credenciais dedicadas
- Ambiente seguro para testes de webhooks
- Sem risco financeiro ou transações reais

## Configuração

Para configurar o SDK para Sandbox, especifique o ambiente `'SANDBOX'` durante a inicialização do cliente:

```typescript
import { AsaasClient } from '@rodrigogs/asaas-sdk'

const client = new AsaasClient({
  accessToken: process.env.ASAAS_SANDBOX_TOKEN!,
  environment: 'SANDBOX',
})
```

### URLs de Ambiente

O SDK roteia automaticamente as requisições para a URL base apropriada com base na configuração do ambiente:

| Ambiente | URL Base |
|----------|----------|
| `SANDBOX` | `https://api-sandbox.asaas.com/v3` |
| `PRODUCTION` | `https://api.asaas.com/v3` |

**Importante:** Não construa URLs manualmente. Sempre confie na configuração de ambiente do SDK para garantir que as requisições sejam enviadas para o endpoint correto.

## Formato de Chave de API e Autenticação

As chaves de API têm prefixos distintos que identificam a qual ambiente elas pertencem:

| Ambiente | Prefixo da Chave | Exemplo |
|----------|------------------|---------|
| Sandbox | `$aact_hmlg_` | `$aact_hmlg_abc123...` |
| Production | `$aact_prod_` | `$aact_prod_xyz789...` |

### Erros de Autenticação

Usar uma chave de API do ambiente errado resultará em um erro `HTTP 401 Unauthorized`. O SDK valida a configuração do ambiente, mas erros comuns incluem:

- Usar uma chave de produção com `environment: 'SANDBOX'`
- Usar uma chave de sandbox com `environment: 'PRODUCTION'`
- Esquecer de trocar as chaves ao implantar em produção

**Melhor Prática:** Use variáveis de ambiente para gerenciar chaves de API e nunca as codifique diretamente em sua aplicação:

```typescript
// .env.development
ASAAS_SANDBOX_TOKEN=$aact_hmlg_your_sandbox_key

// .env.production
ASAAS_PRODUCTION_TOKEN=$aact_prod_your_production_key
```

## Configurando o Acesso ao Sandbox

### Criando uma Conta Sandbox

1. Visite [sandbox.asaas.com](https://sandbox.asaas.com) para criar uma conta de teste
2. Complete o processo de registro (não são necessários documentos reais)
3. Faça login no painel do Sandbox
4. Navegue até **Configurações** → **Chaves de API** → **Gerar Nova Chave**
5. Copie a chave gerada imediatamente (ela não pode ser recuperada posteriormente)
6. Armazene a chave de forma segura na configuração do seu ambiente

### Gerando Chaves de API

Apenas usuários administradores podem gerar chaves de API. As chaves são geradas através da interface web (não via aplicativo mobile) e seguem estas regras operacionais:

- As chaves são **irrecuperáveis** após a geração
- Cada conta suporta até **10 chaves ativas**
- As chaves podem ter nomes e datas de expiração opcionais
- As chaves podem ser habilitadas/desabilitadas sem exclusão
- Chaves excluídas **não podem ser restauradas**

Para instruções detalhadas de configuração, consulte a documentação oficial do Asaas: [Como configurar sua conta no Sandbox](https://docs.asaas.com/docs/how-to-set-up-your-account-in-the-sandbox-1).

## Matriz de Testabilidade

Nem todas as funcionalidades se comportam de forma idêntica no Sandbox em comparação com a produção. A matriz a seguir descreve o que pode e não pode ser testado:

| Domínio | Testável | Limitações / Notas |
|---------|----------|---------------------|
| **Clientes** | ✅ Completo | Operações CRUD completas, sem restrições |
| **Pagamentos (Boleto)** | ⚠️ Parcial | Layout do QR Code funciona; cálculo de descontos, juros e multa **não disponível** |
| **Pagamentos (Cartão de Crédito)** | ✅ Completo | Use números de cartão de teste (veja abaixo) |
| **Pagamentos (PIX)** | ✅ Completo | Requer registro de chave Pix primeiro |
| **Assinaturas** | ✅ Completo | Gere carnê de pagamentos para acionar novas cobranças |
| **Parcelamentos** | ✅ Completo | Operações de criar, listar, recuperar, reembolsar e cancelar |
| **Transferências (PIX)** | ✅ Completo | Transferências para chaves fictícias do BACEN completam instantaneamente |
| **Transferências (TED)** | ⚠️ Parcial | Sucesso/falha simulado via painel Asaas, **não controlável via API** |
| **Subcontas** | ⚠️ Limitado | Máximo de **20 subcontas por dia**; nomes devem usar **apenas letras e espaços** (sem números ou caracteres especiais) |
| **Notificações** | ⚠️ Parcial | Email e SMS enviados de verdade; **WhatsApp não pode ser testado** |
| **Notas Fiscais** | ⚠️ Parcial | Simulação limitada da autoridade fiscal; validação completa requer produção |
| **Links de Pagamento** | ✅ Completo | Operações de criar, atualizar, listar e excluir |
| **Checkouts** | ✅ Completo | Criar e gerenciar sessões de checkout |
| **Webhooks** | ✅ Completo | Configurar e receber eventos de webhook de teste |
| **Estornos (Chargebacks)** | ✅ Completo | Operações de listar e contestar disponíveis |
| **Reembolsos** | ✅ Completo | Reembolsos de pagamentos e parcelamentos |
| **Documentos** | ✅ Completo | Upload, listar, atualizar e excluir documentos de pagamento |

### Números de Cartão de Crédito de Teste

Para testar pagamentos com cartão de crédito no Sandbox, use os seguintes números de cartão de teste:

| Bandeira do Cartão | Número do Cartão | CVV | Validade | Resultado Esperado |
|--------------------|------------------|-----|----------|---------------------|
| Visa | `4000000000000010` | Qualquer 3 dígitos | Qualquer data futura | Sucesso |
| Mastercard | `5500000000000004` | Qualquer 3 dígitos | Qualquer data futura | Sucesso |
| Amex | `340000000000009` | Qualquer 4 dígitos | Qualquer data futura | Sucesso |
| Recusado | `4000000000000002` | Qualquer 3 dígitos | Qualquer data futura | Recusado (fundos insuficientes) |

**Nota:** Use qualquer nome válido para o titular do cartão e qualquer data de validade futura (por exemplo, `12/2030`).

## Peculiaridades Conhecidas do Sandbox

Embora o ambiente Sandbox se esforce para espelhar o comportamento da produção, existem várias peculiaridades e limitações importantes:

### 1. QR Code Pix Requer Chave Registrada

Tentar criar um pagamento com QR Code Pix retorna `HTTP 404` se sua conta Sandbox não tiver nenhuma chave Pix registrada. Você deve:

1. Registrar pelo menos uma chave Pix no painel do Sandbox
2. Aguardar a ativação da chave (geralmente instantâneo no Sandbox)
3. Então criar pagamentos Pix via API

### 2. Restrições de Nome de Subconta

Nomes de subcontas no Sandbox devem conter **apenas letras e espaços**. Os seguintes caracteres não são permitidos:

- Números (`0-9`)
- Caracteres especiais (`@`, `#`, `$`, etc.)
- Hífens ou underscores

**Exemplo:**

```typescript
// ✅ Válido
await client.accounts.create({
  name: 'Test Account Alpha',
  // ...
})

// ❌ Inválido - Contém números
await client.accounts.create({
  name: 'Test Account 123',
  // ...
})
```

### 3. Email e SMS São Enviados de Verdade

Diferentemente de muitos ambientes sandbox, o Sandbox do Asaas **realmente envia notificações por email e SMS**. Isso significa:

- Emails de teste chegam em caixas de entrada reais
- Mensagens SMS são entregues em números de telefone reais
- Você receberá notificações reais para eventos de pagamento

**Melhor Prática:** Use endereços de email e números de telefone de teste dedicados. Nunca use informações de contato de clientes ou terceiros em testes do Sandbox.

### 4. Notificações WhatsApp Indisponíveis

Notificações por WhatsApp não podem ser testadas no Sandbox. Tentativas de configurar ou acionar notificações por WhatsApp falharão silenciosamente ou retornarão erros. Testes de WhatsApp requerem acesso ao ambiente de produção e alinhamento prévio com a equipe de suporte.

### 5. Limitações do White-Label no Sandbox

Subcontas white-label têm restrições adicionais no Sandbox:

- Requerem alinhamento prévio com a equipe de suporte para habilitação
- Podem ter fluxos de aprovação diferentes da produção
- Opções de personalização visual podem ser limitadas

Se você planeja usar recursos white-label, entre em contato com o suporte do Asaas antes de iniciar o desenvolvimento.

### 6. Controle de Status de Transferência TED

Para operações TED (transferência bancária), o Sandbox não fornece controle em nível de API sobre os resultados de sucesso ou falha. Em vez disso:

- Transferências TED são iniciadas normalmente via API
- O status final (sucesso/falha) é controlado manualmente via painel do Sandbox Asaas
- Isso simula a natureza assíncrona do mundo real das transferências bancárias

**Fluxo de trabalho:**

1. Crie uma transferência TED via API
2. Faça login no painel do Sandbox
3. Navegue até a seção de gerenciamento de transferências
4. Aprove ou rejeite manualmente a transferência pendente

### 7. Geração de Cobranças de Assinatura

Assinaturas no Sandbox não geram cobranças automaticamente em seu cronograma. Para testar o comportamento de assinaturas:

1. Crie uma assinatura via API
2. Navegue até a assinatura no painel do Sandbox
3. Use a ação **"Gerar Carnê de Pagamentos"** para acionar manualmente a criação de cobranças

Essa limitação evita o acúmulo acidental de cobranças de teste durante o desenvolvimento.

### 8. Cálculo de Juros e Multa de Boleto

Embora a criação de boleto funcione no Sandbox, as seguintes funcionalidades não podem ser totalmente testadas:

- Cálculo de juros (campo `interest`)
- Aplicação de multa (campo `fine`)
- Lógica de desconto (campo `discount`)

Esses cálculos são visíveis em produção, mas retornam valores simplificados ou placeholder no Sandbox. A validação final dessas funcionalidades requer testes em produção.

### 9. Limite Diário de Criação de Subcontas

O Sandbox impõe um limite de **20 novas subcontas por dia**. Isso evita abuso, mas pode ser restritivo para testes de integração extensivos. Planeje seus cenários de teste adequadamente e limpe regularmente subcontas de teste não utilizadas.

## Melhores Práticas

### Chaves de API Separadas

Sempre mantenha chaves de API separadas para ambientes Sandbox e produção:

```typescript
// Padrão de fábrica de configuração
function createAsaasClient(env: 'sandbox' | 'production') {
  const config = {
    sandbox: {
      accessToken: process.env.ASAAS_SANDBOX_TOKEN!,
      environment: 'SANDBOX' as const,
    },
    production: {
      accessToken: process.env.ASAAS_PRODUCTION_TOKEN!,
      environment: 'PRODUCTION' as const,
    },
  }

  return new AsaasClient(config[env])
}

// Uso
const sandboxClient = createAsaasClient('sandbox')
const productionClient = createAsaasClient('production')
```

### Nunca Use Dados Reais de Clientes

O Sandbox é um ambiente de testes que não fornece as mesmas garantias de proteção de dados que a produção. **Nunca** use:

- Documentos CPF/CNPJ reais de clientes
- Endereços de email reais de clientes (exceto endereços de teste dedicados)
- Números de telefone reais de clientes
- Registros de banco de dados de produção

Em vez disso, crie dados de teste fictícios, mas realistas:

```typescript
const testCustomer = {
  name: 'João Silva Teste',
  cpfCnpj: '12345678901', // CPF fictício
  email: 'joao.teste@example.com', // Domínio de teste
  mobilePhone: '5511999999999', // Número fictício
}
```

### Teste Webhooks Antes da Produção

Webhooks são totalmente funcionais no Sandbox. Use isso a seu favor:

1. Configure endpoints de webhook no Sandbox
2. Verifique se seu servidor recebe e processa eventos corretamente
3. Teste cenários de erro (timeouts, tentativas, validação de assinatura)
4. Monitore logs de entrega de webhook no painel do Sandbox
5. Implante em produção apenas após testes abrangentes de webhook

**Exemplo de configuração de webhook:**

```typescript
await sandboxClient.accounts.create({
  name: 'Test Subaccount',
  email: 'test@example.com',
  cpfCnpj: '12345678901',
  // ... outros campos obrigatórios
  webhooks: [
    {
      url: 'https://your-test-server.com/webhooks/asaas',
      email: 'alerts@example.com',
      sendType: 'SEQUENTIALLY',
      apiVersion: 3,
      enabled: true,
      interrupted: false,
      authToken: 'your-webhook-secret',
      events: [
        'PAYMENT_CREATED',
        'PAYMENT_RECEIVED',
        'PAYMENT_CONFIRMED',
      ],
    },
  ],
})
```

### Esteja Ciente das Notificações Reais

Como email e SMS são enviados de verdade no Sandbox:

- Use endereços de email de teste dedicados para todos os clientes de teste
- Configure filtros de email para organizar notificações do Sandbox
- Use números de telefone de teste que você controla (ou desabilite notificações SMS)
- Desabilite notificações de clientes quando apropriado:

```typescript
await sandboxClient.customers.create({
  name: 'Test Customer',
  cpfCnpj: '12345678901',
  email: 'test@example.com',
  notificationDisabled: true, // Desabilita notificações automáticas
})
```

### Teste Limites de Taxa e Tratamento de Erros

O Sandbox segue as mesmas regras de limitação de taxa que a produção:

- **50 requisições GET simultâneas** no máximo
- **25.000 requisições por janela de 12 horas**
- Respostas `HTTP 429` quando os limites são excedidos

Use o Sandbox para testar a lógica de limitação de taxa e tentativas de sua aplicação:

```typescript
import { AsaasApiError } from '@rodrigogs/asaas-sdk'

try {
  const payment = await sandboxClient.payments.create(paymentData)
} catch (error) {
  if (error instanceof AsaasApiError && error.isRateLimit) {
    // Trata erro de limite de taxa
    console.log('Limitado por taxa. Implementar backoff exponencial.')
  }
}
```

### Valide a Integração Antes da Produção

Use o Sandbox como a etapa final de validação antes da implantação em produção:

1. **Suíte Completa de Testes de Integração:** Execute todos os testes de integração no Sandbox
2. **Fluxos de Usuário Ponta a Ponta:** Teste jornadas completas do usuário (cadastro → pagamento → entrega)
3. **Cenários de Erro:** Verifique o tratamento de pagamentos falhados, cartões recusados e timeouts
4. **Processamento de Webhook:** Confirme que todos os eventos de webhook são processados corretamente
5. **Validação de Segurança:** Teste restrições de whitelist de IP e validação de assinatura de webhook
6. **Testes de Performance:** Verifique se sua aplicação lida com latência da API graciosamente

Implante em produção apenas após todas as validações do Sandbox passarem com sucesso.

### Limpe Dados de Teste Regularmente

Contas Sandbox podem acumular dados de teste ao longo do tempo. Limpe regularmente:

- Clientes e assinaturas de teste
- Pagamentos cancelados ou expirados
- Subcontas inativas (atento ao limite de criação de 20/dia)
- Chaves de API antigas

Isso mantém seu ambiente Sandbox organizado e evita confusão durante o desenvolvimento.

## Transição para Produção

Quando você estiver pronto para migrar do Sandbox para produção:

### 1. Atualize a Configuração de Ambiente

```typescript
// Antes (Sandbox)
const client = new AsaasClient({
  accessToken: process.env.ASAAS_SANDBOX_TOKEN!,
  environment: 'SANDBOX',
})

// Depois (Produção)
const client = new AsaasClient({
  accessToken: process.env.ASAAS_PRODUCTION_TOKEN!,
  environment: 'PRODUCTION',
})
```

### 2. Gere Chaves de API de Produção

1. Faça login em sua conta Asaas de produção em [app.asaas.com](https://app.asaas.com)
2. Navegue até **Configurações** → **Chaves de API** → **Gerar Nova Chave**
3. Armazene a chave de produção de forma segura (use um serviço de gerenciamento de segredos)
4. Atualize suas variáveis de ambiente de produção

### 3. Configure Whitelist de IP (Recomendado)

Para segurança adicional, configure um whitelist de IP para suas chaves de API de produção:

1. Navegue até **Configurações** → **Chaves de API** → **Whitelist de IP**
2. Adicione os endereços IP do seu servidor de produção
3. Salve a configuração
4. Verifique se as requisições da API são bem-sucedidas a partir dos IPs permitidos

Requisições de IPs não incluídos no whitelist receberão `HTTP 403 Forbidden`.

### 4. Atualize URLs de Webhook

Certifique-se de que as URLs de webhook apontem para seus endpoints de produção:

```typescript
// Webhook do Sandbox
url: 'https://staging.yourapp.com/webhooks/asaas'

// Webhook de Produção
url: 'https://api.yourapp.com/webhooks/asaas'
```

### 5. Habilite Webhook de Validação de Transferência (Opcional)

Para segurança aprimorada em saques e transferências, configure o webhook de validação de transferência:

1. Navegue até **Configurações** → **Transferências** → **Webhook de Validação**
2. Insira a URL do seu webhook de produção
3. Forneça um token de acesso para o Asaas incluir nas requisições
4. Teste o webhook com uma pequena transferência

Este webhook permite que você aprove ou rejeite transferências programaticamente em tempo real.

### 6. Verifique Funcionalidades de Produção

Algumas funcionalidades podem requerer habilitação manual em produção:

- **Tokenização de cartão de crédito:** Pode precisar de ativação pelo suporte Asaas
- **Subcontas white-label:** Requer alinhamento contratual
- **Limites de transação mais altos:** Podem precisar de verificação de conta
- **Branding customizado:** Requer configuração no painel de produção

Entre em contato com o suporte do Asaas para confirmar que todas as funcionalidades necessárias estão habilitadas antes de entrar no ar.

### 7. Monitore Transações Iniciais de Produção

Após a implantação:

1. Monitore de perto as primeiras transações de produção
2. Verifique a entrega e o processamento de webhooks
3. Verifique se há erros inesperados `401`, `403` ou `429`
4. Confirme que confirmações de pagamento e reembolsos funcionam como esperado
5. Revise o painel do Asaas para quaisquer alertas ou avisos

## Recursos Adicionais

- [Documentação Oficial do Sandbox Asaas](https://docs.asaas.com/docs/sandbox)
- [Guia de Autenticação](https://docs.asaas.com/docs/authentication-2)
- [Gerenciamento de Chaves de API](https://docs.asaas.com/docs/chaves-de-api)
- [O Que Pode Ser Testado no Sandbox](https://docs.asaas.com/docs/o-que-pode-ser-testado)
- [Limites de Taxa da API](https://docs.asaas.com/docs/duvidas-frequentes-limites-da-api)
- [Mecanismos de Segurança Adicionais](https://docs.asaas.com/docs/additional-security-mechanisms)

## Suporte

Se você encontrar problemas específicos do Sandbox que não estão documentados aqui:

1. Verifique a documentação oficial do Asaas para atualizações
2. Revise os issues do repositório do SDK para problemas conhecidos
3. Entre em contato com o suporte do Asaas para questões específicas do ambiente
4. Reporte bugs do SDK para o repositório do GitHub

---

**Lembre-se:** O Sandbox é uma ferramenta poderosa para desenvolvimento e testes, mas não é uma réplica perfeita da produção. Sempre realize a validação final em produção com transações pequenas e monitoradas antes de escalar.
