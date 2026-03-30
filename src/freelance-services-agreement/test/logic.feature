Feature: Freelance Services Agreement
  This describes the expected behavior for the Accord Project's Freelance Services Agreement contract

  Background:
    Given the default contract

  Scenario: The contract should emit a payment obligation when work is completed
    Given the state
"""
{
    "$class": "org.accordproject.freelanceservicesagreement.FreelanceServicesAgreementState",
    "status": "INITIALIZED"
}
"""
    When it receives the request
"""
{
    "$class": "org.accordproject.freelanceservicesagreement.WorkCompleted"
}
"""
    Then the following obligations should have been emitted
"""
[
    {
      "$class": "org.accordproject.obligation.PaymentObligation",
      "amount": {
        "$class": "org.accordproject.money.MonetaryAmount",
        "doubleValue": 1500.00,
        "currencyCode": "USD"
      },
      "promisor": "resource:org.accordproject.party.Party#Alice",
      "promisee": "resource:org.accordproject.party.Party#Bob"
    }
]
"""
    And the new state of the contract should be
"""
{
    "status": "PAYMENT_DUE"
}
"""

  Scenario: The contract should complete once payment is acknowledged
    Given the state
"""
{
    "$class": "org.accordproject.freelanceservicesagreement.FreelanceServicesAgreementState",
    "status": "PAYMENT_DUE"
}
"""
    When it receives the request
"""
{
    "$class": "org.accordproject.payment.PaymentReceived"
}
"""
    Then the new state of the contract should be
"""
{
    "status": "COMPLETED"
}
"""

  Scenario: The contract should not emit duplicate payment obligations
    Given the state
"""
{
    "$class": "org.accordproject.freelanceservicesagreement.FreelanceServicesAgreementState",
    "status": "PAYMENT_DUE"
}
"""
    When it receives the request
"""
{
    "$class": "org.accordproject.freelanceservicesagreement.WorkCompleted"
}
"""
    Then it should reject the request with the error "[Ergo] Work completion has already been notified."

  Scenario: The contract should not accept payment before work is completed
    Given the state
"""
{
    "$class": "org.accordproject.freelanceservicesagreement.FreelanceServicesAgreementState",
    "status": "INITIALIZED"
}
"""
    When it receives the request
"""
{
    "$class": "org.accordproject.payment.PaymentReceived"
}
"""
    Then it should reject the request with the error "[Ergo] Payment can only be recorded when a payment obligation is due. Either no payment obligation has been emitted yet or the agreement has already been completed."
