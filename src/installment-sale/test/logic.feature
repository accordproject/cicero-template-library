Feature: Installment Sale
  This describe the expected behavior for the Accord Project's installment sale contract

  Background:
    Given that the contract says
      """
      "Dan" agrees to pay to "Ned" the total sum 10,000.00 EUR, in the manner following:

      500.00 EUR is to be paid at closing, and the remaining balance of 9,500.00 EUR shall be paid as follows:

      500.00 EUR or more per month on the first day of each and every month, and continuing until the entire balance, including both principal and interest, shall be paid in full -- provided, however, that the entire balance due plus accrued interest and any other amounts due here-under shall be paid in full on or before 24 months.

      Monthly payments, which shall start on month 3, include both principal and interest with interest at the rate of 1.5%, computed monthly on the remaining balance from time to time unpaid.

      """

  Scenario: The contract should be in the correct initial state
    Then the initial state of the contract should be
      """
      {
        "$class": "org.accordproject.installmentsale.InstallmentSaleState",
        "status": "WaitingForFirstDayOfNextMonth",
        "balance_remaining": {
          "$class": "org.accordproject.money.MonetaryAmount",
          "doubleValue": 10000,
          "currencyCode": "EUR"
        },
        "total_paid": {
          "$class": "org.accordproject.money.MonetaryAmount",
          "doubleValue": 0,
          "currencyCode": "EUR"
        },
        "next_payment_month": 3,
        "stateId": "#1"
      }
      """

  Scenario: The contract accepts a first payment, and maintain the remaining balance
    Given the state
      """
      {
        "$class": "org.accordproject.installmentsale.InstallmentSaleState",
        "status": "WaitingForFirstDayOfNextMonth",
        "balance_remaining": {
          "$class": "org.accordproject.money.MonetaryAmount",
          "doubleValue": 10000,
          "currencyCode": "EUR"
        },
        "total_paid": {
          "$class": "org.accordproject.money.MonetaryAmount",
          "doubleValue": 0,
          "currencyCode": "EUR"
        },
        "next_payment_month": 3,
        "stateId": "#1"
      }
      """
    When it receives the request
      """
      {
        "$class": "org.accordproject.installmentsale.Installment",
        "amount": {
          "$class": "org.accordproject.money.MonetaryAmount",
          "doubleValue": 2500,
          "currencyCode": "EUR"
        }
      }
      """
    Then it should respond with
      """
      {
        "total_paid": {
          "$class": "org.accordproject.money.MonetaryAmount",
          "doubleValue": 2500,
          "currencyCode": "EUR"
        },
        "balance": {
          "$class": "org.accordproject.money.MonetaryAmount",
          "doubleValue": 7612.50,
          "currencyCode": "EUR"
        },
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
            "currencyCode": "EUR"
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
        "status": "WaitingForFirstDayOfNextMonth",
        "balance_remaining": {
          "$class": "org.accordproject.money.MonetaryAmount",
          "doubleValue": 7612.50,
          "currencyCode": "EUR"
        },
        "total_paid": {
          "$class": "org.accordproject.money.MonetaryAmount",
          "doubleValue": 2500,
          "currencyCode": "EUR"
        },
        "next_payment_month": 4,
        "stateId": "#1"
      }
      """

  Scenario: The contract accepts a second payment, and maintain the remaining balance
    When it is in the state
      """
      {
        "$class": "org.accordproject.installmentsale.InstallmentSaleState",
        "status": "WaitingForFirstDayOfNextMonth",
        "balance_remaining": {
          "$class": "org.accordproject.money.MonetaryAmount",
          "doubleValue": 7612.50,
          "currencyCode": "EUR"
        },
        "total_paid": {
          "$class": "org.accordproject.money.MonetaryAmount",
          "doubleValue": 2500,
          "currencyCode": "EUR"
        },
        "next_payment_month": 4,
        "stateId": "#1"
      }
      """
    When it receives the request
      """
      {
        "$class": "org.accordproject.installmentsale.Installment",
        "amount": {
          "$class": "org.accordproject.money.MonetaryAmount",
          "doubleValue": 2500,
          "currencyCode": "EUR"
        }
      }
      """
    Then the new state of the contract should be
      """
      {
        "$class": "org.accordproject.installmentsale.InstallmentSaleState",
        "status": "WaitingForFirstDayOfNextMonth",
        "balance_remaining": {
          "$class": "org.accordproject.money.MonetaryAmount",
          "doubleValue": 5189.19,
          "currencyCode": "EUR"
        },
        "total_paid": {
          "$class": "org.accordproject.money.MonetaryAmount",
          "doubleValue": 5000,
          "currencyCode": "EUR"
        },
        "next_payment_month": 5,
        "stateId": "#1"
      }
      """
    And it should respond with
      """
      {
        "balance": {
          "$class": "org.accordproject.money.MonetaryAmount",
          "doubleValue": 5189.19,
          "currencyCode": "EUR"
        },
        "total_paid": {
          "$class": "org.accordproject.money.MonetaryAmount",
          "doubleValue": 5000,
          "currencyCode": "EUR"
        },
        "$class": "org.accordproject.installmentsale.Balance"
      }
      """

  Scenario: The contract accepts a third payment, and maintain the remaining balance
    When it is in the state
      """
      {
        "$class": "org.accordproject.installmentsale.InstallmentSaleState",
        "status": "WaitingForFirstDayOfNextMonth",
        "balance_remaining": {
          "$class": "org.accordproject.money.MonetaryAmount",
          "doubleValue": 5189.19,
          "currencyCode": "EUR"
        },
        "total_paid": {
          "$class": "org.accordproject.money.MonetaryAmount",
          "doubleValue": 5000,
          "currencyCode": "EUR"
        },
        "next_payment_month": 5,
        "stateId": "#1"
      }
      """
    When it receives the request
      """
      {
        "$class": "org.accordproject.installmentsale.Installment",
        "amount": {
          "$class": "org.accordproject.money.MonetaryAmount",
          "doubleValue": 2500,
          "currencyCode": "EUR"
        }
      }
      """
    Then the new state of the contract should be
      """
      {
        "$class": "org.accordproject.installmentsale.InstallmentSaleState",
        "status": "WaitingForFirstDayOfNextMonth",
        "balance_remaining": {
          "$class": "org.accordproject.money.MonetaryAmount",
          "doubleValue": 2729.53,
          "currencyCode": "EUR"
        },
        "total_paid": {
          "$class": "org.accordproject.money.MonetaryAmount",
          "doubleValue": 7500,
          "currencyCode": "EUR"
        },
        "next_payment_month": 6,
        "stateId": "#1"
      }
      """
    And it should respond with
      """
      {
        "balance": {
          "$class": "org.accordproject.money.MonetaryAmount",
          "doubleValue": 2729.53,
          "currencyCode": "EUR"
        },
        "total_paid": {
          "$class": "org.accordproject.money.MonetaryAmount",
          "doubleValue": 7500,
          "currencyCode": "EUR"
        },
        "$class": "org.accordproject.installmentsale.Balance"
      }
      """

  Scenario: The contract accepts a final closing payment
    When it is in the state
      """
      {
        "$class": "org.accordproject.installmentsale.InstallmentSaleState",
        "status": "WaitingForFirstDayOfNextMonth",
        "balance_remaining": {
          "$class": "org.accordproject.money.MonetaryAmount",
          "doubleValue": 2729.53,
          "currencyCode": "EUR"
        },
        "total_paid": {
          "$class": "org.accordproject.money.MonetaryAmount",
          "doubleValue": 7500,
          "currencyCode": "EUR"
        },
        "next_payment_month": 6,
        "stateId": "#1"
      }
      """
    When it receives the request
      """
      {
        "$class": "org.accordproject.installmentsale.ClosingPayment",
        "amount": {
          "$class": "org.accordproject.money.MonetaryAmount",
          "doubleValue": 3229.53,
          "currencyCode": "EUR"
        }
      }
      """
    Then the new state of the contract should be
      """
      {
        "$class": "org.accordproject.installmentsale.InstallmentSaleState",
        "status": "Fulfilled",
        "balance_remaining": {
          "$class": "org.accordproject.money.MonetaryAmount",
          "doubleValue": 0,
          "currencyCode": "EUR"
        },
        "total_paid": {
          "$class": "org.accordproject.money.MonetaryAmount",
          "doubleValue": 10729.53,
          "currencyCode": "EUR"
        },
        "next_payment_month": 0,
        "stateId": "#1"
      }
      """
    And it should respond with
      """
      {
        "total_paid": {
          "$class": "org.accordproject.money.MonetaryAmount",
          "doubleValue": 10729.53,
          "currencyCode": "EUR"
        },
        "balance": {
          "$class": "org.accordproject.money.MonetaryAmount",
          "doubleValue": 0,
          "currencyCode": "EUR"
        },
        "$class": "org.accordproject.installmentsale.Balance"
      }
      """
