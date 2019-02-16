Feature: Car Rental (Turkish)
  This describe the expected behavior for the Accord Project's car-rential-tr template

  Background:
    Given the default contract

  Scenario: Rental contract calculates a pay out
    When the current time is "2018-01-02T16:34:00Z"
    And it receives the default request
    Then it should respond with
"""
{
   "$class": "org.accordtr.carrental.PayOut",
    "amount": {
      "$class" : "org.accordproject.money.MonetaryAmount",
      "doubleValue" : 217.99,
      "currencyCode" : "USD"
    }
}
"""

