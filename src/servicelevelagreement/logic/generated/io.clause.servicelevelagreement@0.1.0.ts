/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.servicelevelagreement@0.1.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';
import {IEvent} from './concerto@1.0.0';

// interfaces
export interface ITemplateModel extends IClause {
   paymentPeriod: number;
   monthlyCapPercentage: number;
   yearlyCapPercentage: number;
   availability1: number;
   serviceCredit1: number;
   currencyCode: string;
   availability2: number;
   serviceCredit2: number;
   serviceProvider: string;
   serviceConsumer: string;
}

export interface IMonthSummary extends IRequest {
   monthlyServiceLevel: number;
   monthlyCharge: number;
   last11MonthCredit: number;
   last11MonthCharge: number;
}

export interface IInvoiceCredit extends IResponse {
   monthlyCredit: number;
}

export interface IServiceCreditPaymentEvent extends IEvent {
   amount: number;
   currencyCode: string;
   description: string;
}

