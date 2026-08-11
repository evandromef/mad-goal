# ESPEC [Número] - [Nome da Funcionalidade]

> **Como usar este template:** copie este arquivo para `especs/ESPEC_0X_nome-da-funcionalidade.md`, preencha cada seção e remova os comentários em itálico de orientação. Cada ESPEC deve ser autocontida — um desenvolvedor ou agente de IA deve conseguir implementar a funcionalidade lendo apenas este arquivo + o ERS + o documento de arquitetura (quando referenciado na seção 13).
>
> **Sub-fluxos:** se a funcionalidade cobrir mais de uma variação de uma mesma ação (ex.: compra/venda/subscrição; desdobramento/grupamento), duplique as seções 6, 8 e 9.x para cada sub-fluxo, identificando claramente qual RF/RN cada bloco cobre. Não tente descrever variações diferentes em um único fluxo genérico.

## 1. Identificação

- **ID:** ESPEC-0X
- **Nome da Funcionalidade:**
- **Módulo/Área:** *(ex.: Conta, Carteira, Operações, Proventos, Bonificações, Eventos Corporativos, Dashboard)*
- **Status:** *(Rascunho / Em revisão / Aprovada / Implementada)*
- **Versão:** 1.0
- **RFs relacionados (ERS):** *(ex.: RF-010, RF-011, RF-012)*
- **RNs relacionadas (ERS):** *(ex.: RN-002, RN-003)*
- **RNFs relacionados (ERS):** *(ex.: RNF-012, RNF-017)*

## 2. Objetivo

*Descreva em 1-3 frases o que esta funcionalidade permite ao usuário fazer e por quê. Foque no valor entregue, não na implementação.*

## 3. Escopo desta ESPEC

**Inclui:**

-

**Não inclui** *(referenciar o que está fora, ligando ao item correspondente do ERS quando aplicável)*:

-

## 4. Atores

- **Investidor Pessoa Física** — Único ator, conforme ERS seção 2.3.

## 5. Casos de Uso / User Stories

*Use o formato "Como [ator], eu quero [ação], para que [benefício]." Relacione cada história ao(s) RF(s) correspondente(s). Se houver sub-fluxos (ver nota no topo), crie uma US por sub-fluxo.*

**US-01:** Como investidor, eu quero [ação], para que [benefício]. *(RF-0XX)*

## 6. Fluxo Principal

