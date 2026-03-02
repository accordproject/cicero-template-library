/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: io.clause.acceptanceofdelivery@0.1.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';

// interfaces
export interface IInspectDeliverable extends IRequest {
   deliverableReceivedAt: Date;
   inspectionPassed: boolean;
}

export enum InspectionStatus {
   PASSED_TESTING = 'PASSED_TESTING',
   FAILED_TESTING = 'FAILED_TESTING',
   OUTSIDE_INSPECTION_PERIOD = 'OUTSIDE_INSPECTION_PERIOD',
}

export interface IInspectionResponse extends IResponse {
   status: InspectionStatus;
   shipper: string;
   receiver: string;
}

export interface ITemplateModel extends IClause {
   shipper: string;
   receiver: string;
   deliverable: string;
   businessDays: number;
   attachment: string;
}

