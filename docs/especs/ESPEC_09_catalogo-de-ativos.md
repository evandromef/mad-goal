# ESPEC 09 - Catálogo de Ativos

## 1. Identificação

- **ID:** ESPEC-09
- **Nome da Funcionalidade:** Catálogo de Ativos
- **Módulo/Área:** Ativos / Integração
- **Status:** Rascunho
- **Versão:** 1.0
- **RFs relacionados (ERS):** RF-041, RF-042, RF-043, RF-044
- **RNs relacionadas (ERS):** RN-008, RN-017, RN-018
- **RNFs relacionados (ERS):** RNF-015, RNF-017

## 2. Objetivo

Manter automaticamente a base de Ações e FIIs disponíveis para seleção no MAD, usando API externa de dados financeiros. O usuário não cadastra ativos manualmente; ele seleciona ativos previamente mantidos pelo sistema.

## 3. Escopo desta ESPEC

**Inclui:**

- Carga inicial do catálogo de ativos.
- Atualização periódica do catálogo.
- Disponibilização de ativos elegíveis para seleção em cadastros do usuário.
- Tratamento de ativos indisponíveis, ausentes ou inválidos na resposta da API externa.

**Não inclui:**

- Atualização diária de cotações, coberta pelo RF-034 e pelo documento de integração.
- Cadastro manual de ativos pelo usuário, fora do escopo do ERS.
- Suporte a BDRs, ETFs, Renda Fixa, Cripto ou outros ativos fora do MVP.
- Registro automático de operações, proventos, bonificações ou eventos corporativos.

## 4. Atores

- **Investidor Pessoa Física** — utiliza o catálogo ao selecionar ativos em operações, proventos, bonificações, eventos corporativos e consultas.
- **Sistema** — executa a carga inicial e a atualização periódica do catálogo.

## 5. Casos de Uso / User Stories

- **US-01:** Como sistema, eu quero executar a carga inicial de Ações e FIIs a partir da API externa, para que o usuário tenha ativos disponíveis para seleção. *(RF-042)*
- **US-02:** Como sistema, eu quero atualizar periodicamente o catálogo de ativos, para incluir novos ativos e refletir alterações cadastrais vindas da API externa. *(RF-043)*
- **US-03:** Como investidor, eu quero selecionar ativos existentes no catálogo ao cadastrar lançamentos, para evitar digitação livre e inconsistência de tickers. *(RF-044)*
- **US-04:** Como sistema, eu quero preservar ativos já referenciados em carteiras mesmo que fiquem indisponíveis na API externa, para manter a integridade histórica dos dados do usuário. *(RN-008)*

## 6. Fluxo Principal

### 6.1 Carga Inicial do Catálogo

1. O sistema inicia a rotina de carga inicial do catálogo.
2. O sistema consulta a API externa de dados financeiros.
3. O sistema filtra apenas ativos compatíveis com o escopo do MVP: Ações e FIIs.
4. O sistema normaliza os tickers em maiúsculas.
5. O sistema valida os campos mínimos de cada item retornado.
6. O sistema cadastra os ativos válidos que ainda não existem no banco.
7. O sistema registra o resultado da carga, incluindo quantidade de ativos criados, itens rejeitados e eventuais falhas.

### 6.2 Atualização Periódica do Catálogo

1. O sistema inicia a rotina periódica de atualização do catálogo.
2. O sistema consulta a API externa de dados financeiros.
3. O sistema compara os ativos retornados com o catálogo existente.
4. O sistema cadastra novos ativos válidos.
5. O sistema atualiza dados cadastrais de ativos existentes quando houver alteração válida.
6. O sistema marca como indisponíveis para novas seleções os ativos que deixarem de ser elegíveis.
7. O sistema preserva ativos já referenciados em carteiras, sem exclusão física automática.

### 6.3 Seleção de Ativo pelo Usuário

1. O usuário acessa um formulário que exige ativo.
2. O sistema exibe campo de busca/seleção baseado no catálogo de ativos.
3. O usuário pesquisa por ticker ou nome.
4. O sistema lista somente ativos elegíveis para nova seleção.
5. O usuário seleciona um ativo.
6. O sistema vincula o registro do usuário ao ativo selecionado no catálogo.

## 7. Fluxos Alternativos e Exceções

- **Cenário:** API externa indisponível na carga inicial
  - **Comportamento esperado:** O sistema registra a falha e não cria ativos incompletos ou fictícios.

- **Cenário:** API externa indisponível na atualização periódica
  - **Comportamento esperado:** O sistema mantém o catálogo anterior e registra falha operacional.

