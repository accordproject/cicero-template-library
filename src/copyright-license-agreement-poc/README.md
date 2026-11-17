# Copyright License (next major release prototype)

A prototype of [`copyright-license`](../copyright-license), rebuilt on the
design for the next major release of the Accord Project stack. This is the
running example of **The Agreement Quarter**, the illustrated walk-through of
the Agreement 1.0 proposal. Once accordproject/techdocs publishes it, it is
at <https://docs.accordproject.org/agreement-quarter/>. This folder is the
same agreement as files you can read and run.

It is a **draft**, like the proposal. The `@1.0.0` base namespaces and the
engine API it uses are not published. So it compiles, drafts and runs only
against a checkout of the next-major engine (see "Running it"). See
[`NEXT-MAJOR.md`](./NEXT-MAJOR.md) for what changed and why.

## The agreement

An agreement holds documents, and each document can be built from clauses.
[`agreement.json`](./agreement.json) is this agreement, exactly as a host
keeps it and as the engine loads it, with the agreement and document hashes
the engine computed:

```text
Agreement copyright-licence                primary: licence
├─ Document licence                        copyright-license-agreement-poc (this folder)
│  ├─ data.paymentTerms                    inline clause, drafted with {{#with paymentTerms}}
│  ├─ clauses.late-payment                 → instance licence/late-payment
│  │    late-payment-clause-poc            implements latepayment.api 1.2.0 · binds utcOffset
│  └─ references.schedule → schedule
└─ Document schedule                       copyright-license-schedule-poc (schedule/)
                                           text template · no logic, no state
```

- **`licence`** is the primary document, where a caller's request enters.
  It is this template.
- **`licence/late-payment`** is a clause in the licence's optional
  `latePayment` slot. The slot asks for an interface,
  `org.accordproject.latepayment.api@^1.0.0`, not for one template. So the
  agreement names the clause's template by hash, and any template that
  implements a 1.x version of the interface could fill the slot. The clause
  is [`../late-payment-clause-poc`](../late-payment-clause-poc), a template
  of its own. The licence reaches it only through the interface, as
  `self.clauses.latePayment`, and never reads its state. The licence binds
  its `utcOffset` into the clause's data, so the clause drafts in the
  licence's offset.
- **`schedule`** is the schedule of licensed works, a document of its own.
  The licence's manifest names it in `documents`, and its text refers to
  it. The agreement says which document fills that reference:
  `"references": {"schedule": "schedule"}`.

Each document is drafted as itself, with its own text and hash. The late
payment clause is drafted in place, inside the licence's text, where the
grammar says `{{#clause latePayment}}{{/clause}}`.

## The storyboard, stop by stop

| Stop in the Agreement Quarter | Where it is here |
| --- | --- |
| No. 1 The Registry: models | `model/model.cto`, `schedule/model/model.cto`, `../late-payment-clause-poc/model/` |
| No. 2 The Conveyancer: documents and clauses | `agreement.json`; the manifest's `slots` and `documents` in `package.json` |
| No. 3 The Strongroom: agreement state | `CopyrightLicenseState` and `LatePaymentState`, one state per instance (`licence`, `licence/late-payment`) |
| No. 4 The Clerks' Windows: logic and inputs | `logic/logic.ts`: `AcceptLicence` checks the attested principal and binds `self.agreementTermsHash` |
| No. 5 The Library: interfaces, slots and bindings | `../late-payment-clause-poc/model/latepayment.api.cto`; the `latePayment` slot; `self.clauses.latePayment.trigger(PaymentOverdue…)` in `logic/logic.ts` |
| No. 8 The Recorder: effects, notifications and timers | The licence's `fee-overdue` timer; the clause's `PaymentReminder` effect and its `onOutcome`; `LateFeeAccrued` |
| No. 9 The Moot: vectors | `test-vectors/*.json`, replayed by `test/logic.test.ts` |

## Files

