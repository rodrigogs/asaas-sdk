# Notificacoes

> Data de revisao: 12 de marco de 2026

## Objetivo

Definir como o dominio oficial de notificacoes do Asaas deve virar um modulo TypeScript completo dentro do SDK `@repo/asaas`.

Este arquivo cobre:

- notificacoes padrao criadas por cliente
- consulta de notificacoes por cliente
- update unitario e em lote
- canais e destinatarios suportados pela API publica atual
- relacao entre `event` e `scheduleOffset`
- custos, limites de teste e interacao com `notificationDisabled`
- diferenca entre notificacoes de cliente, webhooks e outros avisos da plataforma

Sem esse modulo, o SDK nao consegue oferecer uma superficie segura para controlar a comunicacao de cobrancas com o cliente final.

## Papel do dominio na plataforma

Na documentacao oficial, notificacoes do Asaas nao sao um sistema generico de mensagens arbitrarias.

Elas funcionam como configuracoes fixas, vinculadas ao cliente, que controlam quando o Asaas envia avisos relacionados a cobrancas.

Isso cria tres limites importantes:

1. notificacoes nao sao webhooks
2. notificacoes nao sao alertas administrativos da conta
3. notificacoes nao sao recursos livres por cobranca

As FAQs e os guias oficiais repetem a mesma ideia:

- as notificacoes sao fixas
- elas sao criadas pelo proprio Asaas ao cadastrar um novo cliente
- depois podem ser ajustadas por cliente

Para o SDK, a conclusao correta e:

- `notifications` e um modulo de configuracao de comunicacao por cliente
- nao um modulo de entrega de mensagens sob demanda

## Recorte correto deste modulo

### O que entra aqui

- conjunto padrao de notificacoes criadas pelo Asaas
- leitura da lista de notificacoes de um cliente
- update de uma notificacao especifica
- update em lote das notificacoes de um cliente
- modelagem dos canais e destinatarios atuais
- relacao entre `event` e `scheduleOffset`
- efeitos de `notificationDisabled`
- custos e limites de sandbox ligados a notificacoes

### O que fica para outros modulos

- `notificationDisabled` como campo de `customers.create` e `customers.update`
- reenvio operacional de cobrancas e a propria geracao das cobrancas
- webhooks e eventos assincronos da plataforma
- alertas administrativos, como eventos de chave de API
- qualquer canal ou configuracao que apareca apenas em material comercial, sem superficie publica clara na API

Um limite importante aqui e este:

- este modulo controla notificacoes ligadas ao ciclo de cobrancas para um cliente
- ele nao substitui `customers`, `payments` ou `webhooks`

## Superficie oficial do dominio

Pela referencia oficial atual, o dominio publico de notificacoes expoe apenas tres operacoes:

- `GET /v3/customers/{id}/notifications`
  - resumo oficial: `Retrieve notifications from a customer`
  - permissao oficial: `CUSTOMER_NOTIFICATION:READ`
- `PUT /v3/notifications/{id}`
  - resumo oficial: `Update existing notification`
  - permissao oficial: `CUSTOMER_NOTIFICATION:WRITE`
- `PUT /v3/notifications/batch`
  - resumo oficial: `Update existing notifications in batch`
  - permissao oficial: `CUSTOMER_NOTIFICATION:WRITE`

Esse desenho ja mostra uma regra estrutural importante:

- a API publica atual nao documenta `create`, `delete`, `restore` ou `list` global de notificacoes

Isso bate com o texto funcional dos guias:

- as notificacoes sao fixas
- o Asaas as cria no cadastro do cliente

### Divergencia importante entre guia e referencia

Os guias de alteracao de notificacoes ainda mostram:

- `POST /v3/notifications/{id}`
- `POST /v3/notifications/batch`

Mas a referencia oficial atual documenta:

- `PUT /v3/notifications/{id}`
- `PUT /v3/notifications/batch`

Para o SDK, a regra deve ser simples:

- seguir a referencia atual e modelar `update` e `updateBatch` com `PUT`

## Contrato principal de notificacao

Pela referencia de leitura e pelos exemplos oficiais, o contrato publico de uma notificacao inclui:

- `id`
- `customer`
- `enabled`
- `emailEnabledForProvider`
- `smsEnabledForProvider`
- `emailEnabledForCustomer`
- `smsEnabledForCustomer`
- `phoneCallEnabledForCustomer`
- `whatsappEnabledForCustomer`
- `event`
- `scheduleOffset`
- `deleted`

