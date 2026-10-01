/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: concerto@1.0.0

// imports

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IClause,
	IAgreementParty,
	IAgreementReference
} from './org.accordproject.agreement@1.0.0';
import type {
	ObligationStatus,
	FulfilmentAttemptStatus
} from './org.accordproject.obligation@1.0.0';
import type {
	IPartyRef
} from './org.accordproject.party@1.0.0';
import type {
	TemplateArtifactRole,
	ITemplateArtifact,
	ITemplateReference
} from './org.accordproject.template@1.0.0';
import type {
	ITemplateData,
	IStateData
} from './org.accordproject.templatedata@1.0.0';
import type {
	HashAlgorithmType,
	IHashAlgorithm,
	HashEncoding,
	IHash,
	CanonicalizationType,
	ICanonicalization,
	IHashedResource
} from './org.accordproject.crypto@1.0.0';
import type {
	IApproximateAmount,
	IUnit,
	IPreciseAmount
} from './org.accordproject.money@1.0.0';
import type {
	IPaymentTerms,
	IPaymentTermsState
} from './poc.accordproject.copyrightlicense@0.1.0';

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IAgreementDocument,
	IAgreement
} from './org.accordproject.agreement@1.0.0';
import type {
	IObligation,
	IFulfilmentAttempt
} from './org.accordproject.obligation@1.0.0';
import type {
	IAgreementState
} from './org.accordproject.runtime@1.0.0';

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IParty
} from './org.accordproject.party@1.0.0';

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IRequest,
	IResponse
} from './org.accordproject.runtime@1.0.0';

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IObligationTransition,
	IObligationIssued
} from './org.accordproject.obligation@1.0.0';
import type {
	IPaymentReminder
} from './poc.accordproject.latepayment@0.1.0';

// interfaces
export interface IConcept {
   $class: string;
}

export type ConceptUnion = IClause | 
IAgreementParty | 
IAgreementReference | 
IPartyRef | 
ITemplateArtifact | 
ITemplateReference | 
ITemplateData | 
IStateData | 
IHashAlgorithm | 
IHash | 
ICanonicalization | 
IHashedResource | 
IApproximateAmount | 
IUnit | 
IPreciseAmount | 
IPaymentTerms | 
IPaymentTermsState;

export interface IAsset extends IConcept {
   $identifier: string;
}

export type AssetUnion = IAgreementDocument | 
IAgreement | 
IObligation | 
IFulfilmentAttempt | 
IAgreementState;

export interface IParticipant extends IConcept {
   $identifier: string;
}

export type ParticipantUnion = IParty;

export interface ITransaction extends IConcept {
   $timestamp: string;
}

export type TransactionUnion = IRequest | 
IResponse;

export interface IEvent extends IConcept {
   $timestamp: string;
}

export type EventUnion = IObligationTransition | 
IObligationIssued | 
IPaymentReminder;

