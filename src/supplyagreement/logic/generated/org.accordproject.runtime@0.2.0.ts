/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.runtime@0.2.0

// imports

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IForecastRequest,
	IPurchaseRequest,
	IDeliveryRequest,
	IPaymentRequest
} from './org.accordproject.supplyagreement@0.1.0';

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IForecastResponse,
	IPurchaseResponse,
	IDeliveryResponse,
	IPaymentResponse
} from './org.accordproject.supplyagreement@0.1.0';
import {IContract} from './org.accordproject.contract@0.2.0';
import {ITransaction,IEvent,IParticipant,IAsset} from './concerto@1.0.0';

// interfaces
export interface IRequest extends ITransaction {
}

export type RequestUnion = IForecastRequest | 
IPurchaseRequest | 
IDeliveryRequest | 
IPaymentRequest;

export interface IResponse extends ITransaction {
}

export type ResponseUnion = IForecastResponse | 
IPurchaseResponse | 
IDeliveryResponse | 
IPaymentResponse;

export interface IObligation extends IEvent {
   $identifier: string;
   contract: IContract;
   promisor?: IParticipant;
   promisee?: IParticipant;
   deadline?: Date;
}

export interface IState extends IAsset {
}

