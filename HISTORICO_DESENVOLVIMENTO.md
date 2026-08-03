# Histórico de desenvolvimento do MAD

Este documento registra o trabalho realizado no repositório desde o início da
implementação executável do MAD (Meus Ativos Digitais) até 31 de julho de 2026.
O histórico foi reconstruído a partir dos commits locais, documentos de revisão,
alterações ainda não commitadas e verificações executadas durante o desenvolvimento.

## Estado inicial do repositório

O repositório continha os requisitos e as especificações funcionais do produto:

- `ers.md`, com requisitos funcionais, regras de negócio e requisitos não funcionais;
- `escopo_mvp.md`, com os limites do MVP;
- `espec_template.md`, com o modelo obrigatório de especificações;
- `especs/ESPEC_01` a `ESPEC_09`, cobrindo conta, carteiras, operações,
  proventos, eventos corporativos, dashboard, detalhe do ativo e catálogo.

Ainda não havia aplicação executável, gerenciadores de dependências ou testes
automatizados de código.

## 30 de julho de 2026

### MVP completo e executável

Commit `f6a4a6b` — `feat: implementa MVP web do MAD`

Foi criada a primeira versão completa da aplicação:

- backend em Java 21 com Spring Boot, Maven, Spring Security, JWT, JPA e Flyway;
- frontend em Angular com rotas, autenticação, dashboard e formulários;
- banco PostgreSQL executado em container;
- API REST para autenticação, perfil, carteiras, ativos, lançamentos e notas;
- migração inicial do banco e carga idempotente do catálogo de ativos;
- cálculo de posições, custo de aquisição, patrimônio, resultado, rentabilidade,
  alocação, proventos e evolução da carteira;
- cadastro, autenticação local e proteção das rotas privadas;
- criação e exclusão de carteiras;
- cadastro e exclusão de compras, vendas, subscrições, proventos,
  bonificações, desdobramentos e grupamentos;
- notas por ativo;
- Dockerfiles do backend e do frontend;
- Nginx para servir o Angular e encaminhar a API;
- `docker-compose.yml` com frontend, backend e PostgreSQL, health checks e volume;
- `.env.example` com credenciais exclusivamente locais e variáveis de ambiente;
- testes básicos de autenticação e consolidação de carteira;
- `README.md` com execução local, Docker, configuração, API e testes.

As dependências Maven e npm foram instaladas, os builds e testes foram executados
e a stack foi validada localmente com Docker Compose.

Não foi criado usuário ou senha padrão. O acesso ao sistema é feito por cadastro;
no ambiente local, os tokens de confirmação podem ser expostos somente para
desenvolvimento por meio de `EXPOSE_ACCOUNT_TOKENS=true`.

### Edição de lançamentos

Commit `d9dab45` — `feat: adiciona edição de lançamentos`

- inclusão do endpoint e cliente para alteração de lançamentos;
- reaproveitamento do formulário de lançamento no modo de edição;
- preenchimento dos dados existentes no formulário;
- bloqueio dos campos que não podem mudar durante a edição;
- ações de salvar alterações e cancelar edição;
- recálculo da carteira após a alteração;
- testes do fluxo de criação, edição, cancelamento e exclusão.

### Conclusão das primeiras pendências de revisão

Commit `365ad8e` — `feat: conclui pendencias da revisao do MVP`

- criação do documento da primeira revisão (`REVIEW.md`);
- confirmação de e-mail, recuperação e redefinição de senha;
- refresh token com rotação e logout com revogação;
- login Google configurável;
- precisão ampliada para quantidades e valores financeiros;
- nova migração de banco para segurança de conta e precisão;
- integração configurável com dados de mercado;
- sincronização de catálogo e atualização de cotações;
- consulta de proventos com filtros e agrupamento;
- tela de perfil com alteração de dados e exclusão da conta;
- tela de detalhe do ativo com indicadores, histórico e notas;
- ações contextuais partindo do detalhe do ativo;
- serviço de sessão, interceptor e guard de autenticação;
- ampliação dos testes unitários, de integração e de fluxo de API;
- configuração de cobertura mínima automatizada;
- inclusão do E2E Playwright cobrindo o fluxo principal da stack real.

