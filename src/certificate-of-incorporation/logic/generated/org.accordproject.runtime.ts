/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.runtime

// imports

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IContractSigned
} from './org.accordproject.signature';
import {IContract} from './org.accordproject.contract';
import {ITransaction,IEvent,IParticipant,IAsset} from './concerto@1.0.0';

// interfaces
export interface IRequest extends ITransaction {
}

export type RequestUnion = IContractSigned;

export interface IResponse extends ITransaction {
}

export interface IObligation extends IEvent {
   $identifier: string;
   contract: IContract;
   promisor?: IParticipant;
   promisee?: IParticipant;
   deadline?: Date;
}

export interface IState extends IAsset {
}