- **Cenário:** Item retornado sem ticker
  - **Comportamento esperado:** O sistema rejeita o item e segue processando os demais.

- **Cenário:** Item retornado com categoria fora do escopo
  - **Comportamento esperado:** O sistema ignora o item para o MVP.

- **Cenário:** Ativo já usado em carteira deixa de aparecer na API externa
  - **Comportamento esperado:** O sistema preserva o ativo, marca-o como indisponível para novas seleções quando aplicável e mantém todos os vínculos históricos.

- **Cenário:** Usuário tenta informar ticker livremente
  - **Comportamento esperado:** O sistema bloqueia a digitação livre como cadastro de ativo e exige seleção de ativo existente no catálogo.

## 8. Especificação de Campos

- **Campo:** Ticker
  - **Tipo:** Texto
  - **Obrigatório:** Sim
  - **Regras de Validação:** Normalizado em maiúsculas; único no catálogo; sem espaços antes ou depois.
  - **Valor Mínimo:** 1 caractere
  - **Valor Máximo:** 20 caracteres
  - **Mensagem de Erro (exemplo):** "Ticker inválido ou indisponível."

- **Campo:** Nome
  - **Tipo:** Texto
  - **Obrigatório:** Sim
  - **Regras de Validação:** Deve conter nome suficiente para identificação do ativo.
  - **Valor Mínimo:** 1 caractere
  - **Valor Máximo:** 255 caracteres
  - **Mensagem de Erro (exemplo):** "Nome do ativo inválido."

- **Campo:** Categoria
  - **Tipo:** Enum
  - **Obrigatório:** Sim
  - **Valores permitidos:** `ACAO`, `FII`
  - **Mensagem de Erro (exemplo):** "Categoria de ativo fora do escopo do sistema."

- **Campo:** Status de negociação
  - **Tipo:** Enum ou texto controlado
  - **Obrigatório:** Não, quando o provedor não informar
  - **Regras de Validação:** Deve ser mapeado para status interno documentado no modelo de dados.
  - **Mensagem de Erro (exemplo):** "Status de negociação inválido."

- **Campo:** Disponível para seleção
  - **Tipo:** Booleano
  - **Obrigatório:** Sim
  - **Regras de Validação:** Ativos indisponíveis não aparecem para novos lançamentos, mas continuam disponíveis para histórico e consulta quando já referenciados.

## 9. Regras de Negócio Aplicáveis

### 9.1 Regras de Negócio

- **RN-008 [Cadastro de Ativos]:** O usuário não cadastra ativos manualmente. O catálogo é mantido pelo sistema a partir da API externa.
  - **Pseudocódigo:**

    ```text
    se formulario_exige_ativo:
        permitir somente selecao_de_ativo_existente_no_catalogo
        bloquear cadastro_livre_de_ticker
    ```

- **RN-017 [Escopo da Atualização de Cotações]:** A atualização diária de cotações usa apenas ativos referenciados em carteiras, não todos os ativos do catálogo.
  - **Pseudocódigo:**

    ```text
    tickers_para_cotacao = buscar_tickers_distintos_com_vinculo_em_carteiras()
    excluir tickers_existentes_apenas_no_catalogo
    ```

- **RN-018 [Consulta Unitária de Cotações]:** A atualização diária de cotações consulta um ativo por requisição, sem agrupar múltiplos tickers.
  - **Pseudocódigo:**

    ```text
    para cada ticker em tickers_para_cotacao:
        consultar_cotacao(symbols = ticker)
    ```

### 9.2 Efeitos em Outras Entidades

- **Entidade afetada:** Ativo
  - **O que muda:** Criação ou atualização cadastral do ativo no catálogo.
  - **Quando:** Na carga inicial e na atualização periódica.
  - **Regra:** RF-041, RF-042, RF-043 e RN-008.

- **Entidade afetada:** Operações, proventos, bonificações e eventos corporativos
  - **O que muda:** Esses registros devem referenciar um ativo existente no catálogo.
  - **Quando:** Em todo cadastro ou edição que permita selecionar ativo.
  - **Regra:** RF-044.

- **Entidade afetada:** Cotação atual
  - **O que muda:** Nada diretamente pela atualização do catálogo. Cotações continuam sendo atualizadas por rotina própria.
  - **Quando:** A rotina diária de cotações usa somente ativos referenciados em carteiras.
  - **Regra:** RN-017.

## 10. Interface do Usuário

