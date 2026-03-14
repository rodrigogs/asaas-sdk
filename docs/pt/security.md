# Segurança

## Visão Geral

A segurança no Asaas é implementada através de múltiplas camadas. Enquanto a chave de API serve como o mecanismo de autenticação fundamental, o Asaas fornece recursos de segurança adicionais incluindo lista de permissões de IPs e webhooks de validação de transferências. Esses mecanismos trabalham juntos para proteger operações sensíveis e prevenir acessos não autorizados.

Para operações críticas como transferências e saques, é fortemente recomendado combinar múltiplas camadas de segurança.

## Gerenciamento de Chaves de API

### Gerando Chaves de API

Chaves de API só podem ser geradas por usuários administradores através da interface web do Asaas. A plataforma não fornece geração programática de chaves - todas as chaves devem ser criadas manualmente via dashboard.

**Características das chaves:**

- **Irrecuperável após geração** - Uma vez que você feche o diálogo de geração, a chave não pode ser recuperada novamente. Armazene-a com segurança imediatamente.
- **Máximo de 10 chaves por conta** - Cada conta pode manter até 10 chaves ativas.
- **Nomeadas e datadas** - Chaves podem receber nomes descritivos e datas de expiração opcionais para melhor gerenciamento.
- **Habilitar/desabilitar sem deletar** - Chaves podem ser temporariamente desabilitadas e reabilitadas sem deleção permanente.
- **Sem restauração após deleção** - Uma vez que uma chave é deletada, ela não pode ser recuperada ou restaurada.

### Prefixos de Chaves

Chaves de API usam prefixos específicos de ambiente para diagnósticos operacionais:

- Chaves de produção: `$aact_prod_...`
- Chaves de sandbox: `$aact_hmlg_...`

Embora o SDK não valide esses prefixos para funcionalidade, eles são úteis para depurar incompatibilidades de ambiente.

### Melhores Práticas

**Use chaves separadas para diferentes ambientes:**

```typescript
// Development
const sandboxClient = new AsaasClient({
  accessToken: process.env.ASAAS_SANDBOX_KEY,
  environment: 'SANDBOX',
})

// Production
const productionClient = new AsaasClient({
  accessToken: process.env.ASAAS_PRODUCTION_KEY,
  environment: 'PRODUCTION',
})
```

**Rotacione chaves periodicamente:**

Estabeleça um cronograma de rotação de chaves para minimizar o risco de exposição. Ao rotacionar:

1. Gere uma nova chave com um nome identificador
2. Atualize a configuração da sua aplicação
3. Teste a nova chave em um ambiente de não-produção
4. Implante a mudança de configuração
5. Desabilite (não delete) a chave antiga
6. Monitore erros antes de deletar a chave antiga permanentemente

**Nunca faça hardcode de chaves:**

```typescript
// ❌ NUNCA faça isso
const client = new AsaasClient({
  accessToken: '$aact_prod_abc123...',
  environment: 'PRODUCTION',
})

// ✅ Sempre use variáveis de ambiente
const client = new AsaasClient({
  accessToken: process.env.ASAAS_ACCESS_TOKEN,
  environment: process.env.ASAAS_ENVIRONMENT === 'production' ? 'PRODUCTION' : 'SANDBOX',
})
```

**Armazene chaves com segurança:**

- Use variáveis de ambiente para acesso em runtime
- Armazene chaves de produção em cofres seguros (AWS Secrets Manager, HashiCorp Vault, etc.)
- Nunca faça commit de chaves no controle de versão
- Use `.env.local` ou similar para desenvolvimento local (certifique-se de que está no `.gitignore`)

## Lista de Permissões de IPs

A lista de permissões de IPs restringe o acesso à API a requisições originadas de endereços IP pré-autorizados. Isso adiciona um controle de segurança em camada de rede que protege contra roubo de credenciais e acesso não autorizado.

### Como Funciona

Quando a lista de permissões de IPs está habilitada:

1. Todas as requisições de API devem se originar de IPs autorizados
2. Requisições de IPs não autorizados recebem `HTTP 403 Forbidden`
3. A restrição se aplica a todos os endpoints de API uniformemente

### Configuração

