# Especificação de Requisitos de Sistema (ERS) - [MAD - Meus Ativos Digitais]

## 1. Introdução

### 1.1 Objetivo do Documento

Este ERS tem como objetivo fornecer uma visão clara e inequívoca das funcionalidades e comportamento do sistema responsável pelo cadastro e gestão das carteiras de ativos do usuário.

Ele expõe:

- Requisitos Funcionais
- Requisitos Não-Funcionais
- Regras de Negócio
- Referência para os arquivos de especificação das funcionalidades

O público-alvo é composto por desenvolvedores, agentes de IA responsáveis pela implementação e demais stakeholders envolvidos no projeto.

### 1.2 Escopo do Sistema

O sistema é uma aplicação web voltada para o investidor pessoa física que deseja gerenciar seus ativos de renda variável (especificamente Ações e Fundos de Investimentos Imobiliários do mercado brasileiro).

**O sistema deverá permitir:**

- cadastro de usuário com email ou conta google
- cadastro de carteira de ativos
- manutenção automática do catálogo de ativos de Ações e FIIs a partir de API externa
- cadastro de operações de compra, venda e subscrição
- cadastro de proventos (jcp, dividendos)
- cadastro de bonificações
- cadastro de eventos coporativos (grupamentos (inplits), desdobramentos (splits))
- cadastro de subscrição
- visualização do valor total da carteira (custo de aquisição, valor atual)
- visualização do valor da carteira por categoria de ativo (fii, ação)
- visualização do valor investido em cada ativo (custo de aquisição, valor atual)
- visualização do valor recebido de provento (por carteira, por categoria, por ativo)
- visualização da evolução do custo de aquisição da carteira (período: mês, ano)

**Não faz parte do escopo desta versão:**

- Realizar operações de compra e venda de ativos (será uma ferramenta exclusivamente de registro, monitorização, análise e planeamento)
- Realizar o registro automático de eventos cooporativos, proventos ou bonificações (o usuário terá total controle pelo cadastro desses eventos)
- Importação automática de notas de corretagem (PDF)
- Cadastro manual de ativos pelo usuário
- Cálculo de IR (Imposto de Renda sobre operações)
- Suporte a outros ativos (BDRs, ETFs, Renda Fixa, Cripto)
- Alertas e notificações de eventos (pagamento de proventos, datas ex)
- Exportação para declaração de IR na Receita Federal
- Atualização em tempo real da cotação dos ativos (a atualização será diária)
- Histórico de cotações dos ativos
- Evolução histórica do valor de mercado da carteira ou do ativo, pois o plano gratuito da API Brapi não contempla histórico de cotações

O escopo do MVP está definido no anexo escopo_mvp.md.

### 1.3 Glossário (Linguagem Ubíqua)

