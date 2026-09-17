/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: poc.accordproject.agreement@0.1.0

// imports
import {IParty} from './poc.accordproject.party@0.1.0';
import {ITemplateData} from './poc.accordproject.templatedata@0.1.0';
import {IConcept} from './concerto@1.0.0';

// interfaces
export interface IAgreementParty extends IConcept {
   role?: string;
   party: IParty;
}

export interface IAgreementDocument extends IConcept {
   documentId: string;
   data: ITemplateData;
   parties?: IAgreementParty[];
}

export interface IAgreementReference extends IConcept {
   agreementId: string;
   documentId: string;
}

export interface IAgreement extends IConcept {
   agreementId: string;
   documents: IAgreementDocument[];
   parties?: IAgreementParty[];
}

