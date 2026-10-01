# Copyright License (agreement@1.0.0 migration prototype)

A prototype of [`copyright-license`](../copyright-license) migrated onto the
model design proposed in
[accordproject/models#200](https://github.com/accordproject/models/pull/200)
("Agreement 1.0 Model Redesign"). This template exists to show what
migrating a template with a nested payment clause actually looks like at the
model, sample-data, and logic level, and to pin down precisely where today's
tooling (`cicero-core` / `@accordproject/template-engine`) still falls short
of loading, rendering, and triggering it end to end.

It also prototypes "design B", a proposed extension of models#200 for
composed, executable clauses, and the logic API that goes with it. Both
are described below.

## Models

`model/` vendors models#200's 1.0.0 namespaces verbatim (`templatedata`,
`party`, `template`, `crypto`, `agreement`, `obligation`, `runtime` and
`money`, head 337cc68). They are not yet published at
models.accordproject.org, so each is saved under the file name Concerto
gives a downloaded external model, and `npm run compile` runs offline.

What design B adds or changes is in one namespace of its own,
`poc.accordproject.composition@0.1.0` (`model/composition.cto`), each
change as a subtype of the models#200 type it would change, so the whole
delta is reviewable in one file. The templates' own namespaces
(`poc.accordproject.copyrightlicense@0.1.0` and so on) are just the
templates' versions.

Two tooling issues showed up:

- **concerto-core 5.0.0's ESM build rejects models#200.** It reports its
  own version as `5.0.0-beta.2`, which doesn't satisfy the `concerto
  version "^5.0.0"` the agreement, obligation and runtime namespaces
  declare. Its CommonJS build reports 5.0.0 and accepts them, so
  `vitest.config.js` loads that one.
- **Codegen duplicates same-named types.** Concerto's TypeScript codegen
  emits duplicate imports for two loaded types with the same short name,
  so the proposal's types can't reuse the names of the types they change
  (`ComposedClause` rather than `Clause`).

## The current design

Per models#200's current shape:

- **No `@template` decorator.** A template's model declares exactly one
  *concrete* subtype of `templatedata@1.0.0.TemplateData`, and that subtype
  IS the template model — the renderable root is found by its parent type,
  not a decorator. `model/model.cto`'s `CopyrightLicenseData` is that root;
  it carries the template's variables directly, so the grammar
  (`text/grammar.tem.md`) roots at the data itself: `{{effectiveDate}}`
  resolves directly, with no `{{#with data}}` wrapper.
- **The root is the data, never an envelope.** There is no
  `TemplateModel extends AgreementDocument {}` wrapper class — that's the
  anti-pattern the design forbids. Types the data is composed of (like
  `PaymentTerms`) are ordinary concepts and must NOT extend `TemplateData`;
  only the root does.
- **Inline clauses are data.** `copyright-license`'s `{{#clause
  paymentTerms}}` block is an inline grammar block written directly in
  this template's own grammar, not a composed sub-template. So
  `PaymentTerms` is simply a nested ordinary concept, addressed as a
  subtree of the data at `"paymentTerms"`.
- **`PartyRef`, not a relationship.** `licensee`/`licensor` are
  party@1.0.0 `PartyRef` values — portable embedded references — not
  `--> Party` relationships. A relationship reaches logic as an
  unresolvable `"resource:...#me"` string; `PartyRef` needs no resolution
  step. `--> Party` relationships remain the right tool on the agreement's
  `AgreementParty`, where a registry actually exists.
- **State has the same shape as data.** The original `copyright-license`
  has no state; it is added here to show how clause-scoped state works.
  `CopyrightLicenseState` is the template's one concrete
  `templatedata@1.0.0.StateData` subtype, found by its parent type like
  `CopyrightLicenseData`. The inline payment clause's state is
  `paymentTerms: PaymentTermsState`, an ordinary nested concept at the same
  path as its data. Composed clauses work differently; see design B.
- **The obligation, not template state, owns the payment lifecycle.** The
  fee is an obligation@1.0.0 `PaymentObligation` moving `PENDING` → `DUE`
  → `FULFILLED`. Logic can't read the obligation registry, so clause state
  records only *facts* — `amountPaid`, and `dueAt` once payment is
  requested — and logic derives the obligation's status and revision from
  them. Whether the licence is in force is also derived: it is exactly
  when the obligation is `FULFILLED`.

  `init` seeds the state and issues the obligation with an
  `ObligationIssued` event (proposed in `model/composition.cto`).
  `PaymentRequest` returns the outstanding balance and, the first time,
  makes the obligation `DUE`. `PaymentReceived` records a payment,
  rejecting the wrong currency or scale, non-positive amounts and
  overpayment, and fulfils the obligation once the fee is paid. Status
  changes are `ObligationTransition` events carrying an accurate
  `fromStatus` and `revision`. Timestamps come from the data or the
  request, never the clock, so replaying the same inputs reproduces the
  same state and events.

  Logic can see the agreement it is in, so it gives the obligation an id
  unique across agreements and a full reference: agreement, document and
  clause path. The reference is a proposed `DocumentReference`, since
  models#200's `AgreementReference` has no document, and a clause path is
  only unique within one.
- **Amounts are exact.** Amounts are money@1.0.0 `PreciseAmount`s: an
  integer `unscaledValue` plus a `unit` with a `scale`, so $100.00 is
  `"10000"` at scale 2. Logic does the arithmetic with `BigInt`.

## Design B: an agreement as one tree of template instances

A PROPOSED extension of models#200, sketched here end to end. It allows
embedded executable clauses, while keeping a single structure for the
template hierarchy.

**One tree.** An `AgreementDocument` is the root template instance (its
`template` and `data`). Each entry in its `clauses` map is a
`ComposedClause`: models#200's `Clause` plus the clause's own `data` and
its own composed `clauses`.

- An **inline** clause is a subtree of its template's `data`, as before.
- A **composed** clause has its own template and its own data, so a
  parent's model declares nothing about the clauses composed into it.

**One state index.** `IndexedAgreementState.states` maps each stateful
instance's id (a document's `documentId`, a clause's `clauseId`) to its own
`StateData` subtype. Keys are stable ids, so the index never mirrors the
tree's shape, and a stateless instance has no entry. This replaces
models#200's `data` and `clauseStates`.

**The example** (`test/agreement.test.ts`) is one agreement of two
documents:

- **The licence** (this template). Its payment terms are inline. A late
  payment clause (`composed/late-payment/`: its own model, grammar and
  logic) is composed at `"latePayment"`. Chasing an overdue payment
  delegates to the clause. Paying in full fulfils the obligation and
  discharges the clause, committed in one revision. Issuing the obligation
  reads the title of the licensed work from the schedule, a cousin
  document.
- **Schedule 1** (`documents/licensed-work-schedule/`), a stateless
  document. It gets no state entry and has nothing to trigger.

Every document, state and event validates against the models.

## The logic API (proposed)

`runtime/` prototypes what template-engine would provide; nothing in it is
released. A template's logic is built with `defineLogic`, one handler per
request type it handles, and an optional `init`:

```ts
export type Licence = Self<ICopyrightLicenseData, ICopyrightLicenseState, {
    latePayment?: Clause<LatePayment>;
}>;

