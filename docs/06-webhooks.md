# Webhooks

> Data de revisao: 12 de marco de 2026

## Objetivo

Definir como o dominio oficial de webhooks do Asaas deve virar um modulo TypeScript completo dentro do SDK `@repo/asaas`.

Este arquivo cobre:

- configuracao de webhooks por API
- contrato de configuracao e leitura do recurso `webhook`
- autenticacao do envio para o endpoint consumidor
- tipos de envio sequencial e nao sequencial
- semantica de entrega, retries, idempotencia e tolerancia a duplicidade
- penalizacao, fila pausada, reativacao e logs
- catalogo oficial de eventos por dominio
- mudancas recentes de payload que afetam o desenho do SDK

Sem esse modulo, o SDK fica preso a um cliente HTTP cru e nao consegue oferecer uma superficie segura para:

- configurar recebimento de eventos
- modelar os enums reais de eventos
- tratar o payload assinado pelo Asaas de forma tolerante a evolucao
- separar operacao de fila de CRUD comum

## Papel do dominio na plataforma

Na documentacao oficial, webhooks sao o mecanismo preferencial para manter a aplicacao sincronizada com o Asaas sem polling continuo.

Na pratica, esse dominio funciona como a camada assincrona transversal da plataforma:

- `payments`, `subscriptions`, `invoices`, `transfers`, `bills` e outros modulos publicam eventos aqui
- a configuracao de webhooks e centralizada em `v3/webhooks`
- o payload recebido combina metadados do evento com o recurso relacionado

Para o SDK, isso implica uma regra simples:

1. `webhooks` nao e apenas "mais um endpoint administrativo".
2. ele define parte do contrato de integracao de todos os outros modulos.
3. o pacote precisa expor tipos e helpers para configurar e consumir esse fluxo com seguranca.

## Recorte correto deste modulo

### O que entra aqui

- create, list, get, update e remove de webhooks
- operacao de remocao de penalizacao da fila
- enums oficiais de `sendType` e `events`
- contrato basico do payload entregue pelo Asaas
- header de autenticacao do webhook
- regras de sucesso, retries, duplicidade e ordem
- notas operacionais sobre logs, fila pausada e retencao

### O que fica para outros modulos

- modelagem detalhada do recurso enviado dentro de cada evento
- regras de negocio de `payments`, `subscriptions`, `invoices`, `transfers` e afins
- webhook de autorizacao de transferencias como mecanismo adicional de seguranca
- implementacao HTTP do servidor consumidor em frameworks especificos

Um limite importante aqui e este:

- `webhooks` define o envelope assincrono comum
- o shape profundo de `payment`, `subscription`, `invoice`, `transfer` e demais objetos continua pertencendo ao modulo do proprio dominio

## Superficie oficial do dominio

Pelo conjunto atual de guias, changelog e referencia da API, o dominio de webhooks se divide em dois blocos.

### 1. Configuracao do webhook

- `POST /v3/webhooks`
- `GET /v3/webhooks`
- `GET /v3/webhooks/{id}`
- `PUT /v3/webhooks/{id}`
- `DELETE /v3/webhooks/{id}`

Os guias oficiais deixam claro que:

- a mesma configuracao vale para conta raiz e subcontas
- cada conta pode ter ate 10 webhooks configurados
- cada webhook pode observar um conjunto arbitrario de eventos

### 2. Operacao da fila

- `POST /v3/webhooks/{id}/removeBackoff`

Esse endpoint nao e CRUD comum.

Ele existe para remover a penalizacao de uma configuracao que acumulou falhas e retomar o processamento do topo da fila sem esperar a janela penalizada atual apos a correcao do problema no sistema consumidor.

Para o SDK, isso pede um metodo operacional proprio, nao um alias escondido dentro de `update`.

## Contrato principal de configuracao

### Criacao

Pela referencia atual, o request de criacao documenta os seguintes campos:

- `name`
- `url`
- `email`
- `enabled`
- `interrupted`
- `apiVersion`
- `authToken`
- `sendType`
- `events`

