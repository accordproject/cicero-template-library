/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: poc.accordproject.money@0.1.0

// imports
import {IConcept} from './concerto@1.0.0';

// interfaces
export interface IUnit extends IConcept {
   code: string;
   scheme: string;
   identifier?: string;
   scale: number;
}

export interface IPreciseAmount extends IConcept {
   unscaledValue: string;
   unit: IUnit;
}