export default defineLogic<Licence>()
    .init(licence => { licence.setState(...); licence.emit(issued); })
    .on(PaymentRequest, async (request, licence): Promise<IPayOut> => {
        ...
        await licence.clauses.latePayment?.trigger(PaymentOverdue.create({ $timestamp: request.$timestamp }));
        ...
    })
    .on(PaymentReceived, async (request, licence): Promise<IPaymentReceipt> => { ... });
```

- **No dispatch switch.** The engine dispatches on the request's `$class`
  to the handler registered for it, or for its nearest supertype, and
  rejects a request nothing handles before any logic runs.
  `PaymentRequest` and friends (`logic/request-types.ts`) are the model's
  request types as runtime values; template-engine would generate them
  with the interfaces.
- **The signatures are the declaration.** Each handler's `request` is
  typed by the request type it is registered for, and its response type
  is whatever it declares. `ApiOf<typeof logic>` collects them into the API a composing
  template triggers it with (`LatePayment`). The licence imports that as a
  type only, so it depends on the clause's requests and responses, never
  its state or code.
- **`self` is this instance's node in the agreement tree.** It reads its
  own `data` and `state`, and reaches everything else by walking:
  `self.parent`, `self.clauses`, `self.document.agreement.documents`, or
  `agreement.resolve(reference)`. Everything but its own writes is a frozen,
  read-only view, and reading another template's data at its own type
  means knowing that type statically.
- **Deterministic and transactional, not pure.** A handler writes only
  through `self`: `setState`, `emit`, and triggering its own composed
  clauses. The engine buffers the writes, and the handler sees them
  straight away. Each clause runs in a nested transaction, merged into its
  parent's when it returns, and discarded if it throws, so a parent that
  catches a clause's error loses only that clause's writes. The whole
  request commits as one revision, or not at all.

`test/types.check.ts` holds compile-time checks of all of this (e.g.
triggering the clause with `PaymentOverdue` returns `IReminderSent`, and
writing to another document doesn't compile). `test/types.test.ts` runs
them with `tsc`, along with strict type-checking of both logic files.

### Testing

`runtime/testing.ts` gives unit tests a `self` (`testInstance`) running on
the engine's own transaction code, recording what the engine would commit,
and typed stand-ins for composed clauses (`stubClause`), which record the
requests they get. `logic/logic.test.ts` and
`composed/late-payment/logic/logic.test.ts` test each template alone that
way. `test/runtime.test.ts` covers the engine's transaction semantics.

### Running it as a stateless function

The engine's entry points (`runtime/execute.ts`) are functions from JSON
to JSON:

```
initialise(agreement, documents, effectiveAt)        -> { state@0, events }
execute({ agreement, documents, state@N }, documentId, request)
                                                     -> { result, events, state@N+1 }
