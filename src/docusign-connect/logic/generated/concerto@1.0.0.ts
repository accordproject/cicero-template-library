/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: concerto@1.0.0

// imports

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IDocuSignEnvelopeCounterState
} from './io.clause.docusignconnect@0.1.0';
import type {
	EnvelopeStatusCode,
	RecipientStatusCode,
	TabTypeCode,
	CustomTabTypeCode,
	DocumentType,
	IEnvelopeStatus,
	IRecipient,
	ICustomField,
	ITabStatus
} from './com.docusign.connect';

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IContract,
	IClause
} from './org.accordproject.contract@0.2.0';
import type {
	IState
} from './org.accordproject.runtime@0.2.0';
import type {
	IBinaryResource
} from './org.accordproject.binary';
import type {
	IContract,
	IClause
} from './org.accordproject.contract';
import type {
	IState
} from './org.accordproject.runtime';

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IRequest,
	IResponse
} from './org.accordproject.runtime@0.2.0';
import type {
	IRequest,
	IResponse
} from './org.accordproject.runtime';

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IDocuSignNotificationEvent
} from './io.clause.docusignconnect@0.1.0';
import type {
	IObligation
} from './org.accordproject.runtime@0.2.0';
import type {
	IObligation
} from './org.accordproject.runtime';

// interfaces
export interface IConcept {
   $class: string;
}

export type ConceptUnion = IDocuSignEnvelopeCounterState | 
IEnvelopeStatus | 
IRecipient | 
ICustomField | 
ITabStatus;

export interface IAsset extends IConcept {
   $identifier: string;
}

export type AssetUnion = IContract | 
IClause | 
IState | 
IBinaryResource | 
IContract | 
IClause | 
IState;

export interface IParticipant extends IConcept {
   $identifier: string;
}

export interface ITransaction extends IConcept {
   $timestamp: Date;
}

export type TransactionUnion = IRequest | 
IResponse | 
IRequest | 
IResponse;

export interface IEvent extends IConcept {
   $timestamp: Date;
}

export type EventUnion = IDocuSignNotificationEvent | 
IObligation | 
IObligation;

