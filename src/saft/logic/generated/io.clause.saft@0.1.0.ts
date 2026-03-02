/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: io.clause.saft@0.1.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';

// interfaces
export interface ILaunch extends IRequest {
   exchangeRate: number;
}

export interface ITerminate extends IRequest {
   remainingFunds: number;
   totalInvested: number;
}

export interface IPayout extends IResponse {
   tokenAmount: number;
   tokenAddress: string;
}

export interface ITemplateModel extends IClause {
   token: string;
   company: string;
   companyType: string;
   state: string;
   amendmentProvision: boolean;
   purchaseAmount: number;
   currency: string;
   netProceedLimit: number;
   date: Date;
   deadlineDate: Date;
   discountRatePercentage: number;
   network: string;
   coin: string;
   exchanges: string;
   companyRepresentative: string;
   purchaser: string;
   description: string;
}

