/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: com.docusign.connect

// imports

// Warning: Beware of circular dependencies when modifying these imports
import {IRequest} from './org.accordproject.runtime';
import {IBinaryResource} from './org.accordproject.binary';
import {IConcept} from './concerto@1.0.0';

// interfaces
export enum EnvelopeStatusCode {
   Any = 'Any',
   Voided = 'Voided',
   Created = 'Created',
   Deleted = 'Deleted',
   Sent = 'Sent',
   Delivered = 'Delivered',
   Signed = 'Signed',
   Completed = 'Completed',
   Declined = 'Declined',
   TimedOut = 'TimedOut',
   Template = 'Template',
   Processing = 'Processing',
}

export enum RecipientStatusCode {
   Created = 'Created',
   Sent = 'Sent',
   Delivered = 'Delivered',
   Signed = 'Signed',
   Declined = 'Declined',
   Completed = 'Completed',
   FaxPending = 'FaxPending',
   AutoResponded = 'AutoResponded',
}

export enum TabTypeCode {
   InitialHere = 'InitialHere',
   SignHere = 'SignHere',
   FullName = 'FullName',
   FirstName = 'FirstName',
   LastName = 'LastName',
   EmailAddress = 'EmailAddress',
   Company = 'Company',
   Title = 'Title',
   DateSigned = 'DateSigned',
   InitialHereOptional = 'InitialHereOptional',
   EnvelopeID = 'EnvelopeID',
   Custom = 'Custom',
   SignerAttachment = 'SignerAttachment',
   SignHereOptional = 'SignHereOptional',
   Approve = 'Approve',
   Decline = 'Decline',
   SignerAttachmentOptional = 'SignerAttachmentOptional',
   DigitalSignature = 'DigitalSignature',
}

export enum CustomTabTypeCode {
   Text = 'Text',
   Checkbox = 'Checkbox',
   Radio = 'Radio',
   List = 'List',
   Date = 'Date',
   Number = 'Number',
   SSN = 'SSN',
   ZIP5 = 'ZIP5',
   ZIP5DASH4 = 'ZIP5DASH4',
   Email = 'Email',
   Note = 'Note',
   Formula = 'Formula',
}

export enum DocumentType {
   Principal = 'Principal',
   CertificateOfCompletion = 'CertificateOfCompletion',
   SignerAttachment = 'SignerAttachment',
}

export interface IEnvelopeStatus extends IConcept {
   status: EnvelopeStatusCode;
   envelopeId?: string;
   created?: Date;
   sent?: Date;
   delivered?: Date;
   signed?: Date;
   completed?: Date;
   declined?: Date;
   email?: string;
}

export interface IRecipient extends IConcept {
   status: RecipientStatusCode;
   email: string;
   userName: string;
   sent?: Date;
   delivered?: Date;
   signed?: Date;
   declined?: Date;
   declineReason?: string;
   tabStatuses?: ITabStatus[];
}

export interface ICustomField extends IConcept {
   name: string;
   value: string;
}

export interface ITabStatus extends IConcept {
   tabType: TabTypeCode;
   status: string;
   tabLabel: string;
   originalValue?: string;
   signed?: Date;
   customTabType?: CustomTabTypeCode;
}

export type TabStatusUnion = INumberTabStatus | 
ITextTabStatus | 
IDateTabStatus | 
IBooleanTabStatus | 
IListTabStatus;

export interface INumberTabStatus extends ITabStatus {
   tabName?: string;
   tabValue?: number;
}

export interface ITextTabStatus extends ITabStatus {
   tabName?: string;
   tabValue?: string;
}

export interface IDateTabStatus extends ITabStatus {
   tabName?: string;
   tabValue?: Date;
}

export interface IBooleanTabStatus extends ITabStatus {
   tabName?: string;
   tabValue?: boolean;
}

export interface IListTabStatus extends ITabStatus {
   tabNames: string[];
   tabValue?: string;
   listValues: string[];
   listSelectedValue?: string;
}

export interface IAttachment extends IBinaryResource {
   docType: DocumentType;
}

export interface IDocuSignEnvelopeInformation extends IRequest {
   envelopeStatus: IEnvelopeStatus;
   recipients?: IRecipient[];
   customFields?: ICustomField[];
   attachments?: IAttachment[];
}

