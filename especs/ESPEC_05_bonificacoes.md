# ESPEC 05 - Cadastro de Bonificacoes

## 1. Identificacao

- **ID:** ESPEC-05
- **Nome da Funcionalidade:** Cadastro de Bonificacoes
- **Modulo/Area:** Bonificacoes
- **Status:** Rascunho
- **Versao:** 1.0
- **RFs relacionados (ERS):** RF-020, RF-021, RF-022, RF-037, RF-038
- **RNs relacionadas (ERS):** RN-001, RN-006, RN-007, RN-008, RN-012
- **RNFs relacionados (ERS):** RNF-005, RNF-013, RNF-016, RNF-017

## 2. Objetivo

Permitir que o usuario registre bonificacoes recebidas, aumentando apenas a quantidade do ativo sem alterar seu Custo de Aquisicao Total.

## 3. Escopo desta ESPEC

**Inclui:**

- Cadastro, edicao e exclusao de bonificacoes.
- Recalculo transacional da quantidade do ativo.
- Historico de bonificacoes por ativo e exibicao no detalhe do ativo.

**Nao inclui:**

- Registro automatico de bonificacoes.
- Alteracao do Custo de Aquisicao Total.
- Calculo ou exibicao de preco medio.

## 4. Atores

- **Investidor Pessoa Fisica** — registra manualmente bonificacoes.

## 5. Casos de Uso / User Stories

- **US-01:** Como investidor, eu quero cadastrar bonificacao, para ajustar a quantidade do ativo. *(RF-020, RF-022)*
- **US-02:** Como investidor, eu quero editar ou excluir bonificacao, para corrigir meu historico. *(RF-021, RF-022)*
- **US-03:** Como investidor, eu quero consultar bonificacoes no historico do ativo, para entender mudancas de quantidade. *(RF-037, RF-038)*

## 6. Fluxo Principal

### 6.1 Cadastrar bonificacao

1. O usuario acessa o formulario de bonificacao.
2. O usuario seleciona carteira e ativo do catalogo.
3. O usuario informa data, quantidade recebida e descricao opcional.
4. O sistema valida os dados.
5. O sistema persiste a bonificacao e reprocessa a posicao do par carteira/ativo.

### 6.2 Editar ou excluir bonificacao

1. O usuario seleciona uma bonificacao propria.
2. O usuario altera dados ou solicita exclusao.
3. O sistema valida propriedade e campos.
4. O sistema atualiza ou remove o registro.
5. O sistema reprocessa cronologicamente a posicao do par carteira/ativo.

## 7. Fluxos Alternativos e Excecoes

- **Cenario:** Quantidade recebida nao informada ou menor/igual a zero
  - **Comportamento esperado:** Bloquear gravacao.
- **Cenario:** Edicao ou exclusao retroativa invalida venda posterior
  - **Comportamento esperado:** Abortar a transacao e preservar estado anterior.
- **Cenario:** Ativo nao existe no catalogo
  - **Comportamento esperado:** Bloquear cadastro.

## 8. Especificacao de Campos

- **Campo:** Carteira
  - **Tipo:** Referencia
  - **Obrigatorio:** Sim
  - **Regras de Validacao:** Deve pertencer ao usuario autenticado.

- **Campo:** Ativo
  - **Tipo:** Referencia
  - **Obrigatorio:** Sim
  - **Regras de Validacao:** Deve existir no catalogo.

- **Campo:** Data
  - **Tipo:** Data
  - **Obrigatorio:** Sim
  - **Regras de Validacao:** Datas retroativas sao permitidas.

- **Campo:** Quantidade recebida
  - **Tipo:** Decimal `numeric(19,8)`
  - **Obrigatorio:** Sim
  - **Regras de Validacao:** Maior que zero.

- **Campo:** Descricao
  - **Tipo:** Texto
  - **Obrigatorio:** Nao
  - **Valor Maximo:** Nao definido explicitamente na documentacao atual.

## 9. Regras de Negocio Aplicaveis

### 9.1 Regras de Negocio e Calculo

- **RN-006:** Bonificacao soma quantidade e nao altera custo total.
  - **Formula:**

    ```text
    quantidade_depois = quantidade_antes + quantidade_recebida
    custo_total_depois = custo_total_antes
    ```

- **RN-001:** Nao calcular nem persistir preco medio.
- **RN-007:** Bonificacoes podem ter data retroativa.
- **RN-008:** Ativo deve vir do catalogo.
- **RN-012:** Preservar precisao decimal.

### 9.2 Efeitos em Outras Entidades

- **Entidade afetada:** `posicao_ativo`
  - **O que muda:** Quantidade atual e recalculada; custo total permanece inalterado pela bonificacao.
  - **Quando:** Criacao, edicao ou exclusao.

- **Entidade afetada:** Historico consolidado do ativo
  - **O que muda:** Inclusao, alteracao ou remocao do evento de bonificacao.

## 10. Interface do Usuario

- Formulario com carteira, ativo, data, quantidade recebida e descricao.
- Listagem/historico filtravel por carteira, ativo e periodo.
- Exibicao no detalhe do ativo junto a operacoes e eventos.

## 11. Criterios de Aceitacao

- **Dado** bonificacao valida, **quando** o usuario salvar, **entao** a quantidade do ativo deve aumentar e o custo total permanecer igual.
- **Dado** quantidade recebida zero, **quando** o usuario salvar, **entao** o sistema deve bloquear a gravacao.
- **Dado** bonificacao editada, **quando** a posicao for reprocessada, **entao** a quantidade atual deve refletir a alteracao.
- **Dado** bonificacao excluida, **quando** a posicao for reprocessada, **entao** a quantidade recebida deve deixar de compor a posicao.

## 12. Dependencias

- ESPEC-02 - Carteiras.
- ESPEC-03 - Operacoes.
- ESPEC-09 - Catalogo de Ativos.

## 13. Referencias

- [ERS](../ers.md)
- [Escopo MVP](../escopo_mvp.md)
- [Modelo de Dados](../../arquitetura/modelo_dados.md)

## Contexto para IA

### Objetivo

Implementar bonificacoes como eventos de quantidade, sem alterar Custo de Aquisicao Total.

### Casos de borda criticos

- Bonificacao retroativa antes de venda posterior.
- Exclusao que torna venda posterior invalida.
- Custo total nunca muda por causa de bonificacao.
