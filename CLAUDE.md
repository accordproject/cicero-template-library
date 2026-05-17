# Claude Code - cicero-template-library

## Repository structure

- `src/<template-name>/` — each template is an npm workspace
  - `model/*.cto` — Concerto model files (source of truth for types)
  - `logic/logic.ts` — TypeScript business logic
  - `logic/logic.test.ts` — unit tests (uses `// @ts-nocheck`)
  - `logic/generated/` — auto-generated TypeScript from .cto models (DO NOT hand-edit)
  - `sample.json` — example data conforming to the TemplateModel
  - `text/grammar.tem.md` — template markup
  - `package.json` — workspace package with `compile` and `test` scripts

## Key commands

```bash
# Run all unit tests across all template workspaces
npm run test --workspaces --if-present

# Run render/compilation tests
npm run test:render

# Run render tests for specific templates only
TEMPLATES=acceptance-of-delivery,fragile-goods npm run test:render

# Compile a single template (regenerates logic/generated/ from model/*.cto)
cd src/<name> && npm run compile

# Run unit tests for a single template
cd src/<name> && npm test
```

## Critical: generated files

Files in `logic/generated/` are **auto-generated** by `concerto compile` from the `.cto` model files. The render test suite runs `npm run compile` as part of its compilation test, which regenerates these files. **Never hand-edit generated files** — fix the model (`.cto`) instead. Any manual edits will be overwritten on the next compile.

## money@0.3.0 IMonetaryAmount migration

Many templates were migrated from plain numeric fields to `IMonetaryAmount` objects:

```typescript
// IMonetaryAmount shape
{
  $class: 'org.accordproject.money@0.3.0.MonetaryAmount',
  doubleValue: number,
  currencyCode: CurrencyCode  // enum, not string
}
```

Common fix patterns:
- **Reading**: `data.amount.doubleValue` (not `data.amount`)
- **Arithmetic**: extract `.doubleValue` first, do math, wrap result back
- **Currency codes**: use `CurrencyCode.USD` enum (import from `./generated/org.accordproject.money@0.3.0`), not `'USD'` string literal
- **Passing through**: `data.unitPrice.currencyCode` is already typed as `CurrencyCode`

The `monetary()` helper function in many templates:
```typescript
function monetary(doubleValue: number, currencyCode: CurrencyCode): IMonetaryAmount {
    return { $class: 'org.accordproject.money@0.3.0.MonetaryAmount', doubleValue, currencyCode };
}
```

## sample.json validation

The render test deserializes `sample.json` via `template.getSerializer().fromJSON(data)`. This validates:
- Every `$class` must resolve to a loaded namespace
- Every property must exist in the model definition
- Every value must match the declared Concerto type (`Double` → number, `String` → string, `DateTime` → ISO string, concept → object with `$class`)

Common failures:
- Stale `$class` with wrong version (e.g., `@0.1.0` vs `@0.2.0`)
- Properties removed from model but still in sample.json
- Type changed in model (e.g., `Double` → `MonetaryAmount`) but sample.json not updated

## Duplicate concept names across namespaces

If a template's `.cto` defines a concept with the same name as one in a shared dependency (e.g., `CurrencyConversion` in both `clause.cto` and `money@0.3.0`), the codegen produces duplicate `import type { ISameName }` in `concerto@1.0.0.ts`. Fix by renaming the local concept in the `.cto` file.

## Test architecture

- **Unit tests** (`logic/logic.test.ts`): Use `// @ts-nocheck`, test runtime behavior only. Run via vitest in each workspace.
- **Render tests** (`test/render.test.mjs`): Compilation + sample.json validation + template-engine rendering. `expectedFailures` set marks templates with known upstream issues (use `it.fails`).
- **CI**: GitHub Actions runs `npm test` which does both workspace unit tests and render tests.
