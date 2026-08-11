# ESPEC 03 - Cadastro de Operacoes

## 1. Identificacao

- **ID:** ESPEC-03
- **Nome da Funcionalidade:** Cadastro de Operacoes (Compra, Venda e Subscricao)
- **Modulo/Area:** Operacoes
- **Status:** Rascunho
- **Versao:** 1.0
- **RFs relacionados (ERS):** RF-010, RF-011, RF-012, RF-013, RF-014, RF-036
- **RNs relacionadas (ERS):** RN-001, RN-002, RN-003, RN-007, RN-008, RN-009, RN-012
- **RNFs relacionados (ERS):** RNF-005, RNF-013, RNF-016, RNF-017

## 2. Objetivo

Permitir que o usuario registre compras, vendas e subscricoes de ativos do catalogo, mantendo quantidade atual e Custo de Aquisicao Total de forma transacional.

## 3. Escopo desta ESPEC

**Inclui:**

- Cadastro, edicao, exclusao e listagem historica de operacoes.
- Operacoes dos tipos Compra, Venda e Subscricao.
- Validacao de venda contra quantidade historica disponivel na data.
- Recalculo transacional da posicao materializada do par carteira/ativo.

**Nao inclui:**

- Execucao real de ordens de compra e venda.
- Calculo de IR.
- Calculo, persistencia ou exibicao de preco medio.

## 4. Atores

- **Investidor Pessoa Fisica** — registra manualmente operacoes ja realizadas fora do sistema.

## 5. Casos de Uso / User Stories

- **US-01:** Como investidor, eu quero registrar compra, para aumentar quantidade e Custo de Aquisicao Total do ativo. *(RF-010)*
- **US-02:** Como investidor, eu quero registrar venda, para reduzir quantidade e custo proporcionalmente. *(RF-011, RN-002, RN-003)*
- **US-03:** Como investidor, eu quero registrar subscricao, para aumentar quantidade e Custo de Aquisicao Total. *(RF-012)*
- **US-04:** Como investidor, eu quero editar ou excluir operacoes, para corrigir meu historico. *(RF-013, RF-014)*
- **US-05:** Como investidor, eu quero consultar historico de operacoes por ativo, para auditar meus lancamentos. *(RF-036)*

## 6. Fluxo Principal

### 6.1 Compra

1. O usuario acessa o formulario de operacao.
2. O usuario seleciona carteira e ativo do catalogo.
3. O usuario informa data, quantidade, custo total e, opcionalmente, preco unitario e taxas.
4. O sistema valida os dados.
5. O sistema persiste a operacao e recalcula a posicao do par carteira/ativo na mesma transacao.

### 6.2 Venda

1. O usuario seleciona carteira e ativo do catalogo.
2. O usuario informa data, quantidade, valor total e, opcionalmente, preco unitario e taxas.
3. O sistema reconstitui a quantidade disponivel ate a data da venda.
4. Se houver quantidade suficiente, o sistema persiste a venda e reduz custo total proporcionalmente.

### 6.3 Subscricao

1. O usuario seleciona carteira e ativo do catalogo.
2. O usuario informa data, quantidade subscrita, custo total de subscricao e campos opcionais.
3. O sistema persiste a subscricao e recalcula quantidade e custo total.

### 6.4 Edicao ou exclusao

1. O usuario seleciona uma operacao propria.
2. O usuario edita campos ou solicita exclusao.
3. O sistema valida propriedade, dados e consequencias historicas.
4. O sistema reprocessa cronologicamente o par carteira/ativo afetado.

## 7. Fluxos Alternativos e Excecoes

- **Cenario:** Ativo nao existe ou nao esta disponivel para selecao
  - **Comportamento esperado:** Bloquear cadastro ou edicao para novo lancamento.
- **Cenario:** Venda maior que quantidade disponivel na data
  - **Comportamento esperado:** Abortar toda a transacao e informar quantidade insuficiente.
- **Cenario:** Edicao retroativa invalida uma venda posterior
  - **Comportamento esperado:** Bloquear a alteracao e preservar o estado anterior.
- **Cenario:** Exclusao de operacao com registros vinculados ao ativo/carteira
  - **Comportamento esperado:** Aplicar RN-009 quando a remocao do ativo da carteira implicar exclusao em cascata de registros vinculados.

## 8. Especificacao de Campos

- **Campo:** Carteira
  - **Tipo:** Referencia
  - **Obrigatorio:** Sim
  - **Regras de Validacao:** Deve pertencer ao usuario autenticado.

- **Campo:** Ativo
  - **Tipo:** Referencia
  - **Obrigatorio:** Sim
  - **Regras de Validacao:** Deve existir no catalogo; usuario nao cadastra ticker livremente.

