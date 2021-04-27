Feature: Purchase Order Failure
  This describe the expected behavior for the Accord Project's Purchase Order Failure clause

  Background:
    Given the default contract

  Scenario: Should calculate the penalty when delivered after third late period
    When the current time is "2019-03-18T00:00:00Z"
    Given the state
"""
{
  "$class" : "com.docusign.clauses.PurchaseOrderFailureState",
  "pastFailures" : [],
  "nbPastFailures" : 0
}
"""
    And it receives the request
"""
{
    "$class": "com.docusign.connect.DocuSignEnvelopeInformation",
    "envelopeStatus": {
        "$class": "com.docusign.connect.EnvelopeStatus",
        "status" : "Completed"
    },
    "recipients": [
        {
            "status": "Completed",
            "email": "testRecipient@accordproject.org",
            "userName": "testUser",
            "tabStatuses": [
                {
                    "tabType": "Custom",
                    "status": "Signed",
                    "tabLabel": "currencyCode",
                    "tabName": "",
                    "customTabType": "Text",
                    "tabValue": "USD",
                    "originalValue": "",
                    "$class": "com.docusign.connect.TextTabStatus"
                },
                {
                    "tabType": "Custom",
                    "status": "Signed",
                    "tabLabel": "actualPrice",
                    "tabName": "",
                    "customTabType": "Number",
                    "tabValue": 2000,
                    "originalValue": "",
                    "$class": "com.docusign.connect.NumberTabStatus"
                },
                {
                    "tabType": "Custom",
                    "status": "Signed",
                    "tabLabel": "deliveryDate",
                    "tabName": "",
                    "customTabType": "Date",
                    "tabValue": "2019-02-08T00:00:00-07:00",
                    "originalValue": "",
                    "$class": "com.docusign.connect.DateTabStatus"
                }
            ],
            "$class": "com.docusign.connect.Recipient"
        }
    ]
}
"""
    Then it should respond with
"""
{ "$class" : "com.docusign.clauses.PurchaseOrderFailureResponse",
  "penalty" : {
    "$class": "org.accordproject.money.MonetaryAmount",
    "doubleValue": 1000,
    "currencyCode": "USD"
  }
}
"""
    And the new state of the contract should be
"""
{
  "$class" : "com.docusign.clauses.PurchaseOrderFailureState",
  "nbPastFailures" : 1
}
"""
    And the following obligations should have been emitted
"""
      [
        {
          "$class": "org.accordproject.obligation.PaymentObligation",
          "amount": {
            "$class": "org.accordproject.money.MonetaryAmount",
            "doubleValue": 1000,
            "currencyCode": "USD"
          },
          "description": "\"resource:org.accordproject.party.Party#Buyer%20Corp\" should be paid a penalty"
        }
      ]
"""

  Scenario: Should calculate the penalty when delivered after third late period (with repeated failure penalty)
    When the current time is "2019-03-18T00:00:00Z"
    Given the state
"""
{
  "$class" : "com.docusign.clauses.PurchaseOrderFailureState",
  "pastFailures" : ["2018-11-08T05:00:00.000Z","2019-02-08T05:00:00.000Z","2019-01-08T05:00:00.000Z","2019-03-01T05:00:00.000Z","2019-02-01T05:00:00.000Z","2019-03-08T05:00:00.000Z"],
  "nbPastFailures" : 6
}
"""
    And it receives the request
"""
{
    "$class": "com.docusign.connect.DocuSignEnvelopeInformation",
    "envelopeStatus": {
        "$class": "com.docusign.connect.EnvelopeStatus",
        "status" : "Completed"
    },
    "recipients": [
        {
            "status": "Completed",
            "email": "testRecipient@accordproject.org",
            "userName": "testUser",
            "tabStatuses": [
                {
                    "tabType": "Custom",
                    "status": "Signed",
                    "tabLabel": "currencyCode",
                    "tabName": "",
                    "customTabType": "Text",
                    "tabValue": "USD",
                    "originalValue": "",
                    "$class": "com.docusign.connect.TextTabStatus"
                },
                {
                    "tabType": "Custom",
                    "status": "Signed",
                    "tabLabel": "actualPrice",
                    "tabName": "",
                    "customTabType": "Number",
                    "tabValue": 2000,
                    "originalValue": "",
                    "$class": "com.docusign.connect.NumberTabStatus"
                },
                {
                    "tabType": "Custom",
                    "status": "Signed",
                    "tabLabel": "deliveryDate",
                    "tabName": "",
                    "customTabType": "Date",
                    "tabValue": "2019-02-08T00:00:00-07:00",
                    "originalValue": "",
                    "$class": "com.docusign.connect.DateTabStatus"
                }
            ],
            "$class": "com.docusign.connect.Recipient"
        }
    ]
}
"""
    Then it should respond with
