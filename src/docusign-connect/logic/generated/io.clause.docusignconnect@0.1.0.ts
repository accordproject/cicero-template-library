/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: io.clause.docusignconnect@0.1.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IResponse} from './org.accordproject.runtime@0.2.0';
import {EnvelopeStatusCode} from './com.docusign.connect';
import {IEvent,IConcept} from './concerto@1.0.0';

// interfaces
export interface IMyResponse extends IResponse {
   output: string;
   counter: number;
}

export interface IDocuSignNotificationEvent extends IEvent {
   title: string;
   message: string;
}

export interface IDocuSignEnvelopeCounterState extends IConcept {
   $identifier: string;
   counter: number;
}

export interface ITemplateModel extends IClause {
   status: EnvelopeStatusCode;
}

