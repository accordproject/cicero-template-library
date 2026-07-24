/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.docusignconnect@0.1.0

// imports
import {IContract,IClause} from './org.accordproject.contract@0.2.0';
import {IResponse,IObligation,IState} from './org.accordproject.runtime@0.2.0';
import {EnvelopeStatusCode} from './com.docusign.connect@0.4.0';
import {IParticipant} from './concerto@1.0.0';

// interfaces
export interface IMyResponse extends IResponse {
   output: string;
   counter: number;
}

export interface IDocuSignNotificationEvent extends IObligation {
   title: string;
   message: string;
}

export interface IDocuSignEnvelopeCounterState extends IState {
   counter: number;
}

export interface ITemplateModel extends IClause {
   status: EnvelopeStatusCode;
}