| Termo | Definição |
| --- | --- |
| **Ativo** | Instrumento financeiro negociável na bolsa que pode ser adicionado à carteira do usuário (Ação ou FII, nesta versão). |
| **Catálogo de Ativos** | Base mantida pelo sistema contendo os ativos disponíveis para seleção pelo usuário, limitada nesta versão a Ações e FIIs obtidos por integração com API externa. |
| **Ativo Referenciado em Carteira** | Ativo que possui vínculo com ao menos uma carteira de usuário por meio de operação, provento, bonificação, evento corporativo ou posição registrada. |
| **Ação** | Título que representa uma fração do capital social de uma empresa listada na B3. |
| **FII (Fundo de Investimento Imobiliário)** | Fundo que investe em empreendimentos imobiliários ou títulos relacionados, negociado em bolsa. |
| **Ticker / Código de Negociação** | Código alfanumérico que identifica um ativo na bolsa (ex.: PETR4, MXRF11). |
| **Login Social (OAuth)** | Mecanismo de autenticação que permite ao usuário acessar o sistema utilizando as credenciais de uma conta de terceiros (ex.: conta Google), sem a necessidade de criar e memorizar uma senha específica para o MAD. Baseia-se no protocolo OAuth 2.0 / OpenID Connect. |
| **Carteira** | Conjunto de ativos e respectivas operações registradas por um usuário, usado para consolidar posição e resultados. |
| **Operação** | Registro de compra,venda ou subscrição de uma quantidade de um ativo, em uma data e preço específicos. |
| **Subscrição** | Direito de aquisição de novas quantidades de um ativo, ofertado pela empresa/fundo emissor aos atuais acionistas/cotistas, geralmente a preço diferenciado. |
| **Provento** | Valor distribuído ao investidor em função da posse de um ativo. Nesta versão, compreende Dividendo e JCP. |
| **Dividendo** | Parcela do lucro distribuída pela empresa/fundo aos acionistas/cotistas, isenta de IR na fonte para o investidor pessoa física. |
| **JCP (Juros sobre Capital Próprio)** | Forma de remuneração ao acionista, sujeita a retenção de Imposto de Renda na fonte. |
| **Bonificação** | Distribuição gratuita de novas quantidades de um ativo ao investidor, em razão de incorporação de reservas ao capital da empresa/fundo. |
| **Evento Corporativo** | Alteração na quantidade de um ativo já existente na carteira, sem novo aporte financeiro do investidor. Compreende Desdobramento e Agrupamento (Grupamento). |
| **Desdobramento (Split)** | Evento corporativo que aumenta a quantidade de ativos em posse do investidor, reduzindo proporcionalmente o preço unitário, sem alterar o valor total investido. |
| **Grupamento (Inplit)** | Evento corporativo que reduz a quantidade de ativos em posse do investidor, aumentando proporcionalmente o preço unitário, sem alterar o valor total investido. |
| **Custo de Aquisição** | Valor monetário acumulado pelas operações de compra e subscrição, reduzido proporcionalmente pelas vendas. Bonificações, desdobramentos e grupamentos alteram somente a quantidade e não modificam o Custo de Aquisição Total. |
| **Preço Médio** | Conceito de custo médio por unidade de um ativo (Custo de Aquisição Total dividido pela quantidade total). **Não é calculado nem exibido pelo sistema** nesta versão; mencionado aqui apenas como referência conceitual, podendo ser apurado pelo próprio usuário fora do sistema. |
| **Valor Atual** | Resultado da multiplicação da quantidade do ativo em carteira pela cotação mais recente disponível. |
| **Cotação** | Preço de mercado de um ativo em determinado momento, obtido por integração com fonte externa de dados financeiros. |
| **Data Ex (Data Ex-Provento/Ex-Direito)** | Data a partir da qual a compra do ativo não garante mais o direito ao provento ou evento anunciado. |
| **Categoria de Ativo** | Classificação do ativo dentro da carteira, nesta versão limitada a "Ação" e "FII". |
| **Investidor Pessoa Física** | Ator do sistema responsável por realizar todos os cadastros e consultar as informações consolidadas de sua carteira. |

## 2. Descrição Geral

### 2.1 Perspectiva do Produto

O sistema MAD irá funcionar de forma independente na interface web, consumindo APIs externas de dados da bolsa brasilira para manutenção do catálogo de ativos e atualização diária de preços dos ativos referenciados em carteiras.

### 2.2 Funções do Produto (Resumo)

- Cadastrar, editar, consultar e excluir:
  - usuário
  - carteiras de ativos;
  - operações de compra, venda e subscrições;
  - proventos
  - eventos cooporativos
  - bonificações
- Manter automaticamente o catálogo de ativos elegíveis para seleção pelo usuário
- Painel de vizualização (dashboard)

O escopo do MVP está definido no anexo escopo_mvp.md.

### 2.3 Características dos Usuários (Atores)

- **Investidor pessoa física:** Responsável por cadastrar as informações no sistema

### 2.4 Restrições Gerais e Premissas

- O sistema oferece suporte exclusivamente a ativos negociados na mercado brasileiro (apenas Ação e FII)
- O usuário não cadastra ativos manualmente; os ativos disponíveis para seleção são mantidos pelo sistema a partir de API externa
- Todos os valores monetários serão utilizados em tela no formato de Reais (BRL), com precisão de duas casas decimais
- O cadastro de eventos (proventos, bonificações, eventos corporativos) é sempre manual, sob total responsabilidade do usuário
- A atualização de cotações depende da disponibilidade e dos limites de uso de APIs externas de dados financeiros
- A atualização das cotações é feita diariamente, não havendo atualização em tempo real dos preços dos ativos
- O sistema pressupõe apenas um usuário por conta, sem funcionalidades de compartilhamento ou múltiplos perfis de acesso nesta versão

### 2.5 Objetivos do Sistema