Os enums oficiais atuais de `sendType` sao:

- `SEQUENTIALLY`
- `NON_SEQUENTIALLY`

Um ponto importante de documentacao:

- o schema atual da referencia ainda nao marca nenhum campo como obrigatorio
- ao mesmo tempo, o changelog de 19 de fevereiro de 2026 passou a tratar `authToken` como obrigatorio na configuracao de qualquer webhook
- se `authToken` nao for enviado no `POST /v3/webhooks`, o Asaas informa que gera automaticamente um token forte e o devolve apenas na resposta de criacao

Logo, o SDK nao deve confiar cegamente na lista de `required` do schema publico atual.

### Atualizacao

Pela referencia atual de `PUT /v3/webhooks/{id}`, os campos documentados para update sao:

- `name`
- `url`
- `sendType`
- `enabled`
- `interrupted`
- `authToken`
- `events`

Ha duas assimetrias relevantes entre create e update:

- `email` aparece no create, mas nao no update documentado
- `apiVersion` aparece no create, mas nao no update documentado

Entao o SDK nao deve modelar `update` como `Partial<CreateWebhookInput>` sem cuidado.

### Leitura

Na resposta de leitura e listagem, a referencia atual documenta:

- `id`
- `name`
- `url`
- `email`
- `enabled`
- `interrupted`
- `apiVersion`
- `hasAuthToken`
- `sendType`
- `penalizedRequestsCount`
- `events`

Esse contrato deixa clara outra assimetria importante:

- a API de leitura retorna `hasAuthToken`
- ela nao expoe o token configurado como campo normal de leitura

Para o SDK, isso significa separar:

- tipo de escrita
- tipo de leitura
- comportamento especial do retorno de criacao quando houver auto-geracao de token

## Tipos de envio, autenticacao e entrega

### Tipos de envio

O guia oficial de tipos de envio diferencia os dois modos assim:

- `SEQUENTIALLY`: preserva a ordem dos eventos na fila
- `NON_SEQUENTIALLY`: prioriza throughput e nao garante ordem

O proprio guia recomenda o uso pratico assim:

- envio sequencial quando a ordem dos eventos importa
- envio nao sequencial quando poucos eventos sao observados e a ordem nao muda o resultado

Para o SDK, isso pede:

- enum publico de `AsaasWebhookSendType`
- documentacao explicita da troca entre ordem e throughput
- nenhuma tentativa de "normalizar" os dois comportamentos como se fossem equivalentes

### Autenticacao do disparo

Pelo guia da aplicacao web e pela FAQ oficial:

- o token de autenticacao do webhook e enviado no header `asaas-access-token`

Esse detalhe e importante porque o webhook nao deve ser validado apenas por origem de IP ou por formato do corpo.

O SDK deve documentar claramente que:

- o `authToken` configurado e um segredo de inbound webhook
- ele nao se confunde com o header `access_token` usado pela API do Asaas nas chamadas de cliente para servidor

### Semantica de entrega

Os guias oficiais de webhooks e fila pausada deixam claro que:

- o Asaas faz um `POST` para a URL configurada
- o corpo contem o evento e o recurso relacionado
- a notificacao so e considerada processada com sucesso quando o endpoint responde com status HTTP na faixa 2xx (>= 200 e < 300)
- qualquer retorno fora da faixa 2xx conta como falha de comunicacao

O guia de fila pausada ainda registra um detalhe operacional importante:

- o Asaas espera a resposta por 10 segundos

Para o SDK, isso reforca duas orientacoes:

1. o consumidor deve responder rapido e delegar processamento pesado para fila interna quando necessario
2. o pacote nao deve pressupor confirmacao semantica mais rica do que um status 2xx

## Idempotencia, duplicidade e evolucao do payload

O guia oficial de idempotencia afirma explicitamente que os webhooks do Asaas seguem a premissa de `at least once`.

Na pratica, isso significa:

