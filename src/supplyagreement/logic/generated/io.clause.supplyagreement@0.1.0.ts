/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.supplyagreement@0.1.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';
import {IConcept,IEvent} from './concerto@1.0.0';

// interfaces
export interface IProduct extends IConcept {
   partNumber: string;
   name: string;
   quantity: number;
   unitPrice: number;
}

export interface IOrderItem extends IConcept {
   partNumber: string;
   quantity: number;
}

export interface IPurchaseOrder extends IConcept {
   products: IProduct[];
   deliveryLocation: string;
   deliveryDate: Date;
}

export interface IDeliveryObligationEvent extends IEvent {
   party: string;
   expectedDelivery: Date;
   deliverables: IOrderItem[];
}

export interface IPurchaseObligationEvent extends IEvent {
   party: string;
   requiredPurchase: number;
   year: number;
   quarter: number;
}

export interface IPaymentObligationEvent extends IEvent {
   party: string;
   amount: number;
}

export interface IPurchaseObligationData extends IConcept {
   party: string;
   requiredPurchase: number;
   year: number;
   quarter: number;
}

export interface IDeliveryObligationData extends IConcept {
   party: string;
   expectedDelivery: Date;
   deliverables: IOrderItem[];
}

export interface IPaymentObligationData extends IConcept {
   party: string;
   amount: number;
}

export interface IAgreementState extends IConcept {
   $identifier: string;
   purchaseObligation?: IPurchaseObligationData;
   deliveryObligation?: IDeliveryObligationData;
   paymentObligation?: IPaymentObligationData;
}

export interface IForecastRequest extends IRequest {
   supplyForecast: number;
}

export interface IForecastResponse extends IResponse {
}

export interface IPurchaseRequest extends IRequest {
   purchaseOrder: IPurchaseOrder;
}

export interface IPurchaseResponse extends IResponse {
}

export interface IDeliveryRequest extends IRequest {
   products: IProduct[];
}

export interface IDeliveryResponse extends IResponse {
}

export interface IPaymentRequest extends IRequest {
   amount: number;
}

export interface IPaymentResponse extends IResponse {
   paid: number;
}

export interface ITemplateModel extends IClause {
   effectiveDate: Date;
   supplier: string;
   buyer: string;
   shortDescriptionOfTheProducts: string;
   noticeWindow: number;
   cancellationWindow: number;
   minimumPercentage: number;
   deliverables: string;
   deliveryWindow: number;
   deliveryAttachment: string;
   inspectionWindow: number;
   acceptanceAttachment: string;
   priceUpdateWindow: number;
   accountNumber: string;
   routingNumnber: string;
   termYears: number;
   renewalYears: number;
   renewalWindow: number;
   governingState: string;
   venueState: string;
}