## 31 de julho de 2026

### Estabilização visual do formulário de lançamentos

Commit `dad8b8f` — `fix(frontend): estabiliza formulario de lancamentos`

Foram aplicados os ajustes solicitados ao formulário:

- mensagem de sucesso temporária em formato de toast, sem movimentar elementos;
- `Valor total` isolado em sua própria linha para operações;
- `Preço unitário` e `Taxas` na linha seguinte;
- largura de `Valor total` igual à dos demais campos, sem ocupar duas colunas;
- `Valor total` ao lado de `Data` em dividendos e JCP;
- altura estável do formulário ao alternar o tipo de lançamento;
- espaço reservado abaixo dos botões para mensagens de erro;
- correção da sobreposição do label de descrição com o campo de preço unitário;
- remoção de espaços verticais indevidos quando linhas condicionais desaparecem;
- testes unitários e E2E para dimensões, alinhamento e mensagens.

### Correções da segunda revisão

Commit `0a48f85` — `fix(review-02): resolve pendencias do MVP`

- documentação dos dez apontamentos em `REVIEW_02.md`;
- remoção de cotações fictícias da carga inicial;
- envio configurável de e-mails de confirmação e recuperação via SMTP;
- revogação dos refresh tokens após redefinição de senha;
- validade de 30 minutos para tokens de recuperação;
- indicadores adicionais no detalhe do ativo: cotação, data, P&L e alocação;
- ações contextuais completas no detalhe do ativo;
- filtro por ativo e histórico detalhado de proventos;
- inativação de ativos que deixam de ser elegíveis no catálogo sincronizado;
- cobertura do frontend configurada para incluir todos os fontes;
- restauração do template obrigatório de especificações;
- novas variáveis de ambiente e atualização da documentação;
- novos testes de e-mail, tokens, guard, interceptor e páginas Angular.

### Formatação monetária e evolução

Commit `f221fc7` — `fix(frontend): formata valores e limita evolucao`

- configuração da localização `pt-BR` no Angular;
- valores monetários apresentados em BRL;
- meses e anos formatados em português nas listas de evolução e proventos;
- evolução limitada aos 24 períodos mais recentes na tela inicial;
- ordenação decrescente da evolução, do período mais recente para o mais antigo;
- testes unitários e E2E para moeda, períodos, limite e ordenação.

### Busca de ativo durante uma compra

Commit `a50c75d` — `feat(frontend): adiciona busca de ativo na compra`

- substituição do select de ativo por campo digitável com filtro nas compras;
- pesquisa por ticker ou nome e sugestões do catálogo;
- manutenção do select para venda, subscrição, proventos e eventos;
- nesses demais tipos, exibição somente dos ativos já pertencentes ao usuário;
- sincronização do campo pesquisável ao editar ou preencher uma ação contextual;
- testes unitários e E2E do novo comportamento.

## Revisão 03 e aprimoramentos de interface

Commit `5f2d7d3` — `feat: aprimora interface e conclui revisao 03`

### Terceira revisão

Foi criado `REVIEW_03.md` com dois novos apontamentos:

1. processamento dos parâmetros `mode` e `token` dos links de confirmação e
   recuperação enviados por e-mail;
2. persistência explícita da desativação de ativos feita pela sincronização agendada.

O frontend já processava os parâmetros dos links. Foram acrescentados testes
unitários para o link de redefinição e uma verificação direta no E2E.

No backend, a sincronização passou a salvar explicitamente cada ativo desativado,
inclusive quando chamada pelo agendamento e sem depender da autoinvocação de um
método `@Transactional`. Foi incluído teste específico desse caminho.

