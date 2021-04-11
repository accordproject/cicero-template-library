Feature: DocuSign Connect
  This describe the expected behavior for the Accord Project's docusign-connect template

  Background:
    Given the default contract

Scenario: The contract should be in the correct initial state
    Then the initial state of the contract should be
"""
{
  "$class": "com.docusign.connect.counter.DocuSignEnvelopeCounterState",
  "counter" : 0
}
"""

  Scenario: DocuSign Connect does not count a voided envelope 
  Given the state
"""
{
  "$class": "com.docusign.connect.counter.DocuSignEnvelopeCounterState",
  "counter" : 0
}
"""
    When the current time is "2018-01-02T16:34:00Z"
    When it receives the request
"""
{
  "$class": "com.docusign.connect.DocuSignEnvelopeInformation",
  "envelopeStatus": {
    "$class" : "com.docusign.connect.EnvelopeStatus",
      "status" : "Voided"
    }
}
"""
    Then it should respond with
"""
{
   "$class": "com.docusign.connect.counter.MyResponse",
    "output" : "Have received 0 contracts with status Completed",
    "counter" : 0
}
"""
    And the following obligations should have been emitted
"""
[]
"""
    And the new state of the contract should be
"""
{
  "$class": "com.docusign.connect.counter.DocuSignEnvelopeCounterState",
  "counter" : 0
}
"""

  Scenario: DocuSign Connect counts multiple completed envelopes
  Given the state
"""
{
  "$class": "com.docusign.connect.counter.DocuSignEnvelopeCounterState",
  "counter" : 1
}
"""
    When the current time is "2018-01-02T16:34:00Z"
    When it receives the request
"""
{
  "$class": "com.docusign.connect.DocuSignEnvelopeInformation",
  "envelopeStatus": {
    "$class" : "com.docusign.connect.EnvelopeStatus",
      "status" : "Completed"
    }
}
"""
    Then it should respond with
"""
{
   "$class": "com.docusign.connect.counter.MyResponse",
    "output" : "Have received 2 contracts with status Completed",
    "counter" : 2
}
"""
    And the following obligations should have been emitted
"""
[
  {
    "$class": "org.accordproject.obligation.NotificationObligation",
    "title": "Contracts with status Completed",
    "message": "Have received 2 contracts with status Completed"
 }
]
"""
    And the new state of the contract should be
"""
{
  "$class": "com.docusign.connect.counter.DocuSignEnvelopeCounterState",
  "counter" : 2
}
"""
