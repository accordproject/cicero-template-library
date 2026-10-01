/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.money@1.0.0

// imports
import {IConcept} from './concerto@1.0.0';

// interfaces
export type CurrencyCode = string;

export interface IApproximateAmount extends IConcept {
   doubleValue: number;
   currencyCode: CurrencyCode;
}

export interface IUnit extends IConcept {
   code: string;
   scheme: string;
   identifier?: string;
   scale: number;
}

export type BigInteger = string;

export interface IPreciseAmount extends IConcept {
   unscaledValue: BigInteger;
   unit: IUnit;
}

