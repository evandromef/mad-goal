# ESPEC 06 - Cadastro de Eventos Corporativos

## 1. Identificacao

- **ID:** ESPEC-06
- **Nome da Funcionalidade:** Cadastro de Eventos Corporativos (Desdobramento e Grupamento)
- **Modulo/Area:** Eventos Corporativos
- **Status:** Rascunho
- **Versao:** 1.0
- **RFs relacionados (ERS):** RF-023, RF-024, RF-025, RF-026, RF-037, RF-038
- **RNs relacionadas (ERS):** RN-001, RN-004, RN-005, RN-007, RN-008, RN-012
- **RNFs relacionados (ERS):** RNF-005, RNF-013, RNF-016, RNF-017

## 2. Objetivo

Permitir que o usuario registre desdobramentos e grupamentos, substituindo a quantidade total do ativo pela nova quantidade informada e preservando o Custo de Aquisicao Total.

## 3. Escopo desta ESPEC

**Inclui:**

- Cadastro, edicao e exclusao de desdobramento.
- Cadastro, edicao e exclusao de grupamento.
- Recalculo transacional da quantidade do ativo.
- Historico de eventos corporativos por ativo.

**Nao inclui:**

- Registro automatico de eventos corporativos.
- Alteracao do Custo de Aquisicao Total.
- Calculo ou exibicao de preco medio.

## 4. Atores

- **Investidor Pessoa Fisica** — registra manualmente eventos corporativos.

## 5. Casos de Uso / User Stories

- **US-01:** Como investidor, eu quero cadastrar desdobramento, para atualizar a quantidade total do ativo apos split. *(RF-023, RN-004)*
- **US-02:** Como investidor, eu quero cadastrar grupamento, para atualizar a quantidade total do ativo apos inplit. *(RF-024, RN-005)*
- **US-03:** Como investidor, eu quero editar ou excluir eventos, para corrigir meu historico. *(RF-025, RF-026)*
- **US-04:** Como investidor, eu quero consultar eventos no detalhe do ativo, para auditar alteracoes de quantidade. *(RF-037, RF-038)*

## 6. Fluxo Principal

### 6.1 Desdobramento

1. O usuario acessa o formulario de evento corporativo.
2. O usuario seleciona tipo Desdobramento, carteira e ativo.
3. O usuario informa data, fator, nova quantidade total e descricao opcional.
4. O sistema valida os dados.
5. O sistema persiste o evento e reprocessa a posicao do par carteira/ativo.

### 6.2 Grupamento

1. O usuario acessa o formulario de evento corporativo.
2. O usuario seleciona tipo Grupamento, carteira e ativo.
3. O usuario informa data, fator, nova quantidade total e descricao opcional.
4. O sistema valida os dados.
5. O sistema persiste o evento e reprocessa a posicao do par carteira/ativo.

### 6.3 Edicao ou exclusao

1. O usuario seleciona evento proprio.
2. O usuario edita campos ou solicita exclusao.
3. O sistema valida propriedade e consequencias historicas.
4. O sistema reprocessa cronologicamente a posicao.

## 7. Fluxos Alternativos e Excecoes

- **Cenario:** Nova quantidade total nao informada
  - **Comportamento esperado:** Bloquear gravacao.
- **Cenario:** Fator incompleto
  - **Comportamento esperado:** Bloquear gravacao.
- **Cenario:** Edicao retroativa invalida venda posterior
  - **Comportamento esperado:** Abortar transacao e preservar estado anterior.
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

- **Campo:** Tipo
  - **Tipo:** Enum
  - **Obrigatorio:** Sim
  - **Valores permitidos:** `DESDOBRAMENTO`, `GRUPAMENTO`

- **Campo:** Data
  - **Tipo:** Data
  - **Obrigatorio:** Sim
  - **Regras de Validacao:** Datas retroativas sao permitidas.

- **Campo:** Fator numerador
  - **Tipo:** Decimal `numeric(19,10)`
  - **Obrigatorio:** Sim
  - **Regras de Validacao:** Maior que zero.

- **Campo:** Fator denominador
  - **Tipo:** Decimal `numeric(19,10)`
  - **Obrigatorio:** Sim
  - **Regras de Validacao:** Maior que zero.

- **Campo:** Nova quantidade total
  - **Tipo:** Decimal `numeric(19,8)`
  - **Obrigatorio:** Sim
  - **Regras de Validacao:** Maior ou igual a zero.

- **Campo:** Descricao
  - **Tipo:** Texto
  - **Obrigatorio:** Nao
  - **Valor Maximo:** Nao definido explicitamente na documentacao atual.

## 9. Regras de Negocio Aplicaveis

### 9.1 Regras de Negocio e Calculo

- **RN-004:** Desdobramento substitui diretamente a quantidade pela nova quantidade informada; custo total permanece inalterado.
- **RN-005:** Grupamento substitui diretamente a quantidade pela nova quantidade informada; custo total permanece inalterado.
  - **Formula comum:**

    ```text
    quantidade_depois = nova_quantidade_total_informada
    custo_total_depois = custo_total_antes
    ```

- **RN-001:** Nao calcular nem persistir preco medio.
- **RN-007:** Eventos corporativos podem ter data retroativa.
- **RN-008:** Ativo deve vir do catalogo.
- **RN-012:** Preservar precisao decimal.

### 9.2 Efeitos em Outras Entidades

- **Entidade afetada:** `posicao_ativo`
  - **O que muda:** Quantidade atual e recalculada; custo total permanece inalterado pelo evento.
  - **Quando:** Criacao, edicao ou exclusao.

- **Entidade afetada:** Historico consolidado do ativo
  - **O que muda:** Evento passa a compor ou deixa de compor a linha cronologica do ativo.

## 10. Interface do Usuario

- Formulario com tipo, carteira, ativo, data, fator, nova quantidade total e descricao.
- Historico filtravel por carteira, ativo, periodo e tipo de evento.
- Exibicao no detalhe do ativo.

## 11. Criterios de Aceitacao

- **Dado** desdobramento valido, **quando** o usuario salvar, **entao** a quantidade do ativo deve ser substituida pela nova quantidade total informada.
- **Dado** grupamento valido, **quando** o usuario salvar, **entao** a quantidade do ativo deve ser substituida pela nova quantidade total informada.
- **Dado** evento corporativo salvo, **quando** o sistema recalcular posicao, **entao** o Custo de Aquisicao Total deve permanecer inalterado pelo evento.
- **Dado** evento excluido, **quando** o sistema reprocessar o historico, **entao** a quantidade atual deve refletir a ausencia do evento.

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

Implementar desdobramentos e grupamentos como substituicao manual da quantidade total, sem alterar custo.

### Casos de borda criticos

- Evento retroativo antes de venda posterior.
- Fator e informativo/registral; a quantidade efetiva e a nova quantidade total informada.
- Custo total nunca muda por evento corporativo.