O ponto de modelagem mais importante aqui e este:

- uma notificacao nao e identificada semanticamente apenas por `event`
- o par `event + scheduleOffset` e que diferencia parte relevante do comportamento

### Enum oficial de `event`

O enum oficial atual documentado e:

- `PAYMENT_CREATED`
- `PAYMENT_UPDATED`
- `PAYMENT_RECEIVED`
- `PAYMENT_OVERDUE`
- `PAYMENT_DUEDATE_WARNING`
- `SEND_LINHA_DIGITAVEL`

Esse enum aparece tanto na leitura de notificacoes quanto nos exemplos dos guias.

### Regra de `scheduleOffset`

O schema oficial atual documenta `scheduleOffset` como:

- inteiro
- valido apenas para `PAYMENT_DUEDATE_WARNING` e `PAYMENT_OVERDUE`
- com valores aceitos `0`, `1`, `5`, `7`, `10`, `15` e `30`

Ha uma inconsistencia importante na propria documentacao:

- a descricao do schema fala em "quantos dias antes do vencimento"
- mas o mesmo dominio usa `PAYMENT_OVERDUE` com `scheduleOffset = 7`, o que obviamente representa dias apos o vencimento

Para o SDK, a leitura correta e:

- `scheduleOffset` funciona como deslocamento temporal parametrico
- a interpretacao "antes" ou "depois" depende do `event`

### Sobre `enabled` e `deleted`

O contrato publica dois campos de estado:

- `enabled`
- `deleted`

Mas a API atual nao documenta endpoint de remocao de notificacao.

Para o SDK, isso implica:

- `deleted` deve ser tratado como estado de leitura
- nao como convite para inventar um metodo `remove`

## Notificacoes padrao criadas pelo Asaas

O guia oficial de notificacoes padrao afirma que, ao registrar um novo cliente, o Asaas cria um conjunto fixo de notificacoes.

Combinando esse guia com o fluxo de alteracao por cliente, o conjunto padrao atual pode ser resumido assim:

- `PAYMENT_CREATED` com `scheduleOffset = 0`
- `PAYMENT_DUEDATE_WARNING` com `scheduleOffset = 10`
- `PAYMENT_DUEDATE_WARNING` com `scheduleOffset = 0`
- `SEND_LINHA_DIGITAVEL` com `scheduleOffset = 0`
- `PAYMENT_UPDATED` com `scheduleOffset = 0`
- `PAYMENT_RECEIVED` com `scheduleOffset = 0`
- `PAYMENT_OVERDUE` com `scheduleOffset = 0`
- `PAYMENT_OVERDUE` com `scheduleOffset = 7`

Isso mostra por que o SDK nao deve reduzir o conceito a um simples enum de eventos:

- existem multiplas notificacoes padrao para o mesmo `event`

### Duas nuances operacionais importantes

Os guias oficiais ainda registram dois detalhes relevantes:

- `PAYMENT_CREATED` nao e enviado para cobrancas criadas por assinaturas
- o guia de cobrancas lista as notificacoes do fluxo financeiro, mas omite `PAYMENT_CREATED`, enquanto a pagina de defaults o inclui

Para o SDK, isso reforca:

- notificacoes dependem nao apenas do evento logico, mas tambem da origem do fluxo de cobranca

## Canais, destinatarios e limites da API publica atual

Os materiais funcionais do Asaas apresentam os seguintes canais de notificacao:

- email
- SMS
- WhatsApp
- voz
- servico postal

Ja a API publica atual de notificacoes por cliente deixa claramente expostos:

- email para o provider
- SMS para o provider
- email para o customer
- SMS para o customer
- chamada de voz para o customer
- WhatsApp para o customer

Ou seja:

- o contrato tipado atual da API cobre email, SMS, voz e WhatsApp
- mas nao expoe um campo publico claro para servico postal nas notificacoes de cliente

Para o SDK, a decisao correta e:

- nao inventar `postalServiceEnabledForCustomer` enquanto isso nao aparecer de forma consistente na superficie publica oficial

### Regras operacionais relevantes

Pelas FAQs e pelos guias de notificacao:

