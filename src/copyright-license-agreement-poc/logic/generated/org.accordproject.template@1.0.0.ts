/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.template@1.0.0

// imports
import {IContentHash} from './org.accordproject.crypto@1.0.0';
import {IConcept} from './concerto@1.0.0';

// interfaces
export enum TemplateArtifactRole {
   LOGIC = 'LOGIC',
   MODEL = 'MODEL',
   GRAMMAR = 'GRAMMAR',
   PROSE = 'PROSE',
   DOCUMENTATION = 'DOCUMENTATION',
   TEST = 'TEST',
   RESOURCE = 'RESOURCE',
   CUSTOM = 'CUSTOM',
}

export interface ITemplateArtifact extends IConcept {
   name: string;
   role: TemplateArtifactRole;
   customRole?: string;
   path: string;
   language?: string;
   runtime?: string;
   entryPoint: boolean;
   contentHash: IContentHash;
}

export interface ITemplateReference extends IConcept {
   templateId: string;
   version: string;
   archiveHash: IContentHash;
   artifactManifestHash?: IContentHash;
   artifacts?: ITemplateArtifact[];
}

