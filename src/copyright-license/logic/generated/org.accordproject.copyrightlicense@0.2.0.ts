/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.copyrightlicense@0.2.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';
import {IMonetaryAmount} from './org.accordproject.money@0.3.0';
import {IEvent} from './concerto@1.0.0';

// interfaces
export interface IPaymentRequest extends IRequest {
}

export interface IPayOut extends IResponse {
   amount: IMonetaryAmount;
}

export interface IPaymentObligationEvent extends IEvent {
   amount: IMonetaryAmount;
   description: string;
}

export interface IPaymentClause extends IClause {
   amountText: string;
   amount: IMonetaryAmount;
   paymentProcedure: string;
}

export interface ITemplateModel extends IClause {
   effectiveDate: Date;
   licensee: string;
   licenseeState: string;
   licenseeEntityType: string;
   licenseeAddress: string;
   licensor: string;
   licensorState: string;
   licensorEntityType: string;
   licensorAddress: string;
   territory: string;
   purposeDescription: string;
   workDescription: string;
   paymentClause: IPaymentClause;
}

