/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.obligation@1.0.0

// imports

// Warning: Beware of circular dependencies when modifying these imports
import {IContentHash} from './org.accordproject.crypto@1.0.0';
import {IPreciseAmount} from './org.accordproject.money@1.0.0';
import {IPartyRef} from './org.accordproject.party@1.0.0';
import {IAgreementReference} from './org.accordproject.agreement@1.0.0';
import {IAsset,IEvent} from './concerto@1.0.0';

// interfaces
export enum ObligationStatus {
   PENDING = 'PENDING',
   DUE = 'DUE',
   FULFILLED = 'FULFILLED',
   BREACHED = 'BREACHED',
   WAIVED = 'WAIVED',
   SUPERSEDED = 'SUPERSEDED',
   DISPUTED = 'DISPUTED',
}

export enum FulfilmentAttemptStatus {
   INITIATED = 'INITIATED',
   SUCCEEDED = 'SUCCEEDED',
   FAILED = 'FAILED',
   REVERSED = 'REVERSED',
}

export interface IObligation extends IAsset {
   obligationId: string;
   status: ObligationStatus;
   createdAt: string;
   dueAt?: string;
   bearers: IPartyRef[];
   beneficiaries?: IPartyRef[];
   agreement: IAgreementReference;
   description?: string;
   authorityRef?: string;
   basisHash?: IContentHash;
   evidenceHash?: IContentHash;
   parentObligationId?: string;
   supersedesObligationId?: string;
   revision: number;
}

export type ObligationUnion = IPaymentObligation | 
IPerformanceObligation | 
INotificationObligation | 
IRemediationObligation | 
IEvidenceObligation | 
IMitigationObligation;

export interface IPaymentObligation extends IObligation {
   amount: IPreciseAmount;
}

export interface IPerformanceObligation extends IObligation {
   performance: string;
}

export interface INotificationObligation extends IObligation {
   title: string;
   message: string;
}

export interface IRemediationObligation extends IObligation {
   remedy: string;
}

export interface IEvidenceObligation extends IObligation {
   evidenceRequirement: string;
}

export interface IMitigationObligation extends IObligation {
   mitigationMeasure: string;
}

export interface IObligationTransition extends IEvent {
   obligation: IObligation;
   fromStatus?: ObligationStatus;
   toStatus: ObligationStatus;
   effectiveAt: string;
   actor?: IPartyRef;
   reason?: string;
   evidenceHash?: IContentHash;
   correlationId?: string;
   revision: number;
}

export interface IObligationIssued extends IEvent {
   obligation: IObligation;
}

export interface IFulfilmentAttempt extends IAsset {
   attemptId: string;
   obligation: IObligation;
   status: FulfilmentAttemptStatus;
   initiatedAt: string;
   completedAt?: string;
   actor?: IPartyRef;
   evidenceHash?: IContentHash;
   correlationId?: string;
}

