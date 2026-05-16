/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.roommate@0.1.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';

// interfaces
export interface ITemplateModel extends IClause {
   holder: string;
   roommate: string;
   landlord: string;
   address: string;
   spaceOccupied: string;
   rentAmount: number;
   depositAmount: number;
   startDate: Date;
   endDate: Date;
   holderSignature: string;
   holderDateSigned: Date;
   roommateSignature: string;
   roommateDateSigned: Date;
}

