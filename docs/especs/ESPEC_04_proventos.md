# ESPEC 04 - Cadastro de Proventos

## 1. Identificacao

- **ID:** ESPEC-04
- **Nome da Funcionalidade:** Cadastro de Proventos (Dividendos e JCP)
- **Modulo/Area:** Proventos
- **Status:** Rascunho
- **Versao:** 1.0
- **RFs relacionados (ERS):** RF-015, RF-016, RF-017, RF-018, RF-019, RF-033
- **RNs relacionadas (ERS):** RN-007, RN-008, RN-012
- **RNFs relacionados (ERS):** RNF-005, RNF-013, RNF-016, RNF-017

## 2. Objetivo

Permitir que o usuario registre manualmente dividendos e JCP recebidos, consulte historico e acompanhe totais por periodo, carteira, categoria, ativo e tipo.

## 3. Escopo desta ESPEC

**Inclui:**

- Cadastro, edicao e exclusao de proventos.
- Tipos Dividendo e JCP.
- Historico cronologico com filtros.
- Consolidacao por mes, trimestre ou ano.

**Nao inclui:**

- Registro automatico de proventos.
- Calculo de imposto de renda.
- Uso de proventos no calculo de rentabilidade da carteira.

## 4. Atores

- **Investidor Pessoa Fisica** — registra manualmente proventos recebidos.

## 5. Casos de Uso / User Stories

- **US-01:** Como investidor, eu quero cadastrar proventos, para registrar valores recebidos por ativo. *(RF-015)*
- **US-02:** Como investidor, eu quero editar ou excluir proventos, para corrigir registros. *(RF-016, RF-017)*
- **US-03:** Como investidor, eu quero filtrar historico de proventos, para analisar recebimentos por ativo, categoria e tipo. *(RF-018)*
- **US-04:** Como investidor, eu quero totalizar proventos por periodo, para acompanhar recebimentos mensais, trimestrais ou anuais. *(RF-019, RF-033)*

## 6. Fluxo Principal

### 6.1 Cadastrar provento

1. O usuario acessa o formulario de provento.
2. O usuario seleciona carteira e ativo do catalogo.
3. O usuario informa tipo, data de pagamento, valor total e, opcionalmente, valor por unidade.
4. O sistema valida os dados.
5. O sistema persiste o provento.
6. O sistema recalcula os totais de proventos consultados.

### 6.2 Editar ou excluir provento

1. O usuario seleciona um provento proprio.
2. O usuario altera dados ou solicita exclusao.
3. O sistema valida propriedade e campos.
4. O sistema atualiza ou remove o registro.
5. O sistema reflete a alteracao nos totais e historicos.

### 6.3 Consultar historico e consolidacao

1. O usuario acessa historico ou dashboard de proventos.
2. O usuario aplica filtros por carteira, ativo, categoria, tipo e periodo.
3. O sistema exibe registros em ordem cronologica e totais agrupados por mes, trimestre ou ano.

## 7. Fluxos Alternativos e Excecoes

- **Cenario:** Valor total nao informado
  - **Comportamento esperado:** Bloquear gravacao.
- **Cenario:** Tipo diferente de Dividendo ou JCP
  - **Comportamento esperado:** Bloquear gravacao.
- **Cenario:** Ativo nao pertence ao catalogo
  - **Comportamento esperado:** Bloquear cadastro.
- **Cenario:** Usuario tenta alterar provento de outra conta
  - **Comportamento esperado:** Negar acesso.

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
  - **Valores permitidos:** `DIVIDENDO`, `JCP`

- **Campo:** Data de pagamento
  - **Tipo:** Data
  - **Obrigatorio:** Sim
  - **Regras de Validacao:** Datas retroativas sao permitidas.

- **Campo:** Valor por unidade
  - **Tipo:** Decimal `numeric(19,8)`
  - **Obrigatorio:** Nao
  - **Regras de Validacao:** Campo informativo opcional.

- **Campo:** Valor total
  - **Tipo:** Decimal `numeric(19,8)`
  - **Obrigatorio:** Sim
  - **Regras de Validacao:** Informado manualmente pelo usuario.

## 9. Regras de Negocio Aplicaveis

### 9.1 Regras de Negocio e Calculo

- **RN-007:** Proventos podem ter data retroativa.
- **RN-008:** Ativo deve ser selecionado do catalogo.
- **RN-012:** Totais monetarios preservam precisao decimal; arredondamento apenas em resposta e exibicao.
- **Rentabilidade:** Proventos nao entram na rentabilidade definida pela RN-015.
  - **Formula de consolidacao:**

    ```text
    total_proventos_periodo = soma(valor_total dos proventos filtrados)
    ```

### 9.2 Efeitos em Outras Entidades

- **Entidade afetada:** Totais de proventos
  - **O que muda:** Valor consolidado por carteira, categoria, ativo, tipo e periodo.
  - **Quando:** Criacao, edicao ou exclusao.

- **Entidade afetada:** Posicao do ativo
  - **O que muda:** Nada. Proventos nao alteram quantidade nem custo total.

## 10. Interface do Usuario

- Formulario de provento com carteira, ativo, tipo, data de pagamento, valor por unidade e valor total.
- Listagem com filtros por carteira, ativo, categoria, tipo e periodo.
- Exibicao de data, ativo, valor recebido e tipo de provento.
- Consolidacao por mes, trimestre ou ano.

## 11. Criterios de Aceitacao

- **Dado** dados validos, **quando** o usuario cadastrar dividendo, **entao** o provento deve aparecer no historico.
- **Dado** dados validos, **quando** o usuario cadastrar JCP, **entao** o provento deve aparecer no historico com tipo JCP.
- **Dado** proventos em meses diferentes, **quando** o usuario consolidar por mes, **entao** o sistema deve somar valores por competencia mensal.
- **Dado** provento editado, **quando** o usuario consultar o total do periodo, **entao** o total deve refletir o novo valor.
- **Dado** provento excluido, **quando** o usuario consultar historico, **entao** o registro nao deve mais aparecer.

## 12. Dependencias

- ESPEC-01 - Conta e Acesso.
- ESPEC-02 - Carteiras.
- ESPEC-09 - Catalogo de Ativos.

## 13. Referencias

- [ERS](../ers.md)
- [Escopo MVP](../escopo_mvp.md)
- [Modelo de Dados](../../arquitetura/modelo_dados.md)

## Contexto para IA

### Objetivo

Implementar registro manual e consultas de proventos sem alterar posicao nem rentabilidade.

### Casos de borda criticos

- Valor por unidade e opcional.
- Valor total e sempre informado pelo usuario.
- Proventos nao alteram custo, quantidade ou P&L.
