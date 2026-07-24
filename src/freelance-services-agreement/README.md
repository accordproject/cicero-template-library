# Freelance Services Agreement

A contract template between a client and a freelance service provider. The contract captures the scope of work, payment amount, payment due period, and governing law.

When the provider notifies work completion, the contract emits a `PaymentObligation` requiring the client to pay the agreed amount. The contract completes once payment is acknowledged.

## Template Variables

| Variable | Type | Description |
|---|---|---|
| `client` | Party | The party commissioning the work |
| `provider` | Party | The freelance service provider |
| `scopeOfWork` | String | Description of the services to be performed |
| `paymentAmount` | MonetaryAmount | The agreed payment amount and currency |
| `paymentDueDays` | Integer | Days after work completion within which payment must be made |
| `governingLaw` | String | The jurisdiction whose laws govern this agreement |

## Contract Lifecycle

1. **INITIALIZED** — contract is active, awaiting work completion notification
2. **PAYMENT_DUE** — provider has notified completion; payment obligation emitted to client
3. **COMPLETED** — client has acknowledged payment
