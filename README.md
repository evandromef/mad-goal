# MAD — Meus Ativos Digitais

MVP web para controle de carteiras brasileiras de ações e FIIs. A aplicação permite criar conta e múltiplas carteiras, registrar, editar e excluir operações, proventos, bonificações e eventos corporativos, manter notas por ativo e consultar posição, custo de aquisição, valor atual, P&L, rentabilidade, alocação e evolução do custo.

## Tecnologias

- Java 21, Spring Boot 3.5, Spring Security, JWT, JPA e Flyway
- Angular 21
- PostgreSQL 17
- Maven, npm, Docker e Docker Compose
- JUnit, MockMvc, AssertJ e Vitest

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
npm test
npm run build
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

O catálogo recebe uma carga inicial idempotente de ativos conhecidos para permitir uso local sem depender de uma API externa. As cotações são dados demonstrativos com data de referência explícita; a arquitetura mantém uma única cotação atual por ativo.

## API REST

Os endpoints, exceto cadastro/login e saúde, exigem `Authorization: Bearer <token>`.

| Método e rota | Função |
| --- | --- |
| `POST /api/auth/register` | Cadastro local |
| `POST /api/auth/login` | Autenticação |
| `GET /api/auth/me` | Usuário atual |
| `PUT/DELETE /api/profile` | Edição/exclusão da conta |
| `GET/POST /api/wallets` | Listagem/criação de carteiras |
| `PUT/DELETE /api/wallets/{id}` | Edição/exclusão; exclusão com registros exige `confirm=true` |
| `GET /api/assets` | Catálogo |
| `GET/POST /api/records` | Histórico e cadastro de lançamentos |
| `PUT/DELETE /api/records/{id}` | Edição/exclusão com recálculo |
| `GET /api/dashboard/{walletId}` | Consolidação da carteira |
| `GET/POST /api/notes` | Notas por carteira/ativo |
| `PUT/DELETE /api/notes/{id}` | Edição/exclusão de nota |

Tipos de lançamento: `COMPRA`, `VENDA`, `SUBSCRICAO`, `DIVIDENDO`, `JCP`, `BONIFICACAO`, `DESDOBRAMENTO` e `GRUPAMENTO`.

## Decisões do MVP local

Integrações que dependem de contas externas — login Google, envio de e-mail e atualização real pela API financeira — não recebem credenciais fictícias. O núcleo local oferece cadastro por e-mail/senha e catálogo/cotações demonstrativos. Isso preserva execução determinística e evita armazenar segredos; provedores reais devem ser habilitados por configuração em um ambiente que forneça as respectivas credenciais.
