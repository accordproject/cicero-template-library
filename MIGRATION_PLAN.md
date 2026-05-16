# Plan: complete the MonetaryAmount logic migration

## Context

[PR #509](https://github.com/accordproject/cicero-template-library/pull/509) on branch `mr-monetary-amounts` (worktree: `/Users/matt/dev/gh/accordproject/cicero-template-library/.claude/worktrees/money-everywhere`). Models, sample data, JSON, grammars, generated TS bindings, and 9 templates' `logic.ts` are already migrated. **17 remaining templates have stale `logic.ts` / `logic.test.ts`** that still treat money as plain numbers. Each compiles today because workspace tests use `@ts-nocheck`, but at runtime the engine would deserialize a `MonetaryAmount` object and the math would produce `NaN`.

Current CI: **37 passing / 20 expected-fail / 0 unexpected**. Workspace tests all green. The plan keeps both invariants.

## The reusable recipe

Each migration is mechanical and follows the same five steps. The cheap-model executor applies these in order per template.

### Step 1 — Inspect the current `logic.ts`

Find every reference to a money field. The migration script's `FIELDS_BY_TEMPLATE` list (in `scripts/migrate-to-monetary.mjs`) names the money fields per template; treat that as the source of truth for what's "money" in each template.

### Step 2 — Add the money import + helper

At the top of `logic.ts`:
```ts
import { IMonetaryAmount } from './generated/org.accordproject.money@0.3.0';
```
(use the existing relative import style of the file — some use `"…"`, some use `'…'`)

Add this helper near the top, before the class:
```ts
function monetary(doubleValue: number, currencyCode: string): IMonetaryAmount {
    return {
        $class: 'org.accordproject.money@0.3.0.MonetaryAmount',
        doubleValue,
        currencyCode,
    };
}
```

### Step 3 — Apply four transformations to the logic body

| Pattern (before) | Pattern (after) | Why |
|---|---|---|
| `data.X` where X is a money field, used in arithmetic | `data.X.doubleValue` | unwrap to do math |
| `request.X` (same) | `request.X.doubleValue` | same |
| `state.X` (same) | `state.X.doubleValue` | same |
| `currencyCode: data.currencyCode,` inside an event/response/state object literal | **delete the line** | the field was stripped from the model; currency now lives inside the sibling `MonetaryAmount` |
| `currencyCode: 'USD',` inside an event/response/state object literal | **delete the line** | same |
| `<money_field>: <numeric_expr>,` in a return value where the model says that field is `MonetaryAmount` | `<money_field>: monetary(<numeric_expr>, <currency_source>),` | wrap the result |
| `request.currencyCode !== data.currencyCode` (a same-currency guard on a now-stripped field) | `request.<money_field>.currencyCode !== data.<money_field>.currencyCode` | preserve the guard with the new location of the currency |

**Currency source choice (`<currency_source>` above):**
- Default: use the request's money field's `.currencyCode`. The response derives from the request, so this preserves currency-by-construction.
- If the response depends on a `data.<field>` instead of a `request.<field>`, use that field's `.currencyCode`.
- For **FX templates** (only `latedeliveryandpenalty-currency-conversion`, already done): use `data.toCurrency`. Skip same-currency assertions.

**Same-currency assertion (optional, for templates where multiple money inputs are mixed):**
```ts
if (request.amountPaid.currencyCode !== data.amount.currencyCode) {
    throw new Error('Payment currency must match the contract currency');
}
```
Add this whenever the logic mixes two money inputs from different fields (e.g. `data.amount - request.amountPaid`). Don't add it when the logic only reads from one source.

### Step 4 — Update `logic.test.ts`

| Pattern (before) | Pattern (after) |
|---|---|
| `<money_field>: 1000,` (number literal) in a model/request/state fixture | `<money_field>: { $class: 'org.accordproject.money@0.3.0.MonetaryAmount', doubleValue: 1000, currencyCode: 'USD' },` |
| `expect(result.result.<money_field>).toBeCloseTo(N, ...)` | `expect(result.result.<money_field>.doubleValue).toBeCloseTo(N, ...)` |
| `expect(result.result.<money_field>).toBe(N)` | `expect(result.result.<money_field>.doubleValue).toBe(N)` + add `expect(result.result.<money_field>.currencyCode).toBe('USD');` |
| `expect(result.result.<money_field>).toBeGreaterThan(N)` | `expect(result.result.<money_field>.doubleValue).toBeGreaterThan(N)` |
| `expect(result.result.<money_field>).toBeLessThanOrEqual(N)` | `expect(result.result.<money_field>.doubleValue).toBeLessThanOrEqual(N)` |
| `expect(event.currencyCode).toBe(X)` | `expect(event.amount.currencyCode).toBe(X)` (or whichever money field the event has) |
| `expect(event.amount).toBe(N)` | `expect(event.amount.doubleValue).toBe(N)` |
| `expect(event.amount).toBe(result.result.penalty)` | `expect(event.amount).toEqual(result.result.penalty)` (object equality, not reference) |

If the same fixture appears 5 times (e.g. `goodsValue: 1000` in five tests), use `Edit` with `replace_all: true`.

### Step 5 — Verify

```bash
cd src/<template> && npx vitest run
```

Must pass. Then from the worktree root:
```bash
npm run test:render
```

Must show **37 passing / 20 expected-fail / 0 unexpected** (no regression). If a previously-expected-fail template now passes, remove it from `expectedFailures` in `test/render.test.mjs` — the test `it.fails` marker turns those into failures otherwise.

Commit with a message of the form:
```
feat(logic): <template-name> computes against MonetaryAmount

<one-line summary of what changed>
```
DCO sign-off (`-s`) is mandatory for the `accordproject` org — already in your auto-memory.

## Per-template work breakdown

Ordered easiest → hardest so the executor builds confidence early. Tagged with the money fields involved (sourced from `scripts/migrate-to-monetary.mjs`).

### Tier 1 — Single-money-field, no state, ~5 minutes each

| # | Template | Money fields | Notes |
|---|---|---|---|
| 1 | `full-payment-upon-demand` | `amount` | Drop the `currencyCode: data.currencyCode,` line in the event literal. `data.amount` is already `IMonetaryAmount`, so just pass it through; no wrap needed. **Test:** check for any `data.currencyCode` references and remove them. |
| 2 | `full-payment-upon-signature` | `amount` | Identical to #1. |
| 3 | `one-time-payment-tr` | `amount`, `totalPurchasePrice` | Drop the `currencyCode: data.currencyCode,` line. Pass `data.amount` / `data.totalPurchasePrice` through; they're already `IMonetaryAmount`. |
| 4 | `eat-apples` | `amount`, `price` | Drop any stale `currencyCode` lines. The math (if any) takes `.doubleValue`. |
| 5 | `fragile-goods` | `paymentAmount` | Drop stale `currencyCode` lines. |
| 6 | `interest-rate-swap` | `notionalAmount`, `outstandingBalance` | Single math line; wrap the response. |
| 7 | `rental-deposit` | `amount`, `balance`, `depositAmount` | Drop `currencyCode: data.currencyCode,` line. |
| 8 | `rental-deposit-with` | same as `rental-deposit` | Likely identical pattern to #7. |

### Tier 2 — Multiple money fields or state, ~10 minutes each

| # | Template | Money fields | Notes |
|---|---|---|---|
| 9 | `payment-upon-delivery` | `amount`, `totalAmount`, `costOfGoods`, `deliveryFee` | `totalAmount = costOfGoods + deliveryFee` — both `.doubleValue`; wrap result. Drop two `currencyCode: data.currencyCode` lines. |
| 10 | `payment-upon-signature` | `amount` | More complex than #2 — has state machine. Drop stale `currencyCode` lines (one was already removed by the earlier sed sweep; check). |
| 11 | `copyright-license` | `amount` | Drop stale lines. |
| 12 | `car-rental-tr` | `amount` | Drop stale lines. |
| 13 | `docusign-po-failure` | `penaltyAmount`, `repeatedFailureCompensationAmount` | Two money fields; wrap each return. |
| 14 | `ip-payment` | `totalAmount` | Has math; wrap response. |
| 15 | `lateinvoicewithpayment` | `amount`, `amountDue` | Drop stale `currencyCode` lines; wrap response. |

### Tier 3 — Larger files, state machines, ~15-20 minutes each

| # | Template | Money fields | Notes |
|---|---|---|---|
| 16 | `payment-upon-iot` | `amount`, `amountPerUnit` | **Already partially fixed** in the abandoned attempt — see git history of the file. The fix needed: (a) `const amount = data.amountPerUnit.doubleValue * state.counter;` then wrap in `monetary(amount, data.amountPerUnit.currencyCode)`; (b) replace `request.amount < 0.0` with `request.amount.doubleValue < 0.0`; (c) replace `request.currencyCode !== data.currencyCode` with `request.amount.currencyCode !== data.amountPerUnit.currencyCode`; (d) replace `request.amount / data.amountPerUnit` with `request.amount.doubleValue / data.amountPerUnit.doubleValue`. Add `import { IMonetaryAmount }` and the `monetary()` helper. |
| 17 | `perishable-goods` | `penalty`, `totalPrice`, `totalPaid`, `unitPrice` | `const currency = data.currencyCode;` → `const currency = data.unitPrice.currencyCode;`. Multiple money returns need wrapping with `monetary(value, currency)`. `state.totalPaid + totalPrice` is now `state.totalPaid.doubleValue + totalPrice.doubleValue` — wrap result. **Watch for:** the model has `MonetaryAmount totalPaid default=0.0` which is technically odd Concerto; don't touch the model. |
| 18 | `supplyagreement-perishable-goods` | `penalty`, `totalPrice`, `unitPrice` | Similar shape to #17 — likely the same fix applies. Multiple `currencyCode: data.currencyCode` lines to drop. |
| 19 | `installment-sale` | `amount`, `balance`, `balance_remaining`, `total_paid`, `MIN_PAYMENT`, `TOTAL_DUE_BEFORE_CLOSING` | Most complex. 10 money refs in logic. Likely an installment-payment loop or schedule with sum-of-payments math. Read the file first; expect significant per-line changes. |

### Tier 4 — Confirm-only (no logic changes expected)

These templates' `FIELDS_BY_TEMPLATE` entry exists, but their `logic.ts` had `money_refs=0` in my earlier scan. Each needs a quick `npx vitest run` to confirm tests pass without changes. If they fail, drop into the appropriate Tier above.

`saft`, `safte`, `servicelevelagreement`, `supplyagreement`, `supply-agreement-loc`, `volumediscount`, `volumediscountolist`, `volumediscountulist`, `fixed-interests`, `fixed-interests-static`, `roommate`.

## Concrete worked example for the executor

Template `eat-apples` (Tier 1). Cheap-model executor should follow this exactly for any Tier 1 template, substituting the template name.

```bash
# 1. Inspect
cat src/eat-apples/logic/logic.ts | head -40
cat src/eat-apples/logic/logic.test.ts | head -60
grep -n "currencyCode\|\.amount\|\.price" src/eat-apples/logic/logic.ts
```

For each line found:
- `currencyCode: data.currencyCode,` → delete the line via `Edit`.
- `currencyCode: 'USD',` → delete the line via `Edit`.
- `data.amount * X` or `data.amount + X` etc. → `data.amount.doubleValue * X` (etc.).
- A return literal `{ ..., amount: X, ... }` where the model says `amount: MonetaryAmount` → wrap: `{ ..., amount: monetary(X, data.amount.currencyCode), ... }`.

Add the import and helper if `monetary(` is now referenced.

```bash
# 4. Verify
(cd src/eat-apples && npx vitest run) 2>&1 | tail -5
```

If tests fail, fix the test fixtures per the Step 4 table above. Once green:

```bash
# 5. Commit
git add -A && git restore --staged node_modules 2>/dev/null
git commit -s -m "feat(logic): eat-apples computes against MonetaryAmount"
```

After every ~3 templates, also run from the worktree root:
```bash
npm run test:render 2>&1 | tail -5
```
Must show `37 passed | 20 expected fail`. If a previously-failing template now passes (test runs reports `Expect test to fail`), remove it from `expectedFailures` in `test/render.test.mjs` and commit that as a separate one-liner.

## Risks & gotchas

1. **Stale `currencyCode: data.currencyCode`**: present in many templates' event/state literals. The model no longer has `data.currencyCode`. At runtime, the property would be `undefined` and the serializer would reject the event. **Always remove** this line when seen.

2. **MonetaryAmount default in models**: `perishable-goods/model.cto` has `o MonetaryAmount totalPaid default=0.0`. The script applied this mechanically. Concerto may render this oddly. **Do not touch the model in this PR** — file as a follow-up issue if it causes problems.

3. **Test-only types vs runtime types**: workspace tests use `@ts-nocheck` and don't deserialize through cicero. A logic.ts file can be "wrong" at runtime and still pass its tests. **The render test (`npm run test:render`) is the real signal** — if it passes after a change, the template is functionally correct. If a workspace test still passes after a logic change but the assertions don't reference `.doubleValue`, the test is stale, not the logic. Update the test.

4. **Files that need a Read before Write**: the harness requires `Read` before `Write` on existing files. Use `Edit` for surgical changes (no Read prerequisite when targeting a known string), or `Read` then `Write` for rewrites.

5. **DCO sign-off**: pass `-s` to every `git commit`. Already in auto-memory.

6. **Don't bump namespaces again**: every migrated template is at `@0.2.0`. The previous PR-509 commits already collapsed an accidental double-bump. Logic changes must keep the namespace strings at `@0.2.0`.

7. **Generated TS bindings are already regenerated**. Do **not** run `concerto compile` again — it might no-op or it might re-emit slightly different files. Only run it if the test reports "Cannot find module './generated/org.accordproject.…@0.2.0'", and then only for that one template.

8. **The `expectedFailures` allow-list in `test/render.test.mjs`**: it's expected the list will shrink as more templates render cleanly. The cheap-model executor should never *add* templates to this list — if a render test newly fails, that's a real bug in the change.

## Commit cadence

One commit per template (per Tier 1/2/3 entry). Each commit message follows the form:

```
feat(logic): <template-name> computes against MonetaryAmount

<one-line on what fields, e.g. "Wraps `paymentAmount` as MonetaryAmount on the
return side and dereferences `.doubleValue` for arithmetic.">
```

If a template needs `expectedFailures` updated, do that in the same commit as the logic change (the test list trim is causally tied to the fix).

Push to `origin/mr-monetary-amounts` after every ~3 commits or any time a Tier 3 template lands.

## Acceptance criteria

When done:
- All 19 templates listed above have `logic.ts` and `logic.test.ts` that dereference `.doubleValue` and wrap returns in `MonetaryAmount`.
- `npm test` passes 100% (workspace + render).
- `npm run test:render` reports **at least 37 passing / at most 20 expected-fail** (more passes is better — fewer expected-fail entries means real fixes).
- No new `expectedFailures` entries added.
- No model changes, no namespace re-bumps, no generated-binding regeneration.
- DCO sign-off on every commit.
- Push to `origin/mr-monetary-amounts` so PR #509 picks them up.

## How to estimate progress mid-stream

```bash
# How many of the 19 are done?
git log --oneline mr-monetary-amounts ^origin/main | grep -c "feat(logic):"
# Currently 4 logic commits (mini, late-delivery family, promissory-note-md);
# at the end this should be 4 + 19 = 23 or thereabouts.
```
