/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.crypto@1.0.0

// imports

// Warning: Beware of circular dependencies when modifying these imports
import {IConcept} from './concerto@1.0.0';

// interfaces
export enum HashAlgorithmType {
   SHA_256 = 'SHA_256',
   SHA_384 = 'SHA_384',
   SHA_512 = 'SHA_512',
   SHA3_256 = 'SHA3_256',
   SHA3_512 = 'SHA3_512',
   KECCAK_256 = 'KECCAK_256',
   BLAKE2B_256 = 'BLAKE2B_256',
   BLAKE3 = 'BLAKE3',
   CUSTOM = 'CUSTOM',
}

export interface IHashAlgorithm extends IConcept {
   type: HashAlgorithmType;
   customName?: string;
   uri?: string;
}

export enum HashEncoding {
   HEX = 'HEX',
   HEX_0X = 'HEX_0X',
   BASE64 = 'BASE64',
   BASE64URL = 'BASE64URL',
   MULTIBASE = 'MULTIBASE',
}

export interface IHash extends IConcept {
   algorithm: IHashAlgorithm;
   value: string;
   encoding: HashEncoding;
}

export type HashUnion = IContentHash;

export enum CanonicalizationType {
   RAW_BYTES = 'RAW_BYTES',
   RFC8785_JCS = 'RFC8785_JCS',
   DAG_CBOR = 'DAG_CBOR',
   ZIP_NORMALIZED = 'ZIP_NORMALIZED',
   CUSTOM = 'CUSTOM',
}

export interface ICanonicalization extends IConcept {
   type: CanonicalizationType;
   customName?: string;
   uri?: string;
}

export interface IContentHash extends IHash {
   canonicalization?: ICanonicalization;
   mediaType?: string;
   byteLength?: number;
}

export interface IHashedResource extends IConcept {
   uri?: string;
   hash: IContentHash;
}

