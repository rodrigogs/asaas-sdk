# Clientes

> Data de revisao: 12 de marco de 2026

## Objetivo

Definir como o recurso oficial de `customers` do Asaas deve virar um modulo publico e tipado dentro do SDK `@repo/asaas`.

Este arquivo cobre:

- papel do cliente na plataforma
- CRUD oficial de clientes
- filtros de busca e listagem
- contrato de escrita e leitura
- exclusao e restauracao
- consulta de notificacoes por cliente

Sem esse modulo, `payments`, `subscriptions`, `invoices` e outros dominios acabam dependendo de payloads montados ad hoc ou de identificadores de cliente sem contrato claro.

## Papel do recurso na plataforma

A documentacao oficial posiciona `customers` como etapa base do fluxo financeiro.

O guia de criacao de clientes afirma que o primeiro passo para criar uma cobranca e obter o identificador unico do cliente, seja criando um novo cadastro, seja consultando um cliente previamente criado.

Para o SDK, isso significa duas coisas:

1. `customers` e um modulo fundamental, nao acessorio.
2. o identificador canonico do cliente no Asaas passa a ser uma dependencia transversal para cobrancas, assinaturas e outras operacoes.

Nos exemplos oficiais, esse identificador aparece no formato `cus_...`.

## Superficie oficial do recurso

Pela referencia oficial atual, o recurso de clientes expoe os seguintes endpoints:

- `POST /v3/customers`
  - resumo oficial: `Create new customer`
  - permissao oficial: `CUSTOMER:WRITE`
- `GET /v3/customers`
  - resumo oficial: `List customers`
  - permissao oficial: `CUSTOMER:READ`
- `GET /v3/customers/{id}`
  - resumo oficial: `Retrieve a single customer`
  - permissao oficial: `CUSTOMER:READ`
- `PUT /v3/customers/{id}`
  - resumo oficial: `Update existing customer`
  - permissao oficial: `CUSTOMER:WRITE`
- `DELETE /v3/customers/{id}`
  - resumo oficial: `Remove Customer`
  - permissao oficial: `CUSTOMER:WRITE`
- `POST /v3/customers/{id}/restore`
  - resumo oficial: `Restore removed customer`
  - permissao oficial: `CUSTOMER:WRITE`
- `GET /v3/customers/{id}/notifications`
  - resumo oficial: `Retrieve notifications from a customer`
  - permissao oficial: `CUSTOMER_NOTIFICATION:READ`

Esse conjunto ja justifica um modulo publico `customers` com superficie clara, em vez de apenas helpers genericos de HTTP.

## Contrato de escrita e leitura

### Criacao de cliente

Na referencia oficial, os campos obrigatorios para criacao sao:

- `name`
- `cpfCnpj`

Os demais campos documentados para escrita sao:

- `email`
- `phone`
- `mobilePhone`
- `address`
- `addressNumber`
- `complement`
- `province`
- `postalCode`
- `externalReference`
- `notificationDisabled`
- `additionalEmails`
- `municipalInscription`
- `stateInscription`
- `observations`
- `groupName`
- `company`
- `foreignCustomer`

Um detalhe importante para o SDK:

- a referencia continua marcando `cpfCnpj` como obrigatorio mesmo quando `foreignCustomer` existe no payload

Portanto, o SDK deve refletir esse contrato oficial e nao relaxa-lo por conta propria.

### Atualizacao de cliente

No endpoint `PUT /v3/customers/{id}`, a referencia oficial nao marca nenhum campo do body como obrigatorio.

Para o SDK, isso sugere:

- `update` deve aceitar um payload parcial dos campos gravaveis
- a diferenca entre `create` e `update` precisa ser refletida nos tipos

### Leitura de cliente

O payload de leitura e mais enxuto e nao espelha tudo o que pode ser enviado na escrita.

Os campos documentados na resposta de leitura incluem:

