/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: poc.accordproject.agreement@0.1.0

// imports
import {IParty} from './poc.accordproject.party@0.1.0';
import {ITemplateData} from './poc.accordproject.templatedata@0.1.0';
import {IConcept,IAsset} from './concerto@1.0.0';

// interfaces
export interface IAgreementParty extends IConcept {
   role?: string;
   party: IParty;
}

export interface ITemplateReference extends IConcept {
   templateId: string;
   version: string;
}

export type Children = Map<string, ITemplateInstance>;

export interface ITemplateInstance extends IConcept {
   instanceId: string;
   template: ITemplateReference;
   data: ITemplateData;
   children?: Children;
}

export interface IAgreementDocument extends IConcept {
   documentId: string;
   root: ITemplateInstance;
   parties?: IAgreementParty[];
}

export interface IAgreementReference extends IConcept {
   agreementId: string;
   documentId?: string;
   clausePath?: string;
}

export interface IAgreement extends IAsset {
   agreementId: string;
   documents: IAgreementDocument[];
   parties?: IAgreementParty[];
}

