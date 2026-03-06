# Cicero Template Migration Guide: v0.22 → v0.25 (TypeScript Runtime)

This guide documents how to migrate every template in this repository from the Cicero v0.22
(Ergo-based) format to the v0.25 (TypeScript-based) format introduced by the
[apap reference implementation](https://github.com/accordproject/apap).

## Overview of Changes

| Area | v0.22 (current) | v0.25 (target) |
|------|----------------|----------------|
| Logic language | Ergo (`.ergo`) | TypeScript (`logic.ts`) |
| Logic class (stateless) | `contract X over Y { clause ... }` | `class X extends TemplateLogic<ITemplateModel>` |
| Logic class (stateful) | `contract X over Y { clause ... }` | `class X extends TemplateLogic<ITemplateModel, IStateType>` |
| Model namespace | `org.accordproject.<name>` (unversioned) | `io.clause.<name>@<semver>` (versioned) |
| Main asset name | Custom (e.g. `HelloWorldClause`) | Always `TemplateModel` |
| Main asset base | `Clause` or `Contract` | Always `Clause` |
| `@template` decorator | Not used | Required on `TemplateModel` |
| State definition | `state.json` file | `concept MyState identified { ... }` in model |
| Events | `emit Obligation{...}` in Ergo | `event MyEvent { ... }` in model, returned in `events: object[]` |
| Model imports | Wildcard, remote URL, unversioned | Selective, remote URL, versioned |
| Local model copies | Not present | Required in `model/` directory |
| Generated TS types | Not applicable | `logic/generated/` from `concerto compile` |
| Cicero version | `^0.22.0` | `^0.25.0` |
| Runtime field | `ergo` (or absent) | `typescript` |
| Dependencies | `devDependencies: cucumber` | No template-level deps needed |
| Test framework | Cucumber/Gherkin `.feature` files | Jest/Vitest (`logic.test.ts`) with mocked runtime globals |
| `.cucumber.js` | Present | Remove |
| `state.json` | Present for stateful templates | Remove — state is managed by the runtime |

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

Stateful templates are fully supported. Follow the same steps as Category A, with the additions
described in the stateful subsections of Steps 2 and 4.

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
| `org.accordproject.obligation.*` | Remove — replace with `event` declarations (see below) |
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

#### 2d. Add an `event` declaration (if the template emits events)

Old Ergo used `emit Obligation{...}` inline in logic. In the new format, events are declared
explicitly in the model and returned from `trigger`. Replace obligation-based patterns with a
named event concept:

```
event LateDeliveryAndPenaltyEvent {
  o Boolean penaltyCalculated
}
```

#### 2e. Add a state `concept` (Category C — stateful templates only)

Replace `state.json` with a `concept ... identified` declaration in the model. The concept must
have `identified` (not `identified by`) so the runtime assigns a `$identifier` field.

```
concept LateDeliveryAndPenaltyState identified {
  o Integer count
  o Boolean lateDeliveryProcessed default=false
  o Double totalPenalties default=0.0
}
```

#### 2f. Copy dependent model files locally

Download the versioned model files and place them in `model/`:

```bash
curl -o model/@models.accordproject.org.accordproject.contract@0.2.0.cto \
  https://models.accordproject.org/accordproject/contract@0.2.0.cto

curl -o model/@models.accordproject.org.accordproject.runtime@0.2.0.cto \
  https://models.accordproject.org/accordproject/runtime@0.2.0.cto

curl -o model/@models.accordproject.org.time@0.3.0.cto \
  https://models.accordproject.org/time@0.3.0.cto
```

Naming convention: `@<host>.<path-with-dots>@<version>.cto`

Add any other models your template uses similarly.

#### Complete model example — helloworld (stateless)

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

#### Complete model example — latedeliveryandpenalty (stateful, with events)

```
namespace io.clause.latedeliveryandpenalty@0.1.0

import org.accordproject.time@0.3.0.{Duration, TemporalUnit} from https://models.accordproject.org/time@0.3.0.cto
import org.accordproject.contract@0.2.0.Clause from https://models.accordproject.org/accordproject/contract@0.2.0.cto
import org.accordproject.runtime@0.2.0.{Request,Response} from https://models.accordproject.org/accordproject/runtime@0.2.0.cto

@template
asset TemplateModel extends Clause {
  o Boolean forceMajeure
  o Duration penaltyDuration
  o Double penaltyPercentage
  o Double capPercentage
  o Duration termination
  o TemporalUnit fractionalPart
}

transaction LateDeliveryAndPenaltyRequest extends Request {
  o Boolean forceMajeure
  o DateTime agreedDelivery
  o DateTime deliveredAt optional
  o Double goodsValue
}

transaction LateDeliveryAndPenaltyResponse extends Response {
  o Double penalty
  o Boolean buyerMayTerminate
}

event LateDeliveryAndPenaltyEvent {
  o Boolean penaltyCalculated
}

concept LateDeliveryAndPenaltyState identified {
  o Integer count
  o Boolean lateDeliveryProcessed default=false
  o Double totalPenalties default=0.0
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
`IMyResponse`, etc. For stateful templates it also exports the state interface (e.g.,
`ILateDeliveryAndPenaltyState`) and event interface (e.g., `ILateDeliveryAndPenaltyEvent`).

Install `concerto-cli` globally if needed: `npm install -g @accordproject/concerto-cli`

> **Important:** Re-run this command whenever `model/model.cto` changes.

---

### Step 4 — Replace Ergo Logic with TypeScript (Category A & C templates)

Delete all `.ergo` files from `logic/`. Create `logic/logic.ts`.

Three types are **injected by the runtime** and must not be imported — use suppression comments
to satisfy TypeScript:

| Runtime type | Usage |
|---|---|
| `TemplateLogic<TModel, TState?>` | Base class — use `// @ts-ignore` on the `class` line |
| `EngineResponse<TState>` | Trigger response base type — use `// @ts-expect-error` on the interface line |
| `InitResponse<TState>` | Init return type — use `// @ts-expect-error` on the return annotation |

#### Simple template example — helloworld (stateless)

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

#### Stateful template example — latedeliveryandpenalty

For stateful templates:
- Add the state type as the **second** type parameter to `TemplateLogic`
- `trigger` takes a **third** parameter `state: IMyState`
- `init` takes **only `data`** (no request) and returns `Promise<InitResponse<IMyState>>`
- The trigger response object must include `state` and `events` alongside `result`

Note the inline redeclaration of types from `org.accordproject.time` — generated files reference
these types but they may not be available at runtime, so the needed shapes are declared directly
in `logic.ts`:

```typescript
import {
    ILateDeliveryAndPenaltyState,
    ILateDeliveryAndPenaltyRequest,
    ILateDeliveryAndPenaltyResponse,
    ILateDeliveryAndPenaltyEvent,
    ITemplateModel
} from "./generated/io.clause.latedeliveryandpenalty@0.1.0";

// Inline types from org.accordproject.time@0.3.0 — generated files may not be available at runtime
enum TemporalUnit {
    seconds = 'seconds',
    minutes = 'minutes',
    hours = 'hours',
    days = 'days',
    weeks = 'weeks',
}

interface IDuration {
    amount: number;
    unit: TemporalUnit;
}

// @ts-expect-error EngineResponse is imported by the runtime
interface LateDeliveryContractResponse extends EngineResponse<ILateDeliveryAndPenaltyState> {
    result: ILateDeliveryAndPenaltyResponse;
    state: object;
    events: object[];
}

// @ts-ignore TemplateLogic is imported by the runtime
class LateDeliveryLogic extends TemplateLogic<ITemplateModel, ILateDeliveryAndPenaltyState> {

    // @ts-expect-error InitResponse is imported by the runtime
    async init(data: ITemplateModel): Promise<InitResponse<ILateDeliveryAndPenaltyState>> {
        return {
            state: {
                $class: 'io.clause.latedeliveryandpenalty@0.1.0.LateDeliveryAndPenaltyState',
                $identifier: data.$identifier,
                count: 0,
                lateDeliveryProcessed: false,
                totalPenalties: 0.0,
            }
        };
    }

    private convertDurationToMilliseconds(duration: IDuration): number {
        const MS_PER_SECOND = 1000;
        const MS_PER_MINUTE = MS_PER_SECOND * 60;
        const MS_PER_HOUR = MS_PER_MINUTE * 60;
        const MS_PER_DAY = MS_PER_HOUR * 24;
        const MS_PER_WEEK = MS_PER_DAY * 7;

        switch (duration.unit) {
            case TemporalUnit.seconds: return duration.amount * MS_PER_SECOND;
            case TemporalUnit.minutes: return duration.amount * MS_PER_MINUTE;
            case TemporalUnit.hours:   return duration.amount * MS_PER_HOUR;
            case TemporalUnit.days:    return duration.amount * MS_PER_DAY;
            case TemporalUnit.weeks:   return duration.amount * MS_PER_WEEK;
            default: throw new Error(`Unsupported temporal unit: ${duration.unit}`);
        }
    }

    async trigger(
        data: ITemplateModel,
        request: ILateDeliveryAndPenaltyRequest,
        state: ILateDeliveryAndPenaltyState
    ): Promise<LateDeliveryContractResponse> {
        const agreedDelivery = new Date(request.agreedDelivery);
        const effectiveDelivery = request.deliveredAt ? new Date(request.deliveredAt) : new Date();

        if (agreedDelivery.getTime() > effectiveDelivery.getTime()) {
            throw new Error('Cannot exercise late delivery before delivery date');
        }

        let penalty = 0.0;
        let buyerMayTerminate = false;

        if (data.forceMajeure && request.forceMajeure) {
            buyerMayTerminate = true;
        } else {
            const delayMs = effectiveDelivery.getTime() - agreedDelivery.getTime();
            const penaltyDurationMs = this.convertDurationToMilliseconds(data.penaltyDuration);
            const terminationMs = this.convertDurationToMilliseconds(data.termination);
            const diffRatio = delayMs / penaltyDurationMs;

            if (diffRatio > 0) {
                const penaltyRaw = diffRatio * (data.penaltyPercentage / 100.0) * request.goodsValue;
                const maxPenalty = (data.capPercentage / 100.0) * request.goodsValue;
                penalty = Math.min(penaltyRaw, maxPenalty);
                buyerMayTerminate = delayMs > terminationMs;
            }
        }

        const newState: ILateDeliveryAndPenaltyState = {
            $class: 'io.clause.latedeliveryandpenalty@0.1.0.LateDeliveryAndPenaltyState',
            $identifier: state.$identifier,
            count: state.count + 1,
            lateDeliveryProcessed: penalty > 0 || state.lateDeliveryProcessed,
            totalPenalties: state.totalPenalties + penalty,
        };

        const event: ILateDeliveryAndPenaltyEvent = {
            $class: 'io.clause.latedeliveryandpenalty@0.1.0.LateDeliveryAndPenaltyEvent',
            $timestamp: new Date(),
            penaltyCalculated: penalty > 0
        };

        return {
            result: {
                penalty,
                buyerMayTerminate,
                $timestamp: new Date(),
                $class: 'io.clause.latedeliveryandpenalty@0.1.0.LateDeliveryAndPenaltyResponse'
            },
            events: [event],
            state: newState
        };
    }
}

export default LateDeliveryLogic;
```

#### Key translation rules from Ergo to TypeScript

| Ergo pattern | TypeScript equivalent |
|---|---|
| `contract.fieldName` | `data.fieldName` |
| `request.fieldName` | `request.fieldName` |
| `state.fieldName` | `state.fieldName` (third param to `trigger`) |
| `return ResponseType{ ... }` | `return { result: { ..., $timestamp: new Date(), $class: '...' }, state: newState, events: [...] }` |
| `enforce condition else throw Error{...}` | `if (!condition) throw new Error('...')` |
| `isBefore(date1, date2)` | `date1 < date2` |
| `now()` | `new Date()` |
| `diffDurationAs(d, unit)` | Manual ms arithmetic via `convertDurationToMilliseconds` helper |
| `emit PaymentObligation{...}` | Declare `event` in model; return in `events: [event]` |
| String concatenation `++` | Template literals or `+` |
| `min([a, b])` | `Math.min(a, b)` |
| Force majeure guard | `if (data.forceMajeure && request.forceMajeure) { ... }` |

---

### Step 5 — Write Unit Tests (`logic/logic.test.ts`)

The new test framework is Jest or Vitest. Because `TemplateLogic`, `EngineResponse`, and
`InitResponse` are runtime globals (not npm packages), they must be mocked before the logic
module is imported. The `// @ts-nocheck` directive at the top of the test file suppresses
type errors caused by the mock setup.

```typescript
// @ts-nocheck - Suppress type checking for runtime mocks
declare global {
    var TemplateLogic: any;
    var EngineResponse: any;
    var InitResponse: any;
}

// Mock runtime globals BEFORE importing logic
(global as any).TemplateLogic = class TemplateLogic<T, S> {
    async init(data: T): Promise<any> { return { state: {} }; }
    async trigger(data: T, request: any, state: S): Promise<any> { return {}; }
};
(global as any).EngineResponse = class EngineResponse<S> {};
(global as any).InitResponse = class InitResponse<S> {};

// Import AFTER mocks are set up
import MyLogic from './logic';
import { ITemplateModel, IMyRequest, IMyState } from './generated/io.clause.mytemplate@0.1.0';

describe('MyLogic', () => {
    let logic: MyLogic;
    let model: ITemplateModel;
    let initialState: IMyState;   // omit for stateless templates

    beforeEach(() => {
        logic = new MyLogic();
        model = {
            $class: 'io.clause.mytemplate@0.1.0.TemplateModel',
            $identifier: 'test-id',
            clauseId: 'test-id',
            // ... template fields
        };
        initialState = {
            $class: 'io.clause.mytemplate@0.1.0.MyState',
            $identifier: 'test-id',
            // ... state fields with initial values
        };
    });

    describe('init', () => {
        it('should initialise state', async () => {
            const result = await logic.init(model);
            expect(result.state).toMatchObject({
                $class: 'io.clause.mytemplate@0.1.0.MyState',
                $identifier: 'test-id',
            });
        });
    });

    describe('trigger', () => {
        it('should compute the expected result', async () => {
            const request: IMyRequest = { /* ... */ };
            const result = await logic.trigger(model, request, initialState);

            expect(result.result).toHaveProperty('$class');
            expect(result.result).toHaveProperty('$timestamp');
            expect(result.state).toBeDefined();
            expect(Array.isArray(result.events)).toBe(true);
        });

        it('should update state across multiple triggers', async () => {
            const request: IMyRequest = { /* ... */ };
            const result1 = await logic.trigger(model, request, initialState);
            const result2 = await logic.trigger(model, request, result1.state as IMyState);
            // assert cumulative state changes
        });
    });
});
```

Key testing patterns from the `latedeliveryandpenalty` reference:
- Test `init` separately: verify default state fields, verify `$identifier` propagation
- Test each logical branch of `trigger`: normal case, force majeure, on-time, cap exceeded, termination threshold
- Test state accumulation: pass the returned `result.state` as the `state` argument to the next call
- Test events: assert `result.events` length and field values (e.g., `penaltyCalculated`)
- Test error paths: use `await expect(logic.trigger(...)).rejects.toThrow('...')`

---

### Step 6 — Update Request/Response Data Files

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

---

### Step 7 — Update `text/grammar.tem.md`

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

### Step 8 — Remove Legacy Files

Delete the following files from each template:

- `logic/*.ergo` — all Ergo logic files
- `test/*.feature` — Cucumber test scenarios
- `test/logic_default.feature` — if present
- `.cucumber.js` — test runner setup
- `state.json` — state is now managed by the runtime via the `concept` in the model

---

### Step 9 — Verify the Migration

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
- [ ] `model/model.cto` — state defined as `concept MyState identified { ... }` (Category C)
- [ ] `model/model.cto` — events defined with `event MyEvent { ... }` (if applicable)
- [ ] `model/` — contains local copies of all imported `.cto` files
- [ ] `logic/generated/` — TypeScript interfaces generated via `concerto compile`
- [ ] `logic/logic.ts` — implements `TemplateLogic<ITemplateModel[, IState]>`, default export
- [ ] `logic/logic.ts` — `trigger` accepts `state` as third param (Category C)
- [ ] `logic/logic.ts` — `init(data)` returns `InitResponse<IState>` (Category C)
- [ ] `logic/logic.test.ts` — Jest/Vitest tests with mocked runtime globals
- [ ] `logic/*.ergo` — deleted
- [ ] `test/*.feature` — deleted
- [ ] `.cucumber.js` — deleted
- [ ] `state.json` — deleted
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
The `emits PaymentObligation` pattern in Ergo is replaced by explicit `event` declarations in
the model. Remove the obligation import, declare an appropriate `event` type in the model, and
return instances in the `events` array from `trigger`.

### Templates importing `org.accordproject.money.*` (MonetaryAmount)
Replace `MonetaryAmount` fields with `Double` (for the numeric value) and optionally a `String`
(for currency code) in the model, or use a custom concept.

### Templates with multiple `.ergo` files (e.g., `hellomodule`)
All logic must be consolidated into a single `logic/logic.ts` file. Move helper functions from
module files (e.g., `math.ergo`) into the TypeScript file as regular functions.

### Runtime-injected types from generated files
Types like `TemporalUnit` from `org.accordproject.time` are referenced in generated TypeScript
but the generated files may not be available at runtime. Redeclare the needed shapes inline in
`logic.ts` (enum + interface) rather than importing from `./generated/`. See the
`latedeliveryandpenalty` example in Step 4.

### Data-only templates (Category B)
Templates without a `logic/` directory (e.g., `company-information`, `signature-block-title-name-date`)
only need Steps 1, 2, 6, 7, and 8. Skip Steps 3, 4, and 5.

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

**Category C (Stateful — fully migrate including logic):** `helloworldstate`, `payment-upon-iot`,
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
│   ├── logic.ts                  # TemplateLogic<ITemplateModel[, IState]> class
│   ├── logic.test.ts             # Jest/Vitest tests with mocked runtime globals
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

- **Reference implementation:** https://github.com/accordproject/apap/tree/main/server/test/archives/latedeliveryandpenalty-typescript
- **This repository:** `src/latedeliveryandpenalty/` — direct before/after comparison available
- **New API docs:** `@accordproject/template-engine` package (TemplateArchiveProcessor)
- **New core:** `@accordproject/cicero-core@0.25.1` (Template.fromDirectory)
