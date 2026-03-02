/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.docusignpofailure@0.1.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IResponse} from './org.accordproject.runtime@0.2.0';
import {IDuration} from './org.accordproject.time@0.3.0';
import {IEvent,IConcept} from './concerto@1.0.0';

// interfaces
export interface IPurchaseOrderFailureResponse extends IResponse {
   penaltyAmount: number;
   currencyCode: string;
}

export interface IPurchaseOrderPaymentEvent extends IEvent {
   penaltyAmount: number;
   currencyCode: string;
   description: string;
}

export interface IPurchaseOrderFailureState extends IConcept {
   $identifier: string;
   pastFailures: Date[];
   nbPastFailures: number;
}

export interface ITemplateModel extends IClause {
   buyerName: string;
   lateOne: IDuration;
   lateTwo: IDuration;
   lateThree: IDuration;
   lateOnePercent: number;
   lateTwoPercent: number;
   lateThreePercent: number;
   article: string;
   thisSection: string;
   maxFailures: number;
   failureRange: IDuration;
   repeatedFailureCompensationAmount: number;
   repeatedFailureCompensationCurrency: string;
}

