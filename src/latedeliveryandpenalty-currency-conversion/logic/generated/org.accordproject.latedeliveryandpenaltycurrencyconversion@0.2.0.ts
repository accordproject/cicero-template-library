/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.latedeliveryandpenaltycurrencyconversion@0.2.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';
import {IDuration,TemporalUnit} from './org.accordproject.time@0.3.0';
import {IMonetaryAmount} from './org.accordproject.money@0.3.0';
import {IConcept,IEvent} from './concerto@1.0.0';

// interfaces
export interface IExchangeRate extends IConcept {
   from: string;
   to: string;
   rate: number;
}

export interface ILateDeliveryAndPenaltyRequest extends IRequest {
   forceMajeure: boolean;
   agreedDelivery: Date;
   deliveredAt?: Date;
   goodsValue: IMonetaryAmount;
   currencyConversion: IExchangeRate;
}

export interface ILateDeliveryAndPenaltyResponse extends IResponse {
   penalty: IMonetaryAmount;
   buyerMayTerminate: boolean;
}

export interface IPaymentObligationEvent extends IEvent {
   amount: IMonetaryAmount;
   description: string;
}

export interface ITemplateModel extends IClause {
   buyer: string;
   seller: string;
   forceMajeure: boolean;
   penaltyDuration: IDuration;
   penaltyPercentage: number;
   capPercentage: number;
   termination: IDuration;
   fractionalPart: TemporalUnit;
   conversionSource: string;
   fromCurrency: string;
   toCurrency: string;
}