- `object`
- `id`
- `dateCreated`
- `name`
- `email`
- `phone`
- `mobilePhone`
- `address`
- `addressNumber`
- `complement`
- `province`
- `city`
- `cityName`
- `state`
- `country`
- `postalCode`
- `cpfCnpj`
- `personType`
- `deleted`
- `additionalEmails`
- `externalReference`
- `notificationDisabled`
- `observations`
- `foreignCustomer`

Ha um ponto importante de modelagem aqui:

- `municipalInscription`, `stateInscription`, `groupName` e `company` aparecem no payload de escrita, mas nao aparecem no schema oficial de leitura do cliente

Para o SDK, isso implica separar claramente:

- tipos de input gravavel
- tipos de entidade retornada pela API

O pacote nao deve prometer em `AsaasCustomer` campos que a referencia oficial atual nao devolve.

## Busca, listagem e identificadores

O endpoint `GET /v3/customers` documenta os seguintes filtros:

- `offset`
- `limit`
- `name`
- `email`
- `cpfCnpj`
- `groupName`
- `externalReference`

Tambem documenta:

- `limit` maximo de `100`
- resposta no envelope padrao com `object`, `hasMore`, `totalCount`, `limit`, `offset` e `data`

### Implicacoes para o SDK

O modulo deve expor algo proximo de:

```ts
type ListCustomersParams = {
  offset?: number
  limit?: number
  name?: string
  email?: string
  cpfCnpj?: string
  groupName?: string
  externalReference?: string
}
```

E deve preservar o envelope oficial de listagem, em vez de retornar apenas array cru.

### Sobre deduplicacao

O guia oficial diz que voce pode criar um cliente novo ou consultar um que ja exista.

Isso nao e o mesmo que documentar deduplicacao automatica no `POST /v3/customers`.

Para o SDK, a conclusao correta e:

- nao prometer criacao idempotente por `cpfCnpj` ou `externalReference`
- deixar eventuais helpers de busca previa como conveniencias opcionais
- manter `create` como operacao de criacao simples, sem semantica inventada

## Exclusao e restauracao

O Asaas nao encerra o ciclo de cliente apenas em criar e consultar.

Tambem existe:

- remocao via `DELETE /v3/customers/{id}`
- restauracao via `POST /v3/customers/{id}/restore`

O endpoint de remocao retorna apenas:

- `id`
- `deleted`

Ja os endpoints de leitura e restauracao retornam novamente o objeto de cliente.

Isso sugere fortemente que o recurso funciona como soft delete do ponto de vista de integracao.

Para o SDK, essa semantica deve ficar explicita:

- `remove` retorna um resultado curto de remocao
- `restore` retorna o cliente reconstituido
- `AsaasCustomer` deve preservar o campo `deleted`

## Notificacoes por cliente

Existe um endpoint aninhado em clientes para consultar notificacoes:

- `GET /v3/customers/{id}/notifications`

Os itens documentados nessa lista incluem:

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

O enum oficial documentado para `event` nesta resposta e:

- `PAYMENT_CREATED`
- `PAYMENT_UPDATED`
- `PAYMENT_RECEIVED`
- `PAYMENT_OVERDUE`
- `PAYMENT_DUEDATE_WARNING`
- `SEND_LINHA_DIGITAVEL`

As guias oficiais tambem informam que notificacoes padrao sao criadas ao registrar um novo cliente.

Ao mesmo tempo, a propria referencia desse endpoint documenta apenas o parametro `id` no request, embora a resposta use envelope de lista.

Para o SDK, isso pede cautela:

- expor `listNotifications(customerId)` como leitura simples
- nao inventar filtros ou paginacao de entrada que nao estejam documentados
- deixar criacao, alteracao e remocao de notificacoes para o modulo proprio de `notificacoes`

Em outras palavras:

- consulta de notificacoes do cliente entra aqui porque o endpoint e aninhado em `customers`
- modelagem completa de notificacoes continua sendo assunto do modulo `12-notificacoes.md`

