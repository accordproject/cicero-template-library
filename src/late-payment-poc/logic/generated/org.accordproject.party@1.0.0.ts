/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.party@1.0.0

// imports
import {IParticipant,IConcept} from './concerto@1.0.0';

// interfaces
export interface IParty extends IParticipant {
   partyId: string;
   name?: string;
}

export interface IPartyRef extends IConcept {
   id: string;
   scheme: string;
   label?: string;
}

