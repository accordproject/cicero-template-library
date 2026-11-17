# copyright-license-agreement-poc: next major release

Rebuilt on *Accord Project stack: next major release* (rev 50). Version
`0.1.0` → `0.2.0`; namespace `poc.accordproject.copyrightlicense@0.1.0` →
`@0.2.0`. It now compiles, drafts and runs against the next-major engine
checkout; see "Integration with the next-major engine" at the end for what
that took.

## What changed, by design section

**The engine boundary**
- Logic is `defineLogic<Self<Data, State, NoClauses>>().init(…).on(PaymentRequest, …)`,
  synchronous, instead of a `TemplateLogic` subclass with an async `trigger`.
- No clock: the `new Date()` stamps on the response and event are gone. The
  engine sets `$timestamp` on emitted values to the commit's business time;
  the old request `$timestamp` in `request.json` is removed (the host overwrites
  it).
- No hand-written `$class`: `PayOut.create`, `PaymentObligation.create`,
  `CopyrightLicenseState.create`.
- Nothing to refuse, so no `Declined` type and nothing thrown. Since the
  open decisions of 2026-11-16 the model says so: `PaymentRequest` carries
  no `@Declines` (see "Decisions applied" below).

**Agreements and state**
- Every instance has state: `CopyrightLicenseState extends StateData`, set
  by `init`. Since decision 16 the licence is the primary document of an
  agreement of two documents, instance ids `licence` and `schedule` (see
  "Decision 16" at the end); its state keeps each party's acceptance.

**Composition**
- `package.json` `accordproject` section per the contract: `semantics:
  "1.0.0-draft"`, `implements: {}`, `slots: {}`; `template: "contract"` and
  `cicero` dropped. No default `utcOffset`.

**Effects, outcomes and timers**
- The old `events: [PaymentObligationEvent]` return becomes
  `self.notify(PaymentObligation)` from the draft runtime namespace. It is a
  notification, not an effect: nothing comes back for the obligation itself.
  `obligor`/`obligee` are the licensee and licensor `PartyRef`s; no `dueAt`.

**Text, drafting and data**
- `{{#clause paymentTerms}}` → `{{#with paymentTerms}}`, because a clause block
  now names a slot and the payment terms are inline data.
- `{{#with licensee}}{{label}}{{/with}}` → `{{licensee.displayName}}` (dotted
  paths), likewise the licensor.
- The fee `({{amount}})` → `({{% return formatAmount(data.paymentTerms.amount) %}})`,
  with `formatAmount` in the new `logic/helpers.ts`, shared by formulas and
  logic. It formats explicitly (`100.00 USD`) with no `Intl` or `toLocale*`.
- `sample.json` gains `"utcOffset": "+01:00"`, so the effective date
  (`2018-01-01T01:00:00.000+01:00`) drafts in the offset it was written in.

**Models**
- Imports `org.accordproject.templatedata@1.0.0` (`TemplateData`,
  `StateData`), `party@1.0.0` (`PartyRef`), `money@1.0.0` (`PreciseAmount`) and
  `runtime@1.0.0` (`Request`, `Response`). The copied `poc.accordproject.*@0.1.0`
  and `@models.*` files are no longer imported, and stay on disk untouched.
- `MonetaryAmount` (a double) → `PreciseAmount` (`unscaledValue` `"10000"` at
  scale 2 for USD 100.00).
- `PartyRef {id, scheme, label?}` → the base `PartyRef {partyId, displayName}`.
- `PaymentObligationEvent` is dropped for the runtime `PaymentObligation`.
- The `compile` script generates from `model/model.cto` and the engine's
  `@1.0.0` base drafts (see the integration section).

**Template-local files**
- The test (now `test/logic.test.ts`) drives the licence through `trigger` rather than a
  mocked `TemplateLogic`, and checks types with the generated `Type.is`
  (`PayOut`, `PaymentObligation`, `CopyrightLicenseState`) rather than
  comparing `$class` strings; `vitest.config.js` drops the shared
  `TemplateLogic` mocks in `../test-setup.js`.
