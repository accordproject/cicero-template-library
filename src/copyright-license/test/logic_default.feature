Feature: Copyright License
  This describe the expected behavior for the Accord Project's copyright-license template

  Background:
    Given the default contract

  Scenario: Copyright license calculates a pay out
    When the current time is "2018-01-02T16:34:00Z"
    And it receives the default request
    Then it should respond with
"""
{
   "$class": "org.accordproject.copyrightlicense.PayOut",
    "amount": {
      "$class" : "org.accordproject.money.MonetaryAmount",
      "doubleValue" : 100.00,
      "currencyCode" : "USD"
    }
}
"""