*Descreva o caminho feliz, passo a passo, do ponto de vista do usuário. Se esta ESPEC cobre mais de um sub-fluxo (ex.: compra/venda/subscrição), repita este bloco por sub-fluxo, identificado por um subtítulo (### 6.1 Compra / ### 6.2 Venda / ...).*

### 6.1 [Nome do sub-fluxo, se aplicável]

1. O usuário acessa [tela/ponto de entrada].
2. O usuário informa [campos] (ver seção 8 — Especificação de Campos).
3. O usuário confirma a ação.
4. O sistema valida os dados informados (ver seção 8).
5. O sistema [efeito no sistema — o que é criado/atualizado/recalculado] (ver seção 9.2 — Efeitos em Outras Entidades).
6. O sistema exibe [confirmação/resultado] ao usuário.

## 7. Fluxos Alternativos e Exceções

- **Cenário:** Campo obrigatório não informado
  - **Comportamento esperado:** Sistema bloqueia o envio e exibe mensagem de erro junto ao campo.
- **Cenário:** Valor fora dos limites definidos (seção 8)
  - **Comportamento esperado:** Sistema bloqueia o envio e exibe mensagem de erro específica.
- **Cenário:** *(adicionar exceções específicas desta funcionalidade, ex.: venda maior que posição disponível — RN-003)*
  - **Comportamento esperado:**

## 8. Especificação de Campos

*Esta é a seção onde os limites de valores citados na RNF-016/017 do ERS devem ser detalhados, campo a campo, para esta funcionalidade. Se houver sub-fluxos com campos diferentes entre si, repita esta seção por sub-fluxo (### 8.1 Campos - Compra / ### 8.2 Campos - Venda / ...), já que campos obrigatórios e opcionais podem variar (ex.: venda exige valor total, compra exige custo total).*

- **Campo:** *(ex.: Quantidade)*
  - **Tipo:** Inteiro
  - **Obrigatório:** Sim
  - **Regras de Validação:** Maior que zero
  - **Valor Mínimo:** 1
  - **Valor Máximo:** 999.999.999
  - **Mensagem de Erro (exemplo):** "Quantidade deve ser maior que zero e no máximo 999.999.999."

- **Campo:** *(ex.: Preço Unitário)*
  - **Tipo:** Decimal (2 casas)
  - **Obrigatório:** Sim
  - **Regras de Validação:** Maior que zero
  - **Valor Mínimo:** 0,01
  - **Valor Máximo:** R$ 999.999,99
  - **Mensagem de Erro (exemplo):** "Preço deve ser maior que zero e no máximo R$ 999.999,99."

- **Campo:** *(ex.: Valor Total)*
  - **Tipo:** Decimal (2 casas)
  - **Obrigatório:** Calculado (Quantidade × Preço Unitário)
  - **Regras de Validação:** Resultado do cálculo não pode exceder o valor máximo
  - **Valor Mínimo:** -
  - **Valor Máximo:** R$ 999.999.999.999,99
  - **Mensagem de Erro (exemplo):** "Valor total da operação excede o limite permitido."

- **Campo:** *(ex.: Data)*
  - **Tipo:** Data
  - **Obrigatório:** Sim
  - **Regras de Validação:** Não anterior à data de criação da carteira (RN-008) *(atenção: RN-007 permite datas retroativas — confirmar qual regra se aplica a este campo antes de preencher)*
  - **Valor Mínimo:** -
  - **Valor Máximo:** Data atual
  - **Mensagem de Erro (exemplo):** "Data não pode ser anterior à criação da carteira."

## 9. Regras de Negócio Aplicáveis

### 9.1 Regras de Negócio e Cálculo

*Liste as RNs do ERS que se aplicam a esta funcionalidade. Para cada regra, informe: (a) uma frase de contexto de como ela se aplica especificamente aqui, e (b) sempre que a regra envolver cálculo, matemática, ou lógica condicional, a fórmula ou pseudocódigo explícito — não basta remeter ao texto do ERS. Isso é obrigatório para regras como RN-002, RN-013, RN-014, RN-015 e equivalentes.*

- **RN-0XX:** *(como essa regra afeta especificamente esta funcionalidade)*
  - **Fórmula/Pseudocódigo** *(se aplicável)*:

    ```
    exemplo:
    novo_custo_aquisicao = custo_aquisicao_atual - (custo_aquisicao_atual * quantidade_vendida / quantidade_total_antes_da_venda)
    ```

  - **Casos de borda:** *(ex.: divisão por zero, quantidade total = 0, custo de aquisição = 0)*

### 9.2 Efeitos em Outras Entidades

*Liste todo efeito colateral desta ação sobre outras entidades do sistema (carteira, ativo, posição materializada, posição histórica, etc.), já que estes recálculos automáticos (RF-014, RF-017, RF-022, RF-026 e equivalentes) não aparecem no Fluxo Principal, que é centrado na ótica do usuário.*

- **Entidade afetada:** *(ex.: Posição do ativo na carteira)*
  - **O que muda:** *(ex.: quantidade e custo de aquisição total recalculados)*
  - **Quando:** *(ex.: a cada cadastro/edição/exclusão desta operação)*
  - **Regra que rege o recálculo:** *(referência à seção 9.1)*

## 10. Interface do Usuário

*Descreva os elementos de tela em linguagem simples (não é necessário wireframe visual, mas pode incluir um se ajudar). Referencie a seção 5.1 do ERS para padrões visuais gerais.*

- Tela/Formulário:
- Campos exibidos:
- Ações disponíveis (botões):
- Comportamento responsivo relevante (se houver particularidade):

## 11. Critérios de Aceitação

*Escreva no formato Dado/Quando/Então (Gherkin), um por comportamento relevante, incluindo casos de borda e efeitos em outras entidades (seção 9.2). Estes critérios devem ser diretamente testáveis e mapeáveis 1:1 para testes automatizados (RNF-017).*

- **Dado** [contexto], **quando** [ação do usuário], **então** [resultado esperado].
- **Dado** [contexto de erro], **quando** [ação inválida], **então** [sistema deve bloquear e informar o motivo].
- **Dado** [contexto de efeito colateral], **quando** [ação válida], **então** [entidade relacionada deve refletir o recálculo esperado].

## 12. Dependências

*Outras ESPECs ou funcionalidades que precisam existir antes desta ser implementada.*

- ESPEC-0X - [nome] *(motivo da dependência)*

## 13. Referências

- ERS - Especificação de Requisitos de Sistema (MAD)
- Documento de Arquitetura (Stack) do Sistema *(referenciar se esta ESPEC depender de detalhes de modelo de dados, endpoints ou contratos de API definidos ali)*
- *(outras ESPECs relacionadas)*

------------------------------------------------------------------------

## Diagramas

### Diagrama de Caso de Uso

> Inserir diagrama UML. Preferencialmente em formato texto (ex.: Mermaid), para que também seja legível e processável por um agente de IA, não apenas por humanos visualizando a imagem.

### Diagrama de Sequência

> Inserir diagrama UML (Mermaid recomendado — ver nota acima).

------------------------------------------------------------------------

## Contexto para IA

*Esta seção não deve repetir o conteúdo das seções anteriores. Ela existe para consolidar, em formato compacto e sequencial, o que um agente de IA precisa ter "na cabeça" antes de codificar — útil quando a ESPEC é longa e o agente tem janela de contexto limitada.*

### Objetivo

*(resumo em 1 frase)*

### Dependências

*(lista seca, sem explicação — ex.: "ESPEC-02 implementada")*

### Ordem de validação dos campos

*(lista sequencial: qual validação roda primeiro, segunda, etc. — importante quando há validações que dependem de outras, ex.: validar formato antes de validar limite)*

### Regras que devem ser respeitadas

*(lista seca das RNs com uma linha cada — remeter à seção 9 para o detalhe)*

### Casos de borda críticos

*(lista seca dos casos de borda da seção 9.1, sem repetir a explicação completa)*

### Critérios de Aceitação

*(remeter à seção 11 — não duplicar aqui)*

### Observações

*(qualquer ambiguidade conhecida do ERS que ainda não foi resolvida e que o agente deve tratar com cautela ou perguntar antes de assumir)*

------------------------------------------------------------------------

## Checklist de Implementação

*Itens mínimos que devem ser marcados antes de considerar a ESPEC implementada. Adapte/expanda conforme a funcionalidade, mas não remova os itens abaixo.*

- [ ] Modelo de dados criado/alterado conforme seção 8 e documento de arquitetura
- [ ] Validações de campo implementadas conforme seção 8 (limites, obrigatoriedade, mensagens de erro)
- [ ] Regras de negócio e fórmulas de cálculo implementadas conforme seção 9.1
- [ ] Recálculos em cascata implementados conforme seção 9.2
- [ ] Endpoint(s) de API implementados e documentados
- [ ] Tratamento de exclusão em cascata com confirmação explícita, quando aplicável (RN-009)
- [ ] Interface implementada conforme seção 10 e padrões da seção 5.1 do ERS
- [ ] Testes unitários cobrindo regras de cálculo e casos de borda (seção 9.1)
- [ ] Testes de integração cobrindo efeitos em outras entidades (seção 9.2)
- [ ] Testes end-to-end cobrindo todos os Critérios de Aceitação (seção 11)
- [ ] Cobertura mínima de 80% atingida (RNF-017)
- [ ] Revisão de isolamento de dados entre usuários (RNF-005), quando aplicável
