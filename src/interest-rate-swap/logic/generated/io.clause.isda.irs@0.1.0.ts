/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: io.clause.isda.irs@0.1.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';
import {IConcept} from './concerto@1.0.0';

// interfaces
export interface IDayCountFraction extends IConcept {
   value?: string;
   dayCountFractionScheme?: string;
}

export interface IRateObservation extends IRequest {
}

export interface IResult extends IResponse {
   outstandingBalance: number;
}

export interface ITemplateModel extends IClause {
   bank: string;
   letterDate: Date;
   counterparty: string;
   bankReference: string;
   notionalAmount: number;
   notionalCurrency: string;
   tradeDate: Date;
   effectiveDate: Date;
   terminationDate: Date;
   fixedRatePayer: string;
   fixedRatePayerPeriodEndDates: string;
   fixedRatePayerPaymentDates: string;
   fixedRate: number;
   fixedRateDayCountFraction: IDayCountFraction;
   fixedRatePayerBusinessDays: string;
   fixedRatePayerBusinessDayConvention: string;
   floatingRatePayer: string;
   floatingRatePayerPeriodEndDates: string;
   floatingRatePayerPaymentDates: string;
   floatingRateForInitialCalculationPeriod: number;
   floatingRateOption: string;
   designatedMaturity: string;
   spread: string;
   floatingRateDayCountFraction: IDayCountFraction;
   resetDates: string;
   compounding: string;
   floatingRatePayerBusinessDays: string;
   floatingRatePayerBusinessDayConvention: string;
}

