/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: io.clause.demandforecast@0.1.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';

// interfaces
export interface ITemplateModel extends IClause {
   purchaser: string;
   supplier: string;
   effectiveDate: Date;
   minimumPercentage: number;
}

export interface IForecastRequest extends IRequest {
   supplyForecast: number;
}

export interface IBindingResponse extends IResponse {
   requiredPurchase: number;
   year: number;
   quarter: number;
}

