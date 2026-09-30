/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: poc.accordproject.runtime@0.1.0

// imports
import {IAgreement} from './poc.accordproject.agreement@0.1.0';
import {IStateData} from './poc.accordproject.templatedata@0.1.0';
import {IConcept,IAsset} from './concerto@1.0.0';

// interfaces
export type ClauseStates = Map<string, IStateData>;

export interface IDocumentState extends IConcept {
   data?: IStateData;
   clauseStates?: ClauseStates;
}

export type DocumentStates = Map<string, IDocumentState>;

export interface IAgreementState extends IAsset {
   stateId: string;
   agreement: IAgreement;
   revision: number;
   effectiveAt: Date;
   data?: IStateData;
   documentStates?: DocumentStates;
}

