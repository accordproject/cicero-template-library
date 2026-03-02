/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.volumediscountolist@0.1.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';
import {IConcept} from './concerto@1.0.0';

// interfaces
export interface IRateRange extends IConcept {
   volumeUpTo: number;
   volumeAbove: number;
   rate: number;
}

export interface IVolumeDiscountRequest extends IRequest {
   netAnnualChargeVolume: number;
}

export interface IVolumeDiscountResponse extends IResponse {
   discountRate: number;
}

export interface ITemplateModel extends IClause {
   rates: IRateRange[];
}