"""
{ "$class" : "com.docusign.clauses.PurchaseOrderFailureResponse",
  "penalty" : {
    "$class": "org.accordproject.money.MonetaryAmount",
    "doubleValue": 1599.99,
    "currencyCode": "USD"
  }
}
"""
    And the new state of the contract should be
"""
{
  "$class" : "com.docusign.clauses.PurchaseOrderFailureState",
  "nbPastFailures" : 5
}
"""
    And the following obligations should have been emitted
"""
      [
        {
          "$class": "org.accordproject.obligation.PaymentObligation",
          "amount": {
            "$class": "org.accordproject.money.MonetaryAmount",
            "doubleValue": 1599.99,
            "currencyCode": "USD"
          },
          "description": "\"resource:org.accordproject.party.Party#Buyer%20Corp\" should be paid a penalty"
        }
      ]
"""

  Scenario: Should calculate the penalty when delivered after second late period
    When the current time is "2019-03-18T00:00:00Z"
    Given the state
"""
{
  "$class" : "com.docusign.clauses.PurchaseOrderFailureState",
  "pastFailures" : [],
  "nbPastFailures" : 0
}
"""
    And it receives the request
"""
{
    "$class": "com.docusign.connect.DocuSignEnvelopeInformation",
    "envelopeStatus": {
        "$class": "com.docusign.connect.EnvelopeStatus",
        "status" : "Completed"
    },
    "recipients": [
        {
            "status": "Completed",
            "email": "testRecipient@accordproject.org",
            "userName": "testUser",
            "tabStatuses": [
                {
                    "tabType": "Custom",
                    "status": "Signed",
                    "tabLabel": "currencyCode",
                    "tabName": "",
                    "customTabType": "Text",
                    "tabValue": "GBP",
                    "originalValue": "",
                    "$class": "com.docusign.connect.TextTabStatus"
                },
                {
                    "tabType": "Custom",
                    "status": "Signed",
                    "tabLabel": "actualPrice",
                    "tabName": "",
                    "customTabType": "Number",
                    "tabValue": 2000,
                    "originalValue": "",
                    "$class": "com.docusign.connect.NumberTabStatus"
                },
                {
                    "tabType": "Custom",
                    "status": "Signed",
                    "tabLabel": "deliveryDate",
                    "tabName": "",
                    "customTabType": "Date",
                    "tabValue": "2019-03-08T00:00:00-07:00",
                    "originalValue": "",
                    "$class": "com.docusign.connect.DateTabStatus"
                }
            ],
            "$class": "com.docusign.connect.Recipient"
        }
    ]
}
"""
    Then it should respond with
"""
{ "$class" : "com.docusign.clauses.PurchaseOrderFailureResponse",
  "penalty" : {
    "$class": "org.accordproject.money.MonetaryAmount",
    "doubleValue": 200,
    "currencyCode": "GBP"
  }
}
"""
    And the new state of the contract should be
"""
{
  "$class" : "com.docusign.clauses.PurchaseOrderFailureState",
  "nbPastFailures" : 1
}
"""
    And the following obligations should have been emitted
"""
      [
        {
          "$class": "org.accordproject.obligation.PaymentObligation",
          "amount": {
            "$class": "org.accordproject.money.MonetaryAmount",
            "doubleValue": 200,
            "currencyCode": "GBP"
          },
          "description": "\"resource:org.accordproject.party.Party#Buyer%20Corp\" should be paid a penalty"
        }
      ]
"""

  Scenario: Should calculate the penalty when delivered after first late period
    When the current time is "2019-03-13T00:00:00Z"
    Given the state
"""
{
  "$class" : "com.docusign.clauses.PurchaseOrderFailureState",
  "pastFailures" : [],
  "nbPastFailures" : 0
}
"""
    And it receives the request
