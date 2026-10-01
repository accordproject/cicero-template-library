/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.paymentupondelivery@0.2.0

// imports
import {IContract} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse,IObligation} from './org.accordproject.runtime@0.2.0';
import {IMonetaryAmount} from './org.accordproject.money@0.3.0';
import {IParticipant} from './concerto@1.0.0';

// interfaces
export interface ITemplateModel extends IContract {
   buyer: string;
   seller: string;
   costOfGoods: IMonetaryAmount;
   deliveryFee: IMonetaryAmount;
}

export interface IDeliveryAcceptedRequest extends IRequest {
}

export interface IDeliveryAcceptedResponse extends IResponse {
   totalAmount: IMonetaryAmount;
}

export interface IPaymentObligationEvent extends IObligation {
   amount: IMonetaryAmount;
   description: string;
}

