Feature: Volume discount clause with a rate list
  This describe the expected behavior for the Accord Project's volume discountcontract

  Background:
    Given that the contract says
"""
Volume-Based Card Acceptance Agreement [Abbreviated]

This Agreement is by and between Card, Inc., a New York corporation, and you, the Merchant. By accepting the Card, you agree to be bound by the Agreement. 
Discount means an amount that we charge you for accepting the Card, which amount is: 
(i) a percentage (Discount Rate) of the face amount of the Charge that you submit, or a flat per-
Transaction fee, or a combination of both; and/or 
(ii) a Monthly Flat Fee (if you meet our requirements).

Transaction Processing and Payments. Our Card acceptance, processing, and payment requirements are set forth in the Merchant Regulations. Some requirements are summarized here for ease of reference, but do not supersede the provisions in the Merchant Regulations.
Payment for Charges. We will pay you, through our agent, according to your payment plan in US dollars for the face amount of Charges submitted from your Establishments less all applicable deductions, rejections, and withholdings, which include: 
(i) the Discount, 
(ii) any amounts you owe us or our Affiliates, 
(iii) any amounts for which we have Chargebacks and 
(iv) any Credits you submit. Your initial Discount is indicated in the Agreement or otherwise provided to you in writing by us. In addition to your Discount we may charge you additional fees and assessments, as listed in the Merchant Regulations or as otherwise provided to you in writing by us. We may adjust any of these amounts and may change any other amount we charge you for accepting the Card.

SETTLEMENT
a) Settlement Amount. Our agent will pay you according to your payment plan, as described below, in US dollars for the face amount of Charges submitted from your Establishments less all applicable deductions, rejections, and withholdings, which include: 
    (i) the Discount, 
    (ii) any amounts you owe us or our Affiliates, 
    (iii) any amounts for which we have Chargebacks, and (iv) any Credits you submit. Our agent will subtract the full amount of all applicable deductions, rejections, and withholdings, from this payment to you (or debit your Bank Account), but if it cannot, then you must pay it promptly upon demand.
b) Discount. The Discount is determined according to the following table:

1. 0.0$ million <= Volume < 1.0$ million : 3.1%
1. 1.0$ million <= Volume < 10.0$ million : 3.1%
1. 10.0$ million <= Volume < 50.0$ million : 2.9%
1. 50.0$ million <= Volume < 500.0$ million : 2.5%
1. 500.0$ million <= Volume < 1000.0$ million : 1.2%
1. 1000.0$ million <= Volume < 1000000.0$ million : 0.1%

"""

  Scenario: The contract returns the rate for a volume in the first range
    When it receives the request
"""
{
  "$class": "org.accordproject.volumediscountlist.VolumeDiscountRequest",
  "netAnnualChargeVolume": 0.4
}
"""
    Then it should respond with
"""
{
  "$class": "org.accordproject.volumediscountlist.VolumeDiscountResponse",
  "discountRate": 3.1
}
"""

  Scenario: The contract returns the rate for a volume in the last range
    When it receives the request
"""
{
  "$class": "org.accordproject.volumediscountlist.VolumeDiscountRequest",
  "netAnnualChargeVolume": 101410.4
}
"""
    Then it should respond with
"""
{
  "$class": "org.accordproject.volumediscountlist.VolumeDiscountResponse",
  "discountRate": 0.1
}
"""

  Scenario: The contract returns an error for a volume beyond range
    When it receives the request
"""
{
  "$class": "org.accordproject.volumediscountlist.VolumeDiscountRequest",
  "netAnnualChargeVolume": 110001410.4
}
"""
    Then it should reject the request with the error "[Ergo] Could not find rate for that volume"

