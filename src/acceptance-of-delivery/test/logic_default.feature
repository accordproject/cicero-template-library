Feature: Acceptance of Delivery
  This describe the expected behavior for the Accord Project's acceptance of delivery contract

  Background:
    Given the default contract

  Scenario: The delivery was received and passed testing
    When it receives the default request
    Then it should respond with
"""
{
   "$class": "org.accordproject.acceptanceofdelivery.InspectionResponse",
    "status": "PASSED_TESTING",
   "shipper": "resource:org.accordproject.organization.Organization#Party%20A",
   "receiver": "resource:org.accordproject.organization.Organization#Party%20B"
}
"""

