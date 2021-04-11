Feature: Installment Sale
  This describe the expected behavior for the Accord Project's installment sale contract

  Background:
    Given that the contract says
"""
Upon long button press, "Dan" shall pay to "Grant" 10 USD for each short button press. A maximum of 5 payments may be made before this contract is COMPLETED.

Note: to undo a short button press the buyer may double-press the button.
"""

  Scenario: The contract should be in the correct initial state
    Then the initial state of the contract should be
"""
{
  "$class": "org.accordproject.payment.iot.CounterState",
  "status" : "INITIALIZED",
  "counter": 0.0,
  "paymentCount": 0.0
}
"""

  Scenario: The contract transitions to RUNNING on ContractSigned
    Given the state
"""
{
  "$class": "org.accordproject.payment.iot.CounterState",
  "status" : "INITIALIZED",
  "counter": 0.0,
  "paymentCount": 0.0
}
"""
    When it receives the request
"""
{
    "$class": "org.accordproject.signature.ContractSigned",
    "contract": "MY_CONTRACT"
}
"""
    Then it should respond with
"""
{
  "counter": 0,
  "paymentCount": 0
}
"""
    And the new state of the contract should be
"""
{
  "counter": 0,
  "status" : "RUNNING"
}

"""

  Scenario: The contract should increment counter on short press
    Given the state
"""
{
  "$class": "org.accordproject.payment.iot.CounterState",
  "status" : "RUNNING",
  "counter": 0.0,
  "paymentCount": 0.0
}
"""
    When it receives the request
"""
{
    "$class": "org.accordproject.iot.SingleButtonPress"
}
"""
    Then it should respond with
"""
{
  "counter": 1,
  "paymentCount": 0
}
"""
    And the new state of the contract should be
"""
{
  "counter": 1
}

"""

  Scenario: The contract should decrement counter on double press
    Given the state
"""
{
  "$class": "org.accordproject.payment.iot.CounterState",
  "status" : "RUNNING",
  "counter": 3,
  "paymentCount": 0.0
}
"""
    When it receives the request
"""
{
    "$class": "org.accordproject.iot.DoubleButtonPress"
}
"""
    Then it should respond with
"""
{
  "counter": 2,
  "paymentCount": 0
}
"""
    And the new state of the contract should be
"""
{
  "counter": 2
}

"""

  Scenario: The contract should not be negative on double press
    Given the state
"""
{
  "$class": "org.accordproject.payment.iot.CounterState",
  "status" : "RUNNING",
  "counter": 0,
  "paymentCount": 0.0
}
"""
    When it receives the request
"""
{
    "$class": "org.accordproject.iot.DoubleButtonPress"
}
"""
    Then it should respond with
"""
{
    "counter": 0,
    "paymentCount": 0
}
"""
    And the new state of the contract should be
"""
{
   "counter": 0
}

"""
Scenario: The contract should emit payment obligation on long press (1)
    Given the state
"""
{
  "$class": "org.accordproject.payment.iot.CounterState",
  "status" : "RUNNING",
  "counter": 0,
  "paymentCount": 0.0
}
"""
    When it receives the request
"""
{
    "$class": "org.accordproject.iot.SingleButtonPress"
}
"""
    Then it should respond with
"""
{
    "counter": 1,
    "paymentCount": 0
}
"""
    And the new state of the contract should be
"""
{
   "counter": 1
}
"""

 Scenario: The contract should emit payment obligation on long press (2)
    Given the state
"""
{
  "$class": "org.accordproject.payment.iot.CounterState",
  "status" : "RUNNING",
  "counter": 1,
  "paymentCount": 0.0
}
"""
    When it receives the request
"""
{
    "$class": "org.accordproject.iot.LongButtonPress"
}
"""
    Then it should respond with
"""
{
    "counter": 1,
    "paymentCount": 0
}
"""
    And the following obligations should have been emitted
"""
[
  {
    "$class": "org.accordproject.obligation.PaymentObligation",
    "amount": {
      "$class": "org.accordproject.money.MonetaryAmount",
      "doubleValue": 10.0,
      "currencyCode": "USD"
    }
  }
]

"""

  Scenario: The contract counter should log received payments
    Given the state
"""
{
  "$class": "org.accordproject.payment.iot.CounterState",
  "status" : "RUNNING",
  "counter": 0,
  "paymentCount": 0.0
}
"""
    When it receives the request
"""
{
    "$class": "org.accordproject.payment.iot.MonetaryAmountPayment",
    "amount": {"doubleValue": 10.0,
    "currencyCode": "USD"}
}
"""
    Then it should respond with
"""
{
  "counter": 0.0,
  "paymentCount": 1.0
}
"""
    And the new state of the contract should be
"""
{
  "paymentCount": 1.0
}

"""

  Scenario: The contract should complete when the maximum payments received
    Given the state
"""
{
  "$class": "org.accordproject.payment.iot.CounterState",
  "status" : "RUNNING",
  "counter": 0,
  "paymentCount": 4
}
"""
    When it receives the request
"""
{
    "$class": "org.accordproject.payment.iot.MonetaryAmountPayment",
    "amount": {"doubleValue": 10.0,
    "currencyCode": "USD"}
}
"""
    Then it should respond with
"""
{
  "counter": 0.0,
  "paymentCount": 5.0
}
"""
    And the new state of the contract should be
"""
{
  "paymentCount": 5.0,
  "status": "COMPLETED"
}

"""

  Scenario: The contract should reduce counter by payment amount
    Given the state
"""
{
  "$class": "org.accordproject.payment.iot.CounterState",
  "status" : "RUNNING",
  "counter": 4,
  "paymentCount": 0
}
"""
    When it receives the request
"""
{
    "$class": "org.accordproject.payment.iot.MonetaryAmountPayment",
    "amount": {"doubleValue": 20.0,
    "currencyCode": "USD"}
}
"""
    Then it should respond with
"""
{
  "counter": 2.0,
  "paymentCount": 1.0
}
"""
    And the new state of the contract should be
"""
{
  "counter": 2.0,
  "paymentCount": 1.0
}

"""

  Scenario: The contract counter should never be negative
    Given the state
"""
{
  "$class": "org.accordproject.payment.iot.CounterState",
  "status" : "RUNNING",
  "counter": 4,
  "paymentCount": 0
}
"""
    When it receives the request
"""
{
    "$class": "org.accordproject.payment.iot.MonetaryAmountPayment",
    "amount": {"doubleValue": 1000.0,
    "currencyCode": "USD"}
}
"""
    Then it should respond with
"""
{
  "counter": 0,
  "paymentCount": 1.0
}
"""
    And the new state of the contract should be
"""
{
  "paymentCount": 1,
  "status" : "RUNNING"
}

"""

  Scenario: The contract should not be able to pay in a different currency
    Given the state
"""
{
  "$class": "org.accordproject.payment.iot.CounterState",
  "status" : "RUNNING",
  "counter": 4,
  "paymentCount": 0
}
"""
    When it receives the request
"""
{
    "$class": "org.accordproject.payment.iot.MonetaryAmountPayment",
    "amount": {"doubleValue": 1000.0,
    "currencyCode": "EUR"}
}
"""
    Then it should reject the request with the error "[Ergo] Payments must be in the currency of the contract."
