/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: poc.accordproject.obligation@0.1.0

// imports

// Warning: Beware of circular dependencies when modifying these imports
import {IPreciseAmount} from './org.accordproject.money@1.0.0';
import {IPartyRef} from './poc.accordproject.party@0.1.0';
import {IAgreementReference} from './poc.accordproject.agreement@0.1.0';
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

export interface IDurableObligation extends IAsset {
   obligationId: string;
   status: ObligationStatus;
   createdAt: Date;
   dueAt?: Date;
   bearers: IPartyRef[];
   beneficiaries?: IPartyRef[];
   agreement: IAgreementReference;
   description?: string;
   authorityRef?: string;
   parentObligationId?: string;
   supersedesObligationId?: string;
   revision: number;
}

export type DurableObligationUnion = IPaymentObligation;

export interface IPaymentObligation extends IDurableObligation {
   amount: IPreciseAmount;
}

export interface IObligationTransition extends IEvent {
   obligation: IDurableObligation;
   fromStatus?: ObligationStatus;
   toStatus: ObligationStatus;
   effectiveAt: Date;
   actor?: IPartyRef;
   reason?: string;
   correlationId?: string;
   revision: number;
}

export interface IObligationIssued extends IEvent {
   obligation: IDurableObligation;
}

