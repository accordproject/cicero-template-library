/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.paymentupondelivery@0.1.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';
import {IEvent} from './concerto@1.0.0';

// interfaces
export interface ITemplateModel extends IClause {
   buyer: string;
   seller: string;
   costOfGoods: number;
   deliveryFee: number;
   currencyCode: string;
}

export interface IDeliveryAcceptedRequest extends IRequest {
}

export interface IDeliveryAcceptedResponse extends IResponse {
   totalAmount: number;
   currencyCode: string;
}

export interface IPaymentObligationEvent extends IEvent {
   amount: number;
   currencyCode: string;
   description: string;
}

