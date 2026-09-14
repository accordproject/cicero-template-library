/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.certificateofincorporation@0.1.0

// imports
import {IContract} from './org.accordproject.contract@0.2.0';
import {IObligation} from './org.accordproject.runtime@0.2.0';
import {IParticipant} from './concerto@1.0.0';

// interfaces
export interface IIncorporationEvent extends IObligation {
   companyName: string;
   incorporationDate: string;
   authorizedShareCapital: number;
   parValue: number;
}

export interface ITemplateModel extends IContract {
   companyName: string;
   incorporationState: string;
   streetAddress: string;
   addressRegion: string;
   addressLocality: string;
   postalCode: string;
   registeredAgentName: string;
   incorporationDate: string;
   authorizedShareCapital: number;
   parValue: number;
   incorporatorName: string;
   incorporatorAddress: string;
   incorporatorCity: string;
   incorporatorState: string;
   incorporatorZip: string;
}

