Feature: Hello World State
  This describe the expected behavior for the Accord Project's "Hello World!" State contract for Fred Blogs

  Background:
    Given that the contract says
"""
Name of the person to greet: "Fred Blogs".
Thank you!
"""

  Scenario: The contract should say Hello to Fred Blogs, from the Input from Request, for the default request, once
    When it receives the request
"""
{
    "$class": "org.accordproject.helloworldstate.MyRequest",
    "input": "World"
}
"""
    Then it should respond with
"""
{
    "$class": "org.accordproject.helloworldstate.MyResponse",
    "output": "Hello Fred Blogs World(1.0)"
}
"""

  Scenario: The contract accepts a second payment, and maintain the remaining balance
    When it is in the state
"""
{
    "$class": "org.accordproject.helloworldstate.HelloWorldState",
    "stateId": "org.accordproject.helloworldstate.HelloWorldState#0",
    "counter": 0
}
"""
    When it receives the request
"""
{
    "$class": "org.accordproject.helloworldstate.MyRequest",
    "input": "World"
}
"""
    Then the new state of the contract should be
"""
{
    "$class": "org.accordproject.helloworldstate.HelloWorldState",
    "stateId": "org.accordproject.helloworldstate.HelloWorldState#0.0",
    "counter": 1
}
"""
    And the new state of
 """
{
    "$class": "org.accordproject.helloworldstate.HelloWorldState",
    "stateId": "org.accordproject.helloworldstate.HelloWorldState#0.0",
    "counter": 1
}
"""
    When it receives the request
"""
{
    "$class": "org.accordproject.helloworldstate.MyRequest",
    "input": "World"
}
"""
    Then the new state of the contract should be
"""
{
    "$class": "org.accordproject.helloworldstate.HelloWorldState",
    "stateId": "org.accordproject.helloworldstate.HelloWorldState#0.0",
    "counter": 2
}
"""