/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.runtime@1.0.0

// imports

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IPaymentOverdue,
	IPaymentSettled
} from './poc.accordproject.latepayment@0.1.0';

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IReminderSent,
	ILatePaymentDischarged
} from './poc.accordproject.latepayment@0.1.0';
import {IAgreement} from './org.accordproject.agreement@1.0.0';
import {IContentHash} from './org.accordproject.crypto@1.0.0';
import {IStateData} from './org.accordproject.templatedata@1.0.0';
import {ITransaction,IAsset} from './concerto@1.0.0';

// interfaces
export interface IRequest extends ITransaction {
}

export type RequestUnion = IPaymentOverdue | 
IPaymentSettled;

export interface IResponse extends ITransaction {
}

export type ResponseUnion = IReminderSent | 
ILatePaymentDischarged;

export type InstanceStates = Map<string, IStateData>;

export interface IAgreementState extends IAsset {
   stateId: string;
   agreement: IAgreement;
   revision: number;
   effectiveAt: string;
   states?: InstanceStates;
   stateHash?: IContentHash;
   previousStateHash?: IContentHash;
}

