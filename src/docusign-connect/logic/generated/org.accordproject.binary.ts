/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.binary

// imports

// Warning: Beware of circular dependencies when modifying these imports
import type {
	IAttachment
} from './com.docusign.connect';
import {IAsset} from './concerto@1.0.0';

// interfaces
export interface IBinaryResource extends IAsset {
   identifier: string;
   name: string;
   mimeType: string;
   encoding: string;
}

export type BinaryResourceUnion = IAttachment | 
IBinaryReference | 
IBinaryFile;

export interface IBinaryReference extends IBinaryResource {
}

export interface IBinaryFile extends IBinaryResource {
   content: string;
}

