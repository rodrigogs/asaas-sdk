# Transferencias

> Data de revisao: 12 de marco de 2026

## Objetivo

Definir como o dominio oficial de transferencias do Asaas deve virar um modulo TypeScript completo dentro do SDK `@repo/asaas`.

Este arquivo cobre:

- transferencias entre contas Asaas
- transferencias para conta bancaria de outra instituicao
- transferencias para chave Pix
- agendamento, recorrencia Pix e cancelamento
- leitura de `walletId` como dependencia operacional
- status, comprovante e conciliacao por `externalReference`
- autorizacao critica, whitelist e webhook de validacao de saque
- limites praticos de teste em Sandbox

Sem esse modulo, o SDK fica incompleto em uma parte essencial da conta digital:

- nao existe superficie segura para saida de saldo
- fica facil misturar transferencia Pix com recebimento Pix
- regras de seguranca e aprovacao manual acabam vazando para a aplicacao de forma ad hoc

## Papel do dominio na plataforma

O Asaas posiciona transferencias como o modulo de envio de dinheiro da conta digital.

Na pratica, ele cobre tres destinos diferentes:

1. outra conta Asaas vinculada a sua operacao
2. conta bancaria de outra instituicao
3. chave Pix

Esse dominio e diferente do modulo `04-pix.md` por um motivo importante:

- `pix` cobre principalmente recebimento, QR Code, chaves e transacoes Pix como produto
- `transferencias` cobre saida de dinheiro da conta, inclusive quando a modalidade escolhida e Pix

Para o SDK, isso implica:

- `transfers` deve existir como modulo proprio
- o uso de Pix aqui e uma modalidade de saque, nao um alias do modulo de recebimento Pix

## Recorte correto deste modulo

### O que entra aqui

- criacao de transferencia para conta Asaas
- criacao de transferencia para conta bancaria ou chave Pix
- listagem, consulta e cancelamento
- contrato de leitura do recurso `transfer`
- dependencia de `walletId`
- regras de autorizacao critica e automacao por IP confiavel
- webhook especial de validacao de saque
- testes de Pix e TED em Sandbox

### O que fica para outros modulos

- recebimento via Pix, QR Code e chaves Pix
- Pix Automatico
- fluxo detalhado de Pix Recorrente como produto
- split de pagamentos
- extrato e saldo da conta

Um limite importante aqui e este:

- o request externo aceita `recurring`
- mas o ciclo de vida completo do Pix Recorrente continua sendo assunto do modulo `04-pix.md`

## Superficie oficial do dominio

Pela documentacao oficial atual, o dominio se divide em dois blocos principais e uma dependencia operacional.

### 1. Transferencias externas

- `POST /v3/transfers`
- `GET /v3/transfers`
- `GET /v3/transfers/{id}`
- `DELETE /v3/transfers/{id}/cancel`

### 2. Transferencias entre contas Asaas

- `POST /v3/transfers/`

### 3. Dependencia de carteira

- `GET /v3/wallets/`

Esse ultimo endpoint nao mora em `/transfers`, mas e parte do fluxo real de integracao porque:

- a transferencia interna exige `walletId`
- esse identificador costuma ser retornado na criacao da subconta
- caso nao tenha sido armazenado, a propria documentacao remete ao endpoint de recuperacao de `walletId`

## Modos de transferencia e contratos de criacao

O dominio tem dois requests de criacao oficialmente separados.

### Transferencia para conta Asaas

O endpoint oficial e:

- `POST /v3/transfers/`

Os campos obrigatorios documentados hoje sao:

- `value`
- `walletId`

O request ainda aceita:

- `externalReference`

Pelo guia funcional:

- transferencias entre contas Asaas costumam ser efetivadas imediatamente
- nao e possivel transferir para contas Asaas sem vinculo com a sua operacao

Para o SDK, isso pede um metodo proprio, e nao uma sobrecarga generica do create externo.

### Transferencia para conta bancaria de outra instituicao ou chave Pix

O endpoint oficial e:

- `POST /v3/transfers`

