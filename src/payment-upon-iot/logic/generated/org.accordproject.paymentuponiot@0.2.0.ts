/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.paymentuponiot@0.2.0

// imports
import {IContract,IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse,IObligation,IState} from './org.accordproject.runtime@0.2.0';
import {IMonetaryAmount} from './org.accordproject.money@0.3.0';
import {IParticipant} from './concerto@1.0.0';

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
   amount: IMonetaryAmount;
}

export interface ICounterResponse extends IResponse {
   counter: number;
   paymentCount: number;
}

export interface IPaymentObligationEvent extends IObligation {
   amount: IMonetaryAmount;
   description: string;
}

export interface ICounterState extends IState {
   status: ContractLifecycleStatus;
   counter: number;
   paymentCount: number;
}

export interface ITemplateModel extends IClause {
   buyer: string;
   seller: string;
   amountPerUnit: IMonetaryAmount;
   paymentCount: number;
}