- o mesmo evento pode ser entregue mais de uma vez
- o endpoint consumidor deve ser idempotente
- responder `200` para um evento ja processado continua sendo o comportamento correto

O changelog de 25 de marco de 2024 adicionou um identificador proprio de evento no payload, justamente para facilitar o tratamento de duplicidade.

O changelog de 17 de junho de 2024 adicionou `dateCreated` por padrao aos objetos enviados por webhook.

E o changelog de 5 de janeiro de 2026 adicionou o objeto raiz `account` aos webhooks V3, com:

- `account.id`
- `account.ownerId`

Isso melhora a conciliacao em cenarios com subcontas, mas tambem mostra uma regra importante para o SDK:

- payloads de webhook evoluem com o tempo
- o parser do pacote nao deve rejeitar atributos desconhecidos
- os tipos de entrada precisam ser tolerantes a campos extras

## Penalizacao, fila pausada e logs

Em novembro de 2025, o Asaas introduziu um sistema oficial de penalizacao para filas de webhook.

Pelos guias atuais:

- falhas consecutivas passam a aumentar o intervalo entre novas tentativas
- isso vale para configuracoes sequenciais e nao sequenciais
- no modo sequencial, um evento penalizado bloqueia os eventos seguintes da mesma fila ate ser entregue com sucesso

Os pontos operacionais mais importantes sao:

- apos 15 falhas consecutivas, a fila fica pausada
- novos eventos continuam sendo gerados e enfileirados
- esses eventos nao sao enviados ate que a fila seja reativada
- os logs de webhook ficam disponiveis por 14 dias
- eventos que permanecerem travados por mais de 14 dias podem ser perdidos
- o Asaas envia email quando ha problema de comunicacao

O guia de penalizacao tambem traz duas nuances que impactam o SDK:

- `removeBackoff` permite remover a penalizacao sem esperar o ciclo inteiro terminar
- esse endpoint possui rate limit mais restrito para desencorajar automacao agressiva

Para a API publica do pacote, a consequencia pratica e:

- `removeBackoff` deve existir como operacao administrativa explicita
- o SDK deve tratar `interrupted` e `penalizedRequestsCount` como sinais operacionais reais, nao como metadados cosmeticos

## Catalogo oficial de eventos por dominio

O enum oficial atual de `events`, documentado na referencia de create e update, cobre pelo menos os seguintes grupos.

### Payments

- `PAYMENT_AUTHORIZED`
- `PAYMENT_AWAITING_RISK_ANALYSIS`
- `PAYMENT_APPROVED_BY_RISK_ANALYSIS`
- `PAYMENT_REPROVED_BY_RISK_ANALYSIS`
- `PAYMENT_CREATED`
- `PAYMENT_UPDATED`
- `PAYMENT_CONFIRMED`
- `PAYMENT_RECEIVED`
- `PAYMENT_ANTICIPATED`
- `PAYMENT_OVERDUE`
- `PAYMENT_DELETED`
- `PAYMENT_RESTORED`
- `PAYMENT_REFUNDED`
- `PAYMENT_REFUND_IN_PROGRESS`
- `PAYMENT_REFUND_DENIED`
- `PAYMENT_RECEIVED_IN_CASH_UNDONE`
- `PAYMENT_CHARGEBACK_REQUESTED`
- `PAYMENT_CHARGEBACK_DISPUTE`
- `PAYMENT_AWAITING_CHARGEBACK_REVERSAL`
- `PAYMENT_DUNNING_RECEIVED`
- `PAYMENT_DUNNING_REQUESTED`
- `PAYMENT_BANK_SLIP_CANCELLED`
- `PAYMENT_BANK_SLIP_VIEWED`
- `PAYMENT_CHECKOUT_VIEWED`
- `PAYMENT_CREDIT_CARD_CAPTURE_REFUSED`
- `PAYMENT_PARTIALLY_REFUNDED`
- `PAYMENT_SPLIT_CANCELLED`
- `PAYMENT_SPLIT_DIVERGENCE_BLOCK`
- `PAYMENT_SPLIT_DIVERGENCE_BLOCK_FINISHED`

