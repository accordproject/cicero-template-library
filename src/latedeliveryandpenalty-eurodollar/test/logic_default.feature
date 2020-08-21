Feature: Late delivery contract (default)
  This describe the default behavior for the Accord Project's late delivery and penalty contract with a euro/dollar conversion specified

  Background:
    Given the default contract

  Scenario: The contract should not allow the late delivery clause to be triggered when the delivery is on time and the conversion should be applied to the penalty
    When the current time is "2017-12-19T03:24:00Z"
    And it receives the default request
    Then it should respond with
"""
{
  "$class": "org.accordproject.latedeliveryandpenalty.LateDeliveryAndPenaltyResponse",
  "buyerMayTerminate": false,
  "penalty": 11.55
}
"""

