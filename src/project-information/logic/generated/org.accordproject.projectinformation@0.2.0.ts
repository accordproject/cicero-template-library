/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.projectinformation@0.2.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IMonetaryAmount} from './org.accordproject.money@0.3.0';

// interfaces
export interface ITemplateModel extends IClause {
   name: string;
   deadline: Date;
   budgetAmount: IMonetaryAmount;
   budgetCurrency: string;
   description: string;
   other: string;
}

