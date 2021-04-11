Feature: Certificate of Incorporation
  This describe the expected behavior for the Accord Project's certificate of incorporation contract

  Background:
    Given the default contract

  Scenario: The contract can be signed and emit information about the incorporation
    When the current time is "2019-01-31T16:34:00-05:00"
    And it receives the request
"""
{
    "$class": "org.accordproject.signature.ContractSigned",
    "contract": "MY_CONTRACT"
}
"""
    Then it should respond with
"""
{
    "$class": "org.accordproject.runtime.Response"
}
"""
    And the following obligations should have been emitted
"""
[
    {
      "$class": "org.accordproject.incorporation.Contract",
      "companyName": "ACME",
      "incorporationDate": "2019-04-01T00:00:00.000Z",
      "authorizedShareCapital": 400,
      "parValue": 0.1
    }
]
"""
