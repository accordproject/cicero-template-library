/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: poc.accordproject.copyrightlicense@0.1.0

// imports
import {IClauseData,ITemplateData,IAgreementDocument,IClauses} from './poc.accordproject.agreement@0.1.0';
import {IParty} from './poc.accordproject.party@0.1.0';
import {IRequest,IResponse,IObligation} from './org.accordproject.runtime@0.2.0';
import {IMonetaryAmount} from './org.accordproject.money@0.3.0';
import {IParticipant} from './concerto@1.0.0';

// interfaces
export interface IPaymentRequest extends IRequest {
}

export interface IPayOut extends IResponse {
   amount: IMonetaryAmount;
}

export interface IPaymentObligationEvent extends IObligation {
   amount: IMonetaryAmount;
   description: string;
}

export interface IPaymentTerms extends IClauseData {
   amountText: string;
   amount: IMonetaryAmount;
   paymentProcedure: string;
}

export interface ICopyrightLicenseData extends ITemplateData {
   effectiveDate: Date;
   licensee: IParty;
   licensor: IParty;
   territory: string;
   purposeDescription: string;
   workDescription: string;
   paymentTerms: IPaymentTerms;
}

export interface ITemplateModel extends IAgreementDocument {
}