A configuração da lista de permissões de IPs é gerenciada exclusivamente através do dashboard do Asaas:

1. Navegue até as configurações de segurança da conta
2. Adicione IPs individuais ou pequenos intervalos de IPs
3. Salve a configuração da lista de permissões

As mudanças entram em vigor imediatamente após salvar.

### Importante: Distinguindo Erros 403

O SDK pode encontrar erros `HTTP 403` de duas fontes distintas:

1. **Rejeição da lista de permissões de IPs** - Requisição originada de um IP não autorizado
2. **Negação de permissão** - Requisição válida mas com permissões insuficientes para a operação

Ao depurar erros 403, verifique:

- Se a lista de permissões de IPs está habilitada na sua conta Asaas
- Se o IP de saída da sua aplicação corresponde à lista de permissões
- Se a chave de API tem as permissões necessárias para o endpoint

### Auto-Aprovação para IPs Autorizados

Transferências e saques iniciados de IPs autorizados podem ser configurados para aprovação automática, ignorando requisitos de autorização manual. Isso é particularmente útil para operações financeiras automatizadas.

**Configuração:**

Habilite a auto-aprovação para IPs autorizados nas configurações de segurança do dashboard do Asaas. Uma vez habilitada, transferências de IPs autorizados não exigirão autorização manual via Token SMS ou Token APP.

**Caso de uso:**

```typescript
// Transfer initiated from whitelisted IP with auto-approval enabled
const transfer = await asaas.transfers.createExternal({
  value: 1000.0,
  pixAddressKey: '12345678900',
  pixAddressKeyType: 'CPF',
})

// transfer.authorized will be true immediately
console.log(transfer.authorized) // true
```

## Webhook de Validação de Transferências

Para segurança adicional em transferências e saques, o Asaas fornece um mecanismo dedicado de validação via webhook. Isso permite que sua aplicação aprove ou recuse transferências programaticamente com base em lógica de negócio customizada.

### Como Funciona

1. Sua aplicação cria uma transferência via API
2. Aproximadamente 5 segundos depois, o Asaas envia uma requisição `POST` para a URL do webhook configurada
3. Seu endpoint de webhook valida os detalhes da transferência
4. Seu endpoint responde com `APPROVED` ou `REFUSED`
5. O Asaas processa ou cancela a transferência com base na resposta

### Payload do Webhook

O payload do webhook espelha a resposta de criação da transferência:

```typescript
{
  "id": "tra_000005048474",
  "type": "PIX",
  "dateCreated": "2026-03-13",
  "value": 1000.00,
  "netValue": 995.00,
  "status": "PENDING",
  "transferFee": 5.00,
  "operationType": "PIX",
  "pixAddressKey": "12345678900",
  "pixAddressKeyType": "CPF",
  "authorized": false,
  "externalReference": "order-12345"
}
```

### Autenticação

O Asaas autentica requisições de webhook usando um cabeçalho customizado:

```typescript
import { ASAAS_WEBHOOK_AUTH_HEADER } from 'asaas-sdk'

// ASAAS_WEBHOOK_AUTH_HEADER = 'asaas-access-token'

app.post('/webhooks/transfer-validation', (req, res) => {
  const token = req.headers[ASAAS_WEBHOOK_AUTH_HEADER]

  if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return res.status(401).send('Unauthorized')
  }

  const transfer = req.body

  // Your validation logic
  const isValid = validateTransfer(transfer)

  res.json({
    transferValidation: isValid ? 'APPROVED' : 'REFUSED',
  })
})
```

### Respostas Esperadas

Seu webhook deve responder com um objeto JSON contendo o campo `transferValidation`:

**Aprovar a transferência:**

```json
{
  "transferValidation": "APPROVED"
}
```

**Recusar a transferência:**

```json
{
  "transferValidation": "REFUSED"
}
```

### Lógica de Retentativa

Se seu endpoint de webhook falhar em responder ou retornar um erro:

- O Asaas tentará a entrega até **3 vezes**
- Após 3 tentativas falhas, a transferência é **automaticamente cancelada**

Certifique-se de que seu endpoint de webhook tem alta disponibilidade e responde dentro de um timeout razoável.

### Exemplo de Implementação

