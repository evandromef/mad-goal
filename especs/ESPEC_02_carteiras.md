# ESPEC 02 - Cadastro e Gestao de Carteiras

## 1. Identificacao

- **ID:** ESPEC-02
- **Nome da Funcionalidade:** Cadastro e Gestao de Carteiras
- **Modulo/Area:** Carteiras
- **Status:** Rascunho
- **Versao:** 1.0
- **RFs relacionados (ERS):** RF-006, RF-007, RF-008, RF-009, RF-027
- **RNs relacionadas (ERS):** RN-009, RN-010, RN-012, RN-014, RN-015
- **RNFs relacionados (ERS):** RNF-005, RNF-007, RNF-010, RNF-012, RNF-013, RNF-016, RNF-017

## 2. Objetivo

Permitir que o usuario organize seus ativos em uma ou mais carteiras, mantendo nomes unicos por usuario e exibindo valor atual consolidado para cada carteira.

## 3. Escopo desta ESPEC

**Inclui:**

- Criacao de carteiras.
- Edicao de nome.
- Exclusao de carteira com confirmacao explicita quando houver registros vinculados.
- Listagem de carteiras com nome e valor atual consolidado.
- Uso da carteira selecionada como contexto do dashboard.

**Nao inclui:**

- Cadastro de operacoes, proventos, bonificacoes ou eventos.
- Visao consolidada somando todas as carteiras, fora do MVP.

## 4. Atores

- **Investidor Pessoa Fisica** — cria e administra suas proprias carteiras.

## 5. Casos de Uso / User Stories

- **US-01:** Como investidor, eu quero criar carteiras, para separar objetivos ou estrategias. *(RF-006)*
- **US-02:** Como investidor, eu quero renomear uma carteira, para manter sua identificacao atualizada. *(RF-007)*
- **US-03:** Como investidor, eu quero excluir uma carteira, para remover um conjunto de registros que nao desejo manter. *(RF-008, RN-009)*
- **US-04:** Como investidor, eu quero listar minhas carteiras com valor atual, para escolher qual consultar. *(RF-009, RF-027)*

## 6. Fluxo Principal

### 6.1 Criar carteira

1. O usuario acessa o cadastro de carteira.
2. O usuario informa nome.
3. O sistema valida obrigatoriedade e unicidade por usuario.
4. O sistema cria a carteira.
5. O sistema exibe confirmacao.

### 6.2 Editar carteira

1. O usuario seleciona uma carteira propria.
2. O usuario altera o nome.
3. O sistema valida obrigatoriedade e unicidade por usuario.
4. O sistema atualiza a carteira.

### 6.3 Excluir carteira

1. O usuario solicita excluir uma carteira propria.
2. O sistema verifica se existem operacoes, proventos, bonificacoes, eventos, notas ou posicoes vinculadas.
3. Se houver vinculos, o sistema solicita confirmacao explicita de exclusao em cascata.
4. O usuario confirma.
5. O sistema exclui a carteira e seus registros vinculados na mesma transacao.

### 6.4 Listar carteiras

1. O usuario acessa a area de carteiras ou o seletor da tela inicial.
2. O sistema lista apenas carteiras do usuario autenticado.
3. O sistema exibe nome e valor atual consolidado de cada carteira.

## 7. Fluxos Alternativos e Excecoes

- **Cenario:** Nome nao informado
  - **Comportamento esperado:** Bloquear gravacao e exibir erro junto ao campo.
- **Cenario:** Nome duplicado para o mesmo usuario
  - **Comportamento esperado:** Bloquear gravacao.
- **Cenario:** Usuario cancela confirmacao de exclusao
  - **Comportamento esperado:** Nenhum registro e excluido.
- **Cenario:** Usuario tenta acessar carteira de outro usuario
  - **Comportamento esperado:** Negar acesso.

## 8. Especificacao de Campos

- **Campo:** Nome
  - **Tipo:** Texto
  - **Obrigatorio:** Sim
  - **Regras de Validacao:** Unico por usuario; nao vazio.
  - **Valor Maximo:** Nao definido explicitamente na documentacao atual.
  - **Mensagem de Erro:** "Informe um nome de carteira unico."

## 9. Regras de Negocio Aplicaveis

### 9.1 Regras de Negocio e Calculo

- **RN-009:** Carteira com registros vinculados so pode ser excluida mediante confirmacao explicita.
- **RN-010:** Valor atual usa a ultima cotacao disponivel de cada ativo.
  - **Formula:**

    ```text
    valor_atual_ativo = quantidade_atual * ultima_cotacao_valida
    valor_atual_carteira = soma(valor_atual_ativo)
    ```

- **RN-014:** P&L consolidado e soma dos P&Ls dos ativos.
- **RN-015:** Rentabilidade e P&L dividido pelo custo de aquisicao total; se custo total for zero, apresentar indisponivel.
- **RN-012:** Nao arredondar valores monetarios durante processamento; arredondar para duas casas apenas na exibicao ou resposta.

### 9.2 Efeitos em Outras Entidades

- **Entidade afetada:** Lancamentos, notas e posicao da carteira
  - **O que muda:** Remocao fisica em cascata somente apos confirmacao explicita.
  - **Quando:** Exclusao de carteira.

- **Entidade afetada:** Dashboard
  - **O que muda:** Carteira selecionada define os dados apresentados.
  - **Quando:** Listagem e selecao da carteira.

## 10. Interface do Usuario

- Tela/listagem de carteiras com nome e valor atual consolidado.
- Formulario simples para nome da carteira.
- Acao de exclusao com confirmacao explicita quando houver registros vinculados.
- Seletor de carteira disponivel na tela inicial apos login.

## 11. Criterios de Aceitacao

- **Dado** um usuario autenticado, **quando** criar carteira com nome unico, **entao** a carteira deve ficar disponivel na listagem.
- **Dado** uma carteira existente, **quando** o usuario alterar o nome para outro nome unico, **entao** o sistema deve atualizar a carteira.
- **Dado** uma carteira com registros vinculados, **quando** o usuario solicitar exclusao, **entao** o sistema deve exigir confirmacao explicita.
- **Dado** que o usuario cancele a confirmacao, **quando** voltar a listagem, **entao** a carteira e seus registros devem permanecer.
- **Dado** carteiras de usuarios diferentes, **quando** um usuario listar carteiras, **entao** apenas as suas carteiras devem aparecer.

## 12. Dependencias

- ESPEC-01 - Conta e Acesso do Usuario.
- Entidade `carteira` no modelo de dados.
- Cotacoes e posicoes para exibicao de valor atual consolidado.

## 13. Referencias

- [ERS](../ers.md)
- [Escopo MVP](../escopo_mvp.md)
- [Modelo de Dados](../../arquitetura/modelo_dados.md)

## Contexto para IA

### Objetivo

Implementar CRUD de carteiras com isolamento por usuario, nome unico e exclusao confirmada em cascata.

### Casos de borda criticos

- Nome duplicado por usuario.
- Exclusao com vinculos.
- Tentativa de acesso a carteira de outro usuario.
- Carteira sem ativos deve exibir valor atual consolidado como zero.
