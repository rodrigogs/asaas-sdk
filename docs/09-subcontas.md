# Subcontas

> Data de revisao: 12 de marco de 2026

## Objetivo

Definir como o dominio oficial de subcontas do Asaas deve virar um modulo TypeScript completo dentro do SDK `@repo/asaas`.

Este arquivo cobre:

- criacao e consulta de subcontas
- diferenca operacional entre subconta padrao e white label
- chaves de API por subconta
- fluxo de onboarding, documentos e situacao cadastral
- confirmacao anual de dados comerciais
- exclusao de subconta white label
- dependencia de `walletId`, `apiKey` e `commercialInfoExpiration`

Sem esse modulo, o SDK fica incompleto no principal fluxo de plataforma para parceiros:

- nao existe superficie segura para provisionar contas filhas
- onboarding e aprovacao acabam espalhados em chamadas soltas de `myAccount`
- fica facil misturar autenticacao da conta raiz com autenticacao da propria subconta

## Papel do dominio na plataforma

O Asaas posiciona subcontas como contas filhas vinculadas a uma conta raiz.

Quando a subconta e criada, o parceiro recebe imediatamente:

- a `apiKey` da subconta
- o `walletId`

Esses dois dados sao centrais para a integracao:

- `apiKey` habilita todas as chamadas futuras no contexto da conta filha
- `walletId` e usado em split e em transferencias entre contas Asaas

Ao mesmo tempo, o Asaas trabalha com dois modos de operacao que compartilham o mesmo endpoint de criacao:

1. subconta padrao
2. subconta white label

Para o SDK, isso implica:

- o recurso de criacao e o mesmo
- mas o fluxo de ativacao, onboarding e responsabilidades apos a criacao mudam radicalmente

## Recorte correto deste modulo

### O que entra aqui

- `POST /v3/accounts`, `GET /v3/accounts` e `GET /v3/accounts/{id}`
- gerenciamento de chaves de API da subconta
- onboarding documental e consulta de status cadastral
- leitura e atualizacao de `commercialInfo`
- `commercialInfoExpiration` e expiracao anual
- exclusao de subconta white label
- dependencia de `walletId` e `apiKey`

### O que fica para outros modulos

- webhooks como dominio transversal
- configuracao fiscal de notas da subconta
- cobrancas, Pix, assinaturas e transferencias executadas pela conta filha
- escrow e split como dominios funcionais separados

Um limite importante aqui e este:

- `subcontas` trata provisionamento, identidade operacional e onboarding da conta
- o uso funcional da conta filha continua pertencendo aos modulos de negocio

## Superficie oficial do dominio

Pela documentacao oficial atual, o dominio se divide em tres blocos.

### 1. Provisionamento pela conta raiz

- `POST /v3/accounts`
- `GET /v3/accounts`
- `GET /v3/accounts/{id}`

### 2. Gerenciamento de chaves pela conta raiz

- `GET /v3/accounts/{id}/accessTokens`
- `POST /v3/accounts/{id}/accessTokens`
- `PUT /v3/accounts/{id}/accessTokens/{accessTokenId}`
- `DELETE /v3/accounts/{id}/accessTokens/{accessTokenId}`

### 3. Onboarding e manutencao pela propria subconta

- `GET /v3/myAccount/status/`
- `GET /v3/myAccount/documents`
- `POST /v3/myAccount/documents/{id}`
- `GET /v3/myAccount/documents/files/{id}`
- `POST /v3/myAccount/documents/files/{id}`
- `DELETE /v3/myAccount/documents/files/{id}`
- `GET /v3/myAccount/commercialInfo/`
- `POST /v3/myAccount/commercialInfo/`
- `DELETE /v3/myAccount/`

Essa separacao e a decisao mais importante do modulo:

- `/accounts` e `/accounts/{id}/accessTokens` usam a chave da conta raiz
- `/myAccount/*` deve ser chamado com a chave da propria subconta

## Criacao de subconta

### Request principal

Pela referencia atual, `POST /v3/accounts` exige:

- `name`
- `email`
- `cpfCnpj`
- `mobilePhone`
- `incomeValue`
- `address`
- `addressNumber`
- `province`
- `postalCode`

