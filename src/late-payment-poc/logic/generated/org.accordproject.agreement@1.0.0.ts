/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.agreement@1.0.0

// imports
import {IContentHash} from './org.accordproject.crypto@1.0.0';
import {ITemplateData} from './org.accordproject.templatedata@1.0.0';
import {IParty} from './org.accordproject.party@1.0.0';
import {ITemplateReference} from './org.accordproject.template@1.0.0';
import {IConcept,IAsset} from './concerto@1.0.0';

// interfaces
export interface IClause extends IConcept {
   template: ITemplateReference;
   clauseId: string;
   data: ITemplateData;
   clauses?: Clauses;
   clauseHash?: IContentHash;
}

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
   documentId?: string;
   template?: ITemplateReference;
   clausePath?: string;
   clauseHash?: IContentHash;
}

