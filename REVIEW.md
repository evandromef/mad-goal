# Revisão de implementação do MVP

**Data da revisão:** 30 de julho de 2026  
**Status geral:** pendências corrigidas e validadas em 31 de julho de 2026

## Resumo executivo

O núcleo local implementa autenticação básica, CRUD backend de carteiras,
lançamentos e notas, além dos principais cálculos da carteira. Os sete testes
automatizados existentes passam.

Entretanto, foram identificados erros de cálculo e exibição, além de
funcionalidades previstas no MVP que permanecem ausentes ou inacessíveis pela
interface. Esta revisão reúne 14 pendências:

- 6 de prioridade P1;
- 8 de prioridade P2.

## Pendências P1

### 1. Preservar a ausência de cotação

**Status:** resolvido  
**Local:** `backend/src/main/java/br/com/mad/service/PortfolioService.java:26-29`  
**Referência:** ESPEC 07

Quando um ativo não possui cotação, o serviço transforma seu valor atual em
zero e calcula P&L e rentabilidade negativos sobre esse valor fictício. A
ausência de cotação deve ser sinalizada sem substituição por zero. Os valores
consolidados dependentes da cotação também devem representar esse estado como
indisponível.

### 2. Implementar a sincronização real do catálogo e das cotações

**Status:** resolvido  
**Local:** `backend/src/main/java/br/com/mad/config/AssetCatalogInitializer.java:20-23`  
**Referências:** F07, RF-034, RF-041–RF-043, RN-017 e RN-018

O inicializador grava apenas sete ativos e preços estáticos. Não existe cliente
de API, atualização periódica do catálogo nem job diário para atualizar os
ativos referenciados nas carteiras. Com isso, o patrimônio permanece baseado
em cotações demonstrativas.

### 3. Expor o detalhe do ativo e o CRUD de notas

**Status:** resolvido  
**Local:** `frontend/src/app/app.routes.ts:6-9`  
**Referências:** F04 e RF-036–RF-040

As únicas rotas do frontend são login e dashboard. Não há como abrir o detalhe
de um ativo, consultar seus históricos filtrados, iniciar lançamentos
contextuais ou usar o CRUD de notas já disponível no backend.

### 4. Completar os fluxos de conta previstos no MVP

**Status:** resolvido  
**Local:** `frontend/src/app/pages/login.component.ts:30-35`  
**Referências:** F00, RF-001 e RF-003–RF-005

O frontend oferece somente cadastro tradicional e login. O backend não
implementa confirmação de e-mail, Google OAuth ou recuperação de senha.
Também não existe tela para editar ou excluir o perfil.

### 5. Disponibilizar o histórico completo de lançamentos

**Status:** resolvido  
**Local:** `frontend/src/app/pages/dashboard.component.ts:154`

Quando uma carteira possui mais de 12 registros, `slice(0, 12)` torna os
registros anteriores inacessíveis. Como não existe outra tela ou paginação,
esses registros também não podem ser editados ou excluídos. Isso impede o
histórico completo e o CRUD de operações, proventos, bonificações e eventos
previstos no MVP.

### 6. Implementar filtros e consolidações de proventos

**Status:** resolvido  
**Local:** `backend/src/main/java/br/com/mad/web/LedgerController.java:55-59`  
**Referências:** F05, RF-018, RF-019 e RF-033

A consulta aceita apenas carteira e, opcionalmente, ativo. Não há filtros por
categoria, tipo ou período, nem agrupamento mensal, trimestral ou anual. O
total vitalício apresentado no dashboard não atende à parte analítica de
proventos prevista no MVP.

## Pendências P2

### 7. Expor edição, exclusão e valor das carteiras

**Status:** resolvido  
**Local:** `frontend/src/app/core/api.service.ts:37-38`  
**Referências:** F01 e RF-007–RF-009

A API do frontend implementa somente listagem e criação de carteiras, sem
consumir os endpoints de edição e exclusão. Além disso, o modelo `Wallet` não
contém o valor atual consolidado.

### 8. Renderizar a evolução do custo e permitir escolher a granularidade

**Status:** resolvido  
**Local:** `frontend/src/app/pages/dashboard.component.ts:47-52`  
**Referências:** F06 e RF-032

Embora a resposta da API contenha `evolution`, nenhum elemento da tela
apresenta esses dados e o frontend nunca solicita a granularidade anual.

### 9. Mostrar os indicadores completos por ativo e categoria

**Status:** resolvido  
**Local:** `frontend/src/app/pages/dashboard.component.ts:59-68`  
**Referências:** RF-029 e RF-031

A tabela omite a rentabilidade individual já retornada pela API. A seção de
categorias mostra somente a alocação, e o backend não calcula rentabilidade por
categoria. Devem ser apresentados custo, valor atual e rentabilidade nos dois
níveis.

### 10. Apresentar rentabilidade não calculável como indisponível

**Status:** resolvido  
**Local:** `frontend/src/app/pages/dashboard.component.ts:50`  
**Referências:** RN-015 e ESPEC 07

Quando o custo de aquisição é zero, a API retorna `null` corretamente, mas o
frontend usa `?? 0` e exibe `0%`. O valor deve ser apresentado como
indisponível, pois a rentabilidade não foi calculada.

### 11. Exibir os dados dos eventos corporativos no histórico

**Status:** resolvido  
**Local:** `frontend/src/app/pages/dashboard.component.ts:123-124`  
**Referência:** RF-037

Para desdobramentos e grupamentos, `totalValue` e `quantity` estão ausentes,
pois os dados relevantes são `newQuantity` e a proporção. Atualmente, o
histórico renderiza um valor vazio e impede a auditoria do evento.

### 12. Renovar automaticamente a sessão JWT

**Status:** resolvido  
**Local:** `frontend/src/app/core/auth.interceptor.ts:3-5`  
**Referência:** RNF-002

O interceptor apenas reaplica o token armazenado. Após a expiração, não há
refresh, nova emissão, tratamento global de respostas HTTP 401 ou
redirecionamento para login. A tela permanece em um estado autenticado
inválido.

### 13. Preservar as oito casas decimais especificadas

**Status:** resolvido  
**Local:** `backend/src/main/resources/db/migration/V1__initial_schema.sql:35-39`  
**Referência:** RN-012

As especificações de operações e proventos definem `numeric(19,8)`, mas as
quantidades e cifras do livro são persistidas com escala 6. Entradas com sete
ou oito casas decimais são arredondadas pelo banco, alterando posições e
cálculos.

### 14. Adicionar a cobertura automatizada exigida para o MVP

**Status:** resolvido  
**Local:** `frontend/package.json:6-8`  
**Referência:** RNF-017

A configuração executa apenas três testes de frontend e quatro de backend, sem
suíte end-to-end nem verificação de cobertura mínima. Os principais fluxos de
carteiras, lançamentos, isolamento de dados, dashboard e notas permanecem sem
validação automatizada.

## Ordem recomendada de correção

1. Corrigir o tratamento de cotações ausentes e de rentabilidade
   indisponível.
2. Preservar a precisão decimal dos lançamentos.
3. Implementar a integração do catálogo e das cotações.
4. Completar os fluxos de conta e renovação de sessão.
5. Expor o detalhe do ativo, notas e CRUD completo de carteiras e lançamentos.
6. Implementar filtros, consolidações e indicadores analíticos.
7. Ampliar a cobertura automatizada e incluir testes end-to-end.
