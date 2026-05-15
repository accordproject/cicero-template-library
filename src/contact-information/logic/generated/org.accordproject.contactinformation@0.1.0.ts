/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.contactinformation@0.1.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';

// interfaces
export enum TimeZone {
   America_New_York = 'America_New_York',
   America_Chicago = 'America_Chicago',
   America_Denver = 'America_Denver',
   America_Los_Angeles = 'America_Los_Angeles',
   America_Anchorage = 'America_Anchorage',
   Pacific_Honolulu = 'Pacific_Honolulu',
   Europe_London = 'Europe_London',
   Europe_Paris = 'Europe_Paris',
   Europe_Berlin = 'Europe_Berlin',
   Asia_Tokyo = 'Asia_Tokyo',
   Asia_Shanghai = 'Asia_Shanghai',
   Asia_Kolkata = 'Asia_Kolkata',
   Australia_Sydney = 'Australia_Sydney',
   UTC = 'UTC',
}

export enum CommunicationChannel {
   EMAIL = 'EMAIL',
   PHONE = 'PHONE',
}

export interface ITemplateModel extends IClause {
   name: string;
   title: string;
   email: string;
   phone: string;
   timezone: TimeZone;
   communicationChannel: CommunicationChannel;
}