### Modais personalizados

Os diálogos nativos `window.confirm` e `window.prompt` foram substituídos por um
componente único com identidade visual do MAD:

- serviço central de confirmação e entrada de texto;
- fundo escurecido com desfoque;
- cartão responsivo, animações e marca visual;
- estilo diferenciado para ações destrutivas;
- títulos, mensagens e rótulos contextualizados;
- fechamento por `Escape` ou clique no fundo;
- renomeação de carteira por campo de texto personalizado;
- migração das confirmações de exclusão de carteira, lançamento, nota e conta;
- testes unitários do serviço e componente;
- validação do modal de exclusão no fluxo E2E.

### Acessibilidade dos modais

Após revisão de acessibilidade, foram corrigidos o gerenciamento de foco e os
landmarks da aplicação:

- foco inicial no campo de texto ou na ação segura de cancelar/manter;
- ciclo de `Tab` e `Shift+Tab` restrito aos controles do diálogo;
- conteúdo roteado marcado como `inert` enquanto o modal está aberto;
- devolução do foco ao elemento que abriu o diálogo;
- indicador visual de foco nos botões;
- teste unitário para foco inicial, focus trap e restauração;
- teste E2E do mesmo fluxo acionado pelo teclado;
- uso de um `div` neutro como limite do `inert`, evitando `<main>` aninhados;
- teste estrutural que renderiza uma rota e garante exatamente um landmark `<main>`.

### Iniciais dos tipos de lançamento

O símbolo genérico da lista de atividades foi substituído pela inicial do tipo:

| Tipo | Inicial |
| --- | --- |
| Compra | C |
| Venda | V |
| Subscrição | S |
| Dividendo | D |
| JCP | J |
| Bonificação | B |
| Desdobramento | D |
| Grupamento | G |

O mapeamento foi coberto por teste unitário e o E2E verifica a inicial `C` após
registrar uma compra.

## Alterações posteriores ainda não commitadas

### Quantidade e preço unitário no histórico

- compras, vendas e subscrições passaram a exibir a quantidade registrada no histórico;
- o preço unitário também é apresentado quando estiver disponível;
- o valor total permanece em destaque, com os novos detalhes logo abaixo;
- quantidades respeitam até oito casas decimais e preços usam BRL;
- o layout foi ajustado para desktop e dispositivos móveis;
- a classificação de operação foi centralizada para formulário e histórico;
- testes unitários cobrem compra, venda, subscrição e tipos sem detalhes de operação;
- o E2E valida quantidade e preço unitário após uma compra real.

### Página de histórico completo

- o dashboard passou a mostrar somente os 20 lançamentos mais recentes;
- o título `Lançamentos` passou a navegar para o histórico completo da carteira;
- foi adicionado outro link de acesso ao final da lista recente;
- uma nova rota protegida apresenta todos os lançamentos, do mais recente para o mais antigo;
- a página detalha data, tipo, ativo, quantidade, preço unitário, taxas, valor total,
  evento corporativo e descrição;
- filtros combináveis permitem consultar por período inicial/final, tipo e ativo;
- a ação `Novo lançamento` leva ao formulário incorporado na própria página;
- testes unitários verificam o limite, os links, a ordenação e os estados da nova página;
- o E2E percorre a navegação, os filtros e o retorno ao cadastro de lançamento.

### Páginas de posições e proventos

- foi criada uma página protegida com todas as posições e indicadores por ativo;
- foi criada uma página protegida de proventos com filtros, agrupamentos, total e histórico;
- títulos do dashboard navegam diretamente para as novas páginas;
- um formulário reutilizável de lançamento foi incorporado às páginas de posições,
  proventos e histórico completo;
- a página de posições aceita registros que alteram posição e a página de proventos
  restringe o formulário a dividendo e JCP;
- salvamentos atualizam imediatamente os dados da página atual;
- testes unitários cobrem as páginas e os diferentes tipos do formulário;
- o E2E navega pelas três páginas e cadastra um provento pelo formulário reutilizável.

