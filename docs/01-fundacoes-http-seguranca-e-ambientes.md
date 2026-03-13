# Fundacoes HTTP, Seguranca e Ambientes

> Data de revisao: 12 de marco de 2026

## Objetivo

Definir o que o core do SDK `@repo/asaas` precisa garantir antes de qualquer modulo funcional.

Este arquivo cobre a base transversal do pacote:

- autenticacao
- chaves de API
- ambientes
- sandbox
- limites da API
- convencoes HTTP
- mecanismos adicionais de seguranca

Sem essa fundacao, os modulos de `customers`, `payments`, `pix` e demais dominios tenderao a repetir logica, esconder requisitos operacionais importantes ou implementar retries e validacoes de forma inconsistente.

## Ambientes e URLs base

O Asaas trabalha com dois ambientes distintos:

- `PRODUCTION`: `https://api.asaas.com/v3`
- `SANDBOX`: `https://api-sandbox.asaas.com/v3`

A documentacao oficial reforca dois pontos importantes:

1. Sandbox e producao sao ambientes separados de verdade.
2. Alteracoes feitas no Sandbox nao sao replicadas em producao.

Para o SDK, isso implica uma decisao simples:

- `environment` precisa ser obrigatorio na configuracao principal
- a resolucao da base URL deve sair de um mapa interno oficial
- nao devemos aceitar URL livre como caminho principal da API publica

Uma configuracao esperada do core e:

```ts
type AsaasEnvironment = 'SANDBOX' | 'PRODUCTION'

type AsaasSdkConfig = {
  accessToken: string
  environment: AsaasEnvironment
  timeoutMs?: number
  userAgent?: string
}
```

Permitir `baseUrl` customizada pode existir como escape hatch interno, mas nao deve ser o caminho normal de consumo.

## Autenticacao e chaves de API

### Como a autenticacao funciona

A autenticacao oficial do Asaas e feita por API key enviada no header `access_token`.

Se a chave for invalida, estiver ausente, o header estiver errado ou a chave pertencer ao ambiente incorreto, a API retorna `HTTP 401`.

Na documentacao oficial tambem aparecem dois prefixos uteis para diagnostico operacional:

- chaves de producao comecam com algo como `$aact_prod_`
- chaves de sandbox comecam com algo como `$aact_hmlg_`

O SDK nao deve depender do prefixo para funcionar, mas pode usar essa informacao em mensagens de erro e diagnostico.

### Regras operacionais importantes

As regras oficiais para chaves de API sao:

- apenas usuarios administradores conseguem gerar chaves
- a geracao ocorre pela interface web, nao pelo app
- a chave e irrecuperavel depois de gerada
- uma conta pode ter ate 10 chaves
- cada chave pode ter nome e data de expiracao
- a chave pode ser habilitada ou desabilitada sem ser destruida
- se a chave for excluida, nao pode ser restaurada

### Consequencias para o SDK

O SDK deve assumir que:

- ele nunca gera credenciais
- ele apenas consome credenciais provisionadas externamente
- erros de autenticacao precisam ser explicitamente diagnosticaveis

Logo, o core precisa ter:

- validacao de configuracao minima no bootstrap
- mensagem clara para `401`
- dica contextual quando houver mistura de ambiente e chave

## Sandbox como ambiente de desenvolvimento padrao

O Asaas recomenda fortemente o uso de Sandbox para desenvolvimento.

Pela documentacao oficial, o Sandbox:

- permite testar integracoes e webhooks
- usa chave propria
- usa URL propria
- possui configuracoes de teste especificas
- nao garante que habilitacoes feitas ali existirao em producao
- nao cobre 100% das funcionalidades da plataforma

Tambem existe uma matriz oficial de "o que pode ser testado", o que significa que o SDK nao deve assumir cobertura completa de Sandbox para todos os recursos.

### Implicacoes praticas

O pacote deve:

- tratar `SANDBOX` como caso de primeira classe
- documentar claramente o que depende de validacao em producao
- evitar testes automatizados que pressupoeam equivalencia total entre ambientes

Tambem existe um detalhe operacional importante na documentacao de Sandbox:

