/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.onetimepaymenttr@0.2.0

// imports
import {IClause,IContract} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse,IObligation,IState} from './org.accordproject.runtime@0.2.0';
import {IMonetaryAmount} from './org.accordproject.money@0.3.0';
import {IParticipant} from './concerto@1.0.0';

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

export interface IPaymentObligationEvent extends IObligation {
   amount: IMonetaryAmount;
   description: string;
}

export interface IOneTimePaymentState extends IState {
   status: string;
}

