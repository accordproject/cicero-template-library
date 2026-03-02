/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: io.clause.fixedinterestsstatic@0.1.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';

// interfaces
export interface IFixedInterestsStaticRequest extends IRequest {
   input: string;
}

export interface IFixedInterestsStaticResponse extends IResponse {
   output: string;
}

export interface ITemplateModel extends IClause {
   loanAmount: number;
   currencyCode: string;
   rate: number;
   loanDuration: number;
   monthlyPayment: number;
}

