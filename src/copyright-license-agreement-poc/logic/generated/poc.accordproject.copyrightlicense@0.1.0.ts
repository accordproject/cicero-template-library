/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: poc.accordproject.copyrightlicense@0.1.0

// imports
import {ITemplateData} from './poc.accordproject.templatedata@0.1.0';
import {IPartyRef} from './poc.accordproject.party@0.1.0';
import {IRequest,IResponse,IObligation} from './org.accordproject.runtime@0.2.0';
import {IMonetaryAmount} from './org.accordproject.money@0.3.0';
import {IParticipant,IConcept} from './concerto@1.0.0';

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

export interface IPaymentTerms extends IConcept {
   amountText: string;
   amount: IMonetaryAmount;
   paymentProcedure: string;
}

export interface ICopyrightLicenseData extends ITemplateData {
   effectiveDate: Date;
   licensee: IPartyRef;
   licensor: IPartyRef;
   territory: string;
   purposeDescription: string;
   workDescription: string;
   paymentTerms: IPaymentTerms;
}