- **Centralização:** Consolidar todas as posições em ações e FIIs em um único lugar
- **Precisão:** Calcular automaticamente custo de Aquisição total, P&L e rentabilidade por ativo
- **Rastreabilidade:** Manter histórico completo de operações e proventos
- **Usabilidade:** Interface intuitiva, sem necessidade de conhecimento técnico avançado
- **Confiabilidade:** Dados íntegros mesmo após eventos corporativos (grupamentos (inplits), desdobramentos (splits), bonificações)

## 3. Requisitos Funcionais (RF)

### 3.1 Conta e Acesso do Usuário

- **RF-001:** O sistema deve permitir que o usuário crie uma conta utilizando endereço de e-mail e senha, com confirmação por e-mail

- **RF-002:** O sistema deve permitir que o usuário autenticado realize login com e-mail e senha, exibindo mensagem de erro em até 2 segundos em caso de credenciais inválidas

- **RF-003:** O sistema deve permitir que o usuário acesse via conta Google (OAuth), criando automaticamente uma nova conta no primeiro acesso caso não exista uma conta associada ao e-mail informado pelo provedor Google, utilizando nome e e-mail fornecidos por essa conta

- **RF-004:** O sistema deve permitir que o usuário solicite redefinição de senha via e-mail, com link de redefinição válido por, no máximo, 30 minutos

- **RF-005:** O sistema deve permitir que o usuário edite os dados do próprio perfil (nome, e-mail) e exclua a própria conta, mediante confirmação explícita

### 3.2 Carteira de Ativos

- **RF-006:** O sistema deve permitir que o usuário crie uma ou mais carteiras, informando obrigatoriamente um nome identificador único por usuário

- **RF-007:** O sistema deve permitir que o usuário edite o nome de uma carteira existente

- **RF-008:** O sistema deve permitir que o usuário exclua uma carteira, exigindo confirmação explícita quando houver operações, proventos, bonificações ou eventos vinculados

- **RF-009:** O sistema deve permitir que o usuário liste todas as carteiras cadastradas, exibindo nome e valor atual consolidado de cada uma

### 3.3 Operações (Compra, Venda e Subscrição)

- **RF-010:** O sistema deve permitir o cadastro de uma operação de compra, informando obrigatoriamente carteira, ativo, data, quantidade, preço unitário (opcional), taxas (opcional) e custo total. O custo total não é cálculado, o usuário deve informar manualmente

- **RF-011:** O sistema deve permitir o cadastro de uma operação de venda, informando obrigatoriamente carteira, ativo, data, quantidade, preço unitário (opional), taxas (opcional) e valor total, impedindo o registro de venda de quantidade superior à posição disponível na data informada

- **RF-012:** O sistema deve permitir o cadastro de uma operação de subscrição, informando obrigatoriamente carteira, ativo, data, quantidade subscrita, preço unitário (opcional), taxas(opcional) e custo total de subscrição

- **RF-013:** O sistema deve permitir a edição e a exclusão de operações de compra, venda e subscrição já cadastradas

- **RF-014:** O sistema deve recalcular automaticamente a posição e o custo de aquisição da carteira e do ativo sempre que houver cadastro/edição/exclusão de operação

### 3.4 Proventos

- **RF-015:** O sistema deve permitir o cadastro de um provento do tipo Dividendo ou JCP, informando obrigatoriamente carteira, ativo, tipo, data de pagamento, valor por unidade (opcional) e valor total

- **RF-016:** O sistema deve permitir a edição e a exclusão de proventos já cadastrados

- **RF-017:** O sistema deve recalcular automaticamente o valor total de proventos do ativo sempre que houver cadastro/edição/exclusão de provento

- **RF-018 [Histórico de proventos]:** O sistema deve exibir o histórico em ordem cronológica dos proventos registrados com opção de filtro por ativo, por categoria de ativo e por tipo de provento. Exibindo data, ativo, valor recebido e tipo de provento.

- **RF-019 [Consolidação por período]:** O sistema deve apresentar o valor total dos proventos informados pelo usuário, agrupado por mês, trimestre ou ano.

### 3.5 Bonificações

- **RF-020:** O sistema deve permitir o cadastro de uma bonificação, informando obrigatoriamente carteira, ativo, data, quantidade recebida e descrição (opcional)

- **RF-021:** O sistema deve permitir a edição e a exclusão de bonificações já cadastradas

- **RF-022:** O sistema deve atualizar automaticamente a quantidade do ativo afetado sempre que houver cadastro/edição/exclusão de bonificação

