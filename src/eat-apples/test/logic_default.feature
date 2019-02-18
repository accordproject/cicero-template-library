Feature: Acceptance of Delivery
  This describe the expected behavior for the Accord Project's acceptance of delivery contract

  Background:
    Given the default contract

  Scenario: The contract produces the correct result and emits when an apple is ordered
    When it receives the default request
    Then it should respond with
"""
{
    "$class": "org.accordproject.canteen.Outcome",
    "notice": "Very healthy!"
}
"""
    And the following obligations should have been emitted
"""
[
    {
        "billTo": "Dan",
        "amount": 1.5570499999999998
    }
]
"""