- README rewritten for the new shape.
- Outside this directory and not changed: the repository's `package-lock.json`
  still records this package at `0.1.0`, and `test/render.test.mjs` still
  lists it in `expectedLoadFailures`. Both need refreshing when installs and
  tests are run against the draft engine.

## Behaviour that changed

- None in what the licence decides: it still answers every `PaymentRequest`
  with the fee and records an obligation, and refuses nothing.
- The obligation's description is now the fixed name of the term, "One-time
  licence fee", not the sentence "Me should pay contract amount to Myself"
  built from the parties' names (decision 7; see "Decisions applied"). The
  parties and the amount are still in the obligation, as typed fields.
- The obligation is a typed `PaymentObligation` notification with an
  engine-assigned id, revision and ordinal, instead of a template-local event
  returned in `events`.
- The amount's drafted form is now fixed by `formatAmount` (`100.00 USD`)
  rather than by the engine's default `MonetaryAmount` formatting.

## Assumptions about draft types and APIs

- `defineLogic` and `Self` come from `@accordproject/template-engine` (the
  draft pre-release major, not installed). `Self`'s third parameter for a
  template with no slots is written `Record<never, never>`.
- Generated modules are `./generated/<namespace>.js`, and codegen emits a
  value per type with `create` (`PaymentRequest`, `PayOut`,
  `CopyrightLicenseState`, `CopyrightLicenseData`, `PaymentObligation`,
  `PreciseAmount`, `MonetaryUnit`, `ActorPrincipal`) plus `I…` interfaces.
  Today's codegen emits interfaces only, and `logic/generated/` still holds the
  `0.1.0` output.
- `PaymentObligation`, `Request`, `Response` and `ActorPrincipal` have the
  shapes in the contract's draft `org.accordproject.runtime@1.0.0`;
  `PreciseAmount`/`MonetaryUnit` and `PartyRef` have the contract's
  `money@1.0.0` and `party@1.0.0` shapes; `TemplateData` has `utcOffset
  optional`.
- Model imports name the `@1.0.0` namespaces without a `from` URL, since they
  are not published.
- The grammar's formula can call `formatAmount` from `logic/helpers.ts`
  without an explicit import; how a template declares its helpers module to
  formulas is not yet specified.
- The test assumes `loadTemplate(dir)` and `instantiate(archive, data)` beside
  `trigger`, and a Committed body with `response`, `notifications`, `effects`
  and `revision.to`, and a state index `states.licence.state`.

## Open questions

- Should a `PaymentRequest` check who asks? It accepts any principal, as the
  old logic accepted any caller. The licensee, or the system principal, are
  the obvious callers.
- Should the obligation carry `dueAt`? The terms say the fee is due "upon
  execution of this Agreement"; the old logic named no due date, so none is
  set. If execution is the effective date, `dueAt` could be
  `data.effectiveDate`.
- `PayOut` returns the same amount on every request and records nothing, so a
  repeated request notifies a second obligation. Recording that the fee has
  been notified, or a payment-received request, would need state; neither
  existed before.
- Drafting a `PreciseAmount` and a `DateTime` in TemplateMark: the fee uses a
  local helper until the stdlib's `formatAmount(a, pattern)` exists; the
  effective date keeps `{{effectiveDate}}` with no explicit format. The local
  helper shares the stdlib function's name but takes no pattern; when the
  stdlib version lands, the formula should move to it (same words, so the
  same text hash, if its pattern gives `100.00 USD`) and the local one go.
- The repository's `test/render.test.mjs` (outside this template) still lists
  this template in `expectedLoadFailures` against template-archive#946; it will
  need revisiting when the draft engine can load the template.
- ~~Who renders the obligation's words?~~ Settled by decision 7: the logic
  writes no prose, so an observer renders "Me owes Myself 100.00 USD" from
  `obligor`, `obligee` and `amount`. `PaymentObligation.description` is still
  a required `String` in the runtime draft, so the licence fills it with the
  term's name; whether `description` should stay required is a question for
  the runtime model, not this template.
- ~~No vectors yet.~~ Resolved: the test sessions are recorded as vectors
  in `test-vectors/` and replayed (see the integration section). They are
  recorded, not hand-written, so they freeze what the draft engine does and
  need review before they count as specification.
- The title line is not an ATX heading; the design's TemplateMark fixes allow
  one, but the text was left as it was.