### Subscriptions

- `SUBSCRIPTION_CREATED`
- `SUBSCRIPTION_UPDATED`
- `SUBSCRIPTION_INACTIVATED`
- `SUBSCRIPTION_DELETED`
- `SUBSCRIPTION_SPLIT_DISABLED`
- `SUBSCRIPTION_SPLIT_DIVERGENCE_BLOCK`
- `SUBSCRIPTION_SPLIT_DIVERGENCE_BLOCK_FINISHED`

### Invoices

- `INVOICE_CREATED`
- `INVOICE_UPDATED`
- `INVOICE_SYNCHRONIZED`
- `INVOICE_AUTHORIZED`
- `INVOICE_PROCESSING_CANCELLATION`
- `INVOICE_CANCELED`
- `INVOICE_CANCELLATION_DENIED`
- `INVOICE_ERROR`

### Transfers

- `TRANSFER_CREATED`
- `TRANSFER_PENDING`
- `TRANSFER_IN_BANK_PROCESSING`
- `TRANSFER_BLOCKED`
- `TRANSFER_DONE`
- `TRANSFER_FAILED`
- `TRANSFER_CANCELLED`

### Bills

- `BILL_CREATED`
- `BILL_PENDING`
- `BILL_BANK_PROCESSING`
- `BILL_PAID`
- `BILL_CANCELLED`
- `BILL_FAILED`
- `BILL_REFUNDED`

### Receivable anticipations

- `RECEIVABLE_ANTICIPATION_CANCELLED`
- `RECEIVABLE_ANTICIPATION_SCHEDULED`
- `RECEIVABLE_ANTICIPATION_PENDING`
- `RECEIVABLE_ANTICIPATION_CREDITED`
- `RECEIVABLE_ANTICIPATION_DEBITED`
- `RECEIVABLE_ANTICIPATION_DENIED`
- `RECEIVABLE_ANTICIPATION_OVERDUE`

### Mobile phone recharge

- `MOBILE_PHONE_RECHARGE_PENDING`
- `MOBILE_PHONE_RECHARGE_CANCELLED`
- `MOBILE_PHONE_RECHARGE_CONFIRMED`
- `MOBILE_PHONE_RECHARGE_REFUNDED`

### Account status

- `ACCOUNT_STATUS_BANK_ACCOUNT_INFO_APPROVED`
- `ACCOUNT_STATUS_BANK_ACCOUNT_INFO_AWAITING_APPROVAL`
- `ACCOUNT_STATUS_BANK_ACCOUNT_INFO_PENDING`
- `ACCOUNT_STATUS_BANK_ACCOUNT_INFO_REJECTED`
- `ACCOUNT_STATUS_COMMERCIAL_INFO_APPROVED`
- `ACCOUNT_STATUS_COMMERCIAL_INFO_AWAITING_APPROVAL`
- `ACCOUNT_STATUS_COMMERCIAL_INFO_PENDING`
- `ACCOUNT_STATUS_COMMERCIAL_INFO_REJECTED`
- `ACCOUNT_STATUS_COMMERCIAL_INFO_EXPIRING_SOON`
- `ACCOUNT_STATUS_DOCUMENT_APPROVED`
- `ACCOUNT_STATUS_DOCUMENT_AWAITING_APPROVAL`
- `ACCOUNT_STATUS_DOCUMENT_PENDING`
- `ACCOUNT_STATUS_DOCUMENT_REJECTED`
- `ACCOUNT_STATUS_GENERAL_APPROVED`
- `ACCOUNT_STATUS_GENERAL_AWAITING_APPROVAL`
- `ACCOUNT_STATUS_GENERAL_PENDING`
- `ACCOUNT_STATUS_GENERAL_REJECTED`

### Checkout

- `CHECKOUT_CREATED`
- `CHECKOUT_CANCELED`
- `CHECKOUT_EXPIRED`
- `CHECKOUT_PAID`

