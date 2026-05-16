/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.promissorynotemd@0.1.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';

// interfaces
export interface IPayment extends IRequest {
   amountPaid: number;
}

export interface IResult extends IResponse {
   outstandingBalance: number;
}

export interface ITemplateModel extends IClause {
   amount: number;
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

