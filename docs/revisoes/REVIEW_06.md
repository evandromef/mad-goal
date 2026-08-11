# Sexta revisão da documentação

**Data da revisão:** 11 de agosto de 2026
**Status geral:** 2 pendências P2 na reorganização da documentação

## Resumo executivo

A reorganização dos documentos para o diretório `docs/` não introduziu segredos
de alta confiança nos arquivos versionados nem vulnerabilidades nas dependências
de produção do frontend.

Foram identificadas duas pendências de prioridade P2: o template obrigatório de
especificações não foi movido para o novo diretório e o índice aponta para um
nome incorreto da primeira revisão. Enquanto não forem corrigidos, ambos os
links retornam conteúdo inexistente ao navegar pela documentação no GitHub.

## Pendências P2

### 1. Restaurar o template obrigatório de especificações

**Status:** pendente
**Local:** `docs/README.md:10`
**Referência:** `AGENTS.md:43`

O arquivo `espec_template.md` foi removido da raiz sem ser adicionado como
`docs/espec_template.md`. Com isso, o link do índice fica quebrado e o template
obrigatório para a criação de novas ESPECs deixa de estar disponível no caminho
definido pelas diretrizes do repositório.

O arquivo deve ser movido para `docs/espec_template.md`, preservando seu
conteúdo e tornando válido o link existente no índice.

### 2. Corrigir o link para a primeira revisão

**Status:** pendente
**Local:** `docs/README.md:27`
**Referência:** primeira revisão de implementação do MVP

A primeira revisão foi movida para `docs/revisoes/REVIEW_01.md`, mas o índice
aponta para `revisoes/REVIEW.md`. Esse destino não existe e retorna erro ao
navegar pela documentação no GitHub.

O link deve apontar para `revisoes/REVIEW_01.md`, que é o nome do arquivo
versionado no novo diretório.

## Verificações realizadas

1. Não foram encontrados segredos de alta confiança nos arquivos versionados.
2. Não foram encontradas vulnerabilidades nas dependências de produção do
   frontend.
3. Foi confirmada a ausência de `docs/espec_template.md`.
4. Foi confirmada a divergência entre o link `revisoes/REVIEW.md` e o arquivo
   `docs/revisoes/REVIEW_01.md`.

## Ordem recomendada de correção

1. Restaurar o template em `docs/espec_template.md`.
2. Atualizar o link da primeira revisão para `revisoes/REVIEW_01.md`.
