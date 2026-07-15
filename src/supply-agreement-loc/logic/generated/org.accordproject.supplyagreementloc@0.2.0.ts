/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.supplyagreementloc@0.2.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse,IState} from './org.accordproject.runtime@0.2.0';
import {IDuration,TemporalUnit} from './org.accordproject.time@0.3.0';
import {IMonetaryAmount} from './org.accordproject.money@0.3.0';
import {IConcept} from './concerto@1.0.0';

// interfaces
export interface ISensorReadingData extends IConcept {
   temperature: number;
   humidity: number;
   readingTime: Date;
}

export interface ISensorReading extends IRequest {
   temperature: number;
   humidity: number;
}

export interface ICheckContract extends IRequest {
}

export interface IDeliveryResponse extends IResponse {
   message: string;
   inGoodOrder: boolean;
}

export interface ISupplyAgreementState extends IState {
   sensorReadings: ISensorReadingData[];
}

export interface ITemplateModel extends IClause {
   executionDate: Date;
   exporter: string;
   importer: string;
   product: string;
   importerCreditworthiness: string;
   issueDate: Date;
   importerLOCBank: string;
   importerLOCNumber: number;
   importerLOCAmount: IMonetaryAmount;
   importerLOCCurrency: string;
   orderBillOfLading: string;
   packingList: string;
   renewalTerms: number;
   termRenewal: string;
   termTerminationNotice: string;
   invoice: string;
   bookingId: string;
   purchaseOrder: string;
   exporterAddress: string;
   turnaroundTime: number;
   amountOfEachProduct: number;
   unitPriceOfEachProduct: IMonetaryAmount;
   unitPriceCurrency: string;
   locationForDelivery: string;
   deliveryDate: Date;
   exporterBankAccount: number;
   modifiedPurchaseOrder: string;
   cancellationDeadline: IDuration;
   shipper: string;
   importPort: string;
   exportPort: string;
   productDescription: string;
   productWeight: number;
   productMeasurement: string;
   freightCharges: IMonetaryAmount;
   freightCurrency: string;
   evaluationTime: IDuration;
   acceptanceCriteria: string;
   termBeginDate: Date;
   termPeriod: string;
   currentTerm: string;
   shipment: string;
   unitPrice: IMonetaryAmount;
   unitCurrency: string;
   unit: number;
   sensorReadingFrequency: number;
   duration: TemporalUnit;
   countPeriod: string;
}

