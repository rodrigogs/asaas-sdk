# SDK Asaas Documentation

## Objetivo

Este diretório vai organizar a construção do SDK TypeScript do Asaas em partes menores, uma por vez, no mesmo estilo de documentação modular que usamos no fiscal do PitStop.

O objetivo desta pasta nao e documentar o produto Asaas inteiro.

O objetivo e documentar:

1. o que a documentacao oficial do Asaas cobre
2. como isso se traduz em um SDK TypeScript interno
3. em que ordem cada modulo deve ser pesquisado, escrito, revisado e implementado

## Forma de trabalho

Para cada modulo, vamos seguir sempre a mesma sequencia:

1. pesquisar online a parte especifica da documentacao oficial
2. escrever a documentacao do modulo
3. revisar a documentacao escrita
4. mover para o proximo modulo

## Index

### Fundacao e visao geral

1. `00-visao-geral.md`
   - panorama do Asaas
   - escopo do pacote `@repo/asaas`
   - diferenca entre cliente HTTP atual e SDK completo

2. `01-fundacoes-http-seguranca-e-ambientes.md`
   - autenticacao e chaves de API
   - sandbox vs producao
   - limites da API
   - webhook auth, whitelist de IPs e convencoes de seguranca
   - erros, paginacao e convencoes transversais

### Modulos funcionais

3. `02-clientes.md`
   - cadastro e consulta de clientes
   - base para cobrancas, assinaturas e notas

4. `03-cobrancas.md`
   - cobrancas gerais
   - boleto, cartao, parcelamento, chargeback, estornos e tokenizacao no que fizer parte do dominio de cobrancas

5. `04-pix.md`
   - recursos especificos de Pix
   - QR Code dinamico/estatico
   - Pix recorrente e Pix automatico

6. `05-assinaturas.md`
   - recorrencia
   - geracao de cobrancas recorrentes e comportamento associado

7. `06-webhooks.md`
   - configuracao
   - autenticacao
   - idempotencia
   - eventos por dominio

8. `07-notas-fiscais.md`
   - configuracao fiscal
   - emissao de notas fiscais de servico
   - dependencias e limites do modulo

9. `08-transferencias.md`
   - transferencias para contas Asaas e outras instituicoes

10. `09-subcontas.md`
    - criacao e gestao de subcontas
    - white label e onboarding
    - chaves de API por subconta

11. `10-links-de-pagamento-e-checkout.md`
    - payment links
    - checkout hospedado

12. `11-split-e-antecipacoes.md`
    - split
    - antecipacoes

13. `12-notificacoes.md`
    - notificacoes padrao
    - configuracoes por cliente

14. `13-pague-contas-e-escrow.md`
    - pay bills
    - escrow
    - regras operacionais, status e boas praticas

### Fechamento

15. `99-fontes-e-referencias.md`
    - links oficiais usados em cada modulo
    - observacoes de escopo e confianca das fontes

## Ordem recomendada de execucao

Para construir o SDK de forma segura, a ordem recomendada e:

1. `00-visao-geral.md`
2. `01-fundacoes-http-seguranca-e-ambientes.md`
3. `02-clientes.md`
4. `03-cobrancas.md`
5. `04-pix.md`
6. `05-assinaturas.md`
7. `06-webhooks.md`
8. `07-notas-fiscais.md`
9. `08-transferencias.md`
10. `09-subcontas.md`
11. `10-links-de-pagamento-e-checkout.md`
12. `11-split-e-antecipacoes.md`
13. `12-notificacoes.md`
14. `13-pague-contas-e-escrow.md`
15. `99-fontes-e-referencias.md`

## Regra de escopo

Cada arquivo desta pasta deve responder a quatro perguntas:

1. qual parte oficial do Asaas foi pesquisada
2. quais capacidades reais essa parte da plataforma oferece
3. como isso deve virar API publica no SDK
4. o que fica explicitamente fora do corte atual

Itens da documentacao oficial que entram como apoio, mas nao viram modulo proprio do SDK:

- canais de suporte
- collections de Postman e Insomnia
- plugins, modulos e parceiros
- MCP Server
- FAQ

Esses itens continuam relevantes como fonte auxiliar, exemplos operacionais ou material de validacao, mas nao justificam uma superficie publica dedicada dentro do pacote `@repo/asaas`.

## Status atual

- `README.md` criado com o indice da pasta
- `00-visao-geral.md` escrito e revisado
- `01-fundacoes-http-seguranca-e-ambientes.md` escrito e revisado
- `02-clientes.md` escrito e revisado
- `03-cobrancas.md` escrito e revisado
- `04-pix.md` escrito e revisado
- `05-assinaturas.md` escrito e revisado
- `06-webhooks.md` escrito e revisado
- `07-notas-fiscais.md` escrito e revisado
- `08-transferencias.md` escrito e revisado
- `09-subcontas.md` escrito e revisado
- `10-links-de-pagamento-e-checkout.md` escrito e revisado
- `11-split-e-antecipacoes.md` escrito e revisado
- `12-notificacoes.md` escrito e revisado
- `13-pague-contas-e-escrow.md` escrito e revisado
- `99-fontes-e-referencias.md` escrito e revisado
- documentacao base do SDK `@repo/asaas` concluida
