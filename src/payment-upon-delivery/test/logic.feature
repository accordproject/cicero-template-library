Feature: Payment Upon Delivery
  This describes the expected behavior for the Accord Project's payment upon delivery contract

  Background:
    Given the default contract

  Scenario: The cost of goods is 9.99 USD and the delivery fee is 1.99 USD
    When it receives the request
"""
{
    "$class": "org.accordproject.payment.upondelivery.DeliveryAcceptedRequest"
}
"""
    Then it should respond with
"""
{
    "$class": "org.accordproject.payment.upondelivery.DeliveryAcceptedResponse"
}
"""
    And the following obligations should have been emitted
"""
[
  {
    "$class": "org.accordproject.obligation.PaymentObligation",
    "amount": {
        "$class": "org.accordproject.money.MonetaryAmount",
        "doubleValue": 11.98,
        "currencyCode": "USD"
    }
  }
]
"""

