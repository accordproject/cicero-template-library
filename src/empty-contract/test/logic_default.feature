Feature: Empty
  This describe the expected behavior for the Accord Project's empty contract

  Background:
    Given the default contract

  Scenario: The delivery was received and passed testing
    When it receives the default request
    Then it should respond with
"""
{
    "$class": "org.accordproject.empty.EmptyResponse"
}
"""

