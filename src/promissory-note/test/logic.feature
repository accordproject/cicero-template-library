Feature: Promissory Note
  This describes the expected behavior for the Accord Project's promissory note contract

  Background:
    Given the default contract

  Scenario: The amount paid is 100 USD
    When it receives the request
"""
{
  "$class": "org.accordproject.promissorynote.Payment",
  "amountPaid": {
      "$class": "org.accordproject.money.MonetaryAmount",
      "doubleValue": 100,
      "currencyCode": "USD"    
  }
}
"""
    Then it should respond with
"""
{
    "$class": "org.accordproject.promissorynote.Result",
    "outstandingBalance": 1425.4396822450633
}
"""
