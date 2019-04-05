Feature: Sales Contract RU
  This describes the expected behavior for the Accord Project's Sales Contract RU contract

  Background:
    Given the default contract

  Scenario: Say whether contract is valid
    When it receives the request
"""
{
  "$class": "org.accordru.salescontract.MyRequest",
  "input": "Contract Valid"
}
"""
    Then it should respond with
"""
{
    "output": "Contract Valid"
}
"""