- notificacoes por voz exigem que o cliente tenha telefone fixo ou celular cadastrado
- o Asaas cobra pelo envio de notificacoes de cobranca
- no sandbox, email e SMS entram na lista de recursos testaveis
- no sandbox, WhatsApp nao pode ser testado

Os materiais que consultei nao documentam com a mesma clareza:

- suporte real de teste para voz
- suporte real de teste para servico postal

Entao o SDK deve documentar essa ausencia, nao assumir mais do que a fonte publica confirma.

## Relacao com `customers` e `notificationDisabled`

O campo `notificationDisabled` nao pertence aos endpoints de `notifications`.

Ele aparece em `customers.create` e `customers.update`.

Pelas FAQs oficiais:

- ao criar ou atualizar um cliente com `notificationDisabled = true`, esse cliente nao deve receber notificacoes por padrao

Mas a documentacao publica nao deixa totalmente claro se isso significa:

- deixar de enviar notificacoes mantendo os registros existentes
- ou impedir a materializacao do conjunto padrao logo na origem

Para o SDK, a postura correta e:

- tratar `notificationDisabled` como chave de bloqueio de envio em nivel de cliente
- sem prometer uma semantica de armazenamento que a documentacao nao garante

Tambem e importante manter os dois niveis separados:

- `notificationDisabled` e um kill switch amplo em `customers`
- `notifications.update` e `notifications.updateBatch` fazem o ajuste fino do conjunto padrao

## Update unitario e em lote

### Update unitario

A operacao canonicamente documentada hoje e:

- `PUT /v3/notifications/{id}`

Os guias mostram que e possivel alterar:

- canais habilitados
- destinatario
- antecedencia ou deslocamento do envio para notificacoes parametrizadas

Uma inferencia forte, a partir do guia de alteracao e do schema oficial de notificacao, e que `scheduleOffset` faz parte do conjunto editavel para notificacoes de vencimento e atraso.

Para o SDK, isso significa:

- `update(id, input)` deve aceitar flags de canal
- e tambem `scheduleOffset` quando o `event` suportar essa configuracao

### Update em lote

A operacao canonicamente documentada hoje e:

- `PUT /v3/notifications/batch`

O texto oficial da referencia resume esse endpoint como a forma de customizar varias notificacoes de uma vez:

- enviando o identificador do cliente
- e a lista de notificacoes a serem atualizadas

Esse endpoint e particularmente importante porque o conjunto de notificacoes e fixo.

Na pratica, ele cobre o fluxo operacional mais comum:

1. criar ou localizar o cliente
2. listar o conjunto padrao de notificacoes
3. ajustar varias configuracoes de uma vez
4. so entao emitir cobrancas com o comportamento desejado

### Outra divergencia importante de documentacao

O resumo da referencia de update em lote fala em:

- email
- SMS
- voz

Mas os exemplos e o contrato oficial de notificacao tambem expoem:

- `whatsappEnabledForCustomer`

Para o SDK, a conclusao correta e:

- a prosa resumida da referencia esta atras do schema atual
- o pacote deve modelar WhatsApp porque ele aparece no contrato publico efetivo

## Decisoes recomendadas para a API publica do SDK

O modulo deveria convergir para algo proximo de:

```ts
type AsaasCustomerNotificationEvent =
  | 'PAYMENT_CREATED'
  | 'PAYMENT_UPDATED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_DUEDATE_WARNING'
  | 'SEND_LINHA_DIGITAVEL'

type AsaasCustomerNotificationScheduleOffset = 0 | 1 | 5 | 7 | 10 | 15 | 30

type AsaasCustomerNotification = {
  id: string
  customer: string
  enabled: boolean
  emailEnabledForProvider: boolean
  smsEnabledForProvider: boolean
  emailEnabledForCustomer: boolean
  smsEnabledForCustomer: boolean
  phoneCallEnabledForCustomer: boolean
  whatsappEnabledForCustomer: boolean
  event: AsaasCustomerNotificationEvent
  scheduleOffset: AsaasCustomerNotificationScheduleOffset
  deleted: boolean
}

type UpdateCustomerNotificationInput = {
  enabled?: boolean
  emailEnabledForProvider?: boolean
  smsEnabledForProvider?: boolean
  emailEnabledForCustomer?: boolean
  smsEnabledForCustomer?: boolean
  phoneCallEnabledForCustomer?: boolean
  whatsappEnabledForCustomer?: boolean
  scheduleOffset?: AsaasCustomerNotificationScheduleOffset
}

type BatchUpdateCustomerNotificationsInput = {
  customer: string
  notifications: Array<
    {
      id: string
    } & UpdateCustomerNotificationInput
  >
}
```