| File | What it holds |
| --- | --- |
| `agreement.json` | The agreement: the licence with its late payment clause, and the schedule. Re-recorded with the vectors |
| `model/model.cto` | `CopyrightLicenseData` (with `PaymentTerms`, now including `dueDate`) and `CopyrightLicenseState` (each party's acceptance, and the fee's `FeeStatus`). The requests: `PaymentRequest`, `RecordFeePayment`, `AcceptLicence`. The timer request: `FeeOverdue`. Each request names what it answers and may decline with |
| `text/grammar.md` | The licence text. The fee is drafted with `formatAmount` from `logic/helpers.ts`. The Work is whatever the Schedule lists. The late payment clause is drafted in place |
| `logic/logic.ts` | `defineLogic`: the fee falls due, then is overdue, then is paid, calling the late payment clause through its interface; plus the acceptances. Exports `acceptanceDigest` |
| `sample.json`, `request.json` | The licence's data (USD 100.00, due 2018-01-31) and a `PaymentRequest` |
| `schedule/` | The schedule of licensed works: a text template with its own `package.json`, model, grammar and `sample.json` |
| `logic/generated/` | Types and factories for the licence's namespace, the schedule's, the late payment interface and the `@1.0.0` base drafts. Also `documents.ts`, the type of `self.documents`. Built with `npm run compile`, which also writes the clause's own `logic/generated/` |
| `test/logic.test.ts` | Drives the agreement through the engine's test host, records each session as a vector, and replays every vector against the engine directly |
| `test-vectors/` | The recorded end-to-end vectors: `{id, semantics, archives, agreement, steps}` |

## Behaviour

- **`PaymentRequest`**, from anyone, answers `PayOut {amount}`, the fee in
  the payment terms. The first request also does three things:
  - notifies a `PaymentObligation` from the licensee to the licensor, due at
    `paymentTerms.dueDate`;
  - sets the licence's `fee-overdue` timer for that date;
  - moves the fee from `NOT_DUE` to `DUE`.

  A later request changes nothing.
- **The fee is overdue.** When the timer fires, the licence triggers
  `PaymentOverdue` on its late payment clause. The clause does three
  things:
  - sends a `PaymentReminder` effect, which it keeps pending until the
    reminder's outcome comes back;
  - notifies `LateFeeAccrued` with the first reminder only;
  - answers `ReminderSent {reminder, nextReminderAt}`.

  The licence sets its timer again for `nextReminderAt`. In the sample the
  reminders come every 7 days, up to 3 in all. The last reminder carries no
  `nextReminderAt`, so no more timers are set. A further `PaymentOverdue`
  would be declined with `ReminderLimitReached`, and the clause's writes
  discarded. Without a late payment clause, the timer fires and nothing
  happens.
- **`RecordFeePayment`**, from the licensor while the fee is due, does
  three things:
  - cancels the timer;
  - marks the fee `PAID`;
  - triggers `PaymentSettled` on the clause, which stops the reminders.

  It answers `FeeSettled {amount, remindersSent}`. It is refused with
  `NOT_THE_LICENSOR` when anyone else sends it, and with `NOT_DUE` before
  the fee is asked for or after it is paid.
- **`AcceptLicence {digest}`** records the caller's acceptance of the whole
  agreement.
  - The caller must be the licensee or the licensor.
  - `digest` must be `acceptanceDigest(partyId, self.agreementTermsHash)`.
    The agreement's terms version covers every document's drafted text and
    data, the late payment clause included.
  - So a change to the schedule alone voids an earlier acceptance, which is
    then refused with `TERMS_CHANGED`. A re-pin that changes only logic
    keeps the digest.
  - A caller who is neither party is refused with `NOT_A_PARTY`.
- The logic builds no sentence from data. Who owes whom, and how much,
  travel as typed fields, and an observer renders them. Every request
  describes itself in the model with `@Returns`, `@Declines` and `@Emits`,
  and the engine holds the logic to those lists.

## Manifest

```json
"accordproject": {
    "runtime": "typescript", "semantics": "1.0.0-draft", "implements": {},
    "slots": {
        "latePayment": { "interface": "org.accordproject.latepayment.api@^1.0.0", "optional": true, "bind": { "utcOffset": "utcOffset" } }
    },
    "documents": { "schedule": { "template": { "hash": "UNPINNED", "name": "copyright-license-schedule-poc", "version": "0.1.0", "location": "./schedule" } } }
}
```

The schedule's hash is pinned when the archives are loaded together
(`loadLibrary([schedule, clause, licence])`), as a slot's template is. The
late payment slot names an interface, so nothing is pinned for it. The
licence's template hash covers the manifest's `slots` and `documents`.

## Running it

The engine is not published, and this repository does not install vitest or
tsx. So the scripts run with the binaries of a next-major engine checkout.
Set `ACCORD_NEXT_ENGINE` to that checkout (the configs default to the
author's):

```sh
E=$ACCORD_NEXT_ENGINE
$E/node_modules/.bin/tsx scripts/codegen.mts        # npm run compile (the licence and the clause)
$E/node_modules/.bin/vitest run                    # npm test
RECORD_VECTORS=1 $E/node_modules/.bin/vitest run -t 'copyright licence'   # re-record test-vectors/ and agreement.json
```

A recorded vector freezes whatever happened, so review a re-recorded one
before relying on it.
