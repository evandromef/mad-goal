# Repository Guidelines

## Project Structure & Module Organization

This repository contains the requirements, feature specifications, and the MAD application.

- `ers.md`: system requirements, business rules, glossary, and non-functional requirements.
- `escopo_mvp.md`: features included in and excluded from the MVP.
- `espec_template.md`: required structure for new feature specifications.
- `especs/`: numbered, self-contained specifications such as `ESPEC_03_operacoes.md`.
- `backend/`: Spring Boot API, Flyway migrations, and backend tests.
- `frontend/`: Angular application, component tests, and Playwright flows.

Keep cross-document identifiers aligned. Every RF, RN, or RNF referenced by an ESPEC must exist in `ers.md`, and MVP claims must agree with `escopo_mvp.md`.

## Build, Test, and Development Commands

Use the canonical application checks when changing executable code:

```bash
cd backend && mvn clean verify
cd frontend && npm ci && npm run test:coverage && npm run build
cd frontend && npm run e2e # requires the Docker stack
```

Use lightweight checks when editing documentation:

```bash
rg --files
rg 'RF-[0-9]{3}|RN-[0-9]{3}|RNF-[0-9]{3}' especs/
git diff --check
git diff --word-diff
```

These commands inventory files, inspect requirement references, catch whitespace errors, and review prose changes. If executable code is introduced, add its canonical build and test commands here in the same change.

## Coding Style & Naming Conventions

Write Markdown in Portuguese to match the product documents. Use ATX headings (`#`, `##`), short paragraphs, ordered lists for flows, and bullet lists for rules. Preserve domain terms from the ERS rather than introducing synonyms. Name specifications `ESPEC_XX_nome-da-funcionalidade.md`, using a two-digit sequence and lowercase kebab-case description. Start new specifications from `espec_template.md`; remove all instructional placeholders before review.

## Testing Guidelines

Treat acceptance criteria as the current test layer. Express them in **Dado/Quando/Então** form and cover the happy path, validation failures, boundary values, and effects on related entities. Confirm formulas and pseudocode against applicable business rules. Manually verify that headings are complete and that referenced ESPEC dependencies and requirement IDs resolve.

## Commit & Pull Request Guidelines

The repository has no commit history from which to infer an established convention. Use concise, imperative commits with a clear scope, for example `docs(espec-03): clarify sale validation`.

Pull requests should summarize the behavior or requirement changed, list affected RF/RN/RNF identifiers, explain cross-document impacts, and link the relevant issue. Include screenshots only when rendered diagrams or other visual documentation changes. Keep unrelated specification changes in separate pull requests.