## Decisoes recomendadas para a API publica do SDK

O modulo `customers` deveria convergir para algo proximo de:

```ts
type CreateCustomerInput = {
  name: string
  cpfCnpj: string
  email?: string
  phone?: string
  mobilePhone?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  postalCode?: string
  externalReference?: string
  notificationDisabled?: boolean
  additionalEmails?: string
  municipalInscription?: string
  stateInscription?: string
  observations?: string
  groupName?: string
  company?: string
  foreignCustomer?: boolean
}

type UpdateCustomerInput = Partial<CreateCustomerInput>

type RemoveCustomerResult = {
  id: string
  deleted: boolean
}

type CustomerNotificationEvent =
  | 'PAYMENT_CREATED'
  | 'PAYMENT_UPDATED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_DUEDATE_WARNING'
  | 'SEND_LINHA_DIGITAVEL'
```

E o servico publico deveria ter pelo menos:

```ts
asaas.customers.create(input)
asaas.customers.list(filters)
asaas.customers.get(id)
asaas.customers.update(id, input)
asaas.customers.remove(id)
asaas.customers.restore(id)
asaas.customers.listNotifications(id)
```

## O que este modulo muda no plano do SDK

Depois desta etapa, o pacote ja deveria apontar para uma base como:

- `customers/types.ts`
- `customers/service.ts`
- `customers/contracts.ts`

Com responsabilidades claras:

- `types.ts` para inputs e entidade de cliente
- `contracts.ts` para filtros, resposta de remocao e notificacoes de cliente
- `service.ts` para chamadas HTTP do dominio

Esse modulo tambem reforca uma regra de desenho que vai se repetir nos proximos:

- tipos de escrita e tipos de leitura nao precisam ser identicos so porque pertencem ao mesmo recurso

## Perguntas que este modulo responde

### Qual parte oficial foi pesquisada?

- guia de criacao de clientes
- referencia de criacao, listagem, consulta, atualizacao, remocao e restauracao
- referencia de notificacoes por cliente
- guias de notificacoes padrao e alteracao de notificacoes

### Quais capacidades reais isso mostra?

- o Asaas trata cliente como prerequisito operacional para cobrancas
- o recurso possui CRUD completo com restauracao
- a listagem oficial tem filtros limitados e pagina padrao
- existe leitura de notificacoes aninhada em cliente
- alguns campos sao write-side only na referencia atual

### Como isso deve virar API publica no SDK?

- com um modulo `customers` proprio
- com tipos separados para create, update e leitura
- com listagem filtrada e envelope oficial preservado
- com suporte explicito a remocao e restauracao
- com consulta de notificacoes sem misturar esse modulo com toda a superficie de `notifications`

### O que fica fora deste corte?

- cobrancas, assinaturas e qualquer modulo que apenas consome `customerId`
- personalizacao completa de notificacoes
- qualquer regra de deduplicacao nao documentada oficialmente
- heuristicas locais do PitStop sobre busca de cliente

## Fontes oficiais consultadas

- [Creating customers](https://docs.asaas.com/docs/creating-customers)
- [Create new customer](https://docs.asaas.com/reference/create-new-customer)
- [List customers](https://docs.asaas.com/reference/list-customers)
- [Retrieve a single customer](https://docs.asaas.com/reference/retrieve-a-single-customer)
- [Update existing customer](https://docs.asaas.com/reference/update-existing-customer)
- [Remove customer](https://docs.asaas.com/reference/remove-customer)
- [Restore removed customer](https://docs.asaas.com/reference/restore-removed-customer)
- [Retrieve notifications from a customer](https://docs.asaas.com/reference/retrieve-notifications-from-a-customer)
- [Default notifications](https://docs.asaas.com/docs/default-notifications)
- [Changing notifications of a client](https://docs.asaas.com/docs/changing-notifications-of-a-client)
