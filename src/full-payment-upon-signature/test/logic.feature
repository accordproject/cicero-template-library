Feature: Full Payment Upon Signature
  This describe the expected behavior for the Accord Project's full payment upon signature contract

  Background:
    Given the default contract

  Scenario: The contract produces the correct result and has the correct initial state
    Then the initial state of the contract should be
"""
{
    "status": "INITIALIZED"
}
"""

  Scenario: The contract emits PaymentObligation on ContractSigned
    Given the state
"""
    {
        "$class": "org.accordproject.payment.fulluponsignature.FullPaymentUponSignatureState",
        "status": "INITIALIZED"
    }
"""
    When it receives the request
"""
{
    "$class": "org.accordproject.signature.ContractSigned",
    "contract": "MY_CONTRACT"
}
"""
    Then the following obligations should have been emitted
"""
[
    {
        "$class": "org.accordproject.obligation.PaymentObligation",
        "amount": {
            "$class": "org.accordproject.money.MonetaryAmount",
            "doubleValue": 0.01,
            "currencyCode": "USD"
        }
    }
]
"""
And the new state of the contract should be
"""
{
    "status": "OBLIGATION_EMITTED"
}
"""

  Scenario: The contract completes once the payment is acknowledged
    Given the state
"""
    {
        "$class": "org.accordproject.payment.fulluponsignature.FullPaymentUponSignatureState",
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