```typescript
import { ASAAS_WEBHOOK_AUTH_HEADER } from 'asaas-sdk'
import express from 'express'

const app = express()
app.use(express.json())

app.post('/webhooks/transfer-validation', async (req, res) => {
  // 1. Authenticate the webhook
  const token = req.headers[ASAAS_WEBHOOK_AUTH_HEADER]
  if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // 2. Parse and validate the transfer
  const transfer = req.body

  try {
    // 3. Apply your business rules
    const validationResult = await validateTransferBusinessRules(transfer)

    // 4. Check against fraud detection
    const isSuspicious = await checkFraudDetection(transfer)

    if (isSuspicious) {
      console.warn('Suspicious transfer detected:', transfer.id)
      return res.json({ transferValidation: 'REFUSED' })
    }

    // 5. Verify external reference matches expected state
    if (transfer.externalReference) {
      const orderValid = await verifyOrderState(transfer.externalReference)
      if (!orderValid) {
        return res.json({ transferValidation: 'REFUSED' })
      }
    }

    // 6. Respond with approval
    res.json({ transferValidation: 'APPROVED' })
  } catch (error) {
    console.error('Transfer validation error:', error)
    // Fail closed - refuse transfer on error
    res.json({ transferValidation: 'REFUSED' })
  }
})

async function validateTransferBusinessRules(transfer) {
  // Example: Check transfer amount limits
  if (transfer.value > 10000) {
    throw new Error('Transfer exceeds maximum allowed amount')
  }
  return true
}

async function checkFraudDetection(transfer) {
  // Integrate with fraud detection service
  // Return true if suspicious, false otherwise
  return false
}

async function verifyOrderState(externalReference) {
  // Verify the external reference matches an expected state in your system
  // Return true if valid, false otherwise
  return true
}
```

## IPs Oficiais do Asaas

O Asaas mantém uma lista oficial de endereços IP usados para comunicação de webhooks e serviços da plataforma. Esta lista é atualizada periodicamente e deve ser referenciada da documentação oficial ao invés de estar em hardcode.

