# ESPEC 07 - Dashboard e Visualizacoes de Carteira

## 1. Identificacao

- **ID:** ESPEC-07
- **Nome da Funcionalidade:** Dashboard e Visualizacoes de Carteira
- **Modulo/Area:** Dashboard
- **Status:** Rascunho
- **Versao:** 1.0
- **RFs relacionados (ERS):** RF-027, RF-028, RF-029, RF-030, RF-031, RF-032, RF-033, RF-034, RF-035
- **RNs relacionadas (ERS):** RN-001, RN-010, RN-012, RN-013, RN-014, RN-015, RN-016, RN-017, RN-018
- **RNFs relacionados (ERS):** RNF-005, RNF-007, RNF-010, RNF-011, RNF-015, RNF-017

## 2. Objetivo

Exibir a situacao consolidada da carteira selecionada, incluindo custo de aquisicao, valor atual, P&L, rentabilidade, alocacao, maior posicao, evolucao do custo e proventos.

## 3. Escopo desta ESPEC

**Inclui:**

- Seletor de carteira na tela inicial.
- Indicadores e tabelas do MVP, sem graficos obrigatorios.
- Valor total, segmentacao por categoria e detalhe por ativo.
- Evolucao do custo de aquisicao por mes ou ano.
- Total de proventos com filtros.
- Uso de cotacao atual diaria dos ativos referenciados.

**Nao inclui:**

- Atualizacao de cotacao sob demanda.
- Historico de cotacoes.
- Evolucao historica do valor de mercado.
- Graficos, fora do MVP.
- Visao consolidada somando todas as carteiras.

## 4. Atores

- **Investidor Pessoa Fisica** — consulta indicadores da carteira selecionada.

## 5. Casos de Uso / User Stories

- **US-01:** Como investidor, eu quero alternar a carteira no dashboard, para ver dados da carteira escolhida. *(RF-027)*
- **US-02:** Como investidor, eu quero ver custo, valor atual, P&L e rentabilidade, para avaliar a carteira. *(RF-028)*
- **US-03:** Como investidor, eu quero ver alocacao por categoria e ativo, para entender concentracao. *(RF-029, RF-030, RF-031, RF-035)*
- **US-04:** Como investidor, eu quero ver evolucao do custo de aquisicao, para acompanhar aportes e vendas ao longo do tempo. *(RF-032)*
- **US-05:** Como investidor, eu quero ver proventos filtrados, para analisar recebimentos no periodo. *(RF-033)*

## 6. Fluxo Principal

### 6.1 Visualizar dashboard

1. O usuario autenticado acessa a tela inicial.
2. O sistema exibe seletor com carteiras do usuario.
3. O usuario seleciona uma carteira.
4. O sistema carrega posicoes materializadas, cotações atuais e proventos da carteira.
5. O sistema calcula indicadores e tabelas.
6. O sistema exibe data de referencia da cotacao e sinalizacao quando usar ultima cotacao valida anterior.

### 6.2 Evolucao do custo de aquisicao

1. O usuario seleciona granularidade mensal ou anual.
2. O sistema reconstroi o custo historico ao final de cada competencia.
3. O sistema exibe valores por indicadores ou tabelas.

### 6.3 Proventos no dashboard

1. O usuario seleciona carteira, categoria, ativo e periodo.
2. O sistema soma proventos registrados pelo usuario.
3. O sistema exibe o total filtrado.

## 7. Fluxos Alternativos e Excecoes

- **Cenario:** Carteira sem ativos
  - **Comportamento esperado:** Exibir indicadores zerados ou indisponiveis conforme regra de calculo.
- **Cenario:** Ativo sem cotacao valida
  - **Comportamento esperado:** Nao substituir por zero; sinalizar ausencia ou desatualizacao conforme integracao.
- **Cenario:** Custo total igual a zero
  - **Comportamento esperado:** Rentabilidade percentual deve ser apresentada como indisponivel.
- **Cenario:** API de cotacoes indisponivel
  - **Comportamento esperado:** Usar ultima cotacao valida e exibir data/hora da ultima atualizacao.

## 8. Especificacao de Campos e Filtros

- **Campo:** Carteira selecionada
  - **Tipo:** Referencia
  - **Obrigatorio:** Sim
  - **Regras de Validacao:** Deve pertencer ao usuario autenticado.

- **Campo:** Categoria
  - **Tipo:** Enum/filtro
  - **Obrigatorio:** Nao
  - **Valores permitidos:** `ACAO`, `FII`

- **Campo:** Ativo
  - **Tipo:** Referencia/filtro
  - **Obrigatorio:** Nao
  - **Regras de Validacao:** Deve pertencer aos dados da carteira selecionada quando usado como filtro.