E ainda documenta os seguintes campos opcionais:

- `loginEmail`
- `birthDate`
- `companyType`
- `phone`
- `site`
- `complement`
- `webhooks`

Os enums atuais de `companyType` sao:

- `MEI`
- `LIMITED`
- `INDIVIDUAL`
- `ASSOCIATION`

O shape atual mostra duas regras de negocio importantes:

1. `birthDate` so faz sentido para pessoa fisica
2. `companyType` so faz sentido para pessoa juridica

### Webhooks na criacao

O request de criacao aceita um array `webhooks`.

Isso e especialmente relevante para white label, porque a documentacao funcional recomenda configurar webhooks ja no `POST /v3/accounts` para nao perder eventos de criacao e atualizacao da conta.

Ao mesmo tempo, esse bloco reaproveita o contrato de webhooks e seus enums, inclusive `sendType` e `events`.

Para o SDK, isso implica:

- o tipo de entrada de subconta pode referenciar o modulo `webhooks`
- nao faz sentido duplicar enums de eventos aqui

### Resposta de criacao

A resposta atual de `POST /v3/accounts` inclui, entre outros:

- `id`
- `walletId`
- `accountNumber`
- `commercialInfoExpiration`
- `accessToken`
- `apiKey`

Esse contrato e critico por tres motivos:

1. `apiKey` da subconta e retornada em texto claro apenas na criacao
2. `walletId` precisa ser persistido se a plataforma usar split ou transferencias internas
3. `commercialInfoExpiration` ja nasce como parte do ciclo anual de conformidade

O guia oficial de criacao reforca um ponto operacional:

- a `apiKey` deve ser armazenada no momento da criacao
- ela nao pode ser recuperada depois por um endpoint de leitura simples da subconta

## Listagem e leitura de subcontas

### Listagem

O endpoint `GET /v3/accounts` aceita hoje:

- `offset`
- `limit`
- `cpfCnpj`
- `email`
- `name`
- `walletId`

E retorna envelope paginado com:

- `hasMore`
- `totalCount`
- `limit`
- `offset`
- `data`

### Leitura unitaria

`GET /v3/accounts/{id}` retorna praticamente o mesmo shape principal de create, sem `apiKey` em texto claro.

Os campos mais relevantes para o SDK sao:

- `id`
- `name`
- `email`
- `loginEmail`
- `cpfCnpj`
- `personType`
- `companyType`
- `walletId`
- `accountNumber`
- `commercialInfoExpiration`
- `accessToken`

Os enums atuais de `personType` sao:

- `JURIDICA`
- `FISICA`

Um detalhe importante:

- o retorno de leitura expoe metadados do `accessToken`
- mas nao devolve novamente o valor da chave em texto claro

## Subconta padrao vs white label

Os dois formatos usam o mesmo `POST /v3/accounts`, mas a ativacao muda.

### Subconta padrao

Na subconta padrao:

- o titular recebe email de definicao ou reset de senha
- acessa a interface do Asaas
- envia documentos diretamente pelo painel

Para o SDK, isso significa:

- o provisionamento pode terminar na criacao da conta
- o onboarding documental via API pode ser opcional nesse fluxo

### White label

Na subconta white label:

- o cliente nao recebe comunicacoes do Asaas
- nao acessa a interface do Asaas
- toda a jornada deve ser conduzida pela plataforma integradora

Os guias oficiais deixam claro que:

- o formato white label precisa ser previamente alinhado com o gerente de contas
- em Sandbox, a liberacao de testes depende do suporte

Isso muda o papel do SDK:

- criar a conta nao basta
- o pacote precisa documentar e suportar o ciclo completo de ativacao via API ou via `onboardingUrl`

## Onboarding, documentos e situacao cadastral

### Fluxo correto para white label

O fluxo detalhado oficial hoje e:

1. criar a subconta via `POST /v3/accounts`
2. aguardar pelo menos 15 segundos
3. consultar `GET /v3/myAccount/documents` usando a `apiKey` da subconta
4. analisar cada grupo documental retornado
5. decidir entre `onboardingUrl` externo ou envio via API
6. acompanhar `GET /v3/myAccount/status/` ou webhooks de situacao da conta