### 3.6 Eventos Corporativos

- **RF-023:** O sistema deve permitir o cadastro de um evento corporativo do tipo Desdobramento, informando carteira, ativo, data, fator de desdobramento (ex.: 1:2), descrição (opcional) e a nova quantidade total do ativo após o evento, a qual substitui a quantidade anterior registrada na carteira

- **RF-024:** O sistema deve permitir o cadastro de um evento corporativo do tipo grupamento, informando carteira, ativo, data, fator de grupamento (ex.: 10:1), descrição (opcional) e a nova quantidade total do ativo após o evento, a qual substitui a quantidade anterior registrada na carteira

- **RF-025:** O sistema deve permitir a edição e a exclusão de eventos corporativos já cadastrados

- **RF-026:** O sistema deve atualizar automaticamente a quantidade do ativo afetado sempre que houver cadastro/edição/exclusão de evento corporativo

### 3.7 Visualização (Dashboard)

- **RF-027:** O sistema deve disponibilizar, na tela inicial, um seletor contendo as carteiras do usuário autenticado, permitindo alternar a carteira utilizada nos dados apresentados sem necessidade de sair da tela.

- **RF-028:** O sistema deve exibir o valor total de uma carteira, apresentando custo de aquisição total, valor atual total , P&L e rentabilidade, com atualização em até 24 horas após a última cotação disponível

- **RF-029:** O sistema deve exibir o valor atual, custo de aquisição e rentabilidade da carteira segmentado por categoria de ativo (Ação e FII)

- **RF-030 [Alocação por categoria]:** O sistema deve exibir o percentual de participação do valor atual de cada categoria (Ação e FII) em relação ao valor atual total da carteira selecionada.

- **RF-031:** O sistema deve exibir, para cada ativo em carteira, a quantidade em posse, o custo de aquisição total, valor atual, P&L, rentabilidade e percentual de participação do valor atual total da carteira

- **RF-032:** O sistema deve exibir a evolução do custo de aquisição da carteira ao longo do tempo, com granularidade selecionável por mês ou por ano, considerando as operações, vendas, subscrições, bonificações e eventos corporativos registrados até cada ponto do período. A apresentação será por indicadores ou tabelas.

- **RF-033:** O sistema deve exibir o total de proventos recebidos, com filtros por carteira, por categoria de ativo e por ativo individual, permitindo seleção de período

- **RF-034:** O sistema deve atualizar diariamente as cotações somente dos ativos referenciados em carteiras de usuários, por meio de integração com API externa de dados financeiros

- **RF-035 [Maior posição]:** O sistema deve identificar e exibir o ativo com maior participação percentual no valor atual da carteira selecionada.

### 3.8 Histórico e detalhe do ativo

- **RF-036 [Histórico de operações por ativo]:** O sistema deve exibir o histórico completo das operações de compra, venda e subscrição de cada ativo, apresentando carteira, tipo, data, quantidade, valor Total da operação e informações opcionais registradas.

- **RF-037 [Histórico de eventos por ativo]:** O sistema deve exibir o histórico consolidado de operações, desdobramentos, grupamentos e bonificações de cada ativo, em ordem cronológica, permitindo filtro por operação, evento, bonificação.

- **RF-038 [Tela de detalhe do ativo]:** O sistema deve disponibilizar uma tela de detalhe para cada ativo da carteira, exibindo quantidade atual, Custo de Aquisição Total, cotação atual, data da cotação, P&L, rentabilidade, percentual de alocação, operações, eventos corporativos, bonificações e proventos vinculados.

- **RF-039 [Ações contextuais do ativo]:** A tela de detalhe do ativo deve permitir iniciar diretamente o cadastro de operação, evento corporativo, bonificação ou provento, preenchendo previamente a carteira e o ativo selecionados.

- **RF-040 [Notas por ativo]:** O sistema deve permitir que o usuário crie, edite, consulte e exclua notas pessoais vinculadas a um ativo de uma carteira

### 3.9 Catálogo de Ativos

- **RF-041:** O sistema deve manter um catálogo de ativos elegíveis, contendo Ações e FIIs do mercado brasileiro obtidos por integração com API externa.

- **RF-042:** O sistema deve executar carga inicial do catálogo de ativos, cadastrando no banco de dados os ativos retornados pela API externa com, no mínimo, ticker, nome, categoria do ativo e status de negociação quando disponível.

