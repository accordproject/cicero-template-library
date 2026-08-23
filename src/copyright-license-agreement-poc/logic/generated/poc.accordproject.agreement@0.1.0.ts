/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: poc.accordproject.agreement@0.1.0

// imports

// Warning: Beware of circular dependencies when modifying these imports
import type {
	ICopyrightLicenseData
} from './poc.accordproject.copyrightlicense@0.1.0';

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IPaymentTerms
} from './poc.accordproject.copyrightlicense@0.1.0';

// Warning: Beware of circular dependencies when modifying these imports
import type {
	ITemplateModel
} from './poc.accordproject.copyrightlicense@0.1.0';
import {IParty} from './poc.accordproject.party@0.1.0';
import {IConcept} from './concerto@1.0.0';

// interfaces
export interface ITemplateData extends IConcept {
}

export type TemplateDataUnion = ICopyrightLicenseData;

export interface IClauseData extends IConcept {
}

export type ClauseDataUnion = IPaymentTerms;

export interface IClause extends IConcept {
   path: string;
   data: IClauseData;
}

export type Clauses = Map<string, IClause>;

export interface IAgreementDocument extends IConcept {
   documentId: string;
   data: ITemplateData;
   clauses: Clauses;
   parties?: IParty[];
}

export type AgreementDocumentUnion = ITemplateModel;

