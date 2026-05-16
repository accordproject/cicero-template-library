/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.rentaldeposit@0.3.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';
import {IMonetaryAmount} from './org.accordproject.money@0.3.0';
import {IConcept,IEvent} from './concerto@1.0.0';

// interfaces
export interface IPenalty extends IConcept {
   description: string;
   amount: IMonetaryAmount;
}

export interface IProperyInspection extends IRequest {
   penalties: IPenalty[];
}

export interface IPropertyInspectionResponse extends IResponse {
   balance: IMonetaryAmount;
}

export interface IRentalDepositPaymentEvent extends IEvent {
   amount: IMonetaryAmount;
   description: string;
}

export interface ITemplateModel extends IClause {
   tenant: string;
   landlord: string;
   depositAmount: IMonetaryAmount;
   tenantDepositRestorationPeriod: string;
   monthlyBaseRentMultiple: number;
   applicableLaw: string;
   statute: string;
   bankName: string;
   landlordDepositReturnPeriod: string;
   exhibit: string;
}

