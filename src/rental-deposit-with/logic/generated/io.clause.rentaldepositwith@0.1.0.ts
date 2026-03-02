/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.rentaldepositwith@0.1.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';
import {IConcept,IEvent} from './concerto@1.0.0';

// interfaces
export interface IPenalty extends IConcept {
   description: string;
   amount: number;
   currencyCode: string;
}

export interface IRentalParty extends IConcept {
   partyId: string;
   address: string;
}

export interface IProperyInspection extends IRequest {
   penalties: IPenalty[];
}

export interface IPropertyInspectionResponse extends IResponse {
   balance: number;
   currencyCode: string;
}

export interface IRentalDepositPaymentEvent extends IEvent {
   amount: number;
   currencyCode: string;
   description: string;
}

export interface ITemplateModel extends IClause {
   tenant: IRentalParty;
   landlord: IRentalParty;
   depositAmount: number;
   currencyCode: string;
   tenantDepositRestorationPeriod: string;
   monthlyBaseRentMultiple: number;
   applicableLaw: string;
   statute: string;
   bankName: string;
   landlordDepositReturnPeriod: string;
   exhibit: string;
}