O schema atual marca apenas:

- `value`

como obrigatorio.

Mas isso nao representa a regra de negocio completa.

Na pratica, a transferencia precisa seguir um de dois formatos:

1. conta bancaria
2. chave Pix

#### Conta bancaria

O request pode incluir:

- `bankAccount`
- `operationType`
- `scheduleDate`
- `externalReference`

Dentro de `bankAccount`, a referencia atual exige:

- `ownerName`
- `cpfCnpj`
- `agency`
- `account`
- `accountDigit`

E ainda documenta:

- `bank.code`
- `accountName`
- `ownerBirthDate`
- `bankAccountType`
- `ispb`

Os enums atuais de `bankAccountType` sao:

- `CONTA_CORRENTE`
- `CONTA_POUPANCA`

Um detalhe importante:

- `ownerBirthDate` so deve ser informado quando a conta destino nao pertence ao mesmo CPF ou CNPJ da conta Asaas

#### Chave Pix

O request pode incluir:

- `pixAddressKey`
- `pixAddressKeyType`
- `operationType`
- `description`
- `scheduleDate`
- `externalReference`
- `recurring`

Os enums atuais de `pixAddressKeyType` sao:

- `CPF`
- `CNPJ`
- `EMAIL`
- `PHONE`
- `EVP`

O guia funcional ainda registra duas regras importantes:

- chaves do tipo telefone devem conter 11 digitos com DDD
- chaves CPF e CNPJ devem ser enviadas sem pontuacao

#### Modalidade automatica

Os enums atuais de `operationType` no request sao:

- `PIX`
- `TED`

Se `operationType` nao for informado:

- o Asaas tenta Pix quando a instituicao de destino participa do arranjo Pix
- caso contrario, a transferencia segue via TED

Isso faz diferenca de tempo e comportamento:

- Pix nao agendado tende a ser instantaneo
- TED pode ficar pendente ate processamento bancario

## Agendamento, recorrencia e cancelamento

### Agendamento

O request externo aceita:

- `scheduleDate`

Quando esse campo nao e enviado:

- a documentacao trata a transferencia como imediata

Existe ainda uma regra temporal documentada em changelog:

- desde 21 de outubro de 2024, TED solicitada apos 15h fica agendada para o proximo dia util
- nesse caso, o saldo passa a ser debitado apenas no proximo dia util

### Recorrencia Pix

O request externo aceita:

- `recurring`

Mas somente para transferencias Pix.

O objeto atual documenta:

- `frequency`
- `quantity`

Os enums atuais de `frequency` sao:

- `WEEKLY`
- `MONTHLY`

E a referencia atual ainda detalha os limites:

- `WEEKLY`: maximo de 51 repeticoes
- `MONTHLY`: maximo de 11 repeticoes

Para o SDK, isso sugere duas camadas:

- o request de `transfers` aceita uma recorrencia Pix enxuta
- o modelo de produto e acompanhamento dessa recorrencia continua pertencendo ao modulo `pix`

### Cancelamento

O endpoint oficial e:

- `DELETE /v3/transfers/{id}/cancel`

Esse detalhe importa porque:

- o dominio nao tem `update`
- o encerramento operacional da transferencia acontece por `cancel`
- o contrato e diferente de outros modulos do Asaas que usam `POST` para cancelar

## Leitura, listagem e estados

### Leitura principal

Os retornos de create, get e cancel compartilham o mesmo shape principal.

Os campos mais importantes documentados hoje sao:

- `id`
- `type`
- `dateCreated`
- `value`
- `netValue`
- `status`
- `transferFee`
- `effectiveDate`
- `scheduleDate`
- `endToEndIdentifier`
- `authorized`
- `failReason`
- `externalReference`
- `transactionReceiptUrl`
- `operationType`
- `description`
- `recurring`

Dependendo do destino, o retorno muda:

- transferencia externa retorna `bankAccount`
- transferencia interna retorna `walletId` e `account`

### Enums atuais de leitura

Pela referencia atual:

- `type`: `PIX`, `TED`, `INTERNAL`
- `operationType`: `PIX`, `TED`, `INTERNAL`
- `status`: `PENDING`, `BANK_PROCESSING`, `DONE`, `CANCELLED`, `FAILED`

Esse contrato mostra uma nuance importante:

- `type` e `operationType` aparecem hoje com o mesmo enum
- mas carregam descricoes ligeiramente diferentes na referencia

O SDK nao deve inventar duas hierarquias conceituais diferentes sem necessidade, mas tambem nao deve assumir que essa duplicidade nunca mudara.

### Listagem

O endpoint `GET /v3/transfers` documenta hoje os filtros:

- `dateCreated[ge]`
- `dateCreated[le]`
- `transferDate[ge]`
- `transferDate[le]`
- `type`

A resposta, por outro lado, segue envelope paginado com:

- `hasMore`
- `totalCount`
- `limit`
- `offset`
- `data`

Isso gera uma divergencia de documentacao:

- a resposta e paginada
- mas a referencia atual nao documenta `offset` e `limit` como query params para listagem de transferencias

## `walletId` como dependencia real do dominio

Transferencia interna depende de `walletId`, e esse identificador pode vir de duas fontes principais:

1. resposta de criacao de subconta
2. `GET /v3/wallets/`

O retorno atual desse endpoint e uma lista paginada de objetos com:

- `id`

Para o SDK, a consequencia pratica e:

- o modulo de `transfers` precisa aceitar `walletId`
- mas a descoberta desse identificador tambem deve ficar acessivel de forma pragmatica

Uma opcao coerente e expor isso como helper proprio do modulo ou como utilitario de `account info`, sem obrigar a aplicacao a tratar o endpoint como detalhe oculto.

## Autorizacao critica e seguranca operacional

Transferencias sao tratadas pelo Asaas como operacoes de saque.

Pelas FAQs e guias de seguranca atuais:

- contas nao white label normalmente exigem validacao critica via Token SMS ou Token APP
- quando isso acontece, o retorno pode indicar `authorized: false`
- a transferencia fica pendente ate a aprovacao manual ou sistemica

Essa camada de seguranca afeta diretamente o desenho do SDK.

### Whitelist de IPs

O guia de whitelist documenta que:

- e possivel liberar IPs especificos ou pequenos intervalos
- requisicoes fora da whitelist recebem `403`
- operacoes de saque vindas de IPs autorizados podem ser processadas automaticamente sem pendencia manual, conforme a configuracao da conta

O changelog de 15 de janeiro de 2026 reforca esse comportamento:

- Pix, TED, pagamento de contas e recargas podem ser automatizados para IPs confiaveis

### Webhook de validacao de saque

O mecanismo especial de validacao via webhook tambem impacta diretamente o dominio de transferencias.

Pela documentacao atual:

- toda transferencia solicitada pode disparar um webhook especial para validacao de legitimidade
- o Asaas envia esse `POST` cerca de 5 segundos apos a criacao
- o payload da transferencia espelha o retorno da criacao
- em caso de falha de entrega, o Asaas tenta no maximo 3 vezes
- apos a terceira falha, a transferencia e cancelada automaticamente

As respostas esperadas por esse webhook sao:

- `APPROVED`
- `REFUSED`

Para o SDK, isso significa:

- o modulo de `transfers` precisa documentar claramente que create nao implica liquidacao imediata
- o campo `authorized` e operacionalmente relevante
- a aplicacao pode trocar aprovacao manual por aprovacao sistemica, mas isso continua sendo parte do contrato do dominio

## Sandbox e validacao pratica

O Asaas documenta que, em Sandbox:

- transferencia para conta Asaas pode ser testada
- TED para conta bancaria pode ser testada
- transferencia via Pix para chaves ficticias do BACEN pode ser testada
- transferencia via Pix para outras chaves reais em Sandbox tambem pode ser testada

O guia de testes detalha que:

- Pix para chave ficticia conclui imediatamente com sucesso
- TED depende de controles manuais na interface do Asaas para simular sucesso ou falha
- esses controles nao ficam disponiveis via API