O timeout minimo de 15 segundos e importante porque:

- a conta ainda esta sendo validada com a Receita Federal
- se a consulta for feita cedo demais, o Asaas pode pedir documentos nao obrigatorios por ainda nao ter concluido a captura de dados

### Consulta de documentos pendentes

`GET /v3/myAccount/documents` retorna:

- `rejectReasons`
- `data`

Cada grupo documental atual inclui:

- `id`
- `status`
- `type`
- `title`
- `description`
- `responsible`
- `onboardingUrl`
- `onboardingUrlExpirationDate`
- `documents`

Os enums atuais de `status` do grupo sao:

- `NOT_SENT`
- `PENDING`
- `APPROVED`
- `REJECTED`
- `IGNORED`

Os enums atuais de `type` incluem:

- `IDENTIFICATION`
- `IDENTIFICATION_SELFIE`
- `SOCIAL_CONTRACT`
- `MINUTES_OF_ELECTION`
- `MEI_CERTIFICATE`
- `POWER_OF_ATTORNEY`
- `CUSTOM`

### `onboardingUrl` versus envio via API

Esse e um dos pontos mais sensiveis do modulo.

Pelos guias oficiais:

- se `onboardingUrl` existir, o documento deve ser enviado por esse link
- se `onboardingUrl` nao existir, o envio deve ser feito via `POST /v3/myAccount/documents/{id}`
- tentar enviar via API um documento que possui `onboardingUrl` faz o Asaas rejeitar o envio

Para o SDK, isso implica:

- o pacote deve expor claramente o discriminador de metodo de envio
- nao basta oferecer um `sendDocument` generico sem inspecionar o grupo documental

### Envio e manutencao de documentos via API

Os endpoints oficiais sao:

- `POST /v3/myAccount/documents/{id}`
- `GET /v3/myAccount/documents/files/{id}`
- `POST /v3/myAccount/documents/files/{id}`
- `DELETE /v3/myAccount/documents/files/{id}`

O request de envio documenta:

- `documentFile`
- `type`

E o `type` reaproveita o mesmo enum do grupo documental.

O ponto operacional importante aqui e:

- o `id` do grupo documental nao e o mesmo `id` do arquivo enviado
- depois do upload, manutencao e remocao usam o `id` do arquivo, nao o `id` do grupo

### Situacao cadastral

`GET /v3/myAccount/status/` retorna quatro eixos de aprovacao:

- `commercialInfo`
- `bankAccountInfo`
- `documentation`
- `general`

Cada um deles usa o enum atual:

- `PENDING`
- `APPROVED`
- `REJECTED`
- `AWAITING_APPROVAL`

Esse endpoint e importante porque:

- white label depende dele para acompanhamento sem interface
- a conta so esta totalmente aprovada quando `general` retorna `APPROVED`

Os guias funcionais ainda registram uma nuance relevante:

- no onboarding por link, a prova de vida acontece com a selfie
- inicialmente a conta fica habilitada apenas para criar cobrancas e realizar transferencias ate a liberacao completa dos produtos

## Dados comerciais e expiracao anual

### Leitura e atualizacao

Os endpoints oficiais sao:

- `GET /v3/myAccount/commercialInfo/`
- `POST /v3/myAccount/commercialInfo/`

Essas rotas devem ser chamadas no contexto da subconta, com a `access_token` dela.

Os campos principais de leitura incluem:

- `status`
- `personType`
- `cpfCnpj`
- `name`
- `birthDate`
- `companyName`
- `companyType`
- `incomeValue`
- `email`
- `phone`
- `mobilePhone`
- `postalCode`
- `address`
- `addressNumber`
- `complement`
- `province`
- `city`
- `denialReason`
- `tradingName`
- `site`
- `availableCompanyNames`
- `commercialInfoExpiration`

O request atual de update documenta:

- `personType`
- `cpfCnpj`
- `birthDate`
- `companyType`
- `companyName`
- `incomeValue`
- `email`
- `phone`
- `mobilePhone`
- `site`
- `postalCode`
- `address`
- `addressNumber`
- `complement`
- `province`

### Status de `commercialInfo`

Pela referencia atual, `commercialInfo.status` usa:

