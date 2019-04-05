Feature: Late delivery contract (default)
  This describe the default behavior for the Accord Project's late delivery and penalty contract

  Background:
    Given the default contract

  Scenario: The contract should not allow the late delivery clause to be triggered when the delivery is on time
    When the current time is "2017-12-19T03:24:00Z"
    And it receives the default request
    Then it should respond with
"""
{
  "$class": "org.accordproject.simplelatedeliveryandpenalty.SimpleLateDeliveryAndPenaltyResponse",
  "buyerMayTerminate": false,
  "penalty": 10.5
}
"""