- envio de email e SMS funciona normalmente no ambiente de testes

Isso significa que o SDK e a documentacao do pacote nao devem sugerir uso de contatos reais de terceiros em validacoes automatizadas.

## Limites da API

O Asaas documenta tres grupos de limite que importam diretamente para o desenho do SDK.

### 1. Limite de concorrencia

O limite oficial documentado e:

- ate 50 requisicoes `GET` concorrentes

Se esse limite for excedido, o retorno esperado e `HTTP 429`.

### 2. Quota por janela de tempo

O limite oficial documentado e:

- 25.000 requisicoes por conta a cada 12 horas

O contador comeca na primeira requisicao da janela e segue pelas proximas 12 horas.

Se esse limite for ultrapassado, o retorno esperado e `HTTP 429`.

A documentacao tambem explicita que contas fazendo polling excessivo nao recebem ajuste desse quota limit.

### 3. Rate limit por endpoint

Alguns endpoints possuem limitacao propria, exposta por headers como:

- `RateLimit-Limit`
- `RateLimit-Remaining`
- `RateLimit-Reset`

Quando `RateLimit-Remaining` chega a `0`, o retorno esperado tambem e `HTTP 429`.

### Consequencias para o SDK

O core deve:

- expor metadados de rate limit quando existirem
- permitir estrategia de retry configuravel para `429`
- jamais implementar polling agressivo por padrao
- preferir fluxo orientado a webhook sempre que o produto suportar

O SDK nao deve esconder `429` como erro generico.

Ele deve preserva-lo como erro identificavel e, idealmente, carregar os headers relevantes no erro tipado.

## Mecanismos adicionais de seguranca

O Asaas recomenda usar pelo menos um mecanismo adicional de seguranca alem da API key, e se possivel ambos.

### 1. Whitelist de IPs

Esse mecanismo restringe o uso da API a IPs previamente autorizados.

Qualquer requisicao fora da whitelist recebe `HTTP 403`.

Isso nao e algo implementado pelo SDK em si, mas o pacote deve documentar e respeitar esse contexto:

- `403` pode significar restricao de IP, nao apenas permissao de negocio
- features de administracao de credenciais e subcontas devem mencionar dependencia operacional de whitelist quando aplicavel

### 2. Validacao de transferencias via webhook

O Asaas oferece um mecanismo adicional para validar saques e transferencias por webhook.

Os pontos mais importantes para o core sao:

- existe um token opcional enviado no header `asaas-access-token`
- o Asaas faz um `POST` poucos segundos apos a criacao da transferencia
- se a validacao falhar repetidamente, a transferencia pode ser cancelada

Mesmo sendo um fluxo mais relevante ao modulo de transferencias, esse mecanismo afeta a fundacao porque:

- reforca o uso do header `asaas-access-token`
- mostra que seguranca operacional faz parte do desenho da integracao
- exige utilitarios compartilhados de validacao de headers e parsing de payload

### 3. IPs oficiais do Asaas

O Asaas mantem uma pagina com IPs oficiais usados para comunicacao via webhook.

Para o SDK, a decisao correta nao e hardcodear essa lista.

A decisao correta e:

- documentar que existe uma fonte oficial operacional
- referenciar essa pagina nas docs
- tratar a lista como configuracao externa da infraestrutura

## Convencoes HTTP que o core precisa absorver

### Header de autenticacao

O header oficial de autenticacao e:

```http
access_token: <api-key>
```

Isso deve ser centralizado no core. Nenhum modulo funcional deve montar esse header manualmente.

### Convencao de listas e paginacao

Nos exemplos oficiais de endpoints de listagem, o formato de resposta inclui campos como:

- `object: "list"`
- `hasMore`
- `totalCount`
- `limit`
- `offset`
- `data`

Isso justifica um contrato generico de lista no pacote, por exemplo:

```ts
type AsaasListResponse<T> = {
  object?: 'list'
  hasMore?: boolean
  totalCount?: number
  limit?: number
  offset?: number
  data?: T[]
}
```

Tambem justifica helpers de pagina:

- `limit`
- `offset`
- iteracao paginada opcional no SDK