## Integration with the next-major engine

Run against the bank PoC's next-major engine (`src/engine`, the draft
`@accordproject/template-engine`), aliased in `vitest.config.js` through
`ACCORD_NEXT_ENGINE`. Template changes made to get there, each for an
assumption the engine cannot meet or a gap the design leaves open:

- **`text/grammar.tem.md` → `text/grammar.md`.** The engine reads, hashes and
  binds only `text/grammar.md` (archive.ts `readArchiveSource`, agreement.ts
  `loadAgreement`, trigger.ts `draftOf`); with `grammar.tem.md` the licence
  has no text and instantiation faults. The text itself is unchanged. The
  repository's `run.js` still looks for `grammar.tem.md` and so shows an
  empty grammar for this template; it already cannot load it with
  cicero-core (`test/render.test.mjs` `expectedLoadFailures`).
- **The test moved to `test/logic.test.ts`.** The engine's template hash
  covers every `logic/*.ts` file except `logic/generated/`, tests included,
  while the design keeps tests outside the hash. In `logic/` every test edit
  would change the template hash and invalidate the recorded vectors.
- **The test uses the engine's real API.** The assumed `loadTemplate(dir)`
  and `instantiate(archive, data)` do not exist. The test loads the archive
  with `loadArchive(dir)` (async; since decision 16, `loadLibrary([schedule,
  licence])`, which pins the schedule's hash), makes the agreement with
  `TestHost.make({agreementId, primary: 'licence', documents: [{documentId:
  'licence', template: {hash}, data, references: {schedule: 'schedule'}},
  {documentId: 'schedule', template: {hash}, data}], archives}, {start})`
  (which calls `loadAgreement` and
  `instantiate(agreement, inputs)`), and sends requests with
  `host.send(request, {actor: licensee})` (which calls `trigger`). Body
  fields are `revisionTo` (not `revision.to`) and state is read with
  `host.stateOf('licence')`. Every original assertion is kept.
- **New tests.** The drafted agreement text (instantiation's `agreement`
  artifact: the effective date in `+01:00`, the parties' display names, the
  fee as `100.00 USD`), which the earlier test left for a drafting vector,
  and the licence's own revision staying at 0 after a request (it keeps
  nothing).
- **Vectors.** Each session is recorded with the engine's recorder
  (`TestHost.session(id)`) into `test-vectors/<id>.json`
  (`licence-instantiate`, `licence-payment-request`,
  `licence-fee-from-terms`); `npm test` checks a fresh session against its
  stored vector byte for byte, and replays every stored vector against the
  boundary directly (`loadAgreement`, `instantiate` for step 0, `trigger`
  for each later step against the state the step before produced),
  comparing each step's result and its semantic body in canonical JSON.
  Re-record with `RECORD_VECTORS=1 vitest run -t 'copyright licence'`
  (`npm run test:record`).
- **Generated types.** `logic/generated/` now holds one module per namespace
  (`poc.accordproject.copyrightlicense@0.2.0` and the four `@1.0.0` base
  drafts), from `scripts/codegen.mts`, which applies the engine's codegen
  rules (`I<Name>` interfaces, `<Name>.create`/`.is` factories, engine-set
  fields optional, a supertype table) per namespace, reading the base drafts
  from the engine checkout's `models/accordproject/`. The engine's own
  `scripts/codegen.ts` cannot be pointed at another template: it loads only
  its repository's models and writes one fixed file. The generated modules
  import the factory builders from `@accordproject/template-engine/factories`
  (aliased), because the engine's index does not export them.
- **Base model copies removed, not replaced.** The earlier prototype's
  copied files (`templatedata.cto`, `party.cto`, `agreement.cto` and the
  `@models.*` files) are gone. Copies of the `@1.0.0` drafts were tried in
  `model/` and break loading: the engine counts every namespace in an
  archive's `model/` as the template's own, and its check for the data and
  state types calls `isAbstract()` on the runtime namespace's
  `map InstanceStates`, which has no such method (agreement.ts
  `concreteSubtypes`). The engine loads the drafts beside every archive, so
  the template needs no copies.