- **Campo:** Periodo
  - **Tipo:** Intervalo de datas ou competencia
  - **Obrigatorio:** Conforme consulta.
  - **Regras de Validacao:** Formato pt-BR na interface.

- **Campo:** Granularidade da evolucao
  - **Tipo:** Enum
  - **Valores permitidos:** `MES`, `ANO`

## 9. Regras de Negocio Aplicaveis

### 9.1 Regras de Negocio e Calculo

- **RN-010:** Valor atual usa ultima cotacao disponivel e exibe data de referencia.
  - **Formula:** `valor_atual = quantidade_atual * ultima_cotacao_valida`

- **RN-014:** P&L e valor atual menos custo total.
  - **Formula:** `pnl = valor_atual - custo_total`

- **RN-015:** Rentabilidade nao inclui proventos.
  - **Formula:** `rentabilidade = (pnl / custo_total) * 100`
  - **Caso de borda:** Se `custo_total == 0`, apresentar indisponivel.

- **RF-030:** Alocacao por categoria.
  - **Formula:** `percentual_categoria = valor_atual_categoria / valor_atual_total * 100`

- **RF-031:** Alocacao por ativo.
  - **Formula:** `percentual_ativo = valor_atual_ativo / valor_atual_total * 100`

- **RN-013:** Evolucao mensal usa custo historico ao final do ultimo dia da competencia.
- **RN-016:** Evolucao anual usa o custo ao final da ultima competencia mensal disponivel no ano, nao media nem soma.
- **RN-017/RN-018:** Job diario consulta somente ativos referenciados em carteiras, um ticker por chamada.
- **RN-012:** Preservar precisao decimal e arredondar apenas na resposta/exibicao.

### 9.2 Efeitos em Outras Entidades

- **Entidade afetada:** Nenhuma entidade transacional
  - **O que muda:** Dashboard apenas consulta e calcula apresentacao.

- **Entidade afetada:** `cotacao_atual`
  - **O que muda:** Atualizacao ocorre por job externo ao dashboard, mas seus dados alimentam a visualizacao.

## 10. Interface do Usuario

- Dashboard como tela inicial apos login.
- Seletor de carteira sempre visivel na tela inicial.
- Indicadores/tabelas para valor total, custo, P&L, rentabilidade, categoria, ativo, maior posicao e proventos.
- Exibir datas no formato `dd/mm/aaaa` e valores monetarios no formato brasileiro.
- MVP apresenta indicadores ou tabelas; graficos nao sao obrigatorios.

## 11. Criterios de Aceitacao

- **Dado** usuario com mais de uma carteira, **quando** alternar a carteira selecionada, **entao** todos os indicadores devem refletir a carteira escolhida.
- **Dado** ativo com cotacao valida, **quando** o dashboard carregar, **entao** o valor atual deve ser quantidade atual multiplicada pela ultima cotacao.
- **Dado** custo total zero, **quando** calcular rentabilidade, **entao** o sistema deve apresentar rentabilidade indisponivel.
- **Dado** dados de custo em varios meses, **quando** exibir evolucao mensal, **entao** cada competencia deve usar o custo ao final do ultimo dia do mes.
- **Dado** evolucao anual, **quando** o sistema calcular o ano, **entao** deve usar a ultima competencia mensal disponivel daquele ano.
- **Dado** cotacao desatualizada, **quando** exibir valor atual, **entao** o sistema deve mostrar a data/hora da ultima cotacao valida.

## 12. Dependencias

- ESPEC-02 - Carteiras.
- ESPEC-03 - Operacoes.
- ESPEC-04 - Proventos.
- ESPEC-05 - Bonificacoes.
- ESPEC-06 - Eventos Corporativos.
- ESPEC-09 - Catalogo de Ativos.
- Integracao Brapi para cotacoes.

## 13. Referencias

- [ERS](../ers.md)
- [Escopo MVP](../escopo_mvp.md)
- [Modelo de Dados](../../arquitetura/modelo_dados.md)
- [Integracao Brapi](../../integracoes/integracao_api_bolsa_brasil.md)

## Contexto para IA

### Objetivo

Implementar dashboard consultivo da carteira selecionada com calculos financeiros definidos no ERS.

### Casos de borda criticos

- Cotacao ausente nunca vira zero.
- Rentabilidade indisponivel quando custo total e zero.
- Evolucao anual nao e media nem soma de meses.
- Nao calcular preco medio.

### Observacoes

- A regra temporal exata para classificar cotacao como desatualizada esta pendente no documento de integracao.
