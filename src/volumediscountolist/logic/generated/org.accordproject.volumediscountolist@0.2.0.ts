/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.volumediscountolist@0.2.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';
import {IMonetaryAmount} from './org.accordproject.money@0.3.0';
import {IConcept} from './concerto@1.0.0';

// interfaces
export interface IRateRange extends IConcept {
   volumeUpTo: number;
   volumeAbove: number;
   rate: number;
}

export interface IVolumeDiscountRequest extends IRequest {
   netAnnualChargeVolume: IMonetaryAmount;
}

export interface IVolumeDiscountResponse extends IResponse {
   discountRate: number;
}

export interface ITemplateModel extends IClause {
   rates: IRateRange[];
}

