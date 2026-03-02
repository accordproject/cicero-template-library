/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: concerto@1.0.0

// imports

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IContract,
	IClause
} from './org.accordproject.contract@0.2.0';

// interfaces
export interface IConcept {
   $class: string;
}

export interface IAsset extends IConcept {
   $identifier: string;
}

export type AssetUnion = IContract | 
IClause;

export interface IParticipant extends IConcept {
   $identifier: string;
}

export interface ITransaction extends IConcept {
   $timestamp: Date;
}

export interface IEvent extends IConcept {
   $timestamp: Date;
}

