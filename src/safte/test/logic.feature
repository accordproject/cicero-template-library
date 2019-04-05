Feature: Safte
  This describes the expected behavior for the Accord Project's Safte contract

  Background:
    Given the default contract

  Scenario: Token sale occurs, should provide a share of that sale
    When it receives the request
"""
{
  "$class": "org.accordproject.safte.TokenSale",
  "tokenPrice": 1.23
}
"""
    Then it should respond with
"""
{
    "tokenAmount": 21.855057260250017
}
"""

Scenario: Equity financing is chosen, should provide a share of that equity
    When it receives the request
"""
{
    "$class": "org.accordproject.safte.EquityFinancing",
    "sharePrice": 3.00
}
"""
    Then it should respond with
"""
{
    "equityAmount": 8.960573476702509
}
"""

Scenario: Dissolution event occurs, should refund the amount
    When it receives the request
"""
{
    "$class": "org.accordproject.safte.DissolutionEvent",
    "cause": "Went Shopping"
}
"""
    Then it should respond with
"""
{
    "amount": 25
}
"""