### Navegação principal e layout de lançamentos

- a topbar das páginas autenticadas passou a oferecer acesso a Visão geral,
  Posições, Lançamentos e Proventos, preservando a carteira atual;
- na página de lançamentos, o formulário passou para a coluna esquerda;
- filtros e histórico permanecem juntos na coluna direita;
- o layout só volta a empilhar as seções em telas menores;
- testes unitários e E2E verificam a estrutura e o posicionamento em desktop.

### Dados de demonstração restritos ao desenvolvimento

- o inicializador de demonstração passou a existir somente no perfil Spring `dev`;
- o Docker Compose local ativa explicitamente esse perfil;
- a flag `DEMO_DATA_ENABLED` continua permitindo desligar a carga mesmo em desenvolvimento;
- um teste com perfil `dev` valida a carga completa e idempotente;
- outro teste com perfil `test` e flag ligada comprova que o bean e o usuário de
  demonstração não são criados fora do ambiente de desenvolvimento.

### Tema orbital e alternância de aparência

- foi criada a branch `feat/tema-orbital` para isolar a nova identidade visual;
- foi implementado um tema escuro inspirado em interfaces aeroespaciais, com alto
  contraste, tipografia condensada, superfícies retas e detalhes técnicos;
- o tema cobre login, dashboard, perfil, posições, lançamentos, proventos, detalhe
  de ativo, formulários, tabelas, avisos e modais;
- foi mantido o tema claro anterior como alternativa;
- um botão global no topo permite alternar a aparência em qualquer rota;
- a preferência é persistida no `localStorage`, com comportamento seguro quando o
  armazenamento do navegador estiver indisponível;
- o seletor possui nome acessível, estado `aria-pressed` e tamanho adequado para
  interação por toque;
- o tema orbital é usado por padrão quando ainda não existe uma preferência salva;
- testes unitários verificam aplicação, alternância e persistência;
- o fluxo E2E verifica a alternância, recarregamento e presença do controle nas
  principais telas do sistema;
- o resultado foi inspecionado visualmente em viewports desktop e mobile.

### Compatibilidade com TypeScript 6 e 7

- foram removidas as opções obsoletas `baseUrl` e `downlevelIteration` do
  `frontend/tsconfig.json`;
- `baseUrl` não possuía mapeamentos `paths` dependentes dele;
- `downlevelIteration` não tinha efeito porque o frontend gera JavaScript ES2022;
- a migração foi feita diretamente, sem mascarar os avisos com
  `ignoreDeprecations`.

### Proventos por posição e distribuição compacta

- a API do dashboard passou a agregar dividendos e JCP por ativo usando os
  lançamentos já carregados para o total geral;
- cada posição agora expõe `totalIncome`, inclusive com valor zero quando ainda
  não recebeu proventos;
- as listas de posições do dashboard e da página completa exibem a nova coluna
  Proventos em BRL;
- a área de distribuição por categoria foi reduzida para aproximadamente um
  quinto da grade de posições em desktop;
- em telas menores, posições e distribuição continuam empilhadas;
- testes de integração, unitários e E2E validam o agregado, a apresentação e a
  nova proporção do layout.

### Organização dos componentes Angular

- cada componente de página passou a ter uma pasta própria em `app/pages`;
- os componentes compartilhados `record-form`, `system-modal` e `theme-toggle`
  também receberam diretórios próprios em suas respectivas camadas;
- os testes foram movidos junto dos componentes correspondentes;
- os onze templates de produção foram extraídos dos decoradores Angular para
  arquivos `.component.html` externos;
- o componente raiz ganhou `app.component.html` sem alterar sua posição na raiz
  da aplicação;
- rotas e imports relativos foram atualizados para a nova estrutura;
- as diretrizes do repositório agora documentam a convenção de organização.

### Menu de ações da carteira

