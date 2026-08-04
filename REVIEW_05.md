# Quinta revisão de implementação do MVP

**Data da revisão:** 4 de agosto de 2026  
**Status geral:** 2 pendências resolvidas nas animações da interface

## Resumo executivo

As alterações de movimento introduziram uma animação de entrada do modal que
terminava antes do diálogo e mantinham os controles do menu de carteiras
acessíveis por teclado durante sua animação de saída. Ambos os problemas foram
corrigidos e receberam cobertura automatizada.

Esta quinta revisão reúne 2 pendências de prioridade P2 resolvidas.

## Pendências P2

### 1. Manter a classe de entrada durante toda a animação do diálogo

**Status:** resolvido  
**Local:** `frontend/src/styles.css:207-208`  
**Referência:** animação de entrada do modal

O Angular determina a conclusão da animação pelo elemento que contém
`animate.enter`. A animação de 140 ms do backdrop termina e remove a classe
`motion-modal-enter` enquanto a animação de 240 ms do diálogo descendente ainda
está em execução.

O backdrop e o diálogo agora usam a mesma duração de 240 ms. Assim, o Angular
mantém `motion-modal-enter` até a conclusão de `motion-dialog-in`, sem cancelar
a animação descendente ou provocar salto para o estado final.

### 2. Tornar inerte o menu de carteiras durante a animação de saída

**Status:** resolvido  
**Local:** `frontend/src/app/pages/dashboard/dashboard.component.html:42-43`  
**Referência:** acessibilidade da interface

Ao fechar o menu, `animate.leave` o mantém no DOM por 140 ms. A regra
`pointer-events: none` bloqueia somente a interação por ponteiro; os botões
continuam incluídos na ordem de tabulação e podem ser acionados pelo teclado
durante esse intervalo. Por exemplo, pressionar Escape e Tab rapidamente pode
mover o foco para uma ação do menu que está desaparecendo.

O menu reutiliza a diretiva de saída dos overlays e é marcado como `inert` e
`aria-hidden` sincronamente antes de o estado aberto ser removido. Seus botões
saem imediatamente da navegação por teclado e da árvore acessível, enquanto o
efeito visual termina sem bloquear interações.

## Verificação das correções

1. O E2E compara as durações computadas do backdrop e do diálogo e exige que a
   animação raiz dure pelo menos tanto quanto a animação descendente.
2. O E2E fecha o menu com Escape, verifica `inert`, `aria-hidden`, remoção do
   grupo da árvore acessível e devolução do foco ao botão acionador.
3. O teste unitário da diretiva cobre especificamente a animação
   `motion-menu-out`.
4. Os 52 testes do frontend, o build Angular e o fluxo Playwright passaram.

## Ordem recomendada de correção

1. Garantir que a classe de entrada permaneça aplicada até o término da
   animação do diálogo.
2. Remover os controles do menu da navegação por teclado durante sua animação
   de saída.
