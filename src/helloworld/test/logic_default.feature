Feature: HelloWorld
  This describe the expected behavior for the Accord Project's "Hello World!" contract

  Background:
    Given the default contract

  Scenario: The contract should say Hello to Fred Blogs, from the Accord Project, for the default request
    When it receives the default request
    Then it should respond with
"""
{
    "$class": "org.accordproject.helloworld.MyResponse",
    "output": "Hello Fred Blogs Accord Project"
}
"""

  Scenario: The contract should say Hello to Fred Blogs, from the ACME Corporation
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
    "output": "Hello Fred Blogs ACME Corporation"
}
"""

