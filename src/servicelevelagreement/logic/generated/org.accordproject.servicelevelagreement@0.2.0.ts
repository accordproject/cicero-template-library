/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.servicelevelagreement@0.2.0

// imports
import {IContract} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse,IObligation} from './org.accordproject.runtime@0.2.0';
import {IMonetaryAmount} from './org.accordproject.money@0.3.0';
import {IParticipant} from './concerto@1.0.0';

// interfaces
export interface ITemplateModel extends IContract {
   paymentPeriod: number;
   monthlyCapPercentage: number;
   yearlyCapPercentage: number;
   availability1: number;
   serviceCredit1: number;
   availability2: number;
   serviceCredit2: number;
   serviceProvider: string;
   serviceConsumer: string;
}

export interface IMonthSummary extends IRequest {
   monthlyServiceLevel: number;
   monthlyCharge: IMonetaryAmount;
   last11MonthCredit: IMonetaryAmount;
   last11MonthCharge: IMonetaryAmount;
}

export interface IInvoiceCredit extends IResponse {
   monthlyCredit: IMonetaryAmount;
}

export interface IServiceCreditPaymentEvent extends IObligation {
   amount: IMonetaryAmount;
   description: string;
}

