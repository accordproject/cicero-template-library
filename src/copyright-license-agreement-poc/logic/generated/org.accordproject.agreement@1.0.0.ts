/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.agreement@1.0.0

// imports

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IComposedClause
} from './poc.accordproject.composition@0.1.0';

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IDocumentReference
} from './poc.accordproject.composition@0.1.0';
import {IContentHash} from './org.accordproject.crypto@1.0.0';
import {ITemplateData} from './org.accordproject.templatedata@1.0.0';
import {IParty} from './org.accordproject.party@1.0.0';
import {ITemplateReference} from './org.accordproject.template@1.0.0';
import {IConcept,IAsset} from './concerto@1.0.0';

// interfaces
export interface IClause extends IConcept {
   template: ITemplateReference;
   clauseId?: string;
   clauseHash?: IContentHash;
}

export type ClauseUnion = IComposedClause;

export type Clauses = Map<string, IClause>;

export interface IAgreementParty extends IConcept {
   party: IParty;
   role: string;
}

export interface IAgreementDocument extends IAsset {
   documentId: string;
   documentHash?: IContentHash;
   template?: ITemplateReference;
   data?: ITemplateData;
   clauses?: Clauses;
   parties?: IAgreementParty[];
}

export interface IAgreement extends IAsset {
   agreementId: string;
   agreementHash?: IContentHash;
   documents: IAgreementDocument[];
   parties: IAgreementParty[];
}

export interface IAgreementReference extends IConcept {
   agreementId: string;
   agreementHash?: IContentHash;
   template?: ITemplateReference;
   clausePath?: string;
   clauseHash?: IContentHash;
}

export type AgreementReferenceUnion = IDocumentReference;

