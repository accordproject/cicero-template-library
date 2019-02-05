Feature: Installment Sale
  This describe the expected behavior for the Accord Project's installment sale contract

  Background:
    Given that the contract says
"""
"Dan" agrees to pay to "Ned" the total sum e10000, in the manner following:

E500 is to be paid at closing, and the remaining balance of E9500 shall be paid as follows:

E500 or more per month on the first day of each and every month, and continuing until the entire balance, including both principal and interest, shall be paid in full -- provided, however, that the entire balance due plus accrued interest and any other amounts due here-under shall be paid in full on or before 24 months.

Monthly payments, which shall start on month 3, include both principal and interest with interest at the rate of 1.5%, computed monthly on the remaining balance from time to time unpaid.

"""

  Scenario: The contract should be in the correct initial state
    Then the initial state of the contract should be
"""
{
  "$class": "org.accordproject.installmentsale.InstallmentSaleState",
  "status" : "WaitingForFirstDayOfNextMonth",
  "balance_remaining" : 10000.00,
	"total_paid" : 0.00,
  "next_payment_month" : 3,
  "stateId": "#1"
}
"""

  Scenario: The contract accepts a first payment, and maintain the remaining balance
    Given the state
"""
{
  "$class": "org.accordproject.installmentsale.InstallmentSaleState",
  "status" : "WaitingForFirstDayOfNextMonth",
  "balance_remaining" : 10000.00,
	"total_paid" : 0.00,
  "next_payment_month" : 3,
  "stateId": "#1"
}
"""
    When it receives the request
"""
{
    "$class": "org.accordproject.installmentsale.Installment",
    "amount": 2500.00
}
"""
    Then it should respond with
"""
{
  "total_paid": 2500,
  "balance": 7612.499999999999,
  "$class": "org.accordproject.installmentsale.Balance"
}
"""
    And the following obligations should have been emitted
"""
[
  {
    "$class": "org.accordproject.cicero.runtime.PaymentObligation",
    "amount": {
      "$class": "org.accordproject.money.MonetaryAmount",
      "doubleValue": 2500,
      "currencyCode": "USD"
    },
    "description": "Dan should pay installment to Ned",
    "promisor": "resource:org.accordproject.cicero.contract.AccordParty#Dan",
    "promisee": "resource:org.accordproject.cicero.contract.AccordParty#Ned",
    "eventId": "valid"
  }
]
"""
    And the new state of the contract should be
"""
{
  "$class": "org.accordproject.installmentsale.InstallmentSaleState",
  "status" : "WaitingForFirstDayOfNextMonth",
  "balance_remaining" : 7612.499999999999,
	"total_paid" : 2500,
  "next_payment_month" : 4,
  "stateId": "#1"
}
"""

  Scenario: The contract accepts a second payment, and maintain the remaining balance
    When it is in the state
"""
{
  "$class": "org.accordproject.installmentsale.InstallmentSaleState",
  "status" : "WaitingForFirstDayOfNextMonth",
  "balance_remaining" : 7612.499999999999,
	"total_paid" : 2500,
  "next_payment_month" : 1,
  "stateId": "#1"
}
"""
    When it receives the request
"""
{
    "$class": "org.accordproject.installmentsale.Installment",
    "amount": 2500.00
}
"""
    Then the new state of the contract should be
"""
{
  "$class": "org.accordproject.installmentsale.InstallmentSaleState",
  "status" : "WaitingForFirstDayOfNextMonth",
  "balance_remaining" : 5189.187499999998,
	"total_paid" : 5000,
  "next_payment_month" : 2,
  "stateId": "#1"
}
"""
    And it should respond with
"""
{
  "total_paid": 5000,
  "balance": 5189.187499999998,
  "$class": "org.accordproject.installmentsale.Balance"
}
"""

  Scenario: The contract accepts a third payment, and maintain the remaining balance
    When it is in the state
"""
{
  "$class": "org.accordproject.installmentsale.InstallmentSaleState",
  "status" : "WaitingForFirstDayOfNextMonth",
  "balance_remaining" : 5189.187499999998,
	"total_paid" : 5000,
  "next_payment_month" : 2,
  "stateId": "#1"
}
"""
    When it receives the request
"""
{
    "$class": "org.accordproject.installmentsale.Installment",
    "amount": 2500.00
}
"""
    Then the new state of the contract should be
"""
{
  "$class": "org.accordproject.installmentsale.InstallmentSaleState",
  "status" : "WaitingForFirstDayOfNextMonth",
  "balance_remaining" : 2729.525312499998,
	"total_paid" : 7500,
  "next_payment_month" : 3,
  "stateId": "#1"
}
"""
    And it should respond with
"""
{
  "total_paid": 7500,
  "balance": 2729.525312499998,
  "$class": "org.accordproject.installmentsale.Balance"
}
"""

  Scenario: The contract accepts a final closing payment
    When it is in the state
"""
{
  "$class": "org.accordproject.installmentsale.InstallmentSaleState",
  "status" : "WaitingForFirstDayOfNextMonth",
  "balance_remaining" : 2729.525312499998,
	"total_paid" : 7500,
  "next_payment_month" : 3,
  "stateId": "#1"
}
"""
    When it receives the request
"""
{
    "$class": "org.accordproject.installmentsale.ClosingPayment",
    "amount": 3229.525312499998
}
"""
    Then the new state of the contract should be
"""
{
  "$class": "org.accordproject.installmentsale.InstallmentSaleState",
  "status" : "Fulfilled",
  "balance_remaining" : 0,
	"total_paid" : 10729.525312499998,
  "next_payment_month" : 0,
  "stateId": "#1"
}
"""
    And it should respond with
"""
{
  "total_paid": 10729.525312499998,
  "balance": 0,
  "$class": "org.accordproject.installmentsale.Balance"
}
"""
