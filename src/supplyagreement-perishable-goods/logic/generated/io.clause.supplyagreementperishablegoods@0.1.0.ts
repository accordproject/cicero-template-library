/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: io.clause.supplyagreementperishablegoods@0.1.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';
import {IConcept,IEvent} from './concerto@1.0.0';

// interfaces
export enum ShipmentStatus {
   CREATED = 'CREATED',
   IN_TRANSIT = 'IN_TRANSIT',
   ARRIVED = 'ARRIVED',
}

export enum Unit {
   KG = 'KG',
   BUSHEL = 'BUSHEL',
   TONNE = 'TONNE',
   BARREL = 'BARREL',
   CORD = 'CORD',
}

export interface ISensorReading extends IConcept {
   centigrade: number;
   humidity: number;
}

export interface IShipment extends IConcept {
   shipmentId: string;
   status: ShipmentStatus;
   sensorReadings?: ISensorReading[];
}

export interface IPaymentObligationEvent extends IEvent {
   grower: string;
   importer: string;
   totalPrice: number;
   currencyCode: string;
   late: boolean;
}

export interface IShipmentReceived extends IRequest {
   unitCount: number;
   shipment: IShipment;
}

export interface IPriceCalculation extends IResponse {
   totalPrice: number;
   penalty: number;
   currencyCode: string;
   late: boolean;
}

export interface ITemplateModel extends IClause {
   dueDate: Date;
   grower: string;
   importer: string;
   shipment: string;
   unitPrice: number;
   currencyCode: string;
   unit: Unit;
   minUnits: number;
   maxUnits: number;
   product: string;
   sensorReadingFrequency: number;
   duration: string;
   minTemperature: number;
   maxTemperature: number;
   minHumidity: number;
   maxHumidity: number;
   penaltyFactor: number;
}

