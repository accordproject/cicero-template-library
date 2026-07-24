/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.perishablegoods@0.2.0

// imports
import {IContract,IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse,IObligation,IState} from './org.accordproject.runtime@0.2.0';
import {IMonetaryAmount} from './org.accordproject.money@0.3.0';
import {IConcept,IParticipant} from './concerto@1.0.0';

// interfaces
export enum UnitOfMass {
   KG = 'KG',
   TONNE = 'TONNE',
   LB = 'LB',
}

export interface ISensorReading extends IConcept {
   centigrade: number;
   humidity: number;
}

export interface IShipmentReceived extends IRequest {
   shipmentId: string;
   unitCount: number;
   sensorReadings: ISensorReading[];
}

export interface IPriceCalculation extends IResponse {
   totalPrice: number;
   penalty: number;
   currencyCode: string;
   late: boolean;
}

export interface IPerishableGoodsPaymentEvent extends IObligation {
   totalPrice: number;
   currencyCode: string;
   description: string;
}

export interface IPerishableGoodsState extends IState {
   payoutMade: boolean;
   totalPaid: number;
}

export interface ITemplateModel extends IClause {
   grower: string;
   importer: string;
   shipmentId: string;
   dueDate: Date;
   unit: UnitOfMass;
   minUnits: number;
   maxUnits: number;
   product: string;
   sensorReadingFrequency: number;
   duration: string;
   unitPrice: IMonetaryAmount;
   minTemperature: number;
   maxTemperature: number;
   minHumidity: number;
   maxHumidity: number;
   penaltyFactor: number;
}