### Convencao de erros

Pelo conjunto das fontes oficiais desta etapa, tres status merecem tratamento de primeira classe:

- `401`: autenticacao invalida, ausente ou ambiente incorreto
- `403`: bloqueio por mecanismo de seguranca, especialmente whitelist
- `429`: concorrencia, quota ou rate limit

O SDK precisa mapear esses casos para um erro tipado com metadados suficientes para retry, observabilidade e suporte operacional.

### Permissoes por endpoint

A referencia oficial informa permissoes requeridas por endpoint, como `PAYMENT:READ` em rotas de cobrancas.

O SDK nao precisa bloquear chamadas em runtime com base nisso, mas deve:

- documentar permissoes relevantes por metodo
- preservar esse metadado quando ele for util na geracao de docs

## Decisoes recomendadas para o core do SDK

### Entradas do core

O core deve ter no minimo:

- `accessToken`
- `environment`
- `timeoutMs`
- `userAgent`

### Saidas do core

O core deve fornecer:

- cliente HTTP base
- erros tipados
- utilitario de download binario
- helper de headers padrao
- helper de query params
- helper de pagina
- helper de validacao de `asaas-access-token`

### Comportamento recomendado

- nao fazer retry automatico cego em qualquer erro
- permitir retry controlado para `429` e falhas transientes de rede
- nao mascarar `401` e `403`
- preservar headers relevantes de rate limit
- preservar payload bruto de erro quando isso ajudar diagnostico

## O que este modulo muda no plano do SDK

Depois desta etapa, a base do pacote ja deveria convergir para algo como:

- `core/config.ts`
- `core/http.ts`
- `core/errors.ts`
- `core/pagination.ts`
- `core/security.ts`
- `core/webhook-auth.ts`

Os modulos de dominio devem consumir essa fundacao, nao reimplementa-la.

## Perguntas que este modulo responde

### Qual parte oficial foi pesquisada?

- autenticacao e chaves de API
- sandbox e matriz do que pode ser testado
- limites da API
- mecanismos adicionais de seguranca
- whitelist de IPs
- validacao de saque via webhooks
- referencia de endpoints com permissoes
- exemplos de listagem

### Quais capacidades reais isso mostra?

- o Asaas usa API key via `access_token`
- sandbox e producao sao ambientes separados
- a plataforma tem limites operacionais explicitos
- existem mecanismos extras de seguranca fora do simples uso da API key
- listas seguem um formato reutilizavel com `limit` e `offset`

### Como isso deve virar API publica no SDK?

- com `environment` obrigatorio
- com autenticacao centralizada
- com erro tipado para `401`, `403` e `429`
- com helper generico de lista paginada
- com utilitarios compartilhados para headers e webhook auth

### O que fica fora deste corte?

- modelagem detalhada de cada dominio funcional
- regras de negocio de transferencias e webhooks alem da base de seguranca
- comportamento especifico de cada endpoint

## Fontes oficiais consultadas

- [Authentication](https://docs.asaas.com/docs/authentication-2)
- [Chaves de API](https://docs.asaas.com/docs/chaves-de-api)
- [Sandbox](https://docs.asaas.com/docs/sandbox)
- [How to set up your account in the Sandbox](https://docs.asaas.com/docs/how-to-set-up-your-account-in-the-sandbox-1)
- [O que pode ser testado?](https://docs.asaas.com/docs/o-que-pode-ser-testado)
- [Limites da API](https://docs.asaas.com/docs/duvidas-frequentes-limites-da-api)
- [Additional Security Mechanisms](https://docs.asaas.com/docs/additional-security-mechanisms)
- [Whitelist de IPs](https://docs.asaas.com/docs/whitelist-de-ips)
- [Mecanismo para validacao de saque via webhooks](https://docs.asaas.com/docs/mecanismo-para-validacao-de-saque-via-webhooks)
- [Official Asaas IPs](https://docs.asaas.com/docs/official-asaas-ips)
- [List payments](https://docs.asaas.com/reference/list-payments)
- [Alterando notificacoes de um cliente](https://docs.asaas.com/docs/alterando-notificacoes-de-um-cliente)