- **Scripts.** `compile` is `tsx scripts/codegen.mts`; `test:record`
  re-records the vectors and then runs every test. Both need a next-major
  engine checkout's `tsx` and `vitest`; this repository installs neither.

## Decisions applied (open-decisions log, 2026-11-16)

The bank PoC's `docs/open-decisions.md` decided seven spec questions. Those
that bear on the licence:

- **Decision 2, `expect` replaces `revision` in the inputs.** The licence's
  inputs carry no revision unless a caller names one: `expect: {instance,
  revision}`, any instance in the tree (here only `licence`), and a request
  without it is never stale. The test sends requests without `expect`, and
  a new session (`licence-expect`) sends one at the current revision
  (Committed) and one at a revision the licence never reached (a
  `StaleRevision` Rejection with `declinedBy: "licence"`). The licence keeps
  nothing, so its revision stays 0.
- **Decisions 3 and 4, a root's own requests describe themselves.** The
  model's `PaymentRequest` now carries `@Returns(PayOut)` and
  `@Emits(PaymentObligation)`, the runtime's typed decorators, imported from
  `org.accordproject.runtime@1.0.0`. With no `@Declines`, it never declines:
  a decline, a response other than `PayOut`, or a notification other than a
  `PaymentObligation` would be a Fault. A test reads the description back
  from the engine (`agreement.models.member`). The codegen script skips the
  decorator declarations (`Returns`, `Declines`, `Emits` extend
  `concerto.decorator@1.0.0.Decorator`), as the engine's codegen does, so no
  `Returns.create()` is generated.
- **Decision 7, runtime text is data or drafted.** The handler built the
  obligation's description from the parties' display names. It now carries
  the term's fixed name, and the parties and amount travel as typed fields.
  `formatAmount` stays in `logic/helpers.ts` as a drafting helper for the
  fee formula; the logic does not call it, and the helpers module now says
  so. Drafting the description with `self.draft` was considered and not
  done: the words are a constant, and drafting them would need a second,
  text-only template pinned in the licence's manifest for one label.
- **Bindings and facts (decisions on facts, 5 and 8): not applicable.** The
  licence is a tree of one with no slots, so there is nothing to bind; and it
  reads nothing a system of record owns (the fee is its own data, and it
  names no business date), so it declares no `reads` and the host supplies
  no facts. Its inputs carry no `facts`.
- **Decisions 1, 5 and 6** (approval digests, text templates, formulas
  checked only by running) need no change here: the licence takes no signed
  approvals, has logic, and its one formula already runs in the drafting
  test.

Re-recorded: all four vectors (`licence-instantiate`,
`licence-payment-request`, `licence-fee-from-terms` and the new
`licence-expect`), since the template hash moved with the model and the
logic. Recording twice gives byte-identical files.

## Decision 16: an agreement holds documents (2026-11-17)

The engine's decision 16 makes an agreement a container of documents
(`org.accordproject.agreement@1.0.0`: `Agreement → AgreementDocument[] →
Clause`), one of them primary. The licence uses it for its schedule of
licensed works.

- **The schedule is a document of its own.** Before, the Work was one
  string in the licence's data (`workDescription`), drafted in place in the
  Grant of Rights. Now the works are the data of `schedule/`, a text
  template (`copyright-license-schedule-poc@0.1.0`, namespace
  `poc.accordproject.copyrightlicense.schedule@0.1.0`: `LicensedWorksScheduleData
  {works: LicensedWork[]}`, `LicensedWork {title, description}`), and the
  agreement holds it as the document `schedule`. `workDescription` is gone
  from `CopyrightLicenseData` and `sample.json`; the schedule's sample is
  `schedule/sample.json` (the one work, "other stuff").
