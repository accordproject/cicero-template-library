Feature: Hello Module
  This describe the expected behavior for the Accord Project's Hello Module contract

  Background:
    Given that the contract says
"""
Name of the person to greet: "Fred Blogs".
Thank you!
"""

  Scenario: The contract should produce correct result
    When it receives the request
"""
{
    "$class": "org.accordproject.hellomodule.MyRequest",
    "input": "Module"
}
"""
    Then it should respond with
"""
{
    "$class": "org.accordproject.hellomodule.MyResponse",
    "output": "Hello Fred Blogs (Module) [motd: PI/2.0 radians is 90.0 degrees]"
}
"""