/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.safte@0.2.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';
import {IMonetaryAmount} from './org.accordproject.money@0.3.0';

// interfaces
export interface ITokenSale extends IRequest {
   tokenPrice: IMonetaryAmount;
}

export interface ITokenShare extends IResponse {
   tokenAmount: number;
}

export interface IEquityFinancing extends IRequest {
   sharePrice: IMonetaryAmount;
}

export interface IEquityShare extends IResponse {
   equityAmount: IMonetaryAmount;
}

export interface IDissolutionEvent extends IRequest {
   cause: string;
}

export interface IPayOut extends IResponse {
   amount: IMonetaryAmount;
}

export interface ITemplateModel extends IClause {
   companyName: string;
   companyRegistrationNumber: number;
   purchaser: string;
   jurisdiction: string;
   purchaseAmount: IMonetaryAmount;
   discount: number;
   projectName: string;
   projectDescription: string;
   months: number;
   monthsText: string;
   amount: IMonetaryAmount;
   amountText: string;
}

