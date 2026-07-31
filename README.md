# MAD — Meus Ativos Digitais

MVP web para controle de carteiras brasileiras de ações e FIIs. A aplicação permite criar conta e múltiplas carteiras, registrar, editar e excluir operações, proventos, bonificações e eventos corporativos, manter notas por ativo e consultar posição, custo de aquisição, valor atual, P&L, rentabilidade, alocação e evolução do custo.

## Tecnologias

- Java 21, Spring Boot 3.5, Spring Security, JWT, JPA e Flyway
- Angular 21
- PostgreSQL 17
- Maven, npm, Docker e Docker Compose
- JUnit, MockMvc, AssertJ, Vitest, JaCoCo e Playwright

## Executar com Docker

Pré-requisito: Docker com o plugin Compose.

1. Opcionalmente, copie `.env.example` para `.env` e altere as credenciais locais.
2. Suba a stack:

   ```bash
   docker compose up --build -d
   ```

3. Aguarde os três serviços ficarem saudáveis:

   ```bash
   docker compose ps
   ```

4. Acesse:

   - Frontend: http://localhost:4200
   - API: http://localhost:8080/api
   - Saúde do backend: http://localhost:8080/actuator/health

Para acompanhar logs ou encerrar:

```bash
docker compose logs -f
docker compose down
```

Os dados do PostgreSQL ficam no volume `mad_postgres_data`. Para também remover dados locais de desenvolvimento, use `docker compose down -v`.

## Executar em modo de desenvolvimento

Inicie apenas o banco:

```bash
docker compose up -d db
```

Backend:

```bash
cd backend
mvn spring-boot:run
```

Frontend, em outro terminal:

```bash
cd frontend
npm install
npm start
```

O proxy do Angular encaminha `/api` para `localhost:8080`.

## Builds e testes

```bash
cd backend
mvn clean verify

cd ../frontend
npm ci
npm run test:coverage
npm run build

# Com a stack Docker em execução
npm run e2e
```

## Configuração

Nenhum segredo real é versionado. As seguintes variáveis podem ser definidas no `.env`:

| Variável | Uso |
| --- | --- |
| `POSTGRES_DB` | Nome do banco |
| `POSTGRES_USER` | Usuário do PostgreSQL |
| `POSTGRES_PASSWORD` | Senha do PostgreSQL |
| `JWT_SECRET` | Chave de assinatura dos tokens, com ao menos 32 caracteres |
| `JWT_EXPIRATION_MINUTES` | Duração do token |
| `BRAPI_API_TOKEN` | Token opcional da Brapi |
| `MARKET_DATA_ENABLED` | Habilita sincronização real de catálogo e cotações |
| `GOOGLE_CLIENT_ID` | Client ID público para login Google |
| `EXPOSE_ACCOUNT_TOKENS` | Exibe tokens de confirmação/recuperação na resposta para desenvolvimento local |
| `SMTP_HOST` / `SMTP_PORT` | Servidor SMTP usado para mensagens de conta |
| `SMTP_USER` / `SMTP_PASSWORD` | Credenciais SMTP, quando exigidas pelo provedor |
| `SMTP_AUTH` / `SMTP_STARTTLS` | Habilita autenticação e STARTTLS no SMTP |
| `MAIL_FROM` | Remetente das mensagens de conta |
| `FRONTEND_URL` | URL base usada nos links de confirmação e recuperação |

O catálogo recebe uma carga inicial idempotente para permitir uso offline e, quando
`MARKET_DATA_ENABLED=true`, é sincronizado semanalmente com a Brapi. Cotações são
atualizadas nos dias úteis somente para ativos referenciados em lançamentos, uma
requisição por ticker; uma falha preserva a última cotação válida. Defina
`BRAPI_API_TOKEN` se o plano da API exigir autenticação.

No ambiente local, `EXPOSE_ACCOUNT_TOKENS=true` permite concluir confirmação de
e-mail e recuperação de senha sem um servidor SMTP: o token é preenchido
automaticamente na tela. Em ambientes compartilhados, mantenha essa opção desativada
e configure o SMTP; a aplicação enviará links de confirmação e recuperação ao
endereço do usuário.

## API REST

Os endpoints, exceto cadastro/login e saúde, exigem `Authorization: Bearer <token>`.

| Método e rota | Função |
| --- | --- |
| `POST /api/auth/register` | Cadastro local |
| `POST /api/auth/confirm-email` | Confirmação de e-mail |
| `POST /api/auth/login` | Autenticação |
| `POST /api/auth/google` | Login Google por ID token |
| `POST /api/auth/forgot-password` | Início da recuperação de senha |
| `POST /api/auth/reset-password` | Redefinição de senha |
| `POST /api/auth/refresh` | Rotação do refresh token |
| `POST /api/auth/logout` | Revogação do refresh token |
| `GET /api/auth/me` | Usuário atual |
| `PUT/DELETE /api/profile` | Edição/exclusão da conta |
| `GET/POST /api/wallets` | Listagem/criação de carteiras |
| `PUT/DELETE /api/wallets/{id}` | Edição/exclusão; exclusão com registros exige `confirm=true` |
| `GET /api/assets` | Catálogo |
| `GET/POST /api/records` | Histórico e cadastro de lançamentos |
| `PUT/DELETE /api/records/{id}` | Edição/exclusão com recálculo |
| `GET /api/dashboard/{walletId}` | Consolidação da carteira |
| `GET /api/incomes` | Proventos filtrados e agrupados |
| `GET/POST /api/notes` | Notas por carteira/ativo |
| `PUT/DELETE /api/notes/{id}` | Edição/exclusão de nota |

Tipos de lançamento: `COMPRA`, `VENDA`, `SUBSCRICAO`, `DIVIDENDO`, `JCP`, `BONIFICACAO`, `DESDOBRAMENTO` e `GRUPAMENTO`.

## Cobertura automatizada

Os comandos de verificação falham abaixo de 80% de linhas/instruções no backend
e abaixo de 80% de linhas/statements/funções no frontend. O E2E percorre cadastro,
confirmação, criação de carteira, lançamento, detalhe do ativo e nota usando a stack
real. Integrações externas não recebem credenciais fictícias; Google e Brapi são
habilitados somente pelas variáveis de ambiente acima.
