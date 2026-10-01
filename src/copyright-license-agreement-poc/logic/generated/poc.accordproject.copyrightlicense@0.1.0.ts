/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: poc.accordproject.copyrightlicense@0.1.0

// imports
import {ITemplateData,IStateData} from './poc.accordproject.templatedata@0.1.0';
import {IPartyRef} from './poc.accordproject.party@0.1.0';
import {IPreciseAmount} from './org.accordproject.money@1.0.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';
import {IConcept} from './concerto@1.0.0';

// interfaces
export interface IPaymentRequest extends IRequest {
}

export interface IPayOut extends IResponse {
   amount: IPreciseAmount;
}

export interface IPaymentReceived extends IRequest {
   amount: IPreciseAmount;
}

export interface IPaymentReceipt extends IResponse {
   outstanding: IPreciseAmount;
}

export interface IPaymentTerms extends IConcept {
   amountText: string;
   amount: IPreciseAmount;
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

export interface IPaymentTermsState extends IConcept {
   obligationId: string;
   amountPaid: IPreciseAmount;
   dueAt?: Date;
}

export interface ICopyrightLicenseState extends IStateData {
   paymentTerms: IPaymentTermsState;
}

