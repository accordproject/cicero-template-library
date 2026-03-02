/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.ippayment@0.1.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';
import {IDuration} from './org.accordproject.time@0.3.0';

// interfaces
export interface IPaymentRequest extends IRequest {
   netSaleRevenue: number;
   sublicensingRevenue: number;
   permissionGrantedBy?: Date;
}

export interface IPayOut extends IResponse {
   totalAmount: number;
   dueBy: Date;
}

export interface ITemplateModel extends IClause {
   royaltyText: string;
   royaltyRate: number;
   sublicensingRoyaltyText: string;
   sublicensingRoyaltyRate: number;
   paymentPeriod: IDuration;
   paymentPeriodWithPermission: IDuration;
}

