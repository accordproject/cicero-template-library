/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.runtime@0.2.0

// imports

// Warning: Beware of circular dependencies when modifying these imports
import type {
	ISensorReadingsReceived,
	IShipmentReceived
} from './org.accordproject.perishablegoods@0.2.0';

// Warning: Beware of circular dependencies when modifying these imports
import type {
	ISensorReadingsRecorded,
	IPriceCalculation
} from './org.accordproject.perishablegoods@0.2.0';

// Warning: Beware of circular dependencies when modifying these imports
import type {
	ILateShipmentNotification,
	IPerishableGoodsPaymentEvent
} from './org.accordproject.perishablegoods@0.2.0';

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IPerishableGoodsState
} from './org.accordproject.perishablegoods@0.2.0';
import {IContract} from './org.accordproject.contract@0.2.0';
import {ITransaction,IEvent,IParticipant,IAsset} from './concerto@1.0.0';

// interfaces
export interface IRequest extends ITransaction {
}

export type RequestUnion = ISensorReadingsReceived | 
IShipmentReceived;

export interface IResponse extends ITransaction {
}

export type ResponseUnion = ISensorReadingsRecorded | 
IPriceCalculation;

export interface IObligation extends IEvent {
   $identifier: string;
   contract: IContract;
   promisor?: IParticipant;
   promisee?: IParticipant;
   deadline?: Date;
}

export type ObligationUnion = ILateShipmentNotification | 
IPerishableGoodsPaymentEvent;

export interface IState extends IAsset {
}

export type StateUnion = IPerishableGoodsState;

