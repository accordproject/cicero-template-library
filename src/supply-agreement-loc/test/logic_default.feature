Feature: Supply Agreement Sensor Reading
  This describe the expected behavior for the Supply Agreement

  Background:
    Given the default contract

  Scenario: The contract should process a sensor reading
    When it receives the default request
    Then it should respond with
"""
{
    "$class": "org.cloudsecurityalliance.supplyagreement.DeliveryResponse",
    "message": "Sensor reading received"
}
"""
