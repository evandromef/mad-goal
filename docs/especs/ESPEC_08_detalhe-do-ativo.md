# ESPEC 08 - Historico e Detalhamento do Ativo

## 1. Identificacao

- **ID:** ESPEC-08
- **Nome da Funcionalidade:** Historico e Detalhamento do Ativo
- **Modulo/Area:** Ativos / Historicos / Notas
- **Status:** Rascunho
- **Versao:** 1.0
- **RFs relacionados (ERS):** RF-036, RF-037, RF-038, RF-039, RF-040
- **RNs relacionadas (ERS):** RN-001, RN-010, RN-012, RN-014, RN-015
- **RNFs relacionados (ERS):** RNF-005, RNF-010, RNF-013, RNF-017

## 2. Objetivo

Disponibilizar uma tela de detalhe para cada ativo de uma carteira, reunindo posicao atual, cotacao, indicadores, historicos, acoes contextuais e notas pessoais.

## 3. Escopo desta ESPEC

**Inclui:**

- Historico de operacoes por ativo.
- Historico consolidado de operacoes, eventos corporativos e bonificacoes.
- Detalhe do ativo com quantidade, Custo de Aquisicao Total, cotacao, P&L, rentabilidade e alocacao.
- Acoes contextuais para registrar operacao, evento, bonificacao e provento com carteira/ativo pre-preenchidos.
- CRUD de notas pessoais vinculadas ao ativo de uma carteira.

**Nao inclui:**

- Historico de cotacoes.
- Calculo ou exibicao de preco medio.
- Compartilhamento de notas.

## 4. Atores

- **Investidor Pessoa Fisica** — consulta detalhe e historicos, inicia lancamentos e mantem notas pessoais.

## 5. Casos de Uso / User Stories

- **US-01:** Como investidor, eu quero ver historico de operacoes por ativo, para auditar compras, vendas e subscricoes. *(RF-036)*
- **US-02:** Como investidor, eu quero ver historico consolidado de eventos do ativo, para entender alteracoes de quantidade. *(RF-037)*
- **US-03:** Como investidor, eu quero ver detalhe completo do ativo, para avaliar minha posicao. *(RF-038)*
- **US-04:** Como investidor, eu quero iniciar cadastros pelo detalhe do ativo, para registrar eventos com contexto preenchido. *(RF-039)*
- **US-05:** Como investidor, eu quero criar notas pessoais por ativo, para registrar teses e observacoes. *(RF-040)*

## 6. Fluxo Principal

### 6.1 Consultar detalhe do ativo

1. O usuario acessa um ativo a partir da carteira selecionada.
2. O sistema valida que a carteira pertence ao usuario.
3. O sistema carrega posicao, cotacao atual, operacoes, eventos, bonificacoes, proventos e notas vinculados ao ativo.
4. O sistema calcula P&L, rentabilidade e percentual de alocacao.
5. O sistema exibe os dados em tela.

### 6.2 Consultar historicos

1. O usuario acessa a area de historicos do detalhe.
2. O sistema exibe operacoes de compra, venda e subscricao.
3. O sistema exibe historico consolidado de operacoes, desdobramentos, grupamentos e bonificacoes em ordem cronologica.
4. O usuario filtra por operacao, evento ou bonificacao.

### 6.3 Acoes contextuais

1. O usuario aciona registrar operacao, evento corporativo, bonificacao ou provento.
2. O sistema abre o formulario correspondente com carteira e ativo preenchidos.
3. O usuario conclui o fluxo da ESPEC correspondente.

### 6.4 Notas pessoais

1. O usuario cria, edita, consulta ou exclui nota pessoal do ativo.
2. O sistema valida propriedade da carteira e ativo.
3. O sistema persiste a nota com auditoria temporal.

## 7. Fluxos Alternativos e Excecoes

- **Cenario:** Ativo nao pertence a carteira selecionada
  - **Comportamento esperado:** Negar acesso ao detalhe.
- **Cenario:** Cotacao ausente
  - **Comportamento esperado:** Exibir ausencia de cotacao sem usar valor zero como substituto.
- **Cenario:** Custo total igual a zero
  - **Comportamento esperado:** Rentabilidade percentual indisponivel.
- **Cenario:** Usuario tenta acessar nota de outro usuario
  - **Comportamento esperado:** Negar acesso.

## 8. Especificacao de Campos

