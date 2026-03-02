/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: io.clause.certificateofincorporation@0.1.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IEvent} from './concerto@1.0.0';

// interfaces
export interface IIncorporationEvent extends IEvent {
   companyName: string;
   incorporationDate: Date;
   authorizedShareCapital: number;
   parValue: number;
}

export interface ITemplateModel extends IClause {
   companyName: string;
   incorporationState: string;
   streetAddress: string;
   addressRegion: string;
   addressLocality: string;
   postalCode: string;
   registeredAgentName: string;
   incorporationDate: Date;
   authorizedShareCapital: number;
   parValue: number;
   incorporatorName: string;
   incorporatorAddress: string;
   incorporatorCity: string;
   incorporatorState: string;
   incorporatorZip: string;
}