- **RF-043:** O sistema deve atualizar periodicamente o catálogo de ativos a partir da API externa, incluindo novos ativos e atualizando dados cadastrais de ativos existentes.

- **RF-044:** O sistema deve permitir que o usuário selecione apenas ativos existentes no catálogo mantido pelo sistema ao cadastrar operações, proventos, bonificações ou eventos corporativos.

## 4. Requisitos Não-Funcionais (RNF)

- **RNF-001 [Arquitetura/Stack]:** A definição de linguagens, frameworks e demais componentes de arquitetura e infraestrutura estão detalhados em documento específico de arquitetura, não fazendo parte deste ERS, vide o item 7. Referencias e Anexos

- **RNF-002 [Segurança - Autenticação]:** O sistema deve autenticar usuários via token, com expiração de sessão configurável e renovação automática

- **RNF-003 [Segurança - Dados]:** Senhas devem ser armazenadas utilizando algoritmo de hash com salt, nunca em texto plano

- **RNF-004 [Segurança - Login Social]:** A integração de login via Google deve utilizar o protocolo OAuth 2.0 / OpenID Connect, armazenando apenas os tokens necessários para autenticação (ex.: identificador da conta, e-mail verificado) e nunca a senha da conta Google do usuário

- **RNF-005 [Segurança - Isolamento de Dados]:** O sistema deve garantir que um usuário jamais visualize ou manipule dados (carteiras, operações, proventos, eventos, bonificações, notas pessoais) de outro usuário

- **RNF-006 [Privacidade/LGPD]:** O sistema deve estar em conformidade com a Lei Geral de Proteção de Dados (LGPD), incluindo mecanismo de exclusão definitiva dos dados pessoais e financeiros do usuário quando solicitado

- **RNF-007 [Desempenho]:** As páginas de consulta (dashboard, listagens) devem carregar em até 3 segundos, considerando carteira com até 50 ativos e 1.000 operações, sob condições normais de rede

- **RNF-008 [Disponibilidade]:** O sistema deve ter disponibilidade mensal mínima de 99%, excluindo janelas de manutenção programada previamente comunicadas

- **RNF-009 [Escalabilidade]:** O sistema deve suportar crescimento do número de usuários e volume de dados sem degradação perceptível de desempenho, mediante arquitetura documentada em anexo específico

- **RNF-010 [Usabilidade]:** O sistema deve ser responsivo, garantindo uso funcional em resoluções de tela a partir de 360px de largura (dispositivos móveis) até resoluções desktop

- **RNF-011 [Compatibilidade]:** O sistema deve ser compatível com as duas últimas versões estáveis dos navegadores Google Chrome, Mozilla Firefox, Microsoft Edge e Safari

- **RNF-012 [Integridade de Dados]:** O sistema deve impedir a exclusão de um ativo caso existam operações, proventos, bonificações ou eventos corporativos vinculados, sem antes solicitar confirmação explícita das exclusões em cascata

- **RNF-013 [Auditabilidade]:** O sistema deve registrar data de criação e data de última alteração para todo registro de operação, provento, bonificação, evento corporativo e nota pessoal

- **RNF-014 [Backup e Recuperação]:** O sistema deve realizar backup diário automatizado dos dados dos usuários, com retenção mínima de 30 dias

- **RNF-015 [Resiliência de Integração]:** Em caso de indisponibilidade da API externa de cotações, o sistema deve exibir a última cotação válida obtida, sinalizando ao usuário a data/hora dessa última atualização

- **RNF-016 [Integridade de Dados - Validação de Entrada]:** O sistema deve validar e rejeitar, com mensagem de erro clara, valores numéricos e monetários informados fora de limites plausíveis (quantidade, preço unitário e valores totais), prevenindo erros de digitação. Os limites específicos por campo devem ser detalhados nas respectivas ESPECs de funcionalidade

- **RNF-017 [Requisitos de Testes]:** O sistema deve incluir testes unitários, de integração e end-to-end automatizados com cobertura mínima de 80%

## 5. Requisitos externos da interface

Os requisitos de interface definem como o sistema se comunica com elementos externos.

### 5.1 Interface do Usuário

