/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.templatedata@1.0.0

// imports

// Warning: Beware of circular dependencies when modifying these imports
import type {
	ICopyrightLicenseData
} from './poc.accordproject.copyrightlicense@0.1.0';
import type {
	ILatePaymentData
} from './poc.accordproject.latepayment@0.1.0';
import type {
	ILicensedWorkSchedule
} from './poc.accordproject.licensedwork@0.1.0';

// Warning: Beware of circular dependencies when modifying these imports
import type {
	ICopyrightLicenseState
} from './poc.accordproject.copyrightlicense@0.1.0';
import type {
	ILatePaymentState
} from './poc.accordproject.latepayment@0.1.0';
import {IConcept} from './concerto@1.0.0';

// interfaces
export interface ITemplateData extends IConcept {
}

export type TemplateDataUnion = ICopyrightLicenseData | 
ILatePaymentData | 
ILicensedWorkSchedule;

export interface IStateData extends IConcept {
}

export type StateDataUnion = ICopyrightLicenseState | 
ILatePaymentState;