- os controles de nova carteira, renomeação e exclusão foram reunidos em um único
  botão “Ações da carteira”;
- as opções são exibidas em um painel flutuante sem deslocar o conteúdo;
- renomeação e exclusão só aparecem quando existe uma carteira selecionada;
- o menu fecha após uma ação, ao clicar fora ou pressionar Escape;
- o botão expõe `aria-haspopup`, `aria-expanded` e devolve o foco após Escape;
- o indicador textual foi substituído por um ícone vetorial de ações com três
  pontos verticais;
- o layout foi adaptado aos temas claro e orbital e ocupa toda a largura no mobile;
- testes unitários e E2E cobrem abertura, opções disponíveis e interação por teclado.

### Cadastro contextual de carteira

- o formulário da primeira carteira ganhou um botão Cancelar que também limpa o
  nome digitado;
- quando já existe uma carteira, a opção Nova carteira abre um modal com campo de
  nome, seguindo o mesmo padrão visual e acessível da renomeação;
- a criação inline e a criação pelo modal compartilham a mesma rotina de envio;
- ao fechar o modal, o foco retorna ao botão Ações da carteira;
- o formulário inline passa a empilhar seus controles em telas pequenas;
- testes unitários e E2E cobrem os dois contextos de criação e o cancelamento;
- o timeout do fluxo E2E completo foi ajustado para 60 segundos para acomodar o
  cenário integral em ambientes mais lentos.

### Lançamentos em modal e painéis lado a lado

- o formulário fixo de lançamento foi removido da página inicial;
- um botão Novo lançamento passou a ser exibido abaixo dos controles da
  carteira, ainda dentro da área principal de apresentação;
- cadastro e edição usam o mesmo modal, preservando os campos e a altura do
  formulário entre os diferentes tipos de lançamento;
- o modal recebe o foco ao abrir, contém a navegação por Tab, fecha com Escape
  ou pelo botão Cancelar e devolve o foco ao controle que o abriu;
- as áreas Lançamentos, Evolução e Proventos foram reunidas em uma grade de três
  colunas no desktop e continuam responsivas em telas menores;
- os testes unitários e o fluxo E2E foram atualizados para cobrir abertura,
  edição, retorno de foco e disposição dos três painéis.

### Atividade recente compacta

- a página inicial passou a exibir somente os 10 lançamentos mais recentes;
- os itens da atividade foram compactados, com ações dispostas verticalmente;
- Atividade recente e Evolução deixaram de limitar a altura e não exibem mais
  rolagem vertical interna;
- o histórico completo continua disponível pelo título e pelo link ao final da
  lista de lançamentos.

### Proventos mensais no dashboard

- a antiga análise por período foi substituída por uma área de Proventos;
- o painel consulta e exibe somente os últimos 12 meses, do mês atual ao mais
  antigo;
- os meses formam uma lista expansível de `income-month-details`; o mês atual
  inicia aberto e cada título `income-selected-month` pode ser acionado para
  exibir a tabela logo abaixo do próprio mês;
- o detalhamento mensal mostra ativo, tipo, data de pagamento e valor;
- filtros, agrupamentos e o valor total recebido foram removidos do dashboard;
- meses sem recebimentos permanecem disponíveis e apresentam um estado vazio;
- testes unitários e E2E verificam o intervalo, a seleção inicial, a troca de mês
  e a ausência dos controles removidos.

### Redirecionamento após expiração da sessão

- respostas de autenticação ausente ou token inválido em endpoints protegidos
  passaram de `403 Forbidden` para `401 Unauthorized` no backend;
- o interceptor tenta renovar o token de acesso e limpa a sessão quando o
  refresh token também é recusado;
- respostas `403` vazias continuam sendo reconhecidas defensivamente como
  rejeição de sessão, sem confundir erros de negócio que possuem mensagem;
- ao encerrar a sessão, o frontend substitui a rota atual por `/login`, evitando
  o retorno pelo histórico do navegador a uma página protegida expirada;
