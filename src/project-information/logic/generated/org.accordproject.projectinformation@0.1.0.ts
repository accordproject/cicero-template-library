/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.projectinformation@0.1.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';

// interfaces
export interface ITemplateModel extends IClause {
   name: string;
   deadline: Date;
   budgetAmount: number;
   budgetCurrency: string;
   description: string;
   other: string;
}

