/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.fixedinterests@0.2.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';
import {IMonetaryAmount} from './org.accordproject.money@0.3.0';

// interfaces
export interface IFixedInterestsRequest extends IRequest {
   input: string;
}

export interface IFixedInterestsResponse extends IResponse {
   output: string;
}

export interface ITemplateModel extends IClause {
   loanAmount: IMonetaryAmount;
   rate: number;
   loanDuration: number;
}

