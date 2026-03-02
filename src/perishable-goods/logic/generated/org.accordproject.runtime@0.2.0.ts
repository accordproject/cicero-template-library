/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.runtime@0.2.0

// imports

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IShipmentReceived
} from './io.clause.perishablegoods@0.1.0';

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IPriceCalculation
} from './io.clause.perishablegoods@0.1.0';
import {IContract} from './org.accordproject.contract@0.2.0';
import {ITransaction,IEvent,IParticipant,IAsset} from './concerto@1.0.0';

// interfaces
export interface IRequest extends ITransaction {
}

export type RequestUnion = IShipmentReceived;

export interface IResponse extends ITransaction {
}

export type ResponseUnion = IPriceCalculation;

export interface IObligation extends IEvent {
   $identifier: string;
   contract: IContract;
   promisor?: IParticipant;
   promisee?: IParticipant;
   deadline?: Date;
}

export interface IState extends IAsset {
}

