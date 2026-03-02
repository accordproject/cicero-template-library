/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: io.clause.safte@0.1.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';

// interfaces
export interface ITokenSale extends IRequest {
   tokenPrice: number;
}

export interface ITokenShare extends IResponse {
   tokenAmount: number;
}

export interface IEquityFinancing extends IRequest {
   sharePrice: number;
}

export interface IEquityShare extends IResponse {
   equityAmount: number;
}

export interface IDissolutionEvent extends IRequest {
   cause: string;
}

export interface IPayOut extends IResponse {
   amount: number;
}

export interface ITemplateModel extends IClause {
   companyName: string;
   companyRegistrationNumber: number;
   purchaser: string;
   jurisdiction: string;
   purchaseAmount: number;
   discount: number;
   projectName: string;
   projectDescription: string;
   months: number;
   monthsText: string;
   amount: number;
   amountText: string;
}

