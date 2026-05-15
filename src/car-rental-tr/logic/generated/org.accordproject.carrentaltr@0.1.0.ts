/* eslint-disable @typescript-eslint/no-empty-interface */
// Generated code for namespace: org.accordproject.carrentaltr@0.1.0

// imports
import {IClause} from './org.accordproject.contract@0.2.0';
import {IRequest,IResponse} from './org.accordproject.runtime@0.2.0';

// interfaces
export interface IPaymentRequest extends IRequest {
}

export interface IPayOut extends IResponse {
   amount: number;
   currencyCode: string;
}

export interface IPaymentClause extends IClause {
   amountText: string;
   amount: number;
   currencyCode: string;
   paymentProcedure: string;
}

export interface ITemplateModel extends IClause {
   lessorName: string;
   lessorAddress: string;
   lessorPhone: string;
   lesseeName: string;
   lesseeAddress: string;
   lesseePhone: string;
   authorizedCourt: string;
   plateID: string;
   carBrand: string;
   model: string;
   modelYear: string;
   color: string;
   vechileID: string;
   startDate: string;
   endDate: string;
   deliveryStation: string;
   paymentClause: IPaymentClause;
}

