Feature: DocuSign Connect
  This describe the expected behavior for the Accord Project's docusign-connect template

  Background:
    Given the default contract

  Scenario: DocuSign Connect counts completed an envelope 
    When the current time is "2018-01-02T16:34:00Z"
    And it receives the default request
    Then it should respond with
"""
{
   "$class": "com.docusign.connect.counter.MyResponse",
    "output" : "Have received 1 contracts with status Completed",
    "counter" : 1
}
"""
    And the following obligations should have been emitted
"""
[
  {
    "$class": "org.accordproject.obligation.NotificationObligation",
    "title": "Contracts with status Completed",
    "message": "Have received 1 contracts with status Completed"
 }
]
"""
    And the new state of the contract should be
"""
{
  "$class": "com.docusign.connect.counter.DocuSignEnvelopeCounterState",
  "counter" : 1
}
"""