- Formulários que exigem ativo devem usar campo de busca/seleção baseado no catálogo.
- A busca deve permitir localizar por ticker ou nome.
- O resultado deve exibir, no mínimo, ticker, nome e categoria.
- Ativos indisponíveis para nova seleção não devem aparecer nos resultados de novos lançamentos.
- Registros históricos que já referenciam um ativo indisponível devem continuar exibindo ticker e nome.

## 11. Critérios de Aceitação

- **Dado** que o catálogo está vazio, **quando** a carga inicial receber Ações e FIIs válidos da API externa, **então** o sistema deve cadastrá-los com ticker, nome, categoria e disponibilidade cadastral.
- **Dado** que a API externa retorne ativo fora do escopo do MVP, **quando** a carga for processada, **então** o sistema deve ignorar esse ativo.
- **Dado** que um ativo novo seja retornado em atualização periódica, **quando** o job executar com sucesso, **então** o ativo deve ser incluído no catálogo.
- **Dado** que um ativo existente tenha nome ou status alterado na API externa, **quando** o job executar com sucesso, **então** o catálogo deve refletir a alteração válida.
- **Dado** que um ativo já referenciado em carteira deixe de estar disponível para novas seleções, **quando** o catálogo for atualizado, **então** o sistema deve preservar o ativo e seus vínculos históricos.
- **Dado** que o usuário esteja cadastrando uma operação, **quando** selecionar o ativo, **então** o sistema deve permitir apenas ativos existentes e disponíveis no catálogo.
- **Dado** que um ativo exista apenas no catálogo e não esteja referenciado em carteiras, **quando** a rotina diária de cotações executar, **então** esse ativo não deve ser consultado para cotação.

## 12. Dependências

- Documento de Integração com API da Bolsa de Valores do Brasil.
- Modelo de Dados com entidade `ativo`.
- ESPECs que possuem seleção de ativo: operações, proventos, bonificações, eventos corporativos e detalhe do ativo.

## 13. Referências

- [ERS - Especificação de Requisitos de Sistema](../ers.md)
- [Integração com API da Bolsa de Valores do Brasil](../../integracoes/integracao_api_bolsa_brasil.md)
- [Modelo de Dados](../../arquitetura/modelo_dados.md)
- [ADR-004 - Provedor de Dados da Bolsa de Valores Brasil](../../arquitetura/adr/adr-004-provedor-cotacoes.md)

------------------------------------------------------------------------

## Contexto para IA

### Objetivo

Implementar um catálogo mestre de Ações e FIIs mantido por API externa, impedindo cadastro manual de ativos pelo usuário.

### Dependências

- Entidade `ativo`
- Cliente de integração com API da Bolsa de Valores Brasil
- Formulários que selecionam ativo

### Ordem de validação dos campos

1. Validar presença do ticker.
2. Normalizar ticker.
3. Validar categoria permitida.
4. Validar nome.
5. Validar duplicidade por ticker.
6. Definir disponibilidade cadastral.

### Regras que devem ser respeitadas

- RN-008: usuário não cadastra ativo manualmente.
- RN-017: cotação diária consulta apenas ativos referenciados em carteiras.
- RN-018: cotação diária consulta um ativo por requisição.
- Ativo referenciado historicamente não deve ser excluído fisicamente por ausência no provedor.

### Casos de borda críticos

- API externa fora do ar.
- Item de catálogo inválido.
- Ativo removido ou suspenso pelo provedor.
- Ticker retornado com caixa ou espaços diferentes.
- Ativo presente no catálogo, mas sem vínculo com carteira.

### Critérios de Aceitação

Ver seção 11.

------------------------------------------------------------------------

## Checklist de Implementação

- [ ] Modelo de dados criado/alterado conforme seção 8 e documento de arquitetura.
- [ ] Cliente de integração com API da Bolsa Brasil implementado.
- [ ] Carga inicial do catálogo implementada.
- [ ] Atualização periódica do catálogo implementada.
- [ ] Regras de inativação/preservação histórica implementadas.
- [ ] Seleção de ativo por catálogo aplicada aos formulários dependentes.
- [ ] Rotina diária de cotações filtrando apenas ativos referenciados em carteiras.
- [ ] Rotina diária de cotações consultando um ativo por requisição.
- [ ] Testes unitários cobrindo normalização, validação e inativação de ativos.
- [ ] Testes de integração cobrindo carga inicial e atualização periódica.
- [ ] Testes end-to-end cobrindo seleção de ativo em formulário de lançamento.
- [ ] Cobertura mínima de 80% atingida (RNF-017).
