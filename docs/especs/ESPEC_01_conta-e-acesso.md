# ESPEC 01 - Conta e Acesso do Usuario

## 1. Identificacao

- **ID:** ESPEC-01
- **Nome da Funcionalidade:** Conta e Acesso do Usuario
- **Modulo/Area:** Conta / Autenticacao
- **Status:** Rascunho
- **Versao:** 1.0
- **RFs relacionados (ERS):** RF-001, RF-002, RF-003, RF-004, RF-005
- **RNs relacionadas (ERS):** RN-011
- **RNFs relacionados (ERS):** RNF-002, RNF-003, RNF-004, RNF-005, RNF-006, RNF-010, RNF-011, RNF-013, RNF-017

## 2. Objetivo

Permitir que o investidor crie conta, acesse o sistema, recupere senha, use login Google e mantenha os proprios dados cadastrais com isolamento total entre usuarios.

## 3. Escopo desta ESPEC

**Inclui:**

- Cadastro com e-mail e senha, com confirmacao por e-mail.
- Login com e-mail e senha.
- Login social com Google OAuth 2.0 / OpenID Connect.
- Recuperacao de senha por e-mail, com link valido por no maximo 30 minutos.
- Edicao de nome e e-mail do proprio perfil.
- Exclusao definitiva da propria conta mediante confirmacao explicita.

**Nao inclui:**

- Compartilhamento de carteira entre usuarios.
- Multiplos perfis de acesso.
- Cadastro de ativos, carteiras ou lancamentos financeiros.

## 4. Atores

- **Investidor Pessoa Fisica** — unico ator humano do sistema.
- **Sistema** — envia e-mails transacionais, emite tokens e integra com Google.

## 5. Casos de Uso / User Stories

- **US-01:** Como investidor, eu quero criar conta com e-mail e senha, para acessar minhas carteiras. *(RF-001)*
- **US-02:** Como investidor, eu quero entrar com e-mail e senha, para acessar meus dados. *(RF-002)*
- **US-03:** Como investidor, eu quero acessar com conta Google, para entrar sem criar senha especifica do MAD. *(RF-003, RN-011)*
- **US-04:** Como investidor, eu quero redefinir minha senha por e-mail, para recuperar o acesso. *(RF-004)*
- **US-05:** Como investidor, eu quero editar ou excluir minha conta, para manter ou remover meus dados pessoais e financeiros. *(RF-005, RNF-006)*

## 6. Fluxo Principal

### 6.1 Cadastro com e-mail e senha

1. O usuario acessa a tela de cadastro.
2. O usuario informa nome, e-mail e senha.
3. O sistema valida os campos.
4. O sistema cria a conta com senha armazenada como hash com salt.
5. O sistema envia e-mail de confirmacao.
6. O sistema informa que a confirmacao por e-mail e necessaria.

### 6.2 Login com e-mail e senha

1. O usuario acessa a tela de login.
2. O usuario informa e-mail e senha.
3. O sistema valida as credenciais.
4. O sistema autentica o usuario via token.
5. O sistema direciona o usuario ao dashboard.

### 6.3 Login com Google

1. O usuario escolhe entrar com Google.
2. O sistema executa o fluxo OAuth 2.0 / OpenID Connect.
3. O sistema recebe identificador, nome e e-mail verificado do Google.
4. Se ja existir conta com o mesmo e-mail, o sistema vincula a identidade Google a essa conta.
5. Se nao existir conta, o sistema cria uma nova conta com nome e e-mail retornados pelo provedor.
6. O sistema autentica o usuario via token e direciona ao dashboard.

### 6.4 Recuperacao de senha

1. O usuario solicita redefinicao de senha informando e-mail.
2. O sistema gera token de uso unico com validade maxima de 30 minutos.
3. O sistema envia link de redefinicao por e-mail.
4. O usuario acessa o link valido e informa nova senha.
5. O sistema altera a senha, revoga sessoes aplicaveis e invalida o token.

### 6.5 Edicao e exclusao da conta

1. O usuario autenticado acessa o proprio perfil.
2. O usuario edita nome/e-mail ou solicita exclusao da conta.
3. Para exclusao, o sistema exige confirmacao explicita.
4. O sistema remove definitivamente dados pessoais e financeiros, conforme LGPD, e anonimiza vinculo de auditoria tecnica quando aplicavel.

## 7. Fluxos Alternativos e Excecoes

- **Cenario:** Credenciais invalidas no login
  - **Comportamento esperado:** O sistema exibe mensagem de erro em ate 2 segundos.
- **Cenario:** E-mail ja cadastrado
  - **Comportamento esperado:** O sistema bloqueia novo cadastro tradicional duplicado.
- **Cenario:** Conta Google retorna e-mail ja existente
  - **Comportamento esperado:** O sistema vincula a identidade Google a conta existente, mantendo carteiras e dados.
- **Cenario:** Token de recuperacao expirado ou ja usado
  - **Comportamento esperado:** O sistema bloqueia a redefinicao e solicita novo fluxo.
