Feature: Demand Forecast
  This describe the expected behavior for the Accord Project's demandforecast template

  Background:
    Given the default contract

  Scenario: Demand forecast calculates a required purchase
    When the current time is "2018-01-02T16:34:00Z"
    And it receives the default request
    Then it should respond with
"""
{
   "$class": "org.accordproject.demandforecast.BindingResponse",
    "requiredPurchase" : 1020.00
}
"""