### Balance blocks

- `BALANCE_VALUE_BLOCKED`
- `BALANCE_VALUE_UNBLOCKED`

### Internal transfers

- `INTERNAL_TRANSFER_CREDIT`
- `INTERNAL_TRANSFER_DEBIT`

### Access tokens

- `ACCESS_TOKEN_CREATED`
- `ACCESS_TOKEN_DELETED`
- `ACCESS_TOKEN_DISABLED`
- `ACCESS_TOKEN_ENABLED`
- `ACCESS_TOKEN_EXPIRED`
- `ACCESS_TOKEN_EXPIRING_SOON`

### Pix automatic recurring

- `PIX_AUTOMATIC_RECURRING_AUTHORIZATION_CREATED`
- `PIX_AUTOMATIC_RECURRING_AUTHORIZATION_ACTIVATED`
- `PIX_AUTOMATIC_RECURRING_AUTHORIZATION_CANCELLED`
- `PIX_AUTOMATIC_RECURRING_AUTHORIZATION_EXPIRED`
- `PIX_AUTOMATIC_RECURRING_AUTHORIZATION_REFUSED`
- `PIX_AUTOMATIC_RECURRING_PAYMENT_INSTRUCTION_CREATED`
- `PIX_AUTOMATIC_RECURRING_PAYMENT_INSTRUCTION_SCHEDULED`
- `PIX_AUTOMATIC_RECURRING_PAYMENT_INSTRUCTION_REFUSED`
- `PIX_AUTOMATIC_RECURRING_PAYMENT_INSTRUCTION_CANCELLED`
- `PIX_AUTOMATIC_RECURRING_ELIGIBILITY_UPDATED`

Para o SDK, o ponto central e este:

- as paginas tematicas de webhook por produto ajudam a entender payload e semantica
- mas o enum mais confiavel para o catalogo global do modulo hoje e o da referencia de `webhooks`

## Inconsistencias e riscos de compatibilidade

O dominio de webhooks hoje tem algumas divergencias relevantes entre guias, referencia e changelog.

### `authToken` opcional nos guias antigos vs obrigatorio no changelog recente

Os guias de criacao ainda mostram exemplos com `authToken: null` e a referencia nao marca o campo como obrigatorio.

Ja o changelog de 20 de fevereiro de 2026 define que:

- todo webhook deve ter token
- no `POST`, o Asaas pode auto-gerar um token forte se ele nao for enviado

O SDK deve priorizar o comportamento mais recente e tratar a referencia antiga como atrasada.

### Regras de complexidade de token

Em 2 de marco de 2026, o Asaas adicionou validacao de forca para `authToken`.

Pela regra atual do changelog, um token valido deve:

- ter entre 32 e 255 caracteres
- nao conter espacos em branco
- nao usar sequencias numericas previsiveis
- nao repetir 4 letras em sequencia
- nao ser uma chave de API do Asaas

Isso e criterio de validacao de entrada e merece helper local no SDK.

### Guia geral de assinaturas desatualizado em relacao aos webhooks de assinatura

O guia geral de assinaturas ainda afirma que o Asaas nao possui webhooks proprios de assinatura e que o acompanhamento deve ser feito por `payments`.

Mas a documentacao de webhooks e o changelog ja publicam eventos oficiais de `subscriptions`.

Conclusao:

- o modulo `webhooks` deve expor `SUBSCRIPTION_*`
- o pacote nao deve repetir a limitacao historica do guia geral de assinaturas

### Datas de assinatura e outros campos podem mudar

O calendario oficial de breaking changes informa que, em 2 de fevereiro de 2026, datas de webhooks de assinatura foram padronizadas para `yyyy-MM-dd`.

Para o SDK, isso reforca:

- nao inferir formato de data a partir de exemplos antigos
- evitar validadores rigidos demais em campos legados
- versionar bem os tipos de payload quando a documentacao anunciar mudancas estruturais

## Decisoes recomendadas para a API publica do SDK

