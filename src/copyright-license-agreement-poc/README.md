# Copyright License (agreement@1.0.0 migration prototype)

A prototype of [`copyright-license`](../copyright-license) migrated onto the
model design proposed in
[accordproject/models#200](https://github.com/accordproject/models/pull/200)
("Agreement 1.0 Model Redesign"). This template exists to show what
migrating a template with a nested payment clause actually looks like at the
model, sample-data, and logic level, and to pin down precisely where today's
tooling (`cicero-core` / `@accordproject/template-engine`) still falls short
of loading, rendering, and triggering it end to end.

## The current design

Per PR #200's current shape:

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
- **No `clauses` map.** `copyright-license` has no sub-template archive —
  its `{{#clause paymentTerms}}` block is an inline grammar block written
  directly in this template's own grammar, not a composed sub-template. So
  `PaymentTerms` is simply a nested ordinary concept, addressed as a
  subtree of the data at `"paymentTerms"`. There is no `Clauses` map, and
  no duplicated copy of the payment data for `logic.ts` to be ambiguous
  about.
- **`PartyRef`, not a relationship.** `licensee`/`licensor` are `PartyRef`
  values (`model/party.cto`) — portable embedded references — not `-->
  Party` relationships. A relationship reaches `logic.trigger()` as an
  unresolvable `"resource:...#me"` string with no registry to resolve it
  against; `PartyRef` needs no resolution step, so `logic.ts` no longer
  needs a hand-rolled `resolveParty()` helper. `--> Party` relationships
  remain the right tool on the agreement envelope's `AgreementParty`, where
  a registry actually exists — see `model/agreement.cto`, which documents
  that wider envelope even though this template's own model doesn't import
  it (it has no envelope to be composed onto).
- **State has the same shape as data.** The original `copyright-license`
  has no state; it is added here to show how clause-scoped state works in
  the new design. `CopyrightLicenseState` (`model/model.cto`) is the
  template's one concrete `templatedata@1.0.0.StateData` subtype, found by
  its parent type like `CopyrightLicenseData`. The inline payment clause's
  state is `paymentTerms: PaymentTermsState`, an ordinary nested concept at
  the same instance path as its data. It is not a second `StateData`
  subtype, mirroring how `PaymentTerms` doesn't extend `TemplateData`, and
  it is not a `clauseStates` entry: that map holds the state of *composed*
  sub-template archives, and the payment clause is inline, so it has no
  entry there, just as it has no `clauses` entry.
- **The obligation, not template state, owns the payment lifecycle.** The
  fee is an `obligation@1.0.0` `PaymentObligation` (`model/obligation.cto`)
  moving `PENDING` → `DUE` → `FULFILLED`. Logic can't read the obligation
  registry, so clause state records only *facts* — `amountPaid`, and
  `dueAt` once payment is requested — and logic derives the obligation's
  status and revision from them. No status enum is stored anywhere a
  registry could disagree with it. Whether the licence is in force is also
  derived rather than stored: it is exactly when the obligation is
  `FULFILLED`.

  `init()` seeds the state and issues the obligation with an
  `ObligationIssued` event. `PaymentRequest` returns the outstanding balance
  and, the first time, makes the obligation `DUE`. `PaymentReceived`
  records a payment, rejecting the wrong currency or scale, non-positive
  amounts and overpayment, and fulfils the obligation once the fee is paid.
  Status changes are `ObligationTransition` events carrying an accurate
  `fromStatus` and `revision`. Timestamps come from the data or the
  request, never the clock, so replaying the same inputs reproduces the
  same state and events.

  Logic sees no agreement, so the obligation's id is the clause path
  (`"paymentTerms"`) and its `AgreementReference` carries only
  `clausePath`. The runtime must qualify the id and back-fill
  `agreementId` from the envelope it owns, as template-engine already
  back-fills `contract` on runtime@0.2.0 obligations. Until it does, the
  issued obligation fails Concerto validation for the missing
  `agreementId`; with it filled in, every state and event this template
  emits validates.
- **Amounts are exact.** Amounts are money@1.0.0 `PreciseAmount`s
  (`model/money.cto`): an integer `unscaledValue` plus a `unit` with a
  `scale`, so $100.00 is `"10000"` at scale 2. Logic does the arithmetic
  with `BigInt`. models#200 types `unscaledValue` as `BigInteger`, which
  the Concerto 4.x installed here rejects, so it is a digit `String` here,
  matching how a `BigInteger` serializes in JSON. TemplateMark can't
  format a `PreciseAmount`, so the grammar renders the fee with an inline
  formula for now; template-engine should learn to format `PreciseAmount`
  natively, as it does `MonetaryAmount`.
- **Where state lives in the runtime.** Logic only ever sees and returns
  `CopyrightLicenseState`. The runtime wraps it in an identified,
  revisioned `AgreementState` (`model/runtime.cto`, a stand-in for
  `runtime@1.0.0`), writing one revision per transition. That stand-in also
  sketches a PROPOSED change: in models#200, `AgreementState` has a single
  `data` slot and one agreement-wide `clauseStates` map, which leaves a
  multi-document agreement nowhere to put each document template's state,
  and lets clause paths from different documents collide. Here each
  document's state and composed-clause states sit under
  `documentStates[documentId]`, leaving `data` for agreement-wide state.

`logic/logic.test.ts` covers the transitions and guards. It also checks the
emitted events against a minimal obligation registry, and simulates the
runtime's `AgreementState` envelope.

See `model/*.cto` for the vendored prototype namespaces (`templatedata@0.1.0`,
`party@0.1.0`, `money@0.1.0`, `agreement@0.1.0`, `obligation@0.1.0`,
`runtime@0.1.0` — hand-written local stand-ins for the corresponding
`@1.0.0` namespaces proposed in PR #200, since that PR is unpublished) and
their inline comments for the reasoning behind each shape and each
divergence.

## Known gap: this cannot load with today's installed toolchain

Rooting the grammar at the data (rather than at an empty subclass of a
shared envelope) fixes the *specific* rendering problem the previous
revision of this prototype hit. But there is a second, more fundamental
problem: the *installed* `@accordproject/cicero-core` (2.1.1, including the
copy vendored inside `@accordproject/template-engine`) finds a template's
root concept exclusively via the `@template` decorator —
`Template#getTemplateModel()` calls markdown-template's
`findTemplateConcept()`, which throws `"Failed to find a concept with the
@template decorator"` when none is present. That call isn't confined to
drafting: `Template#validate()` calls it unconditionally, and
`Template.fromDirectory()` calls `validate()` — so with no `@template`
decorator, **this template cannot even be loaded** by the installed
toolchain, let alone drafted or triggered.

Confirmed empirically:

```
$ node -e "require('@accordproject/cicero-core').Template
  .fromDirectory('src/copyright-license-agreement-poc', { offline: true })
  .then(() => console.log('LOADED OK'))
  .catch(e => console.log('ERROR:', e.message));"
ERROR: Failed to find a concept with the @template decorator. The model for
the template must contain a single concept with the @template decoratpr.
```

The fix — finding the template model by parent type
(`templatedata@1.0.0.TemplateData`) instead of, or in addition to, a
decorator — is the subject of
[accordproject/template-archive#946](https://github.com/accordproject/template-archive/issues/946),
which is not released. Until it ships, this prototype cannot compile *and*
load through cicero-core: `npm run compile` (raw Concerto model
compilation) succeeds, and `logic/logic.test.ts` (which drives
`logic.ts` directly, without cicero-core) passes, but
`test/render.test.mjs`'s `template-engine render` and `template-engine
trigger` checks are both tracked as expected failures — see that file's
`expectedLoadFailures` — with a comment naming template-archive#946.
`@template` has deliberately **not** been added back: doing so would
silently paper over the exact gap this prototype exists to surface.

State has a matching gap that would remain even once template-archive#946
ships. The toolchain recognises state only as a subclass of
`org.accordproject.runtime@0.2.0.State`, an identified asset:

- cicero-core 2.1.1's `Template#isStateful()` looks for concrete
  subclasses of it. It would classify this template as stateless, and the
  render test would then call `trigger()` with no state.
- template-engine binds `TemplateLogic`'s state type parameter to
  subclasses of it, and on current `main` also asserts that returned
  state's `$class` extends it.

`StateData` is a plain, unidentified concept carried inside a
runtime-owned `AgreementState`, so both checks need the same
find-by-parent-type change as the template root. Until then, the stateful
behaviour is exercised by `logic/logic.test.ts` rather than the render
tests.