E o servico publico deveria ter pelo menos:

```ts
asaas.notifications.listByCustomer(customerId)
asaas.notifications.update(id, input)
asaas.notifications.updateBatch(input)
```

Tambem faz sentido manter, por discoverability, o alias ja previsto em `customers`:

```ts
asaas.customers.listNotifications(customerId)
```

Mas a modelagem canonica do contrato deve morar em `notifications`.

O SDK nao deveria:

- inventar `create` ou `remove` de notificacoes
- colapsar notificacoes apenas por `event`, ignorando `scheduleOffset`
- expor campo de servico postal sem superficie oficial clara
- seguir `POST` so porque os guias de exemplo ainda usam esse verbo
- tratar `notificationDisabled` como substituto completo do ajuste fino por notificacao

## O que este modulo muda no plano do SDK

Depois desta etapa, o pacote ja deveria apontar para uma base como:

- `notifications/types.ts`
- `notifications/service.ts`
- `notifications/defaults.ts`
- `notifications/contracts.ts`

Com responsabilidades claras:

- `types.ts` para entidade principal, enums e offsets
- `service.ts` para list, update e updateBatch
- `defaults.ts` para o mapeamento do conjunto padrao conhecido
- `contracts.ts` para inputs de update, lote e helpers de compatibilidade

Esse modulo tambem consolida cinco regras de desenho:

- notificacoes sao configuracoes fixas por cliente, nao recursos livres
- `event` sozinho nao descreve todo o comportamento; `scheduleOffset` tambem importa
- a documentacao oficial diverge entre guias e referencia sobre o verbo HTTP
- a lista de canais do produto e maior que a superficie tipada atual da API
- `notificationDisabled` e configuracao ampla de cliente, nao substituto do modulo de notificacoes

## Perguntas que este modulo responde

### Qual parte oficial foi pesquisada?

- guias de notificacoes padrao e alteracao de notificacoes por cliente
- FAQ oficial de notificacoes
- referencias de listagem por cliente, update unitario e update em lote
- material de cobrancas e sandbox que afeta o comportamento e os testes de notificacao
- referencias de criacao e update de cliente para `notificationDisabled`

### Quais capacidades reais isso mostra?

- o Asaas cria um conjunto padrao e fixo de notificacoes no nivel do cliente
- essas notificacoes podem ser consultadas e alteradas, inclusive em lote
- o dominio atual gira em torno de cobrancas, nao de mensagens arbitrarias
- canais e destinatarios sao modelados com flags separadas
- `scheduleOffset` diferencia notificacoes do mesmo evento
- sandbox nao cobre todos os canais da mesma forma

### Como isso deve virar API publica no SDK?

- com um modulo `notifications` proprio
- com tipos canonicos de notificacao, evento e offset
- com `listByCustomer`, `update` e `updateBatch`
- com documentacao explicita das divergencias de verbo e de canais na fonte oficial
- com separacao entre kill switch em `customers` e ajuste fino em `notifications`

### O que fica fora deste corte?

- criacao e remocao arbitraria de notificacoes
- renderizacao do conteudo das mensagens
- politicas comerciais e cobrancas detalhadas por canal
- notificacoes administrativas e webhooks
- qualquer campo de canal que nao esteja estabilizado na API publica atual

## Fontes oficiais consultadas

- [Default notifications](https://docs.asaas.com/docs/default-notifications)
- [Changing notifications of a client](https://docs.asaas.com/docs/changing-notifications-of-a-client)
- [Notifications FAQ](https://docs.asaas.com/docs/notifications-1)
- [Payments](https://docs.asaas.com/docs/payments-1)
- [O que pode ser testado](https://docs.asaas.com/docs/o-que-pode-ser-testado)
- [Create new customer](https://docs.asaas.com/reference/create-new-customer)
- [Update existing customer](https://docs.asaas.com/reference/update-existing-customer)
- [Retrieve notifications from a customer](https://docs.asaas.com/reference/retrieve-notifications-from-a-customer)
- [Update existing notification](https://docs.asaas.com/reference/update-existing-notification)
- [Update existing notifications in batch](https://docs.asaas.com/reference/update-existing-notifications-in-batch)
