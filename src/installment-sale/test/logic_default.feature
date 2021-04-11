Feature: Installment Sale
  This describe the expected behavior for the Accord Project's installment sale contract

  Background:
    Given the default contract

  Scenario: The contract should be in the correct initial state
    Then the initial state of the contract should be
"""
{
  "$class": "org.accordproject.installmentsale.InstallmentSaleState",
  "status" : "WaitingForFirstDayOfNextMonth",
  "balance_remaining" : {
    "$class": "org.accordproject.money.MonetaryAmount",
    "doubleValue": 10000.00,
    "currencyCode": "EUR"
  },
	"total_paid" : {
    "$class": "org.accordproject.money.MonetaryAmount",
    "doubleValue": 0,
    "currencyCode": "EUR"
  },
  "next_payment_month" : 3
}
"""

  Scenario: The contract accepts a first payment, and maintain the remaining balance
    Given the state
"""
{
  "$class": "org.accordproject.installmentsale.InstallmentSaleState",
  "status" : "WaitingForFirstDayOfNextMonth",
  "balance_remaining" : {
    "$class": "org.accordproject.money.MonetaryAmount",
    "doubleValue": 10000.00,
    "currencyCode": "EUR"
  },
	"total_paid" : {
    "$class": "org.accordproject.money.MonetaryAmount",
    "doubleValue": 0,
    "currencyCode": "EUR"
  },
  "next_payment_month" : 3
}
"""
    When it receives the default request
    Then it should respond with
"""
{
  "total_paid" : {
    "$class": "org.accordproject.money.MonetaryAmount",
    "doubleValue": 2500,
    "currencyCode": "EUR"
  },
	"balance" : {
    "$class": "org.accordproject.money.MonetaryAmount",
    "doubleValue": 7612.50,
    "currencyCode": "EUR"
  },
  "$class": "org.accordproject.installmentsale.Balance"
}
"""
    And the new state of the contract should be
"""
{
  "$class": "org.accordproject.installmentsale.InstallmentSaleState",
  "status" : "WaitingForFirstDayOfNextMonth",
   "balance_remaining" : {
    "$class": "org.accordproject.money.MonetaryAmount",
    "doubleValue": 7612.50,
    "currencyCode": "EUR"
  },
	"total_paid" : {
    "$class": "org.accordproject.money.MonetaryAmount",
    "doubleValue": 2500,
    "currencyCode": "EUR"
  },
  "next_payment_month" : 4
}
"""

