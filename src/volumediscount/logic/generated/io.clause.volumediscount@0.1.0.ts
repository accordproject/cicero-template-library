/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: io.clause.volumediscount@0.1.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';

// interfaces
export interface IVolumeDiscountRequest extends IRequest {
   netAnnualChargeVolume: number;
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

