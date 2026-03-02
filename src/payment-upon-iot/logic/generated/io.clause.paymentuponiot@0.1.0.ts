/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: io.clause.paymentuponiot@0.1.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';
import {IEvent,IConcept} from './concerto@1.0.0';

// interfaces
export enum ContractLifecycleStatus {
   INITIALIZED = 'INITIALIZED',
   RUNNING = 'RUNNING',
   COMPLETED = 'COMPLETED',
}

export interface IContractSigned extends IRequest {
   contractId: string;
}

export interface ISingleButtonPress extends IRequest {
}

export interface IDoubleButtonPress extends IRequest {
}

export interface ILongButtonPress extends IRequest {
}

export interface IPaymentReceived extends IRequest {
   amount: number;
   currencyCode: string;
}

export interface ICounterResponse extends IResponse {
   counter: number;
   paymentCount: number;
}

export interface IPaymentObligationEvent extends IEvent {
   amount: number;
   currencyCode: string;
   description: string;
}

export interface ICounterState extends IConcept {
   $identifier: string;
   status: ContractLifecycleStatus;
   counter: number;
   paymentCount: number;
}

export interface ITemplateModel extends IClause {
   buyer: string;
   seller: string;
   amountPerUnit: number;
   currencyCode: string;
   paymentCount: number;
}

