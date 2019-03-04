Feature: IP Payment Contract
  This describes the expected behavior for the Accord Project’s IP Payment Contract contract

  Background:
    Given the default contract

  Scenario: Payment of a specified amount should be made
    When it receives the request
"""
{
    "$class": "org.accordproject.ippayment.PaymentRequest",
    "netSaleRevenue": 1200,
    "sublicensingRevenue": 450,
    "permissionGrantedBy": "04-05-2018"
}
"""
    Then it should respond with
"""
{
    "$class": "org.accordproject.ippayment.PayOut",
    "totalAmount": 77.4,
    "dueBy": "2018-04-12T04:00:00.000Z"
}
"""