- `APPROVED`
- `AWAITING_ACTION_AUTHORIZATION`
- `DENIED`
- `PENDING`

Isso mostra uma divergencia importante em relacao a `GET /v3/myAccount/status/`, que usa:

- `APPROVED`
- `AWAITING_APPROVAL`
- `REJECTED`
- `PENDING`

O SDK nao deve colapsar esses enums como se fossem identicos.

### Confirmacao anual

O guia oficial de confirmacao anual documenta que:

- a confirmacao dos dados comerciais passou a ser obrigatoria para subcontas
- a falta de confirmacao pode restringir o uso da API da conta afetada
- `commercialInfoExpiration` ja aparece nas respostas de create, get e update

Os campos atuais desse objeto sao:

- `isExpired`
- `scheduledDate`

O mesmo guia ainda registra:

- subcontas criadas antes de 6 de dezembro de 2025 entraram em uma janela de transicao
- subcontas criadas depois dessa data seguem o ciclo anual normal
- 40 dias antes do vencimento, o Asaas envia `ACCOUNT_STATUS_COMMERCIAL_INFO_EXPIRING_SOON`
- quando expira sem confirmacao, envia `ACCOUNT_STATUS_COMMERCIAL_INFO_EXPIRED`

Para o SDK, a implicacao e objetiva:

- usar webhook como principal sinal de expiracao
- usar `commercialInfoExpiration` para checagem proativa esparsa, nao para polling frequente

## Gerenciamento de chaves de API da subconta

### Escopo e habilitacao

O guia funcional de gerenciamento de chaves deixa claro que:

- esses endpoints sao usados pela conta raiz
- o acesso fica bloqueado por padrao
- e necessario habilitar temporariamente pela interface
- a liberacao dura 2 horas
- o uso exige IP Whitelist ativa

Esse e um detalhe fundamental de seguranca.

O SDK deve tratar esse bloco como operacao privilegiada do parceiro, nao como rotina comum da conta filha.

### Superficie oficial

Os endpoints atuais sao:

- `GET /v3/accounts/{id}/accessTokens`
- `POST /v3/accounts/{id}/accessTokens`
- `PUT /v3/accounts/{id}/accessTokens/{accessTokenId}`
- `DELETE /v3/accounts/{id}/accessTokens/{accessTokenId}`

### Contratos atuais

Na listagem, a resposta atual retorna `accessTokens` com itens contendo:

- `id`
- `name`
- `enabled`
- `expirationDate`
- `dateCreated`
- `projectedExpirationDateByLackOfUse`

Na criacao, o request atual aceita:

- `name`
- `expirationDate`

E a resposta inclui, alem dos metadados:

- `apiKey`

Ou seja:

- o valor da nova chave tambem so aparece na resposta de criacao

Na atualizacao, a referencia exige:

- `name`
- `enabled`
- `expirationDate`

E na exclusao:

- nao ha resposta estruturada relevante
- a revogacao e definitiva

O guia geral de autenticacao ainda reforca uma regra transversal:

- cada conta pode ter ate 10 chaves de API

## Exclusao de subconta white label

Ha um endpoint especifico para esse caso:

- `DELETE /v3/myAccount/`

Com query opcional:

- `removeReason`

Esse endpoint vive no contexto da propria subconta e a propria referencia o nomeia como:

- `Delete White Label subaccount`

Para o SDK, isso implica duas regras:

1. exclusao de white label e diferente de gerenciamento comum da subconta
2. o metodo deve ficar separado de qualquer CRUD ilusorio em `/accounts`

## Sandbox e operacao pratica

Os guias oficiais registram alguns detalhes operacionais importantes:

- em Sandbox, a conta raiz pode criar ate 20 subcontas por dia
- comunicacoes de subcontas Sandbox sao enviadas ao email da conta raiz
- para aprovar automaticamente subcontas no Sandbox, e importante usar email valido
- em white label Sandbox, os links de onboarding servem mais para ilustracao e a aprovacao depende do time de integracoes

Existe ainda uma observacao relevante do guia de aprovacao:

- nomes de contas de teste devem usar apenas letras e espacos
- numeros e caracteres especiais podem desincronizar e desabilitar Pix na conta de teste

