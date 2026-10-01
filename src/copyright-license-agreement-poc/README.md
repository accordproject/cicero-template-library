# Copyright License (agreement@1.0.0 migration prototype)

A prototype of [`copyright-license`](../copyright-license) migrated onto the
org.accordproject 1.0.0 namespaces:
[accordproject/models#200](https://github.com/accordproject/models/pull/200)
("Agreement 1.0 Model Redesign"), extended for composed, executable clauses
by [accordproject/models#205](https://github.com/accordproject/models/pull/205).
It shows what migrating a template with a nested payment clause looks like
at the model, sample-data and logic level, and it loads, drafts, initialises
and triggers end to end through cicero-core and template-engine.

It is one of three templates that make up its example agreement:

- **`copyright-license-agreement-poc`** (this template): the licence, a
  stateful document with an inline payment clause;
- **[`late-payment-poc`](../late-payment-poc)**: a stateful clause template,
  composed into the licence;
- **[`licensed-work-schedule-poc`](../licensed-work-schedule-poc)**: a
  stateless document, Schedule 1 to the licence.

## Models

`model/` holds the 1.0.0 namespaces (`templatedata`, `party`, `template`,
`crypto`, `agreement`, `obligation`, `runtime` and `money`) as of models#205.
They are not yet published at models.accordproject.org, so each is saved
under the file name Concerto gives a downloaded external model, and
`npm run compile` runs offline.

The licence's logic uses the late payment clause's request types and reads
the schedule's data, so its models also hold copies of theirs
(`late-payment-poc.cto` and `licensed-work-schedule-poc.cto`, identical to
those templates' `model.cto`; an agreement's templates must define a shared
namespace identically). With three `TemplateData` subtypes in its models,
the licence names its template model in package.json
(`accordproject.templateModel`).

## The current design

Per models#200:

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
  path as its data. Composed clauses work differently; see below.
- **The obligation, not template state, owns the payment lifecycle.** The
  fee is an obligation@1.0.0 `PaymentObligation` moving `PENDING` → `DUE`
  → `FULFILLED`. Logic can't read the obligation registry, so clause state
  records only *facts* — `amountPaid`, and `dueAt` once payment is
  requested — and logic derives the obligation's status and revision from
  them. Whether the licence is in force is also derived: it is exactly
  when the obligation is `FULFILLED`.

  `init` seeds the state and issues the obligation with an
  obligation@1.0.0 `ObligationIssued` event (models#205).
  `PaymentRequest` returns the outstanding balance and, the first time,
  makes the obligation `DUE`. `PaymentReceived` records a payment,
  rejecting the wrong currency or scale, non-positive amounts and
  overpayment, and fulfils the obligation once the fee is paid. Status
  changes are `ObligationTransition` events carrying an accurate
  `fromStatus` and `revision`. Timestamps come from the data or the
  request, never the clock, so replaying the same inputs reproduces the
  same state and events.

  Logic can see the agreement it is in, so it gives the obligation an id
  unique across agreements and a full `AgreementReference`: agreement,
  document (added by models#205, since a clause path is only unique within
  one document) and clause path.
- **Amounts are exact.** Amounts are money@1.0.0 `PreciseAmount`s: an
  integer `unscaledValue` plus a `unit` with a `scale`, so $100.00 is
  `"10000"` at scale 2. Logic does the arithmetic with `BigInt`.

## Composed clauses: an agreement as one tree of template instances

models#205 lets a clause be a template instance of its own, while keeping a
single structure for the template hierarchy.

**One tree.** An `AgreementDocument` is the root template instance (its
`template` and `data`). Each entry in its `clauses` map is an
agreement@1.0.0 `Clause`: a template, a `clauseId`, the clause's own `data`
and its own composed `clauses`.

- An **inline** clause is a subtree of its template's `data`.
- A **composed** clause has its own template and its own data, so a
  parent's model declares nothing about the clauses composed into it.

**One state index.** runtime@1.0.0 `AgreementState.states` maps each
stateful instance's id (a document's `documentId`, a clause's `clauseId`)
to its own `StateData` subtype. Keys are stable ids, so the index never
mirrors the tree's shape, and a stateless instance has no entry.

**The example** (`test/agreement.test.ts`) is one agreement of two
documents, run by template-engine's `AgreementProcessor` over the three
templates:

- **The licence** (this template). Its payment terms are inline. A late
  payment clause (an instance of `late-payment-poc`) is composed at
  `"latePayment"`. Chasing an overdue payment delegates to the clause.
  Paying in full fulfils the obligation and discharges the clause,
  committed in one revision. Issuing the obligation reads the title of the
  licensed work from the schedule, a cousin document.
- **Schedule 1** (an instance of `licensed-work-schedule-poc`), a stateless
  document. It gets no state entry and has nothing to trigger.

Every document, state and event validates against the models.

## The logic API

The logic is written with template-engine's logic API
(`@accordproject/template-engine/logic`, accordproject/template-engine#187):
`defineLogic`, one handler per request type it handles, and an optional
`init`:

```ts
export type Licence = Self<ICopyrightLicenseData, ICopyrightLicenseState, {
    latePayment?: Clause<LatePayment>;
}>;

export default defineLogic<Licence>()
    .init(licence => {
        licence.setState(CopyrightLicenseState.create({ paymentTerms: PaymentTermsState.create({ ... }) }));
        licence.emit(ObligationIssued.create({ $timestamp: data.effectiveDate, obligation }));
    })
    .on(PaymentRequest, async (request, licence): Promise<IPayOut> => {
        ...
        await licence.clauses.latePayment?.trigger(PaymentOverdue.create({ $timestamp: request.$timestamp }));
        return PayOut.create({ $timestamp: request.$timestamp, amount: outstanding(data, terms) });
    })
    .on(PaymentReceived, async (request, licence): Promise<IPaymentReceipt> => { ... });
```

- **A factory for every type.** Every value is made with its type's
  factory (`PayOut.create({...})`), which fills in `$class`, and
  `$identifier` for an identified type, so logic never writes either by
  hand. Factories also check a value's type (`LicensedWorkSchedule.is(data)`)
  and make relationships (`PaymentObligation.ref(id)`).
  `npm run compile` (`template-engine-codegen --offline`) generates them
  from the models into `logic/generated/types.ts`, alongside Concerto's
  interfaces; when logic runs, the engine supplies the same factories.
- **No dispatch switch.** A request type's factory is also the key its
  handler is registered under. The engine dispatches on the request's
  `$class` to the handler registered for it, or for its nearest
  supertype, and rejects a request nothing handles before any logic runs.
- **The signatures are the declaration.** Each handler's `request` is
  typed by the request type it is registered for, and its response type
  is whatever it declares. `ApiOf<typeof logic>` collects them into the
  API a composing template triggers it with (`LatePayment`). The licence imports that as a
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
triggering the clause with `PaymentOverdue` returns `IReminderSent`,
writing to another document doesn't compile, and a factory won't take a
hand-written `$class`). `test/types.test.ts` runs them with `tsc`, along
with strict type-checking of both logic files.

### Testing

`@accordproject/template-engine/testing` gives unit tests a `self`
(`testInstance`) running on the engine's own transaction code, recording
what the engine would commit, and typed stand-ins for composed clauses
(`stubClause`), which record the requests they get. `logic/logic.test.ts`
and `../late-payment-poc/logic/logic.test.ts` test each template alone that
way; template-engine's own tests cover the transaction semantics.

### Running it as a stateless function

`AgreementProcessor`'s entry points are functions from JSON to JSON:

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

On its own, through `TemplateArchiveProcessor`, each template runs as the
one document of an agreement: `init(data)` returns its state and events,
and `trigger(data, request, state)` its response, next state and events.
That is how `test/render.test.mjs` drafts, initialises and triggers it.

### Not yet possible

- Placing the composed clause in the licence's text: TemplateMark's
  `ClauseDefinition` has no way to name a composed template. Each template
  drafts on its own.
- Resolving a `TemplateReference` to an archive. The tests name templates by
  `templateId` (their package names), and hash each template's files as a
  stand-in for its `archiveHash`.

## Toolchain

This runs on unreleased branches, installed from git by the repository's
root package.json:

- **cicero-core** finds the template model by its `TemplateData` parent
  type, or by `accordproject.templateModel`, and state by `StateData`,
  alongside runtime@0.2.0 templates
  ([template-archive#946](https://github.com/accordproject/template-archive/pull/946),
  [#950](https://github.com/accordproject/template-archive/pull/950)).
- **template-engine** adds the logic API, the agreement runtime, codegen
  and the testing helpers, and drafts by the named template model
  ([template-engine#187](https://github.com/accordproject/template-engine/pull/187)).
- **Concerto**: concerto-core 5.0.0's ESM build reports its own version as
  `5.0.0-beta.2`, which rejects the `concerto version "^5.0.0"` the 1.0.0
  namespaces declare
  ([concerto#1462](https://github.com/accordproject/concerto/issues/1462)).
  These tests load concerto-core only through cicero-core and
  template-engine, whose CommonJS builds report 5.0.0.
