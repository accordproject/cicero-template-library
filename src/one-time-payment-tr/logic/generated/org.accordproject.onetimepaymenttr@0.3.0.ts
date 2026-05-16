/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.onetimepaymenttr@0.3.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';
import {IMonetaryAmount} from './org.accordproject.money@0.3.0';
import {IEvent,IConcept} from './concerto@1.0.0';

// interfaces
export interface ITemplateModel extends IClause {
   buyer: string;
   seller: string;
   totalPurchasePrice: IMonetaryAmount;
}

export interface IPaymentReceived extends IRequest {
}

export interface IPaymentReceivedResponse extends IResponse {
}

export interface IPaymentObligationEvent extends IEvent {
   amount: IMonetaryAmount;
   description: string;
}

export interface IOneTimePaymentState extends IConcept {
   $identifier: string;
   status: string;
}