## Inconsistencias e riscos de compatibilidade

O dominio de subcontas hoje tem algumas divergencias importantes entre guias e referencia.

### Metodo de update de `commercialInfo`

Os guias funcionais em alguns trechos ainda mostram:

- `PUT /v3/myAccount/commercialInfo`

Mas a referencia oficial atual documenta:

- `POST /v3/myAccount/commercialInfo/`

O SDK deve seguir a referencia publica atual e tratar o `PUT` dos guias como material legado.

### Enums de situacao comercial

`GET /v3/myAccount/status/` e `GET /v3/myAccount/commercialInfo/` nao usam exatamente o mesmo vocabulario de status.

Hoje a referencia separa:

- `AWAITING_APPROVAL` e `REJECTED` no status cadastral
- `AWAITING_ACTION_AUTHORIZATION` e `DENIED` em `commercialInfo`

O pacote nao deve tentar unificar tudo num enum unico sem contexto.

### Enums de webhook embutidos na criacao da subconta

O schema de `webhooks` dentro de `POST /v3/accounts` nao esta perfeitamente alinhado com a referencia isolada de webhooks.

Exemplos:

- aparecem eventos `ACCOUNT_STATUS_GENERAL_APPROVAL_*`
- aparece `ACCOUNT_STATUS_COMMERCIAL_INFO_EXPIRED`

Para o SDK, isso reforca que:

- o catalogo de eventos deve viver em modulo centralizado
- subcontas nao devem definir seu proprio enum paralelo de webhook

### Duplo contexto de autenticacao

Esse e o risco de integracao mais importante do modulo.

- `/v3/accounts*` usa a chave da conta raiz
- `/v3/myAccount/*` usa a chave da subconta

Se o SDK esconder isso mal, a superficie publica fica enganosa e propensa a erro.

## Decisoes recomendadas para a API publica do SDK

O modulo deveria convergir para algo proximo de:

```ts
root.subaccounts.create(input)
root.subaccounts.list(filters)
root.subaccounts.get(id)

root.subaccounts.apiKeys.list(subaccountId)
root.subaccounts.apiKeys.create(subaccountId, input)
root.subaccounts.apiKeys.update(subaccountId, accessTokenId, input)
root.subaccounts.apiKeys.remove(subaccountId, accessTokenId)

child.account.getRegistrationStatus()
child.account.listPendingDocuments()
child.account.sendDocument(groupId, input)
child.account.viewSentDocument(fileId)
child.account.updateSentDocument(fileId, input)
child.account.removeSentDocument(fileId)
child.account.getCommercialInfo()
child.account.updateCommercialInfo(input)
child.account.deleteWhiteLabelSubaccount(reason)
```

Onde:

- `root` representa um cliente autenticado com a conta raiz
- `child` representa um cliente autenticado com a chave da subconta

O SDK nao deveria:

- esconder a troca de contexto entre conta raiz e subconta
- fingir que a `apiKey` pode ser recuperada depois sem gerenciamento privilegiado
- oferecer `sendDocument` para grupos que possuem `onboardingUrl`
- unificar de forma artificial status de onboarding e status de `commercialInfo`
- modelar subconta padrao e white label como fluxos identicos apos a criacao

## O que este modulo muda no plano do SDK

Depois desta etapa, o pacote ja deveria apontar para uma base como:

- `subaccounts/types.ts`
- `subaccounts/contracts.ts`
- `subaccounts/service.ts`
- `subaccounts/api-keys.ts`
- `subaccounts/onboarding.ts`
- `subaccounts/commercial-info.ts`

Com responsabilidades claras:

- `types.ts` para entidade de subconta, `walletId`, `accountNumber` e expiracao comercial
- `contracts.ts` para create, listagem, filtros e respostas privilegiadas
- `service.ts` para provisionamento pela conta raiz
- `api-keys.ts` para gerenciar `accessTokens` da subconta
- `onboarding.ts` para documentos, status cadastral e delete white label
- `commercial-info.ts` para leitura e atualizacao dos dados comerciais da conta filha

Esse modulo tambem consolida cinco regras de desenho:

