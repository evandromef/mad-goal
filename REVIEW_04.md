# Quarta revisão de implementação do MVP

**Data da revisão:** 3 de agosto de 2026  
**Status geral:** 5 achados resolvidos

## Resumo executivo

Os cinco apontamentos recebidos após a terceira revisão foram comparados com
`REVIEW.md`, `REVIEW_02.md` e `REVIEW_03.md`. Eles não constavam nos documentos
anteriores, mas uma verificação posterior do código confirmou que três já
haviam sido corrigidos antes da consolidação desta revisão.

O gerenciamento de foco do modal, o landmark duplicado, a apresentação de
subscrições e os dois riscos do carregamento demonstrativo estão corrigidos e
cobertos por testes.

Esta quarta revisão reúne 5 achados P2 resolvidos.

## Achados P2 já resolvidos

### 1. Mover e manter o foco do teclado dentro do diálogo aberto

**Status:** resolvido  
**Local:** `frontend/src/app/core/system-modal.component.ts:9-10`  
**Referência:** acessibilidade da interface

Nos diálogos de confirmação sem campo de entrada, o foco permanece no controle
que abriu o modal e não fica contido no diálogo. Um usuário de teclado que abre
uma confirmação de exclusão com Enter pode pressionar Enter novamente e apenas
reabrir o modal. A tecla Tab também percorre controles atrás do diálogo antes
de alcançar suas ações.

O componente atual move o foco para uma ação apropriada, mantém o foco dentro
do diálogo e o restaura no elemento que iniciou a interação após o fechamento.
Os testes automatizados cobrem esse comportamento.

### 2. Evitar a criação de um segundo landmark `main`

**Status:** resolvido  
**Local:** `frontend/src/app/app.component.ts:10`  
**Referência:** acessibilidade da interface

Cada página carregada pelas rotas já renderiza seu próprio elemento `<main>`.
O wrapper adicionado no componente raiz cria landmarks principais aninhados em
toda a aplicação, o que pode fazer tecnologias assistivas anunciarem regiões
principais duplicadas ou ambíguas.

O template do componente raiz usa atualmente um `<div>` sem semântica de
landmark como limite para `inert`, preservando apenas um elemento `<main>` por
página.

### 3. Incluir subscrições nos detalhes das operações

**Status:** resolvido  
**Local:** `frontend/src/app/pages/dashboard.component.ts:392`  
**Referência:** `especs/ESPEC_03_operacoes.md:162-164`

Quando `item.type` é `SUBSCRICAO`, o retorno antecipado omite quantidade e
preço unitário, embora o formulário e `isOperation()` tratem subscrição com os
mesmos campos de compra e venda. Como resultado, uma das três operações exibe
apenas o valor total no histórico.

`operationDetails()` delega atualmente a classificação para
`isOperationType()`, que inclui `SUBSCRICAO`. Há também cobertura unitária para
esse tipo de operação.

## Achados P2 corrigidos nesta etapa

### 1. Evitar alterações demonstrativas quando o e-mail já existir

**Status:** resolvido  
**Local:** `backend/src/main/java/br/com/mad/config/DemoDataInitializer.java:79-83`  
**Referência:** idempotência da carga demonstrativa

Quando os dados demonstrativos estão habilitados e o e-mail configurado já
pertence a um usuário, o inicializador adiciona dividendos gerados a qualquer
carteira chamada `Carteira de longo prazo`. Antes disso, as cotações de
referência também já podem ter sido alteradas.

Esse comportamento contradizia a condição de idempotência documentada e podia
alterar dados de um usuário real quando `DEMO_USER_EMAIL` coincidia com um
endereço existente. O inicializador agora verifica o usuário imediatamente
após a configuração de habilitação e encerra a rotina antes de consultar ou
alterar ativos, carteiras, lançamentos ou credenciais.

### 2. Tratar ativos demonstrativos ausentes sem impedir a inicialização

**Status:** resolvido  
**Local:** `backend/src/main/java/br/com/mad/config/DemoDataInitializer.java:72-74`  
**Referência:** robustez da carga demonstrativa

Com `DEMO_DATA_ENABLED=true`, um banco existente cujo catálogo ativo não
contenha qualquer um dos sete tickers exigidos faz `requiredAsset` lançar uma
exceção e interromper a inicialização da aplicação. Esse cenário é possível
porque `AssetCatalogInitializer` só insere os ativos padrão quando a tabela
está completamente vazia, enquanto a sincronização de mercado pode desativar
ativos.

O inicializador agora valida todo o conjunto de tickers antes de atualizar
cotações ou criar dados. Quando algum ativo está ausente ou inativo, registra
um aviso com os tickers afetados e cancela somente a carga demonstrativa, sem
impedir a inicialização completa da aplicação.

## Verificação das correções

1. O teste unitário confirma ausência de interações com ativos, carteiras,
   lançamentos e codificação de senha quando o e-mail já existe.
2. O teste unitário confirma que catálogo incompleto não lança exceção, não
   atualiza cotação e não cria usuário demonstrativo.
3. O teste de integração mantém a cobertura da criação completa e da execução
   idempotente com catálogo válido.