- **The licence names it in its manifest.** `"documents": {"schedule":
  {"template": {"hash": "UNPINNED", "name": "copyright-license-schedule-poc",
  "version": "0.1.0", "location": "./schedule"}}}`, pinned by
  `loadLibrary`, and covered by the licence's template hash. The reference
  is required: an agreement without a schedule, or with a document of
  another template in its place, is refused when it is made. The agreement
  says which document fills it (`references: {schedule: "schedule"}` on the
  licence's document).
- **The text refers to the schedule.** The Grant of Rights now reads 'The
  "Work" is defined as the work or works listed in the Schedule of Licensed
  Works, which forms part of this Agreement (the "Schedule").' The schedule
  drafts its own text and hash: instantiation now gives two `agreement`
  artifacts, `licence` and `schedule`.
- **Acceptance binds the whole agreement.** New: `AcceptLicence {digest}`
  (`@Returns(LicenceAccepted) @Declines(AcceptanceRefused)`). The licensee
  or the licensor accepts the agreement as it stands: `digest` must be
  `acceptanceDigest(partyId, self.agreementTermsHash)` (exported from
  `logic/logic.ts`), SHA-256 over `{party, agreementTermsHash}`. The
  agreement's terms version covers every document's drafted text and data,
  so an amended schedule voids an acceptance of the old one
  (`TERMS_CHANGED`), though the licence's own `termsHash` is unchanged; a
  re-pin that changes only logic keeps it. Anyone else is refused
  (`NOT_A_PARTY`). The state keeps one `Acceptance {party, digest,
  acceptedAt}` per party; a later one replaces it. The reasons are an enum,
  not text (decision 14).
- **Types.** `npm run compile` also generates the schedule's namespace and
  `logic/generated/documents.ts`, `CopyrightLicenseAgreementPocDocuments`
  (`schedule: TextDocumentHandle<ILicensedWorksScheduleData>`), by the
  engine's rule (`src/engine/codegen-documents.ts`). `Self`'s fifth
  parameter is the documents type. The logic does not read the schedule's
  data: the acceptance covers it through `agreementTermsHash`.
- **Tests and vectors.** The test loads both archives, makes the
  two-document agreement, checks both drafts, the acceptance (and its
  refusals), an acceptance voided by a change to the schedule alone, and
  the required reference. All vectors re-recorded (the licence's hash moved
  with its model, text, logic and manifest; each vector now names both
  archives, and its `agreement` is the decision-16 record, `{agreementId,
  agreementHash, primary, documents}`), plus a new `licence-acceptance`.

Open:

- **Who signs?** The digest arrives in the request, as the party's
  statement of what it accepts, and the host attests who the caller is. A
  signed acceptance would carry it in an assurance (as the bank's
  `PasskeyApproval` does) under a trust profile the licence names; no
  profile for licences exists yet.
- **Should the logic read the schedule?** It could, through
  `self.documents.schedule.data` (a payment per work, say); today the
  works matter only to the text and to what is accepted.

## The late payment clause and agreement.json (2026-11-17)

The licence now composes a late payment clause, as the Agreement Quarter's
running example does. The clause is
[`../late-payment-clause-poc`](../late-payment-clause-poc), a template of its
own that implements `org.accordproject.latepayment.api@1.2.0`.

- **Slot.** The licence's optional `latePayment` slot asks for
  `org.accordproject.latepayment.api@^1.0.0` and binds the licence's
  `utcOffset` into the clause's data. The grammar drafts the clause in place
  with `{{#clause latePayment}}{{/clause}}`.
- **Fee.** `PaymentTerms` gains `dueDate`, and `CopyrightLicenseState` gains
  `fee` (`NOT_DUE`, `DUE`, `PAID`).
  - The first `PaymentRequest` makes the fee due, adds `dueAt` to the
    `PaymentObligation`, and sets the `fee-overdue` timer. It now moves the
    licence's revision; before, it recorded nothing.
  - `FeeOverdue` (a `TimerFiring`) calls `PaymentOverdue` on the clause and
    sets the timer again for the date the clause gives.
  - `RecordFeePayment`, from the licensor only, cancels the timer and calls
    `PaymentSettled`.
- **Interface.** The interface ships in the clause's `model/` until it is
  published on its own. The engine reads interface metadata from any loaded
  namespace, so this needs no engine change. The licence's codegen also
  generates the interface, and the clause's own `logic/generated/`.
- **`agreement.json`.** This is the agreement record as the engine loads it,
  with its computed hashes. It is re-recorded with the vectors and checked
  byte for byte by the tests.
- **Vectors.** Every vector was re-recorded, because the agreement now holds
  the clause. There is a new `licence-late-payment` vector: three reminders,
  then payment.
