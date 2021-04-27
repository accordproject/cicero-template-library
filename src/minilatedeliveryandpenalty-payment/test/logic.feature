Feature: Mini late delivery clause
  This describe the expected behavior for the Accord Project's late delivery and penalty clause (mini)

  Background:
    Given that the contract says
"""
Late Delivery and Penalty.

In case of delayed delivery of Goods, "Steve Seller" shall pay to
"Betty Buyer" a penalty amounting to 10.5% of the total
value of the Goods for every 2 days of delay. The total
amount of penalty shall not, however, exceed 52% of the
total value of the delayed goods. If the delay is more than
15 days, the Buyer is entitled to terminate this Contract.

"""

  Scenario: The contract should not allow the late delivery clause to be triggered when the delivery is on time
    When it receives the request
"""
{
    "$class": "org.accordproject.minilatedeliveryandpenalty.LateRequest",
    "agreedDelivery": "2019-04-11T12:00:00-05:00",
    "deliveredAt": "2019-04-10T03:24:00-05:00",
    "goodsValue": 200.00
}
"""
    Then it should reject the request with the error "[Ergo] Cannot exercise late delivery before delivery date"

  Scenario: The contract should return the penalty amount but not allow the buyer to terminate
    When the current time is "2019-01-11T16:34:00-05:00"
    And the UTC offset is -5
    And it receives the request
"""
{
    "$class": "org.accordproject.minilatedeliveryandpenalty.LateRequest",
    "agreedDelivery": "2019-04-01T12:00:00-05:00",
    "deliveredAt": "2019-04-10T03:24:00-05:00",
    "goodsValue": 200.00
}
"""
    Then it should respond with
"""
{
  "$class": "org.accordproject.minilatedeliveryandpenalty.LateResponse",
  "buyerMayTerminate": false,
  "penalty": 84
}
"""
    And the following obligations should have been emitted
"""
[
    {
      "$class": "org.accordproject.obligation.PaymentObligation",
      "amount": {
        "$class": "org.accordproject.money.MonetaryAmount",
        "doubleValue": 84.00,
        "currencyCode": "USD"
      },
      "description": "\"resource:org.accordproject.party.Party#Steve%20Seller\" should pay penalty amount to \"resource:org.accordproject.party.Party#Betty%20Buyer\"",
      "promisor": "resource:org.accordproject.party.Party#Steve%20Seller",
      "promisee": "resource:org.accordproject.party.Party#Betty%20Buyer"
    }
]
"""

  Scenario: The contract should return the penalty amount and allow the buyer to terminate (capped)
    When the current time is "2019-01-11T16:34:00-05:00"
    And the UTC offset is -5
    And it receives the request
"""
{
    "$class": "org.accordproject.minilatedeliveryandpenalty.LateRequest",
    "agreedDelivery": "2019-04-01T12:00:00-05:00",
    "deliveredAt": "2019-04-20T03:24:00-05:00",
    "goodsValue": 200.00
}
"""
    Then it should respond with
"""
{
  "$class": "org.accordproject.minilatedeliveryandpenalty.LateResponse",
  "buyerMayTerminate": true,
  "penalty": 104
}
"""
    And the following obligations should have been emitted
"""
[
    {
      "$class": "org.accordproject.obligation.PaymentObligation",
      "amount": {
        "$class": "org.accordproject.money.MonetaryAmount",
        "doubleValue": 104.00,
        "currencyCode": "USD"
      },
      "description": "\"resource:org.accordproject.party.Party#Steve%20Seller\" should pay penalty amount to \"resource:org.accordproject.party.Party#Betty%20Buyer\"",
      "promisor": "resource:org.accordproject.party.Party#Steve%20Seller",
      "promisee": "resource:org.accordproject.party.Party#Betty%20Buyer"
    }
]
"""

