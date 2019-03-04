Feature: One Time Payment TR
  This describes the expected behavior for the Accord Project's One Time Payment TR contract

  Background:
    Given the default contract

  Scenario: The contract should produce a correct payment in TRY
    Then the initial state of the contract should be
"""
{
    "status": "OBLIGATION_EMITTED"
}
"""
    And the following obligations should have been emitted
"""
[
    {
        "$class": "org.accordproject.cicero.runtime.PaymentObligation",
        "amount": {
            "$class": "org.accordproject.money.MonetaryAmount",
            "doubleValue": 1922.99,
            "currencyCode": "TRY"
        }
    }
]
"""

  Scenario: The contract should complete once the payment is acknowledged
    Given the state
"""
{
    "$class": "org.accordproject.onetimepayment.OneTimePaymentState",
    "status": "OBLIGATION_EMITTED",
    "stateId": "1"
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