- O sistema deve disponibilizar um dashboard como tela inicial após o login, apresentando o valor total consolidado da carteira selecionada
- O sistema deve adotar padrão visual consistente de cores, tipografia e componentes em todas as telas de cadastro (carteira, operação, provento, bonificação, evento corporativo)
- Formulários de cadastro devem sinalizar campos obrigatórios e exibir mensagens de validação junto ao campo correspondente, sem submissão do formulário até a correção
- Formulários de cadastro deve exibir mensagem de orientação para sobre o cadastro
- Listagens de operações, proventos, bonificações e eventos corporativos devem oferecer filtros por carteira, por ativo e por período
- Valores monetários devem ser exibidos no padrão brasileiro (R$ 0.000,00), e datas no formato dd/mm/aaaa
- A telas devem estar no idioma pt-br

### 5.2 Interface de Software

- O sistema deve integrar-se a uma API externa de dados financeiros do mercado brasileiro para manutenção do catálogo de ativos e obtenção diária dos preços de Ações e FIIs
- A rotina de atualização diária de cotações deve filtrar os ativos pelo uso efetivo em carteiras de usuários, evitando chamadas externas para ativos não referenciados
- A rotina de atualização diária de cotações deve consultar um ativo por vez, respeitando as limitações do plano gratuito da API externa
- O sistema deve integrar-se ao provedor de identidade Google, via protocolo OAuth 2.0 / OpenID Connect, para permitir o login social e a criação automática de conta no primeiro acesso
- As demais integrações de software (banco de dados, serviços de e-mail, provedores de autenticação) devem ser detalhadas em documento específico de arquitetura, fora do escopo deste ERS

### 5.3 Interface de Comunicação

- A comunicação entre o frontend e o backend do sistema deve ocorrer via protocolo HTTPS, utilizando API REST com formato de mensagens JSON
- A comunicação com a API externa de dados financeiros deve seguir o protocolo e formato definidos pelo provedor escolhido, documentados no anexo de integrações
- O sistema deve implementar tratamento de timeout e reenvio (retry) controlado para chamadas a serviços externos, evitando bloqueio da experiência do usuário

## 6. Regras de Negócio (RN)

- **RN-001 [Preço Médio]:** O sistema não realiza o cálculo do preço médio do ativo. O sistema mantém apenas o controle da quantidade total em carteira e do custo de aquisição total do ativo, apurados a partir da soma das operações de compra e subscrições

- **RN-002 [Venda e Custo de Aquisição]:** Operações de venda reduzem a quantidade em carteira e o custo de aquisição total do ativo, proporcionalmente à quantidade vendida em relação à posição total do ativo até a data da operação

- **RN-003 [Quantidade Insuficiente]:** O sistema não deve permitir o registro de uma operação de venda cuja quantidade seja superior à quantidade disponível do ativo na carteira até a data da operação

- **RN-004 [Desdobramento]:** Em um evento de Desdobramento, a nova quantidade total do ativo em carteira deve ser aquela informada pelo usuário no cadastro do evento, substituindo diretamente a quantidade anterior; o custo de aquisição total do ativo permanece inalterado por esse tipo de evento

- **RN-005 [Grupamento]:** Em um evento de Grupamento, a nova quantidade total do ativo em carteira deve ser aquela informada pelo usuário no cadastro do evento, substituindo diretamente a quantidade anterior; o custo de aquisição total do ativo permanece inalterado por esse tipo de evento

- **RN-006 [Bonificação]:** A quantidade recebida em bonificação deve ser somada à quantidade total do ativo, sem alterar o custo total do ativo

- **RN-007 [Datas Retroativas]:** O sistema deve permitir o cadastro de operações, proventos, bonificações e eventos corporativos com data retroativa, mesmo que seja anterior à data de criação da carteira

- **RN-008 [Cadastro de Ativos]:** O usuário não cadastra ativos manualmente. O sistema deve manter um catálogo de ativos de Ações e FIIs obtido por API externa, e o usuário apenas seleciona ativos previamente cadastrados nesse catálogo.

- **RN-009 [Exclusão em Cascata]:** A exclusão de uma carteira, operação ou a remoção de um ativo da carteira que possua registros vinculados (proventos, bonificações, eventos corporativos) somente deve ocorrer mediante confirmação explícita do usuário sobre a exclusão em cascata desses registros

- **RN-010 [Valor Atual]:** O valor atual de um ativo deve ser calculado com base na última cotação disponível, mesmo que esta tenha sido obtida em dia anterior ao da consulta, sinalizando a data de referência da cotação

