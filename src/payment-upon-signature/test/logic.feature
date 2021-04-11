Feature: Payment Upon Signature
  This describes the expected behavior for the Accord Project's payment upon signature contract

  Background:
    Given the default contract

  Scenario: The contract is in its initial state
    Then the initial state of the contract should be
"""
{
    "$class": "org.accordproject.payment.uponsignature.PaymentUponSignatureState",
    "status": "INITIALIZED"
}
"""
Scenario: The contract is signed
    Given the state
"""
{
    "$class": "org.accordproject.payment.uponsignature.PaymentUponSignatureState",
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
        "doubleValue": 50,
        "currencyCode": "USD"
    }
}
]
"""
    And the new state of the contract should be
"""
{
    "$class": "org.accordproject.payment.uponsignature.PaymentUponSignatureState",
    "status": "OBLIGATION_EMITTED"
}
"""
Scenario: The payment is made
    Given the state
"""
{
    "$class": "org.accordproject.payment.uponsignature.PaymentUponSignatureState",
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
    "$class": "org.accordproject.payment.uponsignature.PaymentUponSignatureState",
    "status": "COMPLETED"
}
"""

