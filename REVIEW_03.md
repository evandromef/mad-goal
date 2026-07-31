# Terceira revisão de implementação do MVP

**Data da revisão:** 31 de julho de 2026
**Status geral:** novas pendências identificadas após a segunda revisão

## Resumo executivo

Os três apontamentos recebidos foram comparados semanticamente com as
pendências registradas em `REVIEW_02.md`. Dois descrevem problemas que ainda
não estavam documentados e foram incluídos nesta revisão:

- 1 pendência de prioridade P1;
- 1 pendência de prioridade P2.

O apontamento sobre a restauração de `espec_template.md` não foi incluído por
já estar integralmente registrado como a pendência 10 da segunda revisão.

## Pendências P1

### 1. Processar no frontend os links dos fluxos de conta

**Status:** pendente
**Local:** `backend/src/main/java/br/com/mad/service/AccountMailService.java:26-33`
**Referência:** ESPEC 01
**Relação com a segunda revisão:** complementa a pendência 2

Quando `EXPOSE_ACCOUNT_TOKENS=false`, os links enviados por e-mail são o único
meio pelo qual o usuário recebe os tokens de confirmação de conta e de
recuperação de senha. Entretanto, `LoginComponent` não lê os parâmetros
`mode` e `token` da URL. Ao abrir o link, a tela permanece no modo de login e o
token não é preenchido.

O frontend deve consumir esses parâmetros e abrir o fluxo correspondente, ou
os links devem apontar para rotas específicas que processem os tokens. Sem
isso, a entrega por e-mail implementada após a segunda revisão não torna os
fluxos de confirmação e recuperação utilizáveis.

## Pendências P2

### 2. Persistir a desativação executada pelo agendamento

**Status:** pendente
**Local:** `backend/src/main/java/br/com/mad/service/MarketDataService.java:63-65`
**Referências:** RF-043 e ESPEC 09
**Relação com a segunda revisão:** complementa a pendência 8

Na sincronização semanal, `scheduledCatalogSynchronization` inicia o fluxo que
chama internamente `synchronizeCatalog()` por meio de
`synchronizeCatalogSafely()`. Essa autoinvocação não passa pelo proxy do
Spring, portanto o `@Transactional` de `synchronizeCatalog()` não é aplicado.

Os ativos retornados por `findAll()` ficam destacados do contexto de
persistência, e apenas executar `deactivate()` não grava a mudança no banco. A
implementação deve salvar explicitamente os ativos alterados ou mover a
transação para um método invocado externamente pelo proxy.

## Apontamento duplicado não incluído nesta revisão

### Restaurar o template obrigatório de especificações

O apontamento foi omitido da lista de pendências deste documento porque já
está registrado na pendência 10 de `REVIEW_02.md`, com o mesmo arquivo,
impacto e ação corretiva: restaurar `espec_template.md` para preservar o fluxo
obrigatório de criação de novas especificações.

## Ordem recomendada de correção

1. Processar no frontend os parâmetros dos links de confirmação e recuperação
   de conta.
2. Garantir a persistência das desativações realizadas pela sincronização
   agendada.
