# Cicero Template Migration Guide: v0.22 → v0.25 (TypeScript Runtime)

This guide documents how to migrate every template in this repository from the Cicero v0.22
(Ergo-based) format to the v0.25 (TypeScript-based) format introduced by the
[demo-template](https://github.com/accordproject/demo-template).

## Overview of Changes

| Area | v0.22 (current) | v0.25 (target) |
|------|----------------|----------------|
| Logic language | Ergo (`.ergo`) | TypeScript (`logic.ts`) |
| Logic class | `contract X over Y { clause ... }` | `class X extends TemplateLogic<ITemplateModel>` |
| Model namespace | `org.accordproject.<name>` (unversioned) | `io.clause.<name>@<semver>` (versioned) |
| Main asset name | Custom (e.g. `HelloWorldClause`) | Always `TemplateModel` |
| Main asset base | `Clause` or `Contract` | Always `Clause` |
| `@template` decorator | Not used | Required on `TemplateModel` |
| Model imports | Wildcard, remote URL, unversioned | Selective, remote URL, versioned |
| Local model copies | Not present | Required in `model/` directory |
| Generated TS types | Not applicable | `logic/generated/` from `concerto compile` |
| Cicero version | `^0.22.0` | `^0.25.0` |
| Runtime field | `ergo` (or absent) | `typescript` |
| Dependencies | `devDependencies: cucumber` | No template-level deps needed |
| Test framework | Cucumber/Gherkin `.feature` files | Not yet implemented (pending) |
| `.cucumber.js` | Present | Remove |
| `state.json` | Present for stateful templates | Pending support |

---

## Template Categories

There are three categories of templates in this repository:

### Category A — Logic Templates (majority)
Have a `logic/` directory with `.ergo` files.
**Examples:** `helloworld`, `latedeliveryandpenalty`, `fragile-goods`, `volumediscount`

### Category B — Data-Only Templates
No `logic/` directory, no test files.
**Examples:** `company-information`, `signature-block-title-name-date`, `contact-information`

### Category C — Stateful Templates
Have a `state.json` and logic using state.
**Examples:** `helloworldstate`, `perishable-goods`
> **Note:** Stateful template support is pending in the demo-template (`TemplateLogic` supports an
> optional `init` method). Migrate the model and package.json but defer logic migration until
> stateful support is confirmed stable.

---

## Step-by-Step Migration (All Templates)

### Step 1 — Update `package.json`

**Before:**
```json
{
    "name": "helloworld",
    "displayName": "Hello World",
    "version": "0.14.0",
    "description": "...",
    "author": "Accord Project",
    "license": "Apache-2.0",
    "accordproject": {
        "template": "clause",
        "cicero": "^0.22.0"
    },
    "devDependencies": {
        "cucumber": "^5.1.0"
    },
    "scripts": {
        "test": "cucumber-js test -r .cucumber.js"
    },
    "keywords": ["hello", "world", "greet"]
}
```

**After:**
```json
{
    "name": "helloworld",
    "displayName": "Hello World",
    "version": "0.15.0",
    "description": "...",
    "author": "Accord Project",
    "license": "Apache-2.0",
    "accordproject": {
        "runtime": "typescript",
        "template": "clause",
        "cicero": "^0.25.0"
    },
    "keywords": ["hello", "world", "greet"]
}
```

Changes:
- Set `accordproject.cicero` to `"^0.25.0"`
- Add `accordproject.runtime: "typescript"`
- Remove `devDependencies` block (cucumber)
- Remove `scripts.test` block
- Bump `version` (patch or minor increment as appropriate)

---

### Step 2 — Update the Model (`model/model.cto` or `model/clause.cto`)

This is the most significant change. The model must be renamed to `model.cto` if it isn't already.

#### 2a. Update the namespace

Old format:
```
namespace org.accordproject.helloworld
```

New format (versioned, with `io.clause` prefix):
```
namespace io.clause.helloworld@0.1.0
```

Choose a version starting at `0.1.0` for the initial migration.

#### 2b. Update imports to versioned, selective form

Old imports (wildcard, unversioned):
```
import org.accordproject.contract.* from https://models.accordproject.org/accordproject/contract.cto
import org.accordproject.runtime.* from https://models.accordproject.org/accordproject/runtime.cto
import org.accordproject.time.* from https://models.accordproject.org/time@0.2.0.cto
```

New imports (selective, versioned):
```
import org.accordproject.contract@0.2.0.Clause from https://models.accordproject.org/accordproject/contract@0.2.0.cto
import org.accordproject.runtime@0.2.0.{Request,Response} from https://models.accordproject.org/accordproject/runtime@0.2.0.cto
import org.accordproject.time@0.3.0.{Duration,TemporalUnit} from https://models.accordproject.org/time@0.3.0.cto
```

Common versioned imports reference table:

| Old import | New import |
|---|---|
| `org.accordproject.contract.*` from `.../contract.cto` | `org.accordproject.contract@0.2.0.Clause` from `.../contract@0.2.0.cto` |
| `org.accordproject.runtime.*` from `.../runtime.cto` | `org.accordproject.runtime@0.2.0.{Request,Response}` from `.../runtime@0.2.0.cto` |
| `org.accordproject.time.*` from `.../time@0.2.0.cto` | `org.accordproject.time@0.3.0.{Duration,TemporalUnit}` from `.../time@0.3.0.cto` |
| `org.accordproject.party.*` | Remove — Party references are not supported in the new format |
| `org.accordproject.obligation.*` | Remove — Obligations/emits are not supported in the new format |
| `org.accordproject.money.*` | Remove — Replace with plain `Double` fields |
| `org.accordproject.address.*` | Fetch and copy the relevant versioned model into `model/` |

Only import the specific types you actually use in your model (not wildcards).

#### 2c. Rename the main asset to `TemplateModel` and add `@template`

Old:
```
asset HelloWorldClause extends Clause {
  o String name
}
```

New:
```
@template
asset TemplateModel extends Clause {
  o String name
}
```

Rules:
- The main contract/clause asset **must** be named `TemplateModel`
- It **must** extend `Clause` (not `Contract`)
- It **must** have the `@template` decorator
- If the old asset extended `Contract`, change it to `Clause`
- Remove `Party` relationship fields (`--> Party buyer`, `--> Party seller`) — the new format
  does not support relationship types in the template model

#### 2d. Copy dependent model files locally

Download the versioned model files and place them in `model/`:

```bash
curl -o model/@models.accordproject.org.accordproject.contract@0.2.0.cto \
  https://models.accordproject.org/accordproject/contract@0.2.0.cto

curl -o model/@models.accordproject.org.accordproject.runtime@0.2.0.cto \
  https://models.accordproject.org/accordproject/runtime@0.2.0.cto

curl -o model/@models.accordproject.org.time@0.3.0.cto \
  https://models.accordproject.org/time@0.3.0.cto
```

Naming convention: `@<host-reversed>.<path-with-dots>@<version>.cto`

Add any other models your template uses (e.g., `address`, `party`, etc.) similarly.

#### Complete model example — helloworld

Before (`model/model.cto`):
```
namespace org.accordproject.helloworld

import org.accordproject.contract.* from https://models.accordproject.org/accordproject/contract.cto
import org.accordproject.runtime.* from https://models.accordproject.org/accordproject/runtime.cto

transaction MyRequest extends Request {
  o String input
}

transaction MyResponse extends Response {
  o String output
}

asset HelloWorldClause extends Clause {
  o String name
}
```

After (`model/model.cto`):
```
namespace io.clause.helloworld@0.1.0

import org.accordproject.contract@0.2.0.Clause from https://models.accordproject.org/accordproject/contract@0.2.0.cto
import org.accordproject.runtime@0.2.0.{Request,Response} from https://models.accordproject.org/accordproject/runtime@0.2.0.cto

transaction MyRequest extends Request {
  o String input
}

transaction MyResponse extends Response {
  o String output
}

@template
asset TemplateModel extends Clause {
  o String name
}
```

---

### Step 3 — Generate TypeScript Types from the Model

From the template's root directory, run:

```bash
concerto compile \
  --model model/model.cto \
  --target typescript \
  --output logic/generated
```

This produces TypeScript interface files in `logic/generated/`, including one named after your
namespace (e.g., `io.clause.helloworld@0.1.0.ts`) exporting `ITemplateModel`, `IMyRequest`,
`IMyResponse`, etc.

Install `concerto-cli` globally if needed: `npm install -g @accordproject/concerto-cli`

> **Important:** Re-run this command whenever `model/model.cto` changes.

---

### Step 4 — Replace Ergo Logic with TypeScript (Category A templates only)

Delete all `.ergo` files from `logic/`. Create `logic/logic.ts`.

The TypeScript class must:
1. Import interfaces from `./generated/<namespace>` (the file generated in Step 3)
2. Extend `TemplateLogic<ITemplateModel>` (injected by the runtime — no import needed)
3. Export the class as the default export
4. Implement `async trigger(data, request)` returning the response object
5. Optionally implement `async init(data, request)` for initialization logic

#### Simple template example — helloworld

Before (`logic/logic.ergo`):
```ergo
namespace org.accordproject.helloworld

contract HelloWorld over HelloWorldClause {
  clause helloworld(request : MyRequest) : MyResponse {
    return MyResponse{ output: "Hello " ++ contract.name ++ " " ++ request.input }
  }
}
```

After (`logic/logic.ts`):
```typescript
import { IMyRequest, IMyResponse, ITemplateModel } from "./generated/io.clause.helloworld@0.1.0";

type HelloWorldResponse = {
    result: IMyResponse;
}

// @ts-ignore
class HelloWorldLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: IMyRequest): Promise<HelloWorldResponse> {
        return {
            result: {
                output: `Hello ${data.name} ${request.input}`,
                $timestamp: new Date(),
                $class: 'io.clause.helloworld@0.1.0.MyResponse'
            }
        };
    }
}

export default HelloWorldLogic;
```

#### Key translation rules from Ergo to TypeScript

| Ergo pattern | TypeScript equivalent |
|---|---|
| `contract.fieldName` | `data.fieldName` |
| `request.fieldName` | `request.fieldName` |
| `return ResponseType{ ... }` | `return { result: { ..., $timestamp: new Date(), $class: '...' } }` |
| `enforce condition else throw Error{...}` | `if (!condition) throw new Error('...')` |
| `isBefore(date1, date2)` | `date1 < date2` |
| `now()` | `new Date()` |
| `diffDurationAs(...)` | Manual date arithmetic |
| `emit PaymentObligation{...}` | Not supported — remove or model as a response field |
| String concatenation `++` | Template literals or `+` |
| `min([a, b])` | `Math.min(a, b)` |
| Force majeure guard | `if (data.forceMajeure && request.forceMajeure) return ...` |
| `emits PaymentObligation` clause signature | Not supported in new format — remove |

#### Stateful logic — `init` method

For templates that previously used `state.json` and initialization:

```typescript
// @ts-ignore
class MyStatefulLogic extends TemplateLogic<ITemplateModel> {
    async init(data: ITemplateModel, request: IMyInitRequest): Promise<IMyInitResponse> {
        // initialization logic here
        return { ... };
    }

    async trigger(data: ITemplateModel, request: IMyRequest): Promise<IMyResponse> {
        // trigger logic here
        return { ... };
    }
}
```

> **Note:** Full stateful template support is pending in the demo-template. Implement `init` but
> verify against the latest `@accordproject/template-engine` release before relying on it.

---

### Step 5 — Update Request/Response Data Files

All `request.json` files must use the new versioned `$class` values.

Before:
```json
{
    "$class": "org.accordproject.latedeliveryandpenalty.LateDeliveryAndPenaltyRequest",
    "forceMajeure": false,
    "agreedDelivery": "2017-12-17T03:24:00-05:00",
    "deliveredAt": null,
    "goodsValue": 200.00
}
```

After:
```json
{
    "$class": "io.clause.latedeliveryandpenalty@0.1.0.LateDeliveryAndPenaltyRequest",
    "forceMajeure": false,
    "agreedDelivery": "2017-12-17T03:24:00-05:00",
    "deliveredAt": null,
    "goodsValue": 200.00
}
```

Similarly, update `$class` references inside nested objects:

Before: `"$class": "org.accordproject.time.Duration"`
After: `"$class": "org.accordproject.time@0.3.0.Duration"`

If `state.json` is present, update its `$class` similarly or remove it if the template no longer
uses state.

---

### Step 6 — Update `text/grammar.tem.md`

The template grammar syntax (`{{variable}}`, `{{#if ...}}`, `{{/if}}`) is **unchanged**. However,
if the grammar references Party relationship variables (e.g., `{{seller}}`, `{{buyer}}`), these must
be replaced with plain string fields since Party relationships are not supported in the new model.

Example — before:
```
{{seller}} (the Seller) shall pay to {{buyer}} (the Buyer) for every {{penaltyDuration}} ...
```

Example — after (if you add `sellerName` and `buyerName` as `String` fields to `TemplateModel`):
```
{{sellerName}} (the Seller) shall pay to {{buyerName}} (the Buyer) for every {{penaltyDuration}} ...
```

Also update `text/sample.md` to reflect any field name changes.

---

### Step 7 — Remove Legacy Files

Delete the following files from each template:

- `logic/*.ergo` — all Ergo logic files
- `test/*.feature` — Cucumber test scenarios
- `test/logic_default.feature` — if present
- `.cucumber.js` — test runner setup
- `state.json` — if the template is being migrated away from stateful logic

---

### Step 8 — Verify the Migration

Use the `@accordproject/template-engine` and `@accordproject/cicero-core@0.25.x` packages to verify
the template works. From the consumer side (e.g., an `index.js` in the parent project):

```javascript
const { TemplateArchiveProcessor } = require('@accordproject/template-engine');
const { Template } = require('@accordproject/cicero-core');

async function test() {
    const template = await Template.fromDirectory('./src/helloworld');
    const processor = new TemplateArchiveProcessor(template);

    // 1. Draft — generate contract text from data
    const data = {
        "$class": "io.clause.helloworld@0.1.0.TemplateModel",
        "name": "World",
        "clauseId": "test-clause-id",
        "$identifier": "test-clause-id"
    };
    const draft = await processor.draft(data, 'markdown', { verbose: false });
    console.log('Draft:', draft);

    // 2. Trigger — execute contract logic
    const request = { input: "everyone" };
    const response = await processor.trigger(data, request);
    console.log('Response:', JSON.stringify(response, null, 2));
}

test();
```

---

## Per-Template Migration Checklist

For each template in `src/`, verify completion of:

- [ ] `package.json` — runtime is `typescript`, cicero is `^0.25.0`, cucumber removed
- [ ] `model/model.cto` — namespace is `io.clause.<name>@<ver>`, imports are versioned/selective
- [ ] `model/model.cto` — main asset is `TemplateModel` with `@template`, extends `Clause`
- [ ] `model/` — contains local copies of all imported `.cto` files
- [ ] `logic/generated/` — TypeScript interfaces generated via `concerto compile`
- [ ] `logic/logic.ts` — implements `TemplateLogic<ITemplateModel>`, default export
- [ ] `logic/*.ergo` — deleted
- [ ] `test/*.feature` — deleted (or replaced with new tests when framework is ready)
- [ ] `.cucumber.js` — deleted
- [ ] `request.json` — `$class` updated to versioned namespace
- [ ] `text/grammar.tem.md` — Party references replaced if applicable

---

## Special Cases

### Templates extending `Contract` (not `Clause`)
Several templates (e.g., `latedeliveryandpenalty`, `supplyagreement`) define a main asset
extending `Contract`. Change this to `Clause` and rename to `TemplateModel`.

### Templates with `Party` relationships
Templates like `latedeliveryandpenalty` use `-->Party buyer` and `-->Party seller` relationship
fields in the model, and reference them in grammar as `{{buyer}}` / `{{seller}}`. In the new
format, Party relationships are not supported. Replace with plain `String` fields (e.g.,
`o String buyerName`, `o String sellerName`) and update grammar accordingly.

### Templates importing `org.accordproject.obligation.*`
The `emits PaymentObligation` pattern in Ergo is not available in TypeScript templates. Remove
the obligation import, remove `emits PaymentObligation` from any logic, and if obligation output
is needed, model it as a response field instead.

### Templates importing `org.accordproject.money.*` (MonetaryAmount)
Replace `MonetaryAmount` fields with `Double` (for the numeric value) and optionally a `String`
(for currency code) in the model, or use a custom concept.

### Templates with multiple `.ergo` files (e.g., `hellomodule`)
All logic must be consolidated into a single `logic/logic.ts` file. Move helper functions from
module files (e.g., `math.ergo`) into the TypeScript file as regular functions.

### Data-only templates (Category B)
Templates without a `logic/` directory (e.g., `company-information`, `signature-block-title-name-date`)
only need Steps 1, 2, 5, 6, and 7. Skip Steps 3 and 4.

---

## Template Count Reference

This repository contains 57 templates:

**Category A (Logic — migrate fully):** `acceptance-of-delivery`, `bill-of-lading`, `car-rental-tr`,
`certificate-of-incorporation`, `copyright-license`, `demandforecast`, `docusign-connect`,
`docusign-po-failure`, `eat-apples`, `empty`, `empty-contract`, `fixed-interests`,
`fixed-interests-static`, `fragile-goods`, `full-payment-upon-demand`, `full-payment-upon-signature`,
`hellomodule`, `helloworld`, `installment-sale`, `interest-rate-swap`, `ip-payment`,
`latedeliveryandpenalty`, `latedeliveryandpenalty-currency-conversion`, `latedeliveryandpenalty-else`,
`latedeliveryandpenalty-optional`, `latedeliveryandpenalty-optional-this`, `lateinvoicewithpayment`,
`minilatedeliveryandpenalty`, `minilatedeliveryandpenalty-capped`, `minilatedeliveryandpenalty-payment`,
`one-time-payment-tr`, `online-payment-contract-tr`, `payment-upon-delivery`, `payment-upon-signature`,
`promissory-note`, `promissory-note-md`, `rental-deposit`, `rental-deposit-with`, `roommate`,
`saft`, `safte`, `sales-contract-ru`, `servicelevelagreement`, `simplelatedeliveryandpenalty`,
`supply-agreement-loc`, `supplyagreement`, `supplyagreement-perishable-goods`, `volumediscount`,
`volumediscountolist`, `volumediscountulist`

**Category B (Data-only — model + package.json only):** `company-information`, `contact-information`,
`project-information`, `signature-block-title-name-date`

**Category C (Stateful — defer logic migration):** `helloworldstate`, `payment-upon-iot`,
`perishable-goods`

---

## Reference: New Template Structure

```
src/<template-name>/
├── package.json                  # runtime: typescript, cicero: ^0.25.0
├── README.md
├── logo.png                      # optional
├── model/
│   ├── model.cto                 # @template TemplateModel, versioned namespace
│   ├── @models.accordproject.org.accordproject.contract@0.2.0.cto
│   ├── @models.accordproject.org.accordproject.runtime@0.2.0.cto
│   └── @models.accordproject.org.time@0.3.0.cto   # (if used)
├── logic/
│   ├── logic.ts                  # TemplateLogic<ITemplateModel> class
│   └── generated/                # output of concerto compile
│       ├── io.clause.<name>@0.1.0.ts
│       ├── concerto.ts
│       ├── concerto@1.0.0.ts
│       ├── concerto.decorator@1.0.0.ts
│       ├── org.accordproject.contract@0.2.0.ts
│       ├── org.accordproject.runtime@0.2.0.ts
│       └── org.accordproject.time@0.3.0.ts        # (if used)
├── text/
│   ├── grammar.tem.md            # unchanged syntax
│   └── sample.md
└── request.json                  # $class uses new versioned namespace
```

---

## Critical Files to Reference

- **Demo template source:** https://github.com/accordproject/demo-template
- **Reference implementation:** `archives/latedeliveryandpenalty-typescript/` within demo-template
- **This repository:** `src/latedeliveryandpenalty/` — direct before/after comparison available
- **New API docs:** `@accordproject/template-engine` package (TemplateArchiveProcessor)
- **New core:** `@accordproject/cicero-core@0.25.1` (Template.fromDirectory)
