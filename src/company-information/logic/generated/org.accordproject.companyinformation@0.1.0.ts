/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.companyinformation@0.1.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IConcept} from './concerto@1.0.0';

// interfaces
export interface IPostalAddress extends IConcept {
   streetAddress?: string;
   postalCode?: string;
   addressRegion?: string;
   addressLocality?: string;
   addressCountry?: string;
}

export interface ITemplateModel extends IClause {
   name: string;
   industry: string;
   website: string;
   address: IPostalAddress;
   numberOfEmployees: number;
}

