# Segunda revisão de implementação do MVP

**Data da revisão:** 31 de julho de 2026
**Status geral:** implementação parcial do MVP

## Resumo executivo

Várias pendências da primeira revisão foram parcialmente implementadas, mas
fluxos essenciais de conta, cotações, detalhe do ativo e proventos continuam
incompletos. Também permanecem cálculos baseados em preços fictícios, e a
cobertura automatizada declarada não mede todos os novos componentes.

Esta segunda revisão reúne 10 pendências:

- 3 de prioridade P1;
- 7 de prioridade P2.

## Pendências P1

### 1. Remover as cotações fictícias da carga inicial

**Status:** pendente
**Local:** `backend/src/main/java/br/com/mad/config/AssetCatalogInitializer.java:27-33`
**Referência:** pendência 2 da primeira revisão

Quando a integração está desabilitada ou falha na inicialização, os preços
estáticos permanecem com a data atual definida pelo construtor de `Asset` e
são exibidos como cotações válidas. Isso produz patrimônio e P&L fictícios. A
carga offline deve cadastrar o catálogo sem inventar cotações.

### 2. Entregar os tokens de conta quando não forem expostos

**Status:** pendente
**Local:** `backend/src/main/java/br/com/mad/web/AuthController.java:71-73`
**Referência:** ESPEC 01

Quando `EXPOSE_ACCOUNT_TOKENS=false`, o token de confirmação é descartado e
nenhuma mensagem é enviada por e-mail. O mesmo ocorre na recuperação de senha.
Assim, nos ambientes compartilhados recomendados pelo README, usuários
tradicionais não conseguem confirmar a conta nem redefinir a senha.

### 3. Revogar sessões existentes ao redefinir a senha

**Status:** pendente
**Local:** `backend/src/main/java/br/com/mad/web/AuthController.java:135-138`
**Referência:** ESPEC 01

Após uma recuperação de senha, os refresh tokens emitidos anteriormente
continuam utilizáveis por até 30 dias. Em um cenário de conta comprometida,
quem possuir um desses tokens pode renovar o acesso mesmo depois da troca da
senha. As sessões aplicáveis devem ser revogadas durante esse fluxo.

## Pendências P2

### 4. Limitar o token de recuperação a 30 minutos

**Status:** pendente
**Local:** `backend/src/main/java/br/com/mad/service/AccountTokenService.java:31-34`
**Referências:** RF-004 e ESPEC 01

O cálculo de validade de tokens `PASSWORD_RESET` concede uma hora, embora o
requisito defina validade máxima de 30 minutos. Um token comprometido permanece
aceito pelo dobro do período permitido.

### 5. Exibir todos os indicadores exigidos no detalhe do ativo

**Status:** pendente
**Local:** `frontend/src/app/pages/asset-detail.component.ts:20-25`
**Referências:** RF-038 e ESPEC 08

Mesmo quando a posição é carregada, o bloco mostra apenas quantidade, custo,
valor atual e rentabilidade. Cotação, data da cotação, P&L e percentual de
alocação continuam ausentes. Também não há indicação da referência da última
cotação válida.

### 6. Completar as ações contextuais do ativo

**Status:** pendente
**Local:** `frontend/src/app/pages/asset-detail.component.ts:15-18`
**Referências:** RF-039 e ESPEC 08

A tela oferece atalhos somente para compra e dividendo. Também deve permitir
iniciar venda, subscrição, evento corporativo e bonificação com carteira e
ativo previamente preenchidos. Atualmente, esses fluxos exigem voltar ao
dashboard e selecionar manualmente o tipo.

### 7. Expor o filtro por ativo e o histórico de proventos

**Status:** pendente
**Local:** `frontend/src/app/pages/dashboard.component.ts:161-166`
**Referências:** RF-018, RF-033 e pendência 6 da primeira revisão

Embora `/api/incomes` aceite `assetId` e retorne `items`, o formulário não
possui filtro por ativo e a tela renderiza somente os agrupamentos. Ainda não é
possível consultar o histórico com data, ativo, valor e tipo filtrado por
ativo, categoria ou tipo.

### 8. Atualizar a disponibilidade dos ativos sincronizados

**Status:** pendente
**Local:** `backend/src/main/java/br/com/mad/service/MarketDataService.java:53-56`
**Referências:** RF-043 e ESPEC 09

Toda ocorrência recebida é marcada como ativa, mas ativos removidos da resposta
ou retornados como indisponíveis nunca são inativados. Com isso, papéis que
deixaram de ser elegíveis continuam disponíveis para novos lançamentos.

### 9. Incluir todos os fontes no cálculo de cobertura

**Status:** pendente
**Local:** `frontend/angular.json:49-53`
**Referência:** RNF-017

Os limites de cobertura são aplicados somente aos módulos carregados pelos
testes. A execução reporta cobertura para dashboard, API e sessão, mas omite
login, detalhe do ativo, perfil, guard e interceptor. Assim,
`test:coverage` pode passar sem medir grande parte das funcionalidades novas e
não comprova a cobertura mínima de 80%.

### 10. Preservar o template obrigatório de especificações

**Status:** pendente
**Local:** `espec_template.md:1`
**Referência:** `AGENTS.md`

A exclusão do arquivo remove a estrutura usada para criar futuras ESPECs,
embora o template seja definido como obrigatório nas diretrizes do repositório.
O arquivo `espec_template.md` deve ser restaurado para preservar o fluxo
documentado de criação de especificações.

## Ordem recomendada de correção

1. Remover as cotações fictícias da carga inicial.
2. Corrigir a entrega dos tokens de conta e revogar sessões após a redefinição
   de senha.
3. Ajustar a validade do token de recuperação para 30 minutos.
4. Completar os indicadores e as ações contextuais do detalhe do ativo.
5. Expor o histórico e todos os filtros de proventos.
6. Inativar ativos que deixarem de ser elegíveis durante a sincronização.
7. Medir todos os fontes no cálculo de cobertura automatizada.
8. Restaurar o template obrigatório de especificações.