- testes de integração, unitários e E2E cobrem token inválido, falha de renovação,
  limpeza do armazenamento local e redirecionamento para o login.

### Correções da quarta revisão

- a carga demonstrativa passou a verificar a existência do e-mail configurado
  antes de qualquer consulta ou mutação de ativos, carteiras e lançamentos;
- quando o e-mail já existe, o inicializador encerra sem alterar dados do
  usuário, inclusive carteiras que tenham o mesmo nome usado na demonstração;
- os sete ativos necessários são validados em conjunto antes da atualização de
  cotações e da criação do perfil demonstrativo;
- catálogo incompleto ou com ativo exigido inativo gera um aviso e cancela
  apenas a carga de demonstração, sem impedir a inicialização da aplicação;
- testes unitários cobrem a ausência total de mutações para usuário existente e
  a interrupção controlada quando falta um ativo.

### Identificadores UUIDv7

- a geração de chaves primárias foi centralizada em um gerador compatível com o
  layout UUIDv7 definido pela RFC 9562;
- novos usuários, ativos, carteiras, lançamentos, notas, tokens de conta e
  refresh tokens usam timestamp Unix em milissegundos e 74 bits aleatórios;
- as colunas PostgreSQL permanecem com o tipo `uuid`, permitindo coexistência
  transparente entre registros UUIDv4 antigos e UUIDv7 novos;
- o UUIDv4 usado como material aleatório para senha interna no login Google não
  foi alterado, pois não representa um identificador persistente;
- testes validam versão, variante, timestamp, unicidade em sequência e a versão
  do identificador retornado pela API ao criar uma carteira.

## Verificações executadas

Ao longo do desenvolvimento foram usados os comandos canônicos:

```bash
cd backend
mvn clean verify

cd ../frontend
npm ci
npm run test:coverage
npm run build
npm run e2e

cd ..
docker compose build
docker compose up -d
docker compose ps
git diff --check
```

No último ciclo de validação registrado:

- os 23 testes do backend e os 48 testes do frontend passaram;
- a cobertura do frontend ficou em 92,78% de statements, 81,78% de branches,
  96,99% de funções e 94,58% de linhas;
- todas as verificações de cobertura do backend foram atendidas;
- o build Angular passou localmente e dentro do Docker;
- o E2E Playwright passou usando a stack real;
- frontend, backend e PostgreSQL ficaram saudáveis no Docker Compose;
- o endpoint de saúde do backend respondeu com `status: UP`;
- `git diff --check` não encontrou erros de whitespace;
- nenhum push para repositório remoto foi realizado;
- nenhum segredo real foi armazenado no repositório.

## Commits existentes

| Commit | Data | Descrição |
| --- | --- | --- |
| `f6a4a6b` | 30/07/2026 22:47 | Implementação inicial do MVP web |
| `d9dab45` | 30/07/2026 23:18 | Edição de lançamentos |
| `365ad8e` | 30/07/2026 23:49 | Pendências da primeira revisão |
| `dad8b8f` | 31/07/2026 14:08 | Estabilização do formulário |
| `0a48f85` | 31/07/2026 14:41 | Correções da segunda revisão |
| `f221fc7` | 31/07/2026 16:27 | BRL, períodos e evolução |
| `a50c75d` | 31/07/2026 18:10 | Busca de ativo na compra |
| `5f2d7d3` | 31/07/2026 20:47 | Revisão 03, modais acessíveis e histórico |
| `1dbc4a8` | 31/07/2026 22:49 | Páginas completas da carteira e navegação principal |
| `e00f09b` | 02/08/2026 09:07 | Tema orbital e compatibilidade com TypeScript 6 |
| `2ee64a4` | 02/08/2026 09:56 | Proventos por posição e distribuição compacta |
| `ba58846` | 02/08/2026 20:43 | Ações e cadastro contextual de carteira |
