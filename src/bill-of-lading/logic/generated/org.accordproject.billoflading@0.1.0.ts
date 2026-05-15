/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.billoflading@0.1.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IConcept} from './concerto@1.0.0';

// interfaces
export enum PackageType {
   BAG = 'BAG',
   BALE = 'BALE',
   BARREL = 'BARREL',
   BASKET = 'BASKET',
   BATTERY_CORROSIVE_WET = 'BATTERY_CORROSIVE_WET',
   BIN = 'BIN',
   BOX = 'BOX',
   BUNCH = 'BUNCH',
   BUNDLE = 'BUNDLE',
   CABINET = 'CABINET',
   CAN = 'CAN',
   CARBOY = 'CARBOY',
   CARRIER = 'CARRIER',
   CARTON = 'CARTON',
   CASE = 'CASE',
   CASK = 'CASK',
   CONTAINER = 'CONTAINER',
   CRATE = 'CRATE',
   CYLINDER = 'CYLINDER',
   DRUM = 'DRUM',
   LOOSE = 'LOOSE',
   OTHER = 'OTHER',
   PACKAGE = 'PACKAGE',
   PAIL = 'PAIL',
   PALLET = 'PALLET',
   PIECES = 'PIECES',
   PIPE_LINE = 'PIPE_LINE',
   RACK = 'RACK',
   REEL = 'REEL',
   ROLL = 'ROLL',
   SKID = 'SKID',
   SPOOL = 'SPOOL',
   TANK = 'TANK',
   TUBE = 'TUBE',
   UNIT = 'UNIT',
   VAN_PACK = 'VAN_PACK',
   WRAPPED = 'WRAPPED',
}

export enum FreightClass {
   CLASS_50 = 'CLASS_50',
   CLASS_55 = 'CLASS_55',
   CLASS_60 = 'CLASS_60',
   CLASS_65 = 'CLASS_65',
   CLASS_70 = 'CLASS_70',
   CLASS_775 = 'CLASS_775',
   CLASS_85 = 'CLASS_85',
   CLASS_925 = 'CLASS_925',
   CLASS_100 = 'CLASS_100',
   CLASS_110 = 'CLASS_110',
   CLASS_125 = 'CLASS_125',
   CLASS_150 = 'CLASS_150',
   CLASS_175 = 'CLASS_175',
   CLASS_200 = 'CLASS_200',
   CLASS_250 = 'CLASS_250',
   CLASS_300 = 'CLASS_300',
   CLASS_400 = 'CLASS_400',
   CLASS_500 = 'CLASS_500',
}

export enum Hazardous {
   YES = 'YES',
   NO = 'NO',
}

export enum UnitOfMass {
   KG = 'KG',
   TONNE = 'TONNE',
   LB = 'LB',
   OZ = 'OZ',
   STONE = 'STONE',
}

export interface ICommodity extends IConcept {
   quantity: number;
   unitOfMass: UnitOfMass;
   packageType: PackageType;
   description: string;
   nmfcCode?: string;
   freightClass?: FreightClass;
   hazmat?: Hazardous;
}

export interface ITemplateModel extends IClause {
   accountName: string;
   scac: string;
   bolNumber: string;
   bookingNumber: string;
   exportReferences?: string;
   onwardInstructions?: string;
   shipper: string;
   consignee?: string;
   notifyParty?: string;
   vessel: string;
   voyageNumber: string;
   portOfLoading: string;
   portOfDischarge: string;
   placeOfReceipt?: string;
   placeOfDelivery?: string;
   commodities: ICommodity[];
   declaredValue: number;
   declaredValueCurrency?: string;
}