- **Campo:** Tipo
  - **Tipo:** Enum
  - **Obrigatorio:** Sim
  - **Valores permitidos:** `COMPRA`, `VENDA`, `SUBSCRICAO`

- **Campo:** Data da operacao
  - **Tipo:** Data
  - **Obrigatorio:** Sim
  - **Regras de Validacao:** Datas retroativas sao permitidas.

- **Campo:** Quantidade
  - **Tipo:** Decimal `numeric(19,8)`
  - **Obrigatorio:** Sim
  - **Regras de Validacao:** Maior que zero.

- **Campo:** Preco unitario
  - **Tipo:** Decimal `numeric(19,8)`
  - **Obrigatorio:** Nao
  - **Regras de Validacao:** Informativo; nao recalcula `valor_total`.

- **Campo:** Taxas
  - **Tipo:** Decimal `numeric(19,8)`
  - **Obrigatorio:** Nao
  - **Regras de Validacao:** Informativo; nao recalcula `valor_total`.

- **Campo:** Valor total
  - **Tipo:** Decimal `numeric(19,8)`
  - **Obrigatorio:** Sim
  - **Regras de Validacao:** Informado manualmente; para compra/subscricao representa custo total; para venda representa valor total da operacao.

## 9. Regras de Negocio Aplicaveis

### 9.1 Regras de Negocio e Calculo

- **RN-001:** O sistema nunca calcula nem persiste preco medio.
- **RN-002:** Venda reduz custo proporcionalmente.
  - **Formula:**

    ```text
    custo_reduzido = custo_total_antes * quantidade_vendida / quantidade_antes
    custo_total_depois = custo_total_antes - custo_reduzido
    quantidade_depois = quantidade_antes - quantidade_vendida
    se quantidade_depois == 0:
        custo_total_depois = 0
    ```

- **RN-003:** Venda superior a quantidade disponivel na data e proibida.
- **RN-007:** Operacoes podem ter data retroativa.
- **RN-008:** Ativo deve vir do catalogo.
- **RN-012:** Preservar precisao decimal sem arredondamento intermediario.

### 9.2 Efeitos em Outras Entidades

- **Entidade afetada:** `posicao_ativo`
  - **O que muda:** Quantidade atual e custo total sao recalculados.
  - **Quando:** Criacao, edicao ou exclusao de operacao.
  - **Regra:** Reprocessamento cronologico do par carteira/ativo.

- **Entidade afetada:** Dashboard e detalhe do ativo
  - **O que muda:** Indicadores baseados em quantidade, custo, P&L e rentabilidade.
  - **Quando:** Apos transacao de operacao bem-sucedida.

## 10. Interface do Usuario

- Formulario de operacao com tipo, carteira, ativo, data, quantidade, valor total, preco unitario e taxas.
- Listagem com filtros por carteira, ativo e periodo.
- Historico por ativo exibindo carteira, tipo, data, quantidade, valor total e campos opcionais.

## 11. Criterios de Aceitacao

- **Dado** compra valida, **quando** o usuario salvar, **entao** a quantidade e o custo total do ativo devem aumentar.
- **Dado** subscricao valida, **quando** o usuario salvar, **entao** a quantidade e o custo total devem aumentar.
- **Dado** quantidade disponivel insuficiente, **quando** o usuario tentar vender, **entao** a venda deve ser bloqueada.
- **Dado** venda valida, **quando** o usuario salvar, **entao** o custo total deve ser reduzido proporcionalmente a quantidade vendida.
- **Dado** uma operacao retroativa editada, **quando** o sistema reprocessar a posicao, **entao** eventos posteriores devem ser considerados em ordem cronologica.

## 12. Dependencias

- ESPEC-01 - Conta e Acesso.
- ESPEC-02 - Carteiras.
- ESPEC-09 - Catalogo de Ativos.
- Modelo de dados com `operacao` e `posicao_ativo`.

## 13. Referencias

- [ERS](../ers.md)
- [Escopo MVP](../escopo_mvp.md)
- [Modelo de Dados](../../arquitetura/modelo_dados.md)
- [ESPEC-09](./ESPEC_09_catalogo-de-ativos.md)

## Contexto para IA

### Objetivo

Implementar lancamentos de compra, venda e subscricao com recalculo transacional da posicao.

### Ordem de validacao dos campos

1. Validar propriedade da carteira.
2. Validar ativo do catalogo.
3. Validar tipo.
4. Validar data.
5. Validar quantidade e valor total.
6. Para venda, validar quantidade historica disponivel.
7. Reprocessar posicao sem calcular preco medio.

### Casos de borda criticos

- Venda zerando posicao deve zerar custo total.
- Lancamento retroativo pode invalidar venda posterior.
- Preco unitario e taxas sao apenas informativos.
