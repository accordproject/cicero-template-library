/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.docusignpofailure@0.2.0

// imports
import {IContract} from './org.accordproject.contract@0.2.0';
import {IResponse,IObligation,IState} from './org.accordproject.runtime@0.2.0';
import {IDuration} from './org.accordproject.time@0.3.0';
import {IMonetaryAmount} from './org.accordproject.money@0.3.0';
import {IParticipant} from './concerto@1.0.0';

// interfaces
export interface IPurchaseOrderFailureResponse extends IResponse {
   penaltyAmount: IMonetaryAmount;
}

export interface IPurchaseOrderPaymentEvent extends IObligation {
   penaltyAmount: IMonetaryAmount;
   description: string;
}

export interface IPurchaseOrderFailureState extends IState {
   pastFailures: string[];
   nbPastFailures: number;
}

export interface ITemplateModel extends IContract {
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
   repeatedFailureCompensationAmount: IMonetaryAmount;
   repeatedFailureCompensationCurrency: string;
}

