/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: concerto@1.0.0

// imports

// Warning: Beware of circular dependencies when modifying these imports
import type {
	ITemplateData,
	IStateData
} from './poc.accordproject.templatedata@0.1.0';
import type {
	IPartyRef
} from './poc.accordproject.party@0.1.0';
import type {
	IAgreementParty,
	IAgreementDocument,
	IAgreementReference,
	IAgreement
} from './poc.accordproject.agreement@0.1.0';
import type {
	IPaymentTerms
} from './poc.accordproject.copyrightlicense@0.1.0';
import type {
	IDigitalMonetaryAmount,
	DigitalCurrencyCode,
	IMonetaryAmount,
	CurrencyCode,
	ICurrencyConversion
} from './org.accordproject.money@0.3.0';

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
	IParty
} from './poc.accordproject.party@0.1.0';

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IRequest,
	IResponse
} from './org.accordproject.runtime@0.2.0';

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IObligation
} from './org.accordproject.runtime@0.2.0';

// interfaces
export interface IConcept {
   $class: string;
}

export type ConceptUnion = ITemplateData | 
IStateData | 
IPartyRef | 
IAgreementParty | 
IAgreementDocument | 
IAgreementReference | 
IAgreement | 
IPaymentTerms | 
IDigitalMonetaryAmount | 
IMonetaryAmount | 
ICurrencyConversion;

export interface IAsset extends IConcept {
   $identifier: string;
}

export type AssetUnion = IContract | 
IClause | 
IState;

export interface IParticipant extends IConcept {
   $identifier: string;
}

export type ParticipantUnion = IParty;

export interface ITransaction extends IConcept {
   $timestamp: Date;
}

export type TransactionUnion = IRequest | 
IResponse;

export interface IEvent extends IConcept {
   $timestamp: Date;
}

export type EventUnion = IObligation;