O modulo `webhooks` deveria convergir para algo proximo de:

```ts
asaas.webhooks.create(input)
asaas.webhooks.list(filters)
asaas.webhooks.get(id)
asaas.webhooks.update(id, input)
asaas.webhooks.remove(id)
asaas.webhooks.removeBackoff(id)
```

E tambem expor tipos e utilitarios como:

```ts
type AsaasWebhookSendType = "SEQUENTIALLY" | "NON_SEQUENTIALLY"
type AsaasWebhookEvent = ...

type AsaasWebhookConfig = ...
type AsaasWebhookCreateInput = ...
type AsaasWebhookUpdateInput = ...
type AsaasWebhookPayloadBase = ...

isAsaasWebhookEvent(value)
groupAsaasWebhookEvent(value)
```

O pacote nao deveria:

- esconder `removeBackoff` dentro de um metodo generico de `update`
- selar o payload recebido com validacao exata demais
- misturar `authToken` de webhook com `access_token` da API
- replicar manualmente enums por modulo sem uma fonte central

## O que este modulo muda no plano do SDK

Depois desta etapa, o pacote ja deveria apontar para uma base como:

- `webhooks/types.ts`
- `webhooks/events.ts`
- `webhooks/payloads.ts`
- `webhooks/contracts.ts`
- `webhooks/service.ts`
- `webhooks/operations.ts`

Com responsabilidades claras:

- `types.ts` para configuracao lida pela API
- `events.ts` para enum global, grupos por dominio e funcoes utilitarias
- `payloads.ts` para envelope base, `account`, `dateCreated`, `id` e parsers tolerantes
- `contracts.ts` para inputs de create, update e filtros de listagem
- `service.ts` para CRUD da configuracao
- `operations.ts` para `removeBackoff` e demais acoes administrativas

Esse modulo tambem consolida cinco regras de desenho:

- webhook e um modulo transversal, nao um detalhe de infraestrutura
- create e update nao compartilham exatamente o mesmo shape
- payload inbound deve aceitar evolucao da plataforma
- ordem de eventos e throughput sao escolhas explicitas
- operacao de fila pausada merece superficie propria

## Perguntas que este modulo responde

### Qual parte oficial foi pesquisada?

- guias de visao geral, criacao, tipos de envio, idempotencia, fila pausada, penalizacao e logs
- paginas tematicas de eventos por dominio
- referencias de create, list, get, update, remove e `removeBackoff`
- changelog recente de `authToken`, payload e breaking changes

### Quais capacidades reais isso mostra?

- o Asaas centraliza a configuracao de webhooks em um recurso proprio
- existe escolha entre envio sequencial e nao sequencial
- a entrega e `at least once`, com duplicidade possivel
- a fila pode ser penalizada, pausada e reativada
- o catalogo de eventos ja cobre varios dominios alem de cobrancas
- o payload V3 continua evoluindo com campos novos como `id`, `dateCreated` e `account`

### Como isso deve virar API publica no SDK?

- com um modulo `webhooks` proprio
- com tipos separados para create, update, leitura e payload inbound
- com enum global unico de eventos
- com helper para grupos de eventos
- com operacao dedicada para `removeBackoff`
- com documentacao clara sobre `authToken`, `asaas-access-token` e idempotencia

### O que fica fora deste corte?

- shape detalhado do recurso aninhado em cada evento
- implementacao do servidor consumidor em Express, Fastify, Next ou similares
- log viewer no painel do Asaas
- webhook de autorizacao de transferencias como fluxo de seguranca especializado

## Fontes oficiais consultadas

