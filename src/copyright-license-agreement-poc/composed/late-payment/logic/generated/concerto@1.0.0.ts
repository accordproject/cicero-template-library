/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: concerto@1.0.0

// imports

// Warning: Beware of circular dependencies when modifying these imports
import type {
	ITemplateData,
	IStateData
} from './poc.accordproject.templatedata@0.1.0';

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IContract,
	IClause
} from './org.accordproject.contract@0.2.0';
import type {
	IState
} from './org.accordproject.runtime@0.2.0';

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IRequest,
	IResponse
} from './org.accordproject.runtime@0.2.0';

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IPaymentReminder
} from './poc.accordproject.latepayment@0.1.0';
import type {
	IObligation
} from './org.accordproject.runtime@0.2.0';

// interfaces
export interface IConcept {
   $class: string;
}

export type ConceptUnion = ITemplateData | 
IStateData;

export interface IAsset extends IConcept {
   $identifier: string;
}

export type AssetUnion = IContract | 
IClause | 
IState;

export interface IParticipant extends IConcept {
   $identifier: string;
}

export interface ITransaction extends IConcept {
   $timestamp: string;
}

export type TransactionUnion = IRequest | 
IResponse;

export interface IEvent extends IConcept {
   $timestamp: string;
}

export type EventUnion = IPaymentReminder | 
IObligation;

