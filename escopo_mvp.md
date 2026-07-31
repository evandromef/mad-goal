# Escopo do MVP

## 1. Funcionalidades Incluídas no MVP

### F00 — Conta e acesso do Usuário

- O usuário deve ser capaz de criar conta no sistema com e-mail e senha ou com conta google
- O usuário deve ser capaz de recuperar sua senha
- O usuário deve ser capaz de editar/excluir a própria conta

### F01 — Carteira de Ativos

- O usuário pode criar, editar e excluir múltiplas carteiras (ex: "Carteira Principal", "Carteira Aposentadoria")
- Cada operação, posição e provento é vinculado a uma carteira específica
- Seletor de carteira disponível na tela inicial

### F02 — Operações (Compra, Venda e Subscrição)

- Lançamento de operações de **Compra**,  **Venda** e **Subscrição**
- Campos: data, ativo, quantidade, valor total da operação (já incluindo taxas/corretagem), preço unitário (opcional, apenas informativo), taxas (opcional, apenas informativo)
- Histórico completo de operações por ativo
- Edição e exclusão de operações (com recalculo automático do Custo de aquisção Total e quantidade)

### F03 — Eventos Corporativos e Bonificações

- Registro manual de **Desdobramentos e Grupamentos**: ativo, data, proporção, nova quantidade, descrição (opcional)
- Registro manual de **Bonificações**: ativo, data, quantidade recebida, descrição (opcional)
- Em ambos os casos, apenas a quantidade do ativo é ajustada; o Custo aquisoção Total permanece inalterado
- Histórico de eventos corporativos por ativo
- Edição e exclusão de eventos corporativos (com recalculo automático da quantidade)
- Histórico de bonificações por ativo
- Edição e exclusão de bonificações (com recalculo automático da quantidade)

### F04 — Carteira e Posição Atual

- Visão consolidada da carteira com posição atual por ativo
- Cálculo automático do **Custo Aquisição Total** de cada ativo
- Exibição de quantidade atual, Custo Aquisição Total, valor de mercado e P&L (Lucro/Prejuízo)
- Separação de carteira em Ações e FIIs
- Indicador de percentual de alocação por ativo e por classe
- Tela de detalhe do ativo, exibindo: quantidade atual, Custo de Aquisição Total, valor de mercado atual, P&L não realizado, histórico de operações (compra/venda/subscrição), histórico de eventos corporativos (desdobramentos, grupamentos),histórico de bonificações e histórico de proventos recebidos
- A tela de detalhe do ativo deve permitir o acesso direto a todas as funções relacionadas ao ativo: registrar operação, registrar evento corporativo, registrar provento e registrar bonificação
- Área de comentários/notas livres por ativo, onde o usuário pode inserir, editar e visualizar anotações pessoais (ex: teses de investimento, observações, lembretes)

### F05 — Proventos

- Registro manual de proventos recebidos por ativo (data do pagamento, tipo, valor por cota/ação - opcional, valor total recebido)
- Tipos de proventos: Dividendo e Juros sobre Capital Próprio (JCP)
- Histórico de proventos por ativo, por categoria de ativo e por tipo de provento
- Cálculo de total de proventos recebidos no período (mensal, trimestral, anual)

### F06 — Dashboard Analítico

No MVP, os dados serão apresentados por indicadores ou tabelas; suas representações gráficas ficam fora do escopo.

- Resumo do patrimônio total (Ações + FIIs)
- Distribuição da carteira por ativo e por categoria de ativo
- Evolução do custo de aquisição ao longo do tempo
- Resumo de proventos recebidos por mês
- Indicadores: rentabilidade e maior posição

### F07 — Integração com API da Bolsa Brasil

- Integração com API externa de dados financeiros (ex: Brapi, B3, Yahoo Finance) para manter o catálogo de Ações e FIIs e obter o preço atual dos ativos
- Carga inicial automática do catálogo de ativos elegíveis, sem cadastro manual de ativos pelo usuário
- Atualização periódica do catálogo de ativos, incluindo novos ativos e atualizando dados cadastrais existentes
- Atualização automática diária das cotações somente dos ativos referenciados em carteiras de usuários
- Cálculo automático do lucro/prejuízo não realizado (P&L) com base na última cotação válida disponivel
- Armazenamento apenas da cotação atual por ativo, sobrescrita a cada atualização válida
- Tratamento de falha na API: manter última cotação válida e exibir indicador de "cotação desatualizada"

## 2. Funcionalidades Fora do Escopo do MVP (Futuras)

- Atualização sob demanda das cotações
- Histórico de cotações dos ativos
- Evolução histórica do valor de mercado da carteira ou do ativo
- Gráficos de evolução do valor de mercado, distribuição da carteira, etc
- Importação automática de notas de corretagem (PDF)
- Cálculo de IR (Imposto de Renda sobre operações)
- Suporte a outros ativos (BDRs, ETFs, Renda Fixa, Cripto)
- Alertas e notificações de eventos (pagamento de proventos, datas ex)
- Exportação para declaração de IR na Receita Federal
- Visão consolidada opcional somando todas as carteiras do usuário
