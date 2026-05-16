/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.promissorynotemd@0.2.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';
import {IMonetaryAmount} from './org.accordproject.money@0.3.0';

// interfaces
export interface IPayment extends IRequest {
   amountPaid: IMonetaryAmount;
}

export interface IResult extends IResponse {
   outstandingBalance: IMonetaryAmount;
}

export interface ITemplateModel extends IClause {
   amount: IMonetaryAmount;
   date: Date;
   maker: string;
   interestRate: number;
   individual: boolean;
   makerAddress: string;
   lender: string;
   legalEntity: string;
   lenderAddress: string;
   maturityDate: Date;
   defaultDays: number;
   insolvencyDays: number;
   jurisdiction: string;
}

