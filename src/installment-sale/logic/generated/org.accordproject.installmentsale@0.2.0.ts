/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.installmentsale@0.2.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';
import {IMonetaryAmount} from './org.accordproject.money@0.3.0';
import {IConcept,IEvent} from './concerto@1.0.0';

// interfaces
export interface IInstallment extends IRequest {
   amount: IMonetaryAmount;
}

export interface IClosingPayment extends IRequest {
   amount: IMonetaryAmount;
}

export interface IBalance extends IResponse {
   balance: IMonetaryAmount;
   balanceCurrency: string;
   total_paid: IMonetaryAmount;
   totalPaidCurrency: string;
}

export enum ContractStatus {
   WaitingForFirstDayOfNextMonth = 'WaitingForFirstDayOfNextMonth',
   Fulfilled = 'Fulfilled',
}

export interface IInstallmentSaleState extends IConcept {
   $identifier: string;
   status: ContractStatus;
   balance_remaining: IMonetaryAmount;
   next_payment_month: number;
   total_paid: IMonetaryAmount;
}

export interface IInstallmentSalePaymentEvent extends IEvent {
   amount: IMonetaryAmount;
   description: string;
}

export interface ITemplateModel extends IClause {
   BUYER: string;
   SELLER: string;
   INITIAL_DUE: IMonetaryAmount;
   INTEREST_RATE: number;
   TOTAL_DUE_BEFORE_CLOSING: IMonetaryAmount;
   MIN_PAYMENT: IMonetaryAmount;
   DUE_AT_CLOSING: IMonetaryAmount;
   FIRST_MONTH: number;
}

