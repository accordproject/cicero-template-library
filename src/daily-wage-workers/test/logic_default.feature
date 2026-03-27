Feature: Daily Wage Workers Payment
  This describes the expected behavior for the Daily Wage Workers contract

  Background:
    Given the default contract

  Scenario: Calculate payment for 5 days and 4 hours overtime
    When it receives the default request
    Then it should respond with
"""
{
    "$class": "org.accordproject.dailywage.PaymentResponse",
    "totalAmount": {
        "$class": "org.accordproject.money.MonetaryAmount",
        "doubleValue": 850.0,
        "currencyCode": "USD"
    },
    "breakdown": "Base pay plus overtime"
}
"""

