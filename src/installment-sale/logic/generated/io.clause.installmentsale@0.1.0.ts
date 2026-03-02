/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: io.clause.installmentsale@0.1.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';
import {IConcept,IEvent} from './concerto@1.0.0';

// interfaces
export interface IInstallment extends IRequest {
   amount: number;
   currencyCode: string;
}

export interface IClosingPayment extends IRequest {
   amount: number;
   currencyCode: string;
}

export interface IBalance extends IResponse {
   balance: number;
   balanceCurrency: string;
   total_paid: number;
   totalPaidCurrency: string;
}

export enum ContractStatus {
   WaitingForFirstDayOfNextMonth = 'WaitingForFirstDayOfNextMonth',
   Fulfilled = 'Fulfilled',
}

export interface IInstallmentSaleState extends IConcept {
   $identifier: string;
   status: ContractStatus;
   balance_remaining: number;
   currencyCode: string;
   next_payment_month: number;
   total_paid: number;
}

export interface IInstallmentSalePaymentEvent extends IEvent {
   amount: number;
   currencyCode: string;
   description: string;
}

export interface ITemplateModel extends IClause {
   BUYER: string;
   SELLER: string;
   INITIAL_DUE: number;
   CURRENCY_CODE: string;
   INTEREST_RATE: number;
   TOTAL_DUE_BEFORE_CLOSING: number;
   MIN_PAYMENT: number;
   DUE_AT_CLOSING: number;
   FIRST_MONTH: number;
}

