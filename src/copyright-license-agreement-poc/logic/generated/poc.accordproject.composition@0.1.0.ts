/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: poc.accordproject.composition@0.1.0

// imports
import {ITemplateData,IStateData} from './org.accordproject.templatedata@1.0.0';
import {IClause,Clauses,IAgreement,IAgreementReference} from './org.accordproject.agreement@1.0.0';
import {IAgreementState,ClauseStates} from './org.accordproject.runtime@1.0.0';
import {IObligation} from './org.accordproject.obligation@1.0.0';
import {IEvent} from './concerto@1.0.0';

// interfaces
export interface IComposedClause extends IClause {
   data: ITemplateData;
   clauses?: Clauses;
}

export type InstanceStates = Map<string, IStateData>;

export interface IIndexedAgreementState extends IAgreementState {
   states?: InstanceStates;
}

export interface IDocumentReference extends IAgreementReference {
   documentId: string;
}

export interface IObligationIssued extends IEvent {
   obligation: IObligation;
}

