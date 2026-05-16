/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.lateinvoicewithpayment@0.2.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';
import {IDuration} from './org.accordproject.time@0.3.0';
import {IMonetaryAmount} from './org.accordproject.money@0.3.0';
import {IEvent} from './concerto@1.0.0';

// interfaces
export interface ITemplateModel extends IClause {
   maximumDelay: IDuration;
   purchaser: string;
   supplier: string;
}

export interface ILateInvoiceRequest extends IRequest {
   invoiceDue: Date;
   amountDue: IMonetaryAmount;
}

export interface ILateInvoiceResponse extends IResponse {
   paymentRequired: boolean;
   cause?: string;
}

export interface IPaymentObligationEvent extends IEvent {
   amount: IMonetaryAmount;
   description: string;
}