- criacao de subconta e onboarding nao pertencem ao mesmo contexto de autenticacao
- `apiKey` e segredo de retorno unico, nao dado recuperavel por leitura comum
- `walletId` e parte estrutural do provisionamento
- `onboardingUrl` decide o metodo de envio documental
- expiracao anual de dados comerciais precisa ser tratada como parte do ciclo de vida da conta

## Perguntas que este modulo responde

### Qual parte oficial foi pesquisada?

- guias de criacao de subcontas, white label, onboarding e fluxo detalhado de aprovacao
- guia de gerenciamento de chaves de API de subcontas
- guia de confirmacao anual de dados comerciais
- guia de aprovacao em Sandbox
- referencias de `/accounts`, `/accessTokens`, `/myAccount/documents`, `/myAccount/status`, `/myAccount/commercialInfo` e delete white label

### Quais capacidades reais isso mostra?

- o Asaas provisiona contas filhas com `apiKey` e `walletId`
- subconta padrao e white label compartilham o mesmo endpoint de criacao
- onboarding documental pode ocorrer por link ou por API, dependendo do `onboardingUrl`
- a conta raiz pode gerenciar chaves da subconta em janela temporaria e com IP Whitelist
- dados comerciais expiram anualmente e podem restringir a API se nao forem confirmados

### Como isso deve virar API publica no SDK?

- com modulo `subaccounts` proprio
- com separacao explicita entre cliente raiz e cliente de subconta
- com API dedicada para `accessTokens`
- com subservicos de onboarding e `commercialInfo`
- com tipos que preservem `apiKey`, `walletId` e `commercialInfoExpiration`

### O que fica fora deste corte?

- configuracao fiscal da subconta
- cobrancas, Pix, transferencias e demais produtos operados pela conta filha
- detalhamento completo de webhooks
- split, escrow e regras financeiras do parceiro

## Fontes oficiais consultadas

- [Creating subaccounts](https://docs.asaas.com/docs/creating-subaccounts)
- [Creating Whitelabel subaccounts](https://docs.asaas.com/docs/creating-whitelabel-subaccounts)
- [White label](https://docs.asaas.com/docs/about-white-label)
- [Managing sub-account API keys](https://docs.asaas.com/docs/sub-account-api-key-management)
- [Detailed Subaccount Approval Flow](https://docs.asaas.com/docs/detailed-subaccount-approval-flow)
- [Onboarding and sending documents via link](https://docs.asaas.com/docs/onboarding-and-sending-documents-via-link)
- [Annual Business Data Confirmation for Subaccounts](https://docs.asaas.com/docs/annual-business-data-confirmation-for-subaccounts)
- [Approval of accounts](https://docs.asaas.com/docs/approval-of-accounts)
- [Authentication](https://docs.asaas.com/docs/authentication-2)
- [Create subaccount](https://docs.asaas.com/reference/create-subaccount)
- [Listar subcontas](https://docs.asaas.com/reference/listar-subcontas)
- [Retrieve a single subaccount](https://docs.asaas.com/reference/retrieve-a-single-subaccount)
- [Listar chaves de API de uma subconta](https://docs.asaas.com/reference/listar-chaves-de-api-de-uma-subconta)
- [Criar chave de API para uma subconta](https://docs.asaas.com/reference/criar-chave-de-api-para-uma-subconta)
- [Atualizar chave de API de uma subconta](https://docs.asaas.com/reference/atualizar-chave-de-api-de-uma-subconta)
- [Excluir chave de API de uma subconta](https://docs.asaas.com/reference/excluir-chave-de-api-de-uma-subconta)
- [Check pending documents](https://docs.asaas.com/reference/check-pending-documents)
- [Send documents](https://docs.asaas.com/reference/send-documents)
- [View document sent](https://docs.asaas.com/reference/view-document-sent)
- [Update sent document](https://docs.asaas.com/reference/update-sent-document)
- [Remove sent document](https://docs.asaas.com/reference/remove-sent-document)
- [Check account registration status](https://docs.asaas.com/reference/check-account-registration-status)
- [Retrieve business data](https://docs.asaas.com/reference/retrieve-business-data)
- [Update business data](https://docs.asaas.com/reference/update-business-data)
- [Delete White Label subaccount](https://docs.asaas.com/reference/delete-white-label-subaccount)
