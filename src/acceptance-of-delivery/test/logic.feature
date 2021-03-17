Feature: Acceptance of Delivery
  This describe the expected behavior for the Accord Project's acceptance of delivery contract

  Background:
    Given that the contract says
"""
## Acceptance of Delivery.

"Party A" will be deemed to have completed its delivery obligations
if in "Party B"'s opinion, the "Widgets" satisfies the
Acceptance Criteria, and "Party B" notifies "Party A" in writing
that it is accepting the "Widgets".

## Inspection and Notice.

"Party B" will have 10 Business Days to inspect and
evaluate the "Widgets" on the delivery date before notifying
"Party A" that it is either accepting or rejecting the
"Widgets".

## Acceptance Criteria.

The "Acceptance Criteria" are the specifications the "Widgets"
must meet for "Party A" to comply with its requirements and
obligations under this agreement, detailed in "Attachment X", attached
to this agreement.
"""

  Scenario: The delivery was received and passed testing
    When the current time is "2019-01-31T16:34:00-05:00"
    And it receives the request
"""
{
    "$class": "org.accordproject.acceptanceofdelivery.InspectDeliverable",
    "deliverableReceivedAt": "2019-01-22 03:24:00Z",
    "inspectionPassed": true
}
"""
    Then it should respond with
"""
{
   "$class": "org.accordproject.acceptanceofdelivery.InspectionResponse",
    "status": "PASSED_TESTING",
   "shipper": "resource:org.accordproject.organization.Organization#Party%20A",
   "receiver": "resource:org.accordproject.organization.Organization#Party%20B"
}
"""

  Scenario: The delivery was received but failed testing
    When the current time is "2019-01-31T16:34:00-05:00"
    And it receives the request
"""
{
    "$class": "org.accordproject.acceptanceofdelivery.InspectDeliverable",
    "deliverableReceivedAt": "2019-01-22 03:24:00Z",
    "inspectionPassed": false
}
"""
    Then it should respond with
"""
{
   "$class": "org.accordproject.acceptanceofdelivery.InspectionResponse",
    "status": "FAILED_TESTING",
   "shipper": "resource:org.accordproject.organization.Organization#Party%20A",
   "receiver": "resource:org.accordproject.organization.Organization#Party%20B"
}
"""

  Scenario: The delivery was received but outside the testing period
    When the current time is "2019-01-31T16:34:00-05:00"
    And it receives the request
"""
{
    "$class": "org.accordproject.acceptanceofdelivery.InspectDeliverable",
    "deliverableReceivedAt": "2019-01-12 03:24:00Z",
    "inspectionPassed": true
}
"""
    Then it should respond with
"""
{
   "$class": "org.accordproject.acceptanceofdelivery.InspectionResponse",
    "status": "OUTSIDE_INSPECTION_PERIOD",
   "shipper": "resource:org.accordproject.organization.Organization#Party%20A",
   "receiver": "resource:org.accordproject.organization.Organization#Party%20B"
}
"""

  Scenario: The delivery was received in the future!
    When the current time is "2019-01-11T16:34:00-05:00"
    And it receives the request
"""
{
    "$class": "org.accordproject.acceptanceofdelivery.InspectDeliverable",
    "deliverableReceivedAt": "2019-01-12 03:24:00Z",
    "inspectionPassed": true
}
"""
    Then it should reject the request with the error "[Ergo] Transaction time is before the deliverable date."

