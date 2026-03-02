/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.helloworldstate@0.1.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';
import {IConcept} from './concerto@1.0.0';

// interfaces
export interface IMyRequest extends IRequest {
   input: string;
}

export interface IMyResponse extends IResponse {
   output: string;
}

export interface IHelloWorldState extends IConcept {
   $identifier: string;
   counter: number;
}

export interface ITemplateModel extends IClause {
   name: string;
}

