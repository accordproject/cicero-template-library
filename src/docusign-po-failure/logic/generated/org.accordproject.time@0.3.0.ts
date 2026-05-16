/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.time@0.3.0

// imports
import {IConcept} from './concerto@1.0.0';

// interfaces
export enum Month {
   January = 'January',
   February = 'February',
   March = 'March',
   April = 'April',
   May = 'May',
   June = 'June',
   July = 'July',
   August = 'August',
   September = 'September',
   October = 'October',
   November = 'November',
   December = 'December',
}

export enum Day {
   Monday = 'Monday',
   Tuesday = 'Tuesday',
   Wednesday = 'Wednesday',
   Thursday = 'Thursday',
   Friday = 'Friday',
   Saturday = 'Saturday',
   Sunday = 'Sunday',
}

export enum TemporalUnit {
   seconds = 'seconds',
   minutes = 'minutes',
   hours = 'hours',
   days = 'days',
   weeks = 'weeks',
}

export interface IDuration extends IConcept {
   amount: number;
   unit: TemporalUnit;
}

export enum PeriodUnit {
   days = 'days',
   weeks = 'weeks',
   months = 'months',
   quarters = 'quarters',
   years = 'years',
}

export interface IPeriod extends IConcept {
   amount: number;
   unit: PeriodUnit;
}

