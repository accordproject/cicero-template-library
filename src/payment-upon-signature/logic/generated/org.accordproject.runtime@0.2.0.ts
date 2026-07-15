/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.runtime@0.2.0

// imports

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IContractSigned,
	IPaymentReceived
} from './org.accordproject.paymentuponssignature@0.2.0';

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IContractSignedResponse,
	IPaymentReceivedResponse
} from './org.accordproject.paymentuponssignature@0.2.0';

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IPaymentObligationEvent
} from './org.accordproject.paymentuponssignature@0.2.0';

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IPaymentUponSignatureState
} from './org.accordproject.paymentuponssignature@0.2.0';
import {IContract} from './org.accordproject.contract@0.2.0';
import {ITransaction,IEvent,IParticipant,IAsset} from './concerto@1.0.0';

// interfaces
export interface IRequest extends ITransaction {
}

export type RequestUnion = IContractSigned | 
IPaymentReceived;

export interface IResponse extends ITransaction {
}

export type ResponseUnion = IContractSignedResponse | 
IPaymentReceivedResponse;

export interface IObligation extends IEvent {
   $identifier: string;
   contract: IContract;
   promisor?: IParticipant;
   promisee?: IParticipant;
   deadline?: Date;
}

export type ObligationUnion = IPaymentObligationEvent;

export interface IState extends IAsset {
}

export type StateUnion = IPaymentUponSignatureState;

