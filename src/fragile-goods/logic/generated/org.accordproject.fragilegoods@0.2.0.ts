/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.fragilegoods@0.2.0

// imports
import {IContract} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse,IObligation} from './org.accordproject.runtime@0.2.0';
import {IDuration} from './org.accordproject.time@0.3.0';
import {IMonetaryAmount} from './org.accordproject.money@0.3.0';
import {IParticipant} from './concerto@1.0.0';

// interfaces
export enum ShipmentStatus {
   CREATED = 'CREATED',
   IN_TRANSIT = 'IN_TRANSIT',
   ARRIVED = 'ARRIVED',
}

export interface IDeliveryUpdate extends IRequest {
   startTime: string;
   finishTime?: string;
   status: ShipmentStatus;
   accelerometerReadings: number[];
}

export interface IPayOut extends IResponse {
   paymentAmount: IMonetaryAmount;
}

export interface IFragileGoodsEvent extends IObligation {
   paymentAmount: IMonetaryAmount;
}

export interface ITemplateModel extends IContract {
   seller: string;
   buyer: string;
   deliveryPrice: IMonetaryAmount;
   accelerationMin: number;
   accelerationMax: number;
   accelerationBreachPenalty: IMonetaryAmount;
   deliveryLimitDuration: IDuration;
   lateDeliveryPenalty: IMonetaryAmount;
}

