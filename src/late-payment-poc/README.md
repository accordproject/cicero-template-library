# Late Payment (agreement@1.0.0 composed clause prototype)

A clause template meant to be composed into a document that owns a payment
([accordproject/models#205](https://github.com/accordproject/models/pull/205)):
an instance of it sits in an `AgreementDocument`'s `clauses`, with its own
data and state. The document chases an overdue payment through it
(`PaymentOverdue`, answered with `ReminderSent` and a `PaymentReminder`
event), and discharges it once the payment is settled (`PaymentSettled`).
It knows nothing about the document's own model.

Its logic is written with template-engine's logic API; see
[`copyright-license-agreement-poc`](../copyright-license-agreement-poc),
which composes it, for the design.
