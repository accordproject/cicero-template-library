/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.minilatedeliveryandpenalty@0.1.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';
import {IDuration} from './org.accordproject.time@0.3.0';

// interfaces
export interface ILateRequest extends IRequest {
   agreedDelivery: Date;
   deliveredAt: Date;
   goodsValue: number;
}

export interface ILateResponse extends IResponse {
   penalty: number;
   buyerMayTerminate: boolean;
}

export interface ITemplateModel extends IClause {
   buyer: string;
   seller: string;
   penaltyDuration: IDuration;
   penaltyPercentage: number;
   maximumDelay: IDuration;
}

