Feature: Liquidated Damages for Delayed or Mishandled Delivery
  This describe the expected behavior for the Accord Project's fragile goods contract

  Background:
    Given the default contract

  Scenario: The delivery was received late with two mishandling breaches
    When it receives the request
"""
{
    "$class": "io.clause.demo.fragileGoods.DeliveryUpdate",
    "startTime": "2018-01-01T16:34:00.000Z",
    "finishTime": "2018-01-01T16:34:11.000Z",
    "status": "ARRIVED",
    "accelerometerReadings": [0.2,0.6,-0.3,-0.7,0.1]
}
"""
    Then it should respond with
"""
{
    "$class": "io.clause.demo.fragileGoods.PayOut",
    "amount": {
        "$class": "org.accordproject.money.MonetaryAmount",
        "currencyCode": "USD",
        "doubleValue": 790
    }
}
"""
    And the following obligations should have been emitted
"""
[
    {
        "$class": "org.accordproject.obligation.PaymentObligation",
        "amount": {
            "$class": "org.accordproject.money.MonetaryAmount",
            "doubleValue": 790,
            "currencyCode": "USD"
        }
    }
]
"""

  Scenario: The contract should execute while the delivery is in transit with two mishandling breaches
    When it receives the request
"""
{
    "$class": "io.clause.demo.fragileGoods.DeliveryUpdate",
    "startTime": "2018-01-01T16:34:00.000Z",
    "status": "IN_TRANSIT",
    "accelerometerReadings": [0.2,0.6,-0.3,-0.7,0.1]
}
"""
    Then it should respond with
"""
{
    "$class": "io.clause.demo.fragileGoods.PayOut",
    "amount": {
        "$class": "org.accordproject.money.MonetaryAmount",
        "currencyCode": "USD",
        "doubleValue": 990
    }
}
"""

  Scenario: The delivery was received in time with two mishandling breaches
    When it receives the request
"""
{
    "$class": "io.clause.demo.fragileGoods.DeliveryUpdate",
    "startTime": "2018-01-01T16:34:00.000Z",
    "finishTime": "2018-01-01T16:34:09.000Z",
    "status": "ARRIVED",
    "accelerometerReadings": [0.2,0.6,-0.3,-0.7,0.1]
}
"""
    Then it should respond with
"""
{
    "$class": "io.clause.demo.fragileGoods.PayOut",
    "amount": {
        "$class": "org.accordproject.money.MonetaryAmount",
        "currencyCode": "USD",
        "doubleValue": 990
    }
}
"""
    And the following obligations should have been emitted
"""
[
    {
        "$class": "org.accordproject.obligation.PaymentObligation",
        "amount": {
            "$class": "org.accordproject.money.MonetaryAmount",
            "doubleValue": 990,
            "currencyCode": "USD"
        }
    }
]
"""

  Scenario: The delivery was received in time with no breaches
    When it receives the request
"""
{
    "$class": "io.clause.demo.fragileGoods.DeliveryUpdate",
    "startTime": "2018-01-01T16:34:00.000Z",
    "finishTime": "2018-01-01T16:34:09.000Z",
    "status": "ARRIVED",
    "accelerometerReadings": [0.2,0.4,0.1]
}
"""
    Then it should respond with
"""
{
    "$class": "io.clause.demo.fragileGoods.PayOut",
    "amount": {
        "$class": "org.accordproject.money.MonetaryAmount",
        "currencyCode": "USD",
        "doubleValue": 1000
    }
}
"""
    And the following obligations should have been emitted
"""
[
    {
        "$class": "org.accordproject.obligation.PaymentObligation",
        "amount": {
            "$class": "org.accordproject.money.MonetaryAmount",
            "doubleValue": 1000,
            "currencyCode": "USD"
        }
    }
]
"""


  Scenario: The delivery was received on time with no accelerometer readings
    When it receives the request
"""
{
    "$class": "io.clause.demo.fragileGoods.DeliveryUpdate",
    "startTime": "2018-01-01T16:34:00.000Z",
    "finishTime": "2018-01-01T16:34:09.000Z",
    "status": "ARRIVED",
    "accelerometerReadings": []
}
"""
    Then it should respond with
"""
{
    "$class": "io.clause.demo.fragileGoods.PayOut",
    "amount": {
        "$class": "org.accordproject.money.MonetaryAmount",
        "currencyCode": "USD",
        "doubleValue": 1000
    }
}
"""
    And the following obligations should have been emitted
"""
[
    {
        "$class": "org.accordproject.obligation.PaymentObligation",
        "amount": {
            "$class": "org.accordproject.money.MonetaryAmount",
            "doubleValue": 1000,
            "currencyCode": "USD"
        }
    }
]
"""