Logo, o SDK deve ser testado com expectativas diferentes por modalidade:

- Pix e bom para fluxo automatizado de sucesso
- TED exige cobertura de estados assicronos e falha simulada fora da API

## Inconsistencias e riscos de compatibilidade

O dominio de transferencias hoje tem divergencias relevantes entre guias, referencia e exemplos antigos.

### `type` no webhook antigo vs referencia atual

Os exemplos antigos de webhook para transferencias mostram `type` com valores como:

- `ASAAS_ACCOUNT`
- `BANK_ACCOUNT`

Ja a referencia atual de `transfer` retorna:

- `PIX`
- `TED`
- `INTERNAL`

O SDK deve tratar o exemplo de webhook como material historico e considerar a referencia atual como fonte principal para o recurso `transfer`.

### Estados resumidos no guia geral

O guia `transfers-overview` lista apenas:

- `PENDING`
- `DONE`
- `CANCELLED`

Mas a referencia atual de leitura e listagem tambem documenta:

- `BANK_PROCESSING`
- `FAILED`

Entao o SDK nao deve limitar `TransferStatus` ao resumo do guia introdutorio.

### Paginacao parcial na listagem

A referencia atual de `GET /v3/transfers` devolve envelope paginado com `limit` e `offset`, mas nao documenta esses filtros na entrada.

Isso e uma inconsistancia real da superficie publica atual.

### Trailing slash e endpoints de criacao

Hoje existem dois endpoints de criacao:

- `/v3/transfers`
- `/v3/transfers/`

O SDK deve absorver isso como detalhe de infraestrutura e expor uma API clara por destino, sem vazar a diferenca de barra final.

### Enum de conta bancaria nos guias traduzidos

A referencia atual documenta:

- `CONTA_CORRENTE`
- `CONTA_POUPANCA`

Mas guias traduzidos em ingles usam exemplos como `CHECKING_ACCOUNT`.

O pacote deve seguir os enums da referencia oficial atual, nao os exemplos textuais divergentes.

## Decisoes recomendadas para a API publica do SDK

O modulo deveria convergir para algo proximo de:

```ts
asaas.transfers.createToAsaasAccount(input)
asaas.transfers.createExternal(input)
asaas.transfers.list(filters)
asaas.transfers.get(id)
asaas.transfers.cancel(id)
asaas.transfers.listWallets()
```

E tambem expor tipos separados para:

- `AsaasTransfer`
- `AsaasTransferStatus`
- `AsaasTransferType`
- `AsaasTransferOperationType`
- `AsaasAsaasAccountTransferInput`
- `AsaasExternalTransferInput`
- `AsaasBankAccountTransferInput`
- `AsaasPixKeyTransferInput`
- `AsaasTransferRecurringInput`

O SDK nao deveria:

- modelar tudo como um unico `createTransfer(input)` frouxo sem discriminador
- esconder a dependencia de `walletId`
- reduzir `authorized` a um detalhe secundario
- misturar Pix de saque com Pix de recebimento
- prometer semantica sincrona para TED ou para contas com autorizacao critica

## O que este modulo muda no plano do SDK

Depois desta etapa, o pacote ja deveria apontar para uma base como:

- `transfers/types.ts`
- `transfers/status.ts`
- `transfers/contracts.ts`
- `transfers/wallets.ts`
- `transfers/security.ts`
- `transfers/service.ts`

Com responsabilidades claras:

- `types.ts` para entidade principal de transferencia
- `status.ts` para enums e compatibilidade entre guia, webhook e referencia
- `contracts.ts` para inputs discriminados de create e filtros de listagem
- `wallets.ts` para recuperacao de `walletId`
- `security.ts` para helpers e documentacao operacional de autorizacao critica
- `service.ts` para create, list, get e cancel

Esse modulo tambem consolida cinco regras de desenho:

- transferencia interna e externa nao compartilham o mesmo endpoint
- `walletId` e dependencia real do dominio
- seguranca operacional altera o fluxo de confirmacao
- Pix como modalidade de transferencia nao substitui o modulo Pix
- a API publica precisa ser tolerante a inconsistencias historicas dos exemplos de webhook

## Perguntas que este modulo responde

### Qual parte oficial foi pesquisada?

- guias de visao geral, transferencia interna, transferencia externa e testes
- eventos de webhook para transferencias
- FAQs de seguranca e mecanismos adicionais de protecao
- referencias de create, list, get, cancel e `walletId`
- changelog de `externalReference`, TED apos 15h e automacao por IP autorizado

### Quais capacidades reais isso mostra?

- o Asaas permite saque para conta Asaas, conta bancaria externa e chave Pix
- a modalidade pode ser Pix, TED ou interna
- existe agendamento e Pix recorrente no fluxo externo
- transferencias podem exigir aprovacao manual ou sistemica
- o `walletId` continua sendo dependencia pratica para fluxo interno
- Sandbox cobre cenarios diferentes para Pix e TED

### Como isso deve virar API publica no SDK?

- com um modulo `transfers` proprio
- com create separado por destino
- com tipos discriminados para banco, Pix e conta Asaas
- com suporte a status assincronos e cancelamento
- com documentacao explicita de `walletId`, `authorized` e webhook de validacao

### O que fica fora deste corte?

- recebimento Pix
- split e repasse automatico
- extrato e saldo da conta
- fluxo completo de Pix Recorrente como produto
- configuracao do webhook comum de eventos

## Fontes oficiais consultadas

- [Overview](https://docs.asaas.com/docs/transfers-overview)
- [Transferencia para conta Asaas](https://docs.asaas.com/docs/transferencia-para-conta-asaas)
- [Transferencia para contas de outra instituicao (Pix / TED)](https://docs.asaas.com/docs/transferencia-para-contas-de-outra-instituicao-pix-ted)
- [Pix Recorrente](https://docs.asaas.com/docs/pix-recorrente)
- [Eventos para transferencias](https://docs.asaas.com/docs/webhook-para-transferencias)
- [Testando transferencias](https://docs.asaas.com/docs/testando-transfer%C3%AAncias)
- [O que pode ser testado?](https://docs.asaas.com/docs/o-que-pode-ser-testado)
- [Chaves de API](https://docs.asaas.com/docs/chaves-de-api)
- [Whitelist de IPs](https://docs.asaas.com/docs/whitelist-de-ips)
- [Mecanismo para validacao de saque via webhooks](https://docs.asaas.com/docs/mecanismo-para-validacao-de-saque-via-webhooks)
- [Duvidas frequentes sobre seguranca](https://docs.asaas.com/docs/duvidas-frequentes-seguranca)
- [Transferir para conta de outra Instituicao ou chave Pix](https://docs.asaas.com/reference/transferir-para-conta-de-outra-instituicao-ou-chave-pix)
- [Transferir para conta Asaas](https://docs.asaas.com/reference/transferir-para-conta-asaas)
- [Listar transferencias](https://docs.asaas.com/reference/listar-transferencias)
- [Recuperar uma unica transferencia](https://docs.asaas.com/reference/recuperar-uma-unica-transferencia)
- [Cancelar uma transferencia](https://docs.asaas.com/reference/cancelar-uma-transfer%C3%AAncia)
- [Recuperar WalletId](https://docs.asaas.com/reference/recuperar-walletid)
- [Inclusao de atributo para definir referencia externa em transferencias](https://docs.asaas.com/changelog/novo-campo-de-refer%C3%AAncia-externa-no-endpoint-de-transfer%C3%AAncias)
- [TEDs apos as 15h serao agendados para o proximo dia](https://docs.asaas.com/changelog/teds-ap%C3%B3s-%C3%A0s-15h-ser%C3%A3o-agendados-para-o-pr%C3%B3ximo-dia)
- [Automacao de saques para IPs autorizados](https://docs.asaas.com/changelog/automa%C3%A7%C3%A3o-de-saques-para-ips-autorizados)