- **Campo:** Carteira
  - **Tipo:** Referencia
  - **Obrigatorio:** Sim
  - **Regras de Validacao:** Deve pertencer ao usuario autenticado.

- **Campo:** Ativo
  - **Tipo:** Referencia
  - **Obrigatorio:** Sim
  - **Regras de Validacao:** Deve estar vinculado a carteira por operacao, provento, bonificacao, evento, nota ou posicao.

- **Campo:** Conteudo da nota
  - **Tipo:** Texto
  - **Obrigatorio:** Sim para criacao/edicao de nota.
  - **Valor Maximo:** Nao definido explicitamente na documentacao atual.

- **Campo:** Filtro de historico
  - **Tipo:** Enum
  - **Obrigatorio:** Nao
  - **Valores permitidos:** Operacao, Evento Corporativo, Bonificacao, conforme RF-037.

## 9. Regras de Negocio Aplicaveis

### 9.1 Regras de Negocio e Calculo

- **RN-001:** Nao calcular nem exibir preco medio.
- **RN-010:** Valor atual usa ultima cotacao disponivel e sinaliza data de referencia.
  - **Formula:** `valor_atual = quantidade_atual * ultima_cotacao_valida`

- **RN-014:** P&L do ativo e valor atual menos Custo de Aquisicao Total.
  - **Formula:** `pnl = valor_atual - custo_total`

- **RN-015:** Rentabilidade e P&L dividido pelo Custo de Aquisicao Total, sem incluir proventos.
  - **Formula:** `rentabilidade = (pnl / custo_total) * 100`
  - **Caso de borda:** Se `custo_total == 0`, apresentar indisponivel.

- **RN-012:** Preservar precisao decimal e arredondar apenas na resposta/exibicao.

### 9.2 Efeitos em Outras Entidades

- **Entidade afetada:** Formularios de operacao, provento, bonificacao e evento
  - **O que muda:** Sao abertos com carteira e ativo pre-preenchidos.
  - **Quando:** Acoes contextuais do detalhe.

- **Entidade afetada:** `nota_ativo`
  - **O que muda:** Criacao, edicao ou exclusao de conteudo pessoal.
  - **Quando:** CRUD de notas.

## 10. Interface do Usuario

- Tela de detalhe por ativo dentro de uma carteira.
- Bloco de indicadores: quantidade, custo total, cotacao, data da cotacao, valor atual, P&L, rentabilidade e percentual de alocacao.
- Abas ou secoes para operacoes, eventos/bonificacoes, proventos e notas.
- Acoes contextuais para novos registros relacionados ao ativo.

## 11. Criterios de Aceitacao

- **Dado** ativo em carteira, **quando** o usuario abrir o detalhe, **entao** o sistema deve exibir quantidade atual, custo total, cotacao, P&L, rentabilidade e alocacao.
- **Dado** ativo com custo total zero, **quando** calcular rentabilidade, **entao** o sistema deve apresentar rentabilidade indisponivel.
- **Dado** historico com operacoes e eventos, **quando** o usuario consultar historico consolidado, **entao** os registros devem aparecer em ordem cronologica.
- **Dado** detalhe de ativo aberto, **quando** o usuario iniciar cadastro de provento, **entao** o formulario deve abrir com carteira e ativo preenchidos.
- **Dado** nota pessoal criada, **quando** o usuario retornar ao detalhe, **entao** a nota deve estar vinculada somente ao ativo daquela carteira.

## 12. Dependencias

- ESPEC-02 - Carteiras.
- ESPEC-03 - Operacoes.
- ESPEC-04 - Proventos.
- ESPEC-05 - Bonificacoes.
- ESPEC-06 - Eventos Corporativos.
- ESPEC-07 - Dashboard.
- ESPEC-09 - Catalogo de Ativos.

## 13. Referencias

- [ERS](../ers.md)
- [Escopo MVP](../escopo_mvp.md)
- [Modelo de Dados](../../arquitetura/modelo_dados.md)

## Contexto para IA

### Objetivo

Implementar tela consultiva e operacional por ativo da carteira, incluindo notas pessoais.

### Casos de borda criticos

- Ativo sem cotacao valida.
- Custo total zero.
- Isolamento de notas e historicos por usuario.
- Acoes contextuais nao devem permitir trocar para carteira/ativo de outro usuario.