**Documentação oficial de IPs:**
[https://docs.asaas.com/docs/official-asaas-ips](https://docs.asaas.com/docs/official-asaas-ips)

### Uso

Se você precisa autorizar IPs do Asaas no seu firewall ou grupos de segurança:

1. Referencie a página de documentação oficial
2. Configure sua infraestrutura para permitir tráfego dos IPs listados
3. Inscreva-se para notificações do changelog do Asaas para capturar atualizações de IPs

**Não faça hardcode de IPs no código da sua aplicação.** Trate a lista de IPs como configuração operacional de infraestrutura.

## Requisito de HTTPS

Ao capturar dados de cartão de crédito através da sua própria interface (ao invés de usar páginas de pagamento hospedadas pelo Asaas), **HTTPS é obrigatório**.

### Quando HTTPS é Necessário

- Formulários de checkout customizados que coletam número do cartão, CVV e data de expiração
- Fluxos de tokenização onde dados do cartão passam pelos seus servidores
- Qualquer manipulação direta de dados do titular do cartão

### Conformidade PCI-DSS

Manipulação direta de dados de cartão de crédito requer conformidade com PCI-DSS. Usar páginas de pagamento hospedadas pelo Asaas (checkout transparente) reduz significativamente o escopo da sua conformidade PCI ao evitar manipulação direta de dados do cartão.

**Abordagem recomendada:**

```typescript
// ✅ Use Asaas-hosted checkout (reduced PCI scope)
const payment = await asaas.payments.create({
  customer: 'cus_000005048474',
  billingType: 'CREDIT_CARD',
  value: 100.0,
  creditCard: {
    holderName: 'João Silva',
    // Card details collected via Asaas hosted page
  },
})

// ❌ Custom form requires HTTPS and PCI compliance
// Your custom form → Your server → Asaas
```

Se você deve implementar captura customizada de dados do cartão, certifique-se de que:

- Todas as páginas usam HTTPS com certificados válidos
- Nenhum dado do cartão é registrado em logs ou armazenado
- Tokenização acontece imediatamente após a captura
- Sua infraestrutura atende aos requisitos PCI-DSS para seu nível de conformidade

## Resumo de Melhores Práticas

### Camadas de Segurança Combinadas

Para ambientes de produção lidando com operações sensíveis:

1. **Habilite a lista de permissões de IPs** para proteção em camada de rede
2. **Configure o webhook de validação de transferências** para aprovação programática
3. **Rotacione chaves de API periodicamente** (trimestralmente ou em eventos de segurança)
4. **Monitore erros 403** que podem indicar problemas com a lista de permissões de IPs
5. **Use chaves separadas por ambiente** para isolar sandbox e produção

### Monitoramento

Implemente monitoramento para eventos relacionados à segurança:

```typescript
import { AsaasClient, AsaasApiError } from 'asaas-sdk'

const client = new AsaasClient({
  accessToken: process.env.ASAAS_ACCESS_TOKEN!,
  environment: 'PRODUCTION',
})

try {
  await client.payments.create(paymentData)
} catch (error) {
  if (error instanceof AsaasApiError) {
    if (error.status === 401) {
      // Authentication failure - possible key compromise
      console.error('Authentication failed - check API key')
      alertSecurityTeam('API key authentication failure')
    } else if (error.status === 403) {
      // May indicate IP whitelist rejection
      console.error('Access forbidden - check IP whitelist')
      alertSecurityTeam('Possible IP whitelist rejection')
    } else if (error.status === 429) {
      // Rate limit exceeded - possible abuse
      console.warn('Rate limit exceeded')
      alertOperationsTeam('Rate limit threshold reached')
    }
  }
}
```

### Variáveis de Ambiente

Use uma convenção de nomenclatura consistente para variáveis de ambiente:

```bash
# .env.production
ASAAS_ACCESS_TOKEN=<production-key>
ASAAS_ENVIRONMENT=production
ASAAS_WEBHOOK_TOKEN=<webhook-auth-token>

# .env.sandbox
ASAAS_ACCESS_TOKEN=<sandbox-key>
ASAAS_ENVIRONMENT=sandbox
ASAAS_WEBHOOK_TOKEN=<webhook-auth-token>
```

### Checklist de Segurança de Transferências

Ao implementar transferências e saques:

- ✅ Habilite a lista de permissões de IPs para ambiente de produção
- ✅ Configure o webhook de validação de transferências
- ✅ Implemente autenticação robusta de webhook
- ✅ Lide com falhas de entrega de webhook com elegância
- ✅ Monitore o campo `authorized` nas respostas de transferência
- ✅ Documente fluxos de aprovação de transferência esperados
- ✅ Teste caminhos de aprovação automática e manual

### Checklist de HTTPS

Ao manipular dados de cartão de pagamento:

- ✅ Todas as páginas usam HTTPS com certificados válidos
- ✅ Dados do cartão nunca registrados em logs ou armazenados (exceto via tokenização do Asaas)
- ✅ Nível de conformidade PCI-DSS determinado e requisitos atendidos
- ✅ Varredura de segurança e avaliação de vulnerabilidades em vigor
- ✅ Considere usar páginas hospedadas pelo Asaas para reduzir escopo PCI

## Resposta a Incidentes de Segurança

Se você suspeitar de um incidente de segurança:

1. **Desabilite imediatamente a chave de API afetada** via dashboard do Asaas
2. **Gere uma nova chave** e atualize a configuração da sua aplicação
3. **Revise logs de acesso** para atividade não autorizada
4. **Atualize a lista de permissões de IPs** se o comprometimento envolveu acesso de rede
5. **Rotacione tokens de autenticação de webhook**
6. **Entre em contato com o suporte do Asaas** se o incidente envolver segurança da plataforma

## Recursos Adicionais

- [FAQs de Segurança do Asaas](https://docs.asaas.com/docs/duvidas-frequentes-seguranca)
- [Mecanismos Adicionais de Segurança](https://docs.asaas.com/docs/additional-security-mechanisms)
- [Documentação de Lista de Permissões de IPs](https://docs.asaas.com/docs/whitelist-de-ips)
- [Webhook de Validação de Transferências](https://docs.asaas.com/docs/mecanismo-para-validacao-de-saque-via-webhooks)
- [IPs Oficiais do Asaas](https://docs.asaas.com/docs/official-asaas-ips)
