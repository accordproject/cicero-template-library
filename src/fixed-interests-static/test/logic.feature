Feature: Fixed Interests Clause
  This describes the expected behavior for the Accord Project's fixed interests clause

  Background:
    Given the default contract

  Scenario: Initiate a loan for 10000.00
    When it receives the request
"""
{
  "$class": "org.accordproject.interests.Request",
  "input": "test"
}
"""
    Then it should respond with
"""
{
    "$class": "org.accordproject.interests.Response",
    "output": "loan for the amount of 100000.0"
}
"""