- [Sobre os Webhooks](https://docs.asaas.com/docs/sobre-os-webhooks)
- [Criar novo Webhook pela aplicacao web](https://docs.asaas.com/docs/criar-novo-webhook-pela-aplicacao-web)
- [Criar novo Webhook pela API](https://docs.asaas.com/docs/criar-novo-webhook-pela-api)
- [Tipos de envio](https://docs.asaas.com/docs/tipos-de-envio)
- [Receba eventos do Asaas no seu endpoint de Webhook](https://docs.asaas.com/docs/receba-eventos-do-asaas-no-seu-endpoint-de-webhook)
- [Como implementar idempotencia em Webhooks](https://docs.asaas.com/docs/como-implementar-idempotencia-em-webhooks)
- [Polling vs Webhooks](https://docs.asaas.com/docs/polling-vs-webhooks)
- [Fila pausada](https://docs.asaas.com/docs/fila-pausada)
- [Penalizacao de filas](https://docs.asaas.com/docs/penaliza%C3%A7%C3%A3o-de-filas)
- [Como reativar fila interrompida](https://docs.asaas.com/docs/como-reativar-fila-interrompida)
- [Logs de Webhooks](https://docs.asaas.com/docs/logs-de-webhooks)
- [Erro 408 - Read Timed Out](https://docs.asaas.com/docs/erro-read-timed-out)
- [Webhook para cobrancas](https://docs.asaas.com/docs/webhook-para-cobrancas)
- [Eventos para assinaturas](https://docs.asaas.com/docs/eventos-para-assinaturas)
- [Webhook para notas fiscais](https://docs.asaas.com/docs/webhook-para-notas-fiscais)
- [Webhook para transferencias](https://docs.asaas.com/docs/webhook-para-transferencias)
- [Webhook para pague contas](https://docs.asaas.com/docs/webhook-para-pague-contas)
- [Webhook para antecipacoes](https://docs.asaas.com/docs/webhook-para-antecipacoes)
- [Webhook para recargas de celular](https://docs.asaas.com/docs/webhook-para-recargas-de-celular)
- [Webhook para verificar situacao da conta](https://docs.asaas.com/docs/webhook-para-verificar-situacao-da-conta)
- [Eventos para bloqueios de saldo](https://docs.asaas.com/docs/eventos-para-bloqueios-de-saldo)
- [Eventos para checkout](https://docs.asaas.com/docs/eventos-para-checkout)
- [Eventos para movimentacoes internas](https://docs.asaas.com/docs/eventos-para-movimenta%C3%A7%C3%B5es-internas)
- [Eventos para chaves de API](https://docs.asaas.com/docs/eventos-para-chaves-de-api)
- [Eventos para Pix automatico](https://docs.asaas.com/docs/eventos-para-pix-autom%C3%A1tico)
- [Create new Webhook](https://docs.asaas.com/reference/create-new-webhook)
- [List Webhooks](https://docs.asaas.com/reference/list-webhooks)
- [Retrieve a single Webhook](https://docs.asaas.com/reference/retrieve-a-single-webhook)
- [Update existing Webhook](https://docs.asaas.com/reference/update-existing-webhook)
- [Remove Webhook](https://docs.asaas.com/reference/remove-webhook)
- [Remove webhook backoff](https://docs.asaas.com/reference/remove-webhook-backoff)
- [Obrigatoriedade e auto-geracao de tokens para Webhooks](https://docs.asaas.com/changelog/obrigatoriedade-e-auto-gera%C3%A7%C3%A3o-de-tokens-para-webhooks)
- [Validacao de complexidade em tokens de Webhook](https://docs.asaas.com/changelog/valida%C3%A7%C3%A3o-de-complexidade-em-tokens-de-webhook)
- [Inclusao de campo com ID do evento em envios de Webhooks](https://docs.asaas.com/changelog/inclus%C3%A3o-de-campo-com-id-do-evento-em-envios-de-webhooks)
- [Campo dateCreated em objetos de Webhooks](https://docs.asaas.com/changelog/campo-datecreated-em-objetos-de-webhooks)
- [Identificacao da origem da conta em Webhooks V3](https://docs.asaas.com/changelog/identifica%C3%A7%C3%A3o-da-origem-da-conta-em-webhooks-v3)
- [Breaking changes](https://docs.asaas.com/page/breaking-changes)
- [Assinaturas](https://docs.asaas.com/docs/assinaturas)
