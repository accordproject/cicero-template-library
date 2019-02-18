Feature: Acceptance of Delivery
  This describe the expected behavior for the Accord Project's acceptance of delivery contract

  Background:
    Given the default contract

  Scenario: The contract produces the correct result and zero emits when beef is ordered
    When it receives the request
"""
{
    "$class": "org.accordproject.canteen.Food",
    "produce": "beef",
    "price": 11.49
}
"""
    Then it should respond with
"""
{
    "$class": "org.accordproject.canteen.Outcome",
    "notice": "You're fired!"
}
"""
    And the following obligations should have been emitted
"""
[
]
"""

