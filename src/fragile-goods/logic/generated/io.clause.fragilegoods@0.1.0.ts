/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.fragilegoods@0.1.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';
import {IDuration} from './org.accordproject.time@0.3.0';
import {IConcept,IEvent} from './concerto@1.0.0';

// interfaces
export enum ShipmentStatus {
   CREATED = 'CREATED',
   IN_TRANSIT = 'IN_TRANSIT',
   ARRIVED = 'ARRIVED',
}

export interface IMonetaryAmount extends IConcept {
   doubleValue: number;
   currencyCode: string;
}

export interface IDeliveryUpdate extends IRequest {
   startTime: Date;
   finishTime?: Date;
   status: ShipmentStatus;
   accelerometerReadings: number[];
}

export interface IPayOut extends IResponse {
   paymentAmount: number;
   currencyCode: string;
}

export interface IFragileGoodsEvent extends IEvent {
   paymentAmount: number;
   currencyCode: string;
}

export interface ITemplateModel extends IClause {
   seller: string;
   buyer: string;
   deliveryPrice: IMonetaryAmount;
   accelerationMin: number;
   accelerationMax: number;
   accelerationBreachPenalty: IMonetaryAmount;
   deliveryLimitDuration: IDuration;
   lateDeliveryPenalty: IMonetaryAmount;
}

