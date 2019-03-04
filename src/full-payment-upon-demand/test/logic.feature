Feature: Full Payment Upon Demand
  This describe the expected behavior for the Accord Project's full payment upon demand contract

  Background:
    Given the default contract

  Scenario: The contract should produce correct payment in USD
    Given the state
"""
{
    "$class": "org.accordproject.payment.fullupondemand.FullPaymentUponDemandState",
    "stateId": "org.accordproject.payment.fullupondemand.FullPaymentUponDemandState#1"
}
"""
    When it receives the request
"""
{
    "$class": "org.accordproject.payment.fullupondemand.PaymentDemand"
}
"""
    Then the following obligations should have been emitted
"""
[
    {
      "$class": "org.accordproject.cicero.runtime.PaymentObligation",
      "amount": {
        "$class": "org.accordproject.money.MonetaryAmount",
        "doubleValue": 3.14,
        "currencyCode": "EUR"
      },
      "description": "Dan should pay contract amount to Jerome",
      "promisor": "resource:org.accordproject.cicero.contract.AccordParty#Dan",
      "promisee": "resource:org.accordproject.cicero.contract.AccordParty#Jerome",
      "eventId": "valid"
    }
]
"""
    And the new state of the contract should be
"""
{
    "status": "OBLIGATION_EMITTED"
}
"""

Scenario: The contract should complete once the payment is acknowledged
    Given the state
"""
{
    "$class": "org.accordproject.payment.fullupondemand.FullPaymentUponDemandState",
    "stateId": "org.accordproject.payment.fullupondemand.FullPaymentUponDemandState#1",
    "status": "OBLIGATION_EMITTED"
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

Scenario: The contract should not emit multiple payment obligations
    Given the state
"""
{
    "$class": "org.accordproject.payment.fullupondemand.FullPaymentUponDemandState",
    "stateId": "org.accordproject.payment.fullupondemand.FullPaymentUponDemandState#1",
    "status": "OBLIGATION_EMITTED"
}
"""
    When it receives the request
"""
{
    "$class": "org.accordproject.payment.fullupondemand.PaymentDemand"
}
"""
    Then it should reject the request with the error "[Ergo] Payment has already been demanded."

Scenario: The contract should not emit multiple payment obligations
    Given the state
"""
{
    "$class": "org.accordproject.payment.fullupondemand.FullPaymentUponDemandState",
    "stateId": "org.accordproject.payment.fullupondemand.FullPaymentUponDemandState#1",
    "status": "INITIALIZED"
}
"""
    When it receives the request
"""
{
    "$class": "org.accordproject.payment.PaymentReceived"
}
"""
    Then it should reject the request with the error "[Ergo] Either a payment obligation hasn\'t yet been emitted by the contract or payment notification has already been received"