- **Cenario:** Usuario tenta acessar dados de outro usuario
  - **Comportamento esperado:** O sistema nega a consulta ou alteracao.

## 8. Especificacao de Campos

- **Campo:** Nome
  - **Tipo:** Texto
  - **Obrigatorio:** Sim
  - **Regras de Validacao:** Nao vazio.
  - **Valor Maximo:** 150 caracteres, conforme `usuario.nome`.

- **Campo:** E-mail
  - **Tipo:** Texto
  - **Obrigatorio:** Sim
  - **Regras de Validacao:** Formato de e-mail, normalizado, unico.
  - **Valor Maximo:** 320 caracteres, conforme `usuario.email`.

- **Campo:** Senha
  - **Tipo:** Segredo
  - **Obrigatorio:** Sim para conta tradicional.
  - **Regras de Validacao:** Deve ser armazenada somente como hash com salt.
  - **Observacao:** Politica de complexidade minima nao esta definida na documentacao atual.

- **Campo:** Token de recuperacao
  - **Tipo:** Token de uso unico
  - **Obrigatorio:** Sim no fluxo de redefinicao.
  - **Regras de Validacao:** Hash persistido; validade maxima de 30 minutos; uso unico.

## 9. Regras de Negocio Aplicaveis

### 9.1 Regras de Negocio e Calculo

- **RN-011:** Login Google com e-mail ja cadastrado deve vincular a identidade Google a conta existente.
  - **Pseudocodigo:**

    ```text
    se google.email_verificado existe em usuario.email:
        criar identidade_oidc vinculada ao usuario existente
    senao:
        criar usuario e identidade_oidc
    ```

- **RNF-003:** Senhas nunca sao persistidas em texto plano.
- **RNF-004:** O sistema armazena somente dados necessarios da identidade Google, nunca a senha Google.
- **RNF-005:** Toda consulta ou alteracao deve validar propriedade dos dados pelo usuario autenticado.

### 9.2 Efeitos em Outras Entidades

- **Entidade afetada:** `identidade_oidc`
  - **O que muda:** Criacao ou vinculacao da identidade Google.
  - **Quando:** No primeiro login Google de uma conta.

- **Entidade afetada:** `token_uso_unico`
  - **O que muda:** Criacao, uso e expiracao de tokens de confirmacao e recuperacao.
  - **Quando:** Cadastro e recuperacao de senha.

- **Entidade afetada:** Dados financeiros do usuario
  - **O que muda:** Remocao definitiva na exclusao da conta.
  - **Quando:** Confirmacao explicita de exclusao.

## 10. Interface do Usuario

- Tela de login com opcoes e-mail/senha e Google.
- Tela de cadastro com nome, e-mail e senha.
- Tela de recuperacao de senha por e-mail.
- Tela de perfil para edicao de nome/e-mail e exclusao da conta.
- Mensagens e datas em pt-BR; formularios com validacao junto ao campo.

## 11. Criterios de Aceitacao

- **Dado** um e-mail novo e dados validos, **quando** o usuario criar conta, **entao** o sistema deve criar a conta e enviar e-mail de confirmacao.
- **Dado** credenciais invalidas, **quando** o usuario tentar login, **entao** o sistema deve exibir erro em ate 2 segundos.
- **Dado** uma conta tradicional existente, **quando** o usuario entrar com Google usando o mesmo e-mail verificado, **entao** o sistema deve vincular a identidade Google a conta existente.
- **Dado** uma solicitacao de recuperacao, **quando** o usuario acessar link expirado apos 30 minutos, **entao** o sistema deve bloquear a redefinicao.
- **Dado** uma conta autenticada, **quando** o usuario confirmar exclusao, **entao** o sistema deve remover seus dados pessoais e financeiros conforme LGPD.

## 12. Dependencias

- Provedor de e-mail transacional.
- Integracao Google OIDC.
- Estrategia de autenticacao definida na arquitetura.

## 13. Referencias

- [ERS](../ers.md)
- [Modelo de Dados](../../arquitetura/modelo_dados.md)
- [Documento de Arquitetura](../../arquitetura/documento_arquitetura_MAD.md)
- [ADR-003](../../arquitetura/adr/adr-003-provedor-oauth.md)
- [ADR-005](../../arquitetura/adr/adr-005-estrategia-autenticacao.md)

## Contexto para IA

### Objetivo

Implementar conta, login tradicional, login Google, recuperacao de senha, perfil e exclusao da propria conta.

### Dependencias

- E-mail transacional
- Google OIDC
- JWT e refresh token

### Ordem de validacao dos campos

1. Validar obrigatoriedade.
2. Validar formato.
3. Normalizar e-mail.
4. Validar unicidade ou vinculacao.
5. Persistir somente hashes de senhas e tokens.

### Observacoes

- A documentacao atual nao define politica minima de complexidade de senha nem validade do token de confirmacao de e-mail.
