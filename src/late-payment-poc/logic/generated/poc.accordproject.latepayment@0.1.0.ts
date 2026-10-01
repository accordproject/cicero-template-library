/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: poc.accordproject.latepayment@0.1.0

// imports
import {ITemplateData,IStateData} from './org.accordproject.templatedata@1.0.0';
import {IRequest,IResponse} from './org.accordproject.runtime@1.0.0';
import {IEvent} from './concerto@1.0.0';

// interfaces
export interface IPaymentOverdue extends IRequest {
}

export interface IReminderSent extends IResponse {
   remindersSent: number;
}

export interface IPaymentSettled extends IRequest {
}

export interface ILatePaymentDischarged extends IResponse {
}

export interface IPaymentReminder extends IEvent {
   reminderNumber: number;
   gracePeriodDays: number;
}

export interface ILatePaymentData extends ITemplateData {
   gracePeriodDays: number;
}

export interface ILatePaymentState extends IStateData {
   remindersSent: number;
   discharged: boolean;
}

