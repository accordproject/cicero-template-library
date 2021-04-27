Feature: Late delivery contract
  This describe the expected behavior for the Accord Project's late delivery and penalty contract

  Background:
    Given that the contract says
"""
Late Delivery and Penalty. In case of delayed delivery of Goods, "Betty Buyer" shall pay to "Steve Seller" a penalty amounting to 10.5% of the total value of the Goods for every 2 days of delay. The total amount of penalty shall not, however, exceed 55% of the total value of the delayed goods. If the delay is more than 15 days, the Buyer is entitled to terminate this Contract.

"""

  Scenario: The contract should not allow the late delivery clause to be triggered when the delivery is on time
    When the current time is "2019-01-11T16:34:00-05:00"
    And the UTC offset is -5
    And it receives the request
"""
{
    "$class": "org.accordproject.simplelatedeliveryandpenalty.SimpleLateDeliveryAndPenaltyRequest",
    "agreedDelivery": "2019-01-31 03:24:00Z",
    "deliveredAt": null,
    "goodsValue": 200.00
}
"""
    Then it should reject the request with the error "[Ergo] Cannot exercise late delivery before delivery date"

  Scenario: The contract should return the penalty amount but not allow the buyer to terminate
    When the current time is "2019-01-16T16:34:00-05:00"
    And the UTC offset is -5
    And it receives the request
"""
{
    "$class": "org.accordproject.simplelatedeliveryandpenalty.SimpleLateDeliveryAndPenaltyRequest",
    "agreedDelivery": "2019-01-11T03:24:00Z",
    "deliveredAt": null,
    "goodsValue": 200.00
}
"""
    Then it should respond with
"""
{
  "$class": "org.accordproject.simplelatedeliveryandpenalty.SimpleLateDeliveryAndPenaltyResponse",
  "buyerMayTerminate": false,
  "penalty": 52.5
}
"""

  Scenario: The contract should return the penalty amount and allow the buyer to terminate
    When the current time is "2019-01-11T16:34:00-05:00"
    And the UTC offset is -5
    And it receives the request
"""
{
    "$class": "org.accordproject.simplelatedeliveryandpenalty.SimpleLateDeliveryAndPenaltyRequest",
    "agreedDelivery": "2018-01-31 03:24:00Z",
    "deliveredAt": null,
    "goodsValue": 200.00
}
"""
    Then it should respond with
"""
{
  "$class": "org.accordproject.simplelatedeliveryandpenalty.SimpleLateDeliveryAndPenaltyResponse",
  "buyerMayTerminate": true,
  "penalty": 110.00000000000001
}
"""
    And the following obligations should have been emitted
"""
[
    {
      "$class": "org.accordproject.obligation.PaymentObligation",
      "amount": {
        "$class": "org.accordproject.money.MonetaryAmount",
        "doubleValue": 110.00000000000001,
        "currencyCode": "USD"
      },
      "description": "\"resource:org.accordproject.party.Party#Steve%20Seller\" should pay penalty amount to \"resource:org.accordproject.party.Party#Betty%20Buyer\"",
      "promisor": "resource:org.accordproject.party.Party#Steve%20Seller",
      "promisee": "resource:org.accordproject.party.Party#Betty%20Buyer"
    }
]
"""