- **RN-011 [Vínculo de Conta Google]:** Caso o e-mail retornado pela conta Google já possua uma conta tradicional (e-mail/senha) cadastrada no sistema, o acesso via Google deve ser vinculado a essa conta existente, mantendo todas as carteiras e dados já cadastrados, em vez de criar uma nova conta duplicada

- **RN-012 [Precisão Monetária]:** Cálculos monetários devem preservar a precisão decimal durante todo o processamento, sem arredondamentos intermediários. Valores em BRL devem ser arredondados para duas casas decimais somente nas bordas de exibição e resposta da API

- **RN-013 [Evolução do Custo de Aquisição]:** Para calcular a evolução do custo de aquisição de uma carteira em cada competência mensal, o sistema deve utilizar o custo de aquisição histórico de cada ativo ao final do último dia da respectiva competência, considerando todas as operações, vendas e subscrições ocorridas até essa data. Bonificações, desdobramentos e grupamentos alteram quantidade, mas não alteram o Custo de Aquisição Total. A posição atual não deve ser utilizada para recalcular competências anteriores.

- **RN-014 [P&L]:** O P&L de um ativo deve corresponder ao seu valor atual de mercado menos seu Custo de Aquisição Total. O P&L consolidado deve corresponder à soma dos P&Ls dos ativos considerados.

- **RN-015 [Rentabilidade]:** A rentabilidade deve ser calculada pela divisão do P&L pelo Custo de Aquisição Total, multiplicada por 100. Quando o Custo de Aquisição Total for zero, a rentabilidade percentual não deve ser calculada, devendo ser apresentada como indisponível. Não inclui proventos recebidos.

- **RN-016 [Consolidação Anual da Evolução do Custo de Aquisição]:** Para cada ano, o custo de aquisição apresentado deve corresponder ao custo de aquisição histórico ao final da última competência mensal disponível naquele ano. O sistema não deve calcular o valor anual pela média ou soma dos valores mensais.

- **RN-017 [Escopo da Atualização de Cotações]:** A atualização diária de cotações deve considerar apenas ativos referenciados em ao menos uma carteira de usuário. Ativos presentes apenas no catálogo, sem vínculo com carteiras, não devem ter cotação atualizada pela rotina diária.

- **RN-018 [Consulta Unitária de Cotações]:** A atualização diária de cotações deve realizar uma chamada por ativo, sem agrupar múltiplos tickers na mesma requisição, respeitando as limitações do plano gratuito da API externa.

## 7. Referências e Anexos

- [ESPEC 01 - Cadastro de Usuário e Autenticação](./especs/ESPEC_01_conta-e-acesso.md)
- [ESPEC 02 - Cadastro e Gestão de Carteiras](./especs/ESPEC_02_carteiras.md)
- [ESPEC 03 - Cadastro de Operações (Compra, Venda e Subscrição)](./especs/ESPEC_03_operacoes.md)
- [ESPEC 04 - Cadastro de Proventos (Dividendos e JCP)](./especs/ESPEC_04_proventos.md)
- [ESPEC 05 - Cadastro de Bonificações](./especs/ESPEC_05_bonificacoes.md)
- [ESPEC 06 - Cadastro de Eventos Corporativos (Desdobramento e Grupamento)](./especs/ESPEC_06_eventos-corporativos.md)
- [ESPEC 07 - Dashboard e Visualizações de Carteira](./especs/ESPEC_07_dashboard.md)
- [ESPEC 08 - Histórico e Detalhamento do Ativo](./especs/ESPEC_08_detalhe-do-ativo.md)
- [ESPEC 09 - Catálogo de Ativos](./especs/ESPEC_09_catalogo-de-ativos.md)
- [Documento de Escopo do MVP](escopo_mvp.md)
- [Documento de Arquitetura (Stack) do Sistema](./../arquitetura/documento_arquitetura_MAD.md)
- [Documento de Integrações Externas da API  Bolsa do Brasil](./../integracoes/integracao_api_bolsa_brasil.md)

## Considerações Gerais

- O documento deve descrever **o que o sistema faz**, e não como será implementado.
- Banco de dados, APIs, arquitetura, infraestrutura e deploy devem ser documentados em documentos específicos.
- Utilize linguagem ubíqua em todo o documento.
- Cada Feature deve ser autocontida, permitindo implementação independente por desenvolvedores ou agentes de IA.
- Sempre que possível, relacione Casos de Uso, User Stories, Regras de Negócio e Requisitos Funcionais.
