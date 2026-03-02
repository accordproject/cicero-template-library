/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: io.clause.salescontractru@0.1.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';

// interfaces
export interface IMyRequest extends IRequest {
   input: string;
}

export interface IMyResponse extends IResponse {
   output: string;
}

export interface ITemplateModel extends IClause {
   buyer: string;
   seller: string;
   refundPeriod: string;
   counterparty: string;
   currencyType: string;
   appealPeriod: string;
   countryLegislation: string;
}

