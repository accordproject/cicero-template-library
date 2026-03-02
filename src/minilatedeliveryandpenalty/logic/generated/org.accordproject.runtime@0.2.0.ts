/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.runtime@0.2.0

// imports

// Warning: Beware of circular dependencies when modifying these imports
import type {
	ILateRequest
} from './io.clause.minilatedeliveryandpenalty@0.1.0';

// Warning: Beware of circular dependencies when modifying these imports
import type {
	ILateResponse
} from './io.clause.minilatedeliveryandpenalty@0.1.0';
import {IContract} from './org.accordproject.contract@0.2.0';
import {ITransaction,IEvent,IParticipant,IAsset} from './concerto@1.0.0';

// interfaces
export interface IRequest extends ITransaction {
}

export type RequestUnion = ILateRequest;

export interface IResponse extends ITransaction {
}

export type ResponseUnion = ILateResponse;

export interface IObligation extends IEvent {
   $identifier: string;
   contract: IContract;
   promisor?: IParticipant;
   promisee?: IParticipant;
   deadline?: Date;
}

export interface IState extends IAsset {
}