```

So one invocation (e.g. a serverless function) can load the state,
execute, and commit with a conditional write on the revision, writing the
events to an outbox in the same write. A lost race is retried from the
winning state, and a redelivered request returns its stored result.
`test/agreement.test.ts` shows both against an in-memory store. Composed
clauses run in the same invocation and transaction as their parent, so
the unit of deployment is the agreement, not the clause.

### Not yet possible

- Placing the composed clause in the licence's text: TemplateMark's
  `ClauseDefinition` has no way to name a composed archive. Each archive
  renders on its own (`test/template-engine-5.test.ts`).
- Resolving `TemplateReference` to an archive. The tests register logic by
  `templateId`, and hash each archive's files as a stand-in for its
  `archiveHash`.
- Running any of this through template-engine. Its compiler and runtime
  hardcode `runtime@0.2.0` Request, Response and State types and a
  `TemplateLogic` base class, so the logic here is checked with `tsc`
  and run by `runtime/execute.ts` instead.

## Known gap: this cannot load with today's installed toolchain

The *installed* `@accordproject/cicero-core` (2.1.1, including the copy
vendored inside `@accordproject/template-engine`) finds a template's root
concept exclusively via the `@template` decorator —
`Template#getTemplateModel()` calls markdown-template's
`findTemplateConcept()`, which throws `"Failed to find a concept with the
@template decorator"` when none is present. `Template#validate()` calls it
unconditionally, and `Template.fromDirectory()` calls `validate()`, so with
no `@template` decorator, **this template cannot even be loaded** by the
installed toolchain, let alone drafted or triggered.

The fix — finding the template model by parent type
(`templatedata@1.0.0.TemplateData`) instead of, or in addition to, a
decorator — is the subject of
[accordproject/template-archive#946](https://github.com/accordproject/template-archive/issues/946),
which is not released. Until it ships, `npm run compile` succeeds and this
workspace's own tests pass, but `test/render.test.mjs`'s `template-engine
render` and `template-engine trigger` checks are both tracked as expected
failures — see that file's `expectedLoadFailures`. `@template` has
deliberately **not** been added back: doing so would silently paper over
the exact gap this prototype exists to surface.

State has a matching gap that would remain even once template-archive#946
ships. The toolchain recognises state only as a subclass of
`org.accordproject.runtime@0.2.0.State`, an identified asset:

- cicero-core's `Template#isStateful()` looks for concrete subclasses of
  it, so it would classify this template as stateless.
- template-engine binds `TemplateLogic`'s state type parameter to
  subclasses of it, and on current `main` also asserts that returned
  state's `$class` extends it.

`StateData` is a plain, unidentified concept carried inside a
runtime-owned agreement state, so both checks need the same
find-by-parent-type change as the template root.

## What template-engine 5.x already changes

This workspace alone depends on `@accordproject/template-engine` 5.1.0
(the rest of the repo is still on 4.0.0); `test/template-engine-5.test.ts`
exercises it:

- **Rendering without `@template`.** 5.x's `TemplateMarkTransformer` and
  `TemplateMarkInterpreter` accept the root concept's name, so each
  archive's sample renders with the root named explicitly. What's still
  missing is cicero-core finding that root by its `TemplateData` parent
  type (template-archive#946).
- **Native `PreciseAmount` formatting.** `{{amount}}` renders as
  `100.00 USD` with no formula, because 5.x drafts
  `org.accordproject.money@1.PreciseAmount` natively.
- **Concerto 5 codegen.** This workspace also compiles its models with
  `@accordproject/concerto-cli` 4.2.0 (built on Concerto 5) rather than
  the repo's 4.0.1. The older codegen drops the import for a type used only
  as a map value, which breaks `IndexedAgreementState.states`. The newer
  one represents `DateTime` as a `string`, matching what template-engine
  5.x compiles logic against.
