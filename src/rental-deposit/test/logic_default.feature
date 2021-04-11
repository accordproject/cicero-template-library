Feature: Rental Deposit
  This describe the expected behavior for the Accord Project's rental deposit contract

  Background:
    Given the default contract

  Scenario: The property was inspected and there was damage
    When the current time is "2018-01-02T16:34:00Z"
    And it receives the default request
    Then it should respond with
"""
{
   "$class": "org.accordproject.rentaldeposit.PropertyInspectionResponse",
    "balance": {
      "$class": "org.accordproject.money.MonetaryAmount",
      "doubleValue" : 1550,
      "currencyCode" : "USD"
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
            "currencyCode": "USD",
            "doubleValue": 1550
        }
    }
]
"""


