Feature: Late invoice contract
  This describe the expected behavior for the Accord Project's late invoice with payment contract

  Background:
    Given that the contract says
"""
2.4 "Betty Buyer" is not required to pay any invoice that is issued more than 180 days after it is due to be issued by "Steve Seller".
"""

  Scenario: The contract should accept invoice and emit a payment obligation
    When the current time is "2019-03-02T16:34:00-05:00"
    And the UTC offset is -5
    And it receives the request
"""
{
    "$class": "org.accordproject.lateinvoicewithpayment.LateInvoiceRequest",
    "invoiceDue": "2019-02-17T03:24:00Z",
    "amountDue": {
                    "doubleValue": 200,
                    "currencyCode": "USD"
                }
}
"""
    Then it should respond with
"""
{
    "$class": "org.accordproject.lateinvoicewithpayment.LateInvoiceResponse",
    "paymentRequired": true
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
        "currencyCode": "USD"
      }
    }
]
"""

  Scenario: The contract should should reject invoice and not emit a payment obligation
    When the current time is "2019-03-02T16:34:00-05:00"
    And the UTC offset is -5
    And it receives the request
"""
{
    "$class": "org.accordproject.lateinvoicewithpayment.LateInvoiceRequest",
    "invoiceDue": "2018-01-17T03:24:00Z",
    "amountDue": {
      "doubleValue": 200,
      "currencyCode": "USD"
    }
}
"""
    Then it should reject the request with the error "Invoice was received 411.0 days late"