Feature: Online Payment Contract TR
  This describes the expected behavior for the Accord Project's Online Payment Contract TR contract

  Background:
    Given the default contract

  Scenario: Say whether contract is valid
    When it receives the request
"""
{
  "$class": "org.accordtr.onlinepayment.MyRequest",
  "input": "Payment Valid"
}
"""
    Then it should respond with
"""
{
    "output": "Payment Valid"
}
"""