"""
{
    "$class": "com.docusign.connect.DocuSignEnvelopeInformation",
    "envelopeStatus": {
        "$class": "com.docusign.connect.EnvelopeStatus",
        "status" : "Completed"
    },
    "recipients": [
        {
            "status": "Completed",
            "email": "testRecipient@accordproject.org",
            "userName": "testUser",
            "tabStatuses": [
                {
                    "tabType": "Custom",
                    "status": "Signed",
                    "tabLabel": "currencyCode",
                    "tabName": "",
                    "customTabType": "Text",
                    "tabValue": "USD",
                    "originalValue": "",
                    "$class": "com.docusign.connect.TextTabStatus"
                },
                {
                    "tabType": "Custom",
                    "status": "Signed",
                    "tabLabel": "actualPrice",
                    "tabName": "",
                    "customTabType": "Number",
                    "tabValue": 2000,
                    "originalValue": "",
                    "$class": "com.docusign.connect.NumberTabStatus"
                },
                {
                    "tabType": "Custom",
                    "status": "Signed",
                    "tabLabel": "deliveryDate",
                    "tabName": "",
                    "customTabType": "Date",
                    "tabValue": "2019-03-11T00:00:00-07:00",
                    "originalValue": "",
                    "$class": "com.docusign.connect.DateTabStatus"
                }
            ],
            "$class": "com.docusign.connect.Recipient"
        }
    ]
}
"""
    Then it should respond with
"""
{ "$class" : "com.docusign.clauses.PurchaseOrderFailureResponse",
  "penalty" : {
    "$class": "org.accordproject.money.MonetaryAmount",
    "doubleValue": 100,
    "currencyCode": "USD"
  }
}
"""
    And the new state of the contract should be
"""
{
  "$class" : "com.docusign.clauses.PurchaseOrderFailureState",
  "nbPastFailures" : 1
}
"""
    And the following obligations should have been emitted
"""
      [
        {
          "$class": "org.accordproject.obligation.PaymentObligation",
          "amount": {
            "$class": "org.accordproject.money.MonetaryAmount",
            "doubleValue": 100,
            "currencyCode": "USD"
          },
          "description": "\"resource:org.accordproject.party.Party#Buyer%20Corp\" should be paid a penalty"
        }
      ]
"""

  Scenario: Should set the penalty to zero if not late
    When the current time is "2019-03-18T00:00:00Z"
    Given the state
"""
{
  "$class" : "com.docusign.clauses.PurchaseOrderFailureState",
  "pastFailures" : [],
  "nbPastFailures" : 0
}
"""
    And it receives the request
"""
{
    "$class": "com.docusign.connect.DocuSignEnvelopeInformation",
    "envelopeStatus": {
        "$class": "com.docusign.connect.EnvelopeStatus",
        "status" : "Completed"
    },
    "recipients": [
        {
            "status": "Completed",
            "email": "testRecipient@accordproject.org",
            "userName": "testUser",
            "tabStatuses": [
                {
                    "tabType": "Custom",
                    "status": "Signed",
                    "tabLabel": "currencyCode",
                    "tabName": "",
                    "customTabType": "Text",
                    "tabValue": "USD",
                    "originalValue": "",
                    "$class": "com.docusign.connect.TextTabStatus"
                },
                {
                    "tabType": "Custom",
                    "status": "Signed",
                    "tabLabel": "actualPrice",
                    "tabName": "",
                    "customTabType": "Number",
                    "tabValue": 2000,
                    "originalValue": "",
                    "$class": "com.docusign.connect.NumberTabStatus"
                },
                {
                    "tabType": "Custom",
                    "status": "Signed",
                    "tabLabel": "deliveryDate",
                    "tabName": "",
                    "customTabType": "Date",
                    "tabValue": "2019-03-20T00:00:00-07:00",
                    "originalValue": "",
                    "$class": "com.docusign.connect.DateTabStatus"
                }
            ],
            "$class": "com.docusign.connect.Recipient"
        }
    ]
}
"""
    Then it should respond with
"""
{ "$class" : "com.docusign.clauses.PurchaseOrderFailureResponse",
  "penalty" : {
    "$class": "org.accordproject.money.MonetaryAmount",
    "doubleValue": 0,
    "currencyCode": "USD"
  }
}
"""
    And the new state of the contract should be
"""
{
  "$class" : "com.docusign.clauses.PurchaseOrderFailureState",
  "nbPastFailures" : 0
}
"""
    And the following obligations should have been emitted
"""
      []
"""
