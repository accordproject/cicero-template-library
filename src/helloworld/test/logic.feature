Feature: HelloWorld
  This describe the expected behavior for the Accord Project's "Hello World!" contract for Betty Buyer

  Background:
    Given that the contract says
"""
Name of the person to greet: "Betty Buyer".
Thank you!
"""

  Scenario: The contract should say Hello to Betty Buyer, from the Accord Project, for the default request
    When it receives the default request
    Then it should respond with
"""
{
    "$class": "org.accordproject.helloworld.MyResponse",
    "output": "Hello Betty Buyer Accord Project"
}
"""

  Scenario: The contract should say Hello to Betty Buyer, from the ACME Corporation
    When it receives the request
"""
{
    "$class": "org.accordproject.helloworld.MyRequest",
    "input": "ACME Corporation"
}
"""
    Then it should respond with
"""
{
    "$class": "org.accordproject.helloworld.MyResponse",
    "output": "Hello Betty Buyer ACME Corporation"
}
"""

