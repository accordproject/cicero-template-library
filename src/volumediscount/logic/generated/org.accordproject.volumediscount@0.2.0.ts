/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.volumediscount@0.2.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';
import {IMonetaryAmount} from './org.accordproject.money@0.3.0';

// interfaces
export interface IVolumeDiscountRequest extends IRequest {
   netAnnualChargeVolume: IMonetaryAmount;
}

export interface IVolumeDiscountResponse extends IResponse {
   discountRate: number;
}

export interface ITemplateModel extends IClause {
   firstVolume: number;
   secondVolume: number;
   firstRate: number;
   secondRate: number;
   thirdRate: number;
}

