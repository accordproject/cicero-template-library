/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: concerto@1.0.0

// imports

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IPurchaseOrderFailureState
} from './org.accordproject.docusignpofailure@0.2.0';
import type {
	Month,
	Day,
	TemporalUnit,
	IDuration,
	PeriodUnit,
	IPeriod
} from './org.accordproject.time@0.3.0';
import type {
	IDigitalMonetaryAmount,
	DigitalCurrencyCode,
	IMonetaryAmount,
	CurrencyCode,
	ICurrencyConversion
} from './org.accordproject.money@0.3.0';
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
} from './com.docusign.connect@0.4.0';

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IState
} from './org.accordproject.runtime@0.2.0';
import type {
	IContract,
	IClause
} from './org.accordproject.contract@0.2.0';
import type {
	IBinaryResource
} from './org.accordproject.binary@0.2.0';

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IRequest,
	IResponse
} from './org.accordproject.runtime@0.2.0';

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IPurchaseOrderPaymentEvent
} from './org.accordproject.docusignpofailure@0.2.0';
import type {
	IObligation
} from './org.accordproject.runtime@0.2.0';

// interfaces
export interface IConcept {
   $class: string;
}

export type ConceptUnion = IPurchaseOrderFailureState | 
IDuration | 
IPeriod | 
IDigitalMonetaryAmount | 
IMonetaryAmount | 
ICurrencyConversion | 
IEnvelopeStatus | 
IRecipient | 
ICustomField | 
ITabStatus;

export interface IAsset extends IConcept {
   $identifier: string;
}

export type AssetUnion = IState | 
IContract | 
IClause | 
IBinaryResource;

export interface IParticipant extends IConcept {
   $identifier: string;
}

export interface ITransaction extends IConcept {
   $timestamp: Date;
}

export type TransactionUnion = IRequest | 
IResponse;

export interface IEvent extends IConcept {
   $timestamp: Date;
}

export type EventUnion = IPurchaseOrderPaymentEvent | 
IObligation;

