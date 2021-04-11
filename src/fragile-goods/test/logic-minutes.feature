Feature: Liquidated Damages for Delayed or Mishandled Delivery
  This describe the expected behavior for the Accord Project's fragile goods contract

  Background:
    Given that the contract says
"""
Liquidated Damages for Delayed Delivery.

In the event the EXW delivery date of the Equipment is delayed beyond the delivery schedule as indicated below, solely through the fault of "Dan" (the Seller), and unless the parties mutually agreed to an extension thereto, "Steve" (the Buyer) is entitled to claim liquidated damages in an amount equivalent to 200.00 USD. 
Prior to implementing the provisions of Article 16.4 pursuant to this section, Buyer agrees that it shall discuss with Seller alternate remedies in good faith.. . . . 

The Equipment to be shipped to the Buyer shall be packed and shipped in accordance with the Specifications and if not specified therein.... 
Additionally the Equipment should have proper devices on it to record any shock during transportation as any instance of acceleration outside the bounds of -0.5g and 0.5g. 
Each shock shall reduce the Contract Price by 5.00 USD. Packing containing fragile materials should be so marked in bold stout letters. . . . .

Equipment Description, Contract Price and Delivery Schedule

Contract Price is 1000.00 USD per unit of Equipment.
Delivery Schedule: no later than 10 minutes after initiation.

"""

  Scenario: The delivery was received late (specified in minutes) with two mishandling breaches
    When it receives the request
"""
{
    "$class": "io.clause.demo.fragileGoods.DeliveryUpdate",
    "startTime": "2018-01-01T16:34:30.000Z",
    "finishTime": "2018-01-01T16:44:31.000Z",
    "status": "ARRIVED",
    "accelerometerReadings": [0.2,0.6,-0.3,-0.7,0.1]
}
"""
    Then it should respond with
"""
{
    "$class": "io.clause.demo.fragileGoods.PayOut",
    "amount": {
        "$class": "org.accordproject.money.MonetaryAmount",
        "currencyCode": "USD",
        "doubleValue": 790
    }
}
"""
    And the following obligations should have been emitted
"""
[
    {
        "$class": "org.accordproject.obligation.PaymentObligation",
        "amount": {
            "$class": "org.accordproject.money.MonetaryAmount",
            "doubleValue": 790,
            "currencyCode": "USD"
        }
    }
]
"""

  Scenario: The delivery was received in time (specified in minutes) with two mishandling breaches
    When it receives the request
"""
{
    "$class": "io.clause.demo.fragileGoods.DeliveryUpdate",
    "startTime": "2018-01-01T16:34:30.000Z",
    "finishTime": "2018-01-01T16:44:29.000Z",
    "status": "ARRIVED",
    "accelerometerReadings": [0.2,0.6,-0.3,-0.7,0.1]
}
"""
    Then it should respond with
"""
{
    "$class": "io.clause.demo.fragileGoods.PayOut",
    "amount": {
        "$class": "org.accordproject.money.MonetaryAmount",
        "currencyCode": "USD",
        "doubleValue": 990
    }
}
"""
    And the following obligations should have been emitted
"""
[
    {
        "$class": "org.accordproject.obligation.PaymentObligation",
        "amount": {
            "$class": "org.accordproject.money.MonetaryAmount",
            "doubleValue": 990,
            "currencyCode": "USD"
        }
    }
]
"""

