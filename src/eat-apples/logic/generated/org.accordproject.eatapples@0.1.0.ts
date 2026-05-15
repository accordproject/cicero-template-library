/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.eatapples@0.1.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';
import {IEvent} from './concerto@1.0.0';

// interfaces
export interface IFood extends IRequest {
   produce: string;
   price: number;
}

export interface IOutcome extends IResponse {
   notice: string;
}

export interface IBill extends IEvent {
   billTo: string;
   amount: number;
}

export interface ITemplateModel extends IClause {
   employee: string;
   company: string;
   tax: number;
}

