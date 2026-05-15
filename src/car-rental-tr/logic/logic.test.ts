// @ts-nocheck - Suppress type checking for runtime mocks
declare global {
    var TemplateLogic: any;
    var EngineResponse: any;
    var InitResponse: any;
}

// Mock runtime globals BEFORE importing logic
(global as any).TemplateLogic = class TemplateLogic<T, S = undefined> {
    async trigger(data: T, request: any, state?: S): Promise<any> { return {}; }
};
(global as any).EngineResponse = class EngineResponse<S> {};
(global as any).InitResponse = class InitResponse<S> {};

import CarRentalLogic from './logic';
import { ITemplateModel, IPaymentRequest, IPaymentClause } from './generated/org.accordproject.carrentaltr@0.1.0';

describe('CarRentalLogic', () => {
    let logic: CarRentalLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new CarRentalLogic();

        const paymentClause: IPaymentClause = {
            $class: 'org.accordproject.carrentaltr@0.1.0.PaymentClause',
            $identifier: 'payment-test-id',
            clauseId: 'payment-test-id',
            amountText: 'İki Yüz On Yedi Amerikan Doları',
            amount: 217.99,
            currencyCode: 'USD',
            paymentProcedure: 'bank transfer'
        };

        model = {
            $class: 'org.accordproject.carrentaltr@0.1.0.TemplateModel',
            $identifier: 'test-clause-id',
            clauseId: 'test-clause-id',
            lessorName: 'Acme Car Rental',
            lessorAddress: 'Dikmen Caddesi No:48/15 Dikmen Ankara',
            lessorPhone: '+901231231234',
            lesseeName: 'Can Doğan',
            lesseeAddress: 'John F. Kennedy Sokak No:23/12 Kavaklıdere Ankara',
            lesseePhone: '+901234567890',
            authorizedCourt: 'Ankara',
            plateID: 'PlakaNo',
            carBrand: 'Volkswagen',
            model: 'Golf 1.6 TDI Comfortline',
            modelYear: '2017',
            color: 'Kırmızı',
            vechileID: 'WVWZZZ3CZXW000001',
            startDate: '13.07.2018',
            endDate: '17.07.2018',
            deliveryStation: 'Acme Car Rental Merkez Ofis',
            paymentClause
        };
    });

    describe('trigger', () => {
        it('should return the payment amount from the payment clause', async () => {
            const request: IPaymentRequest = {
                $class: 'org.accordproject.carrentaltr@0.1.0.PaymentRequest',
                $timestamp: new Date()
            };

            const result = await logic.trigger(model, request);

            expect(result.result).toBeDefined();
            expect(result.result.$class).toBe('org.accordproject.carrentaltr@0.1.0.PayOut');
            expect(result.result.$timestamp).toBeDefined();
            expect(result.result.amount).toBe(217.99);
            expect(result.result.currencyCode).toBe('USD');
        });

        it('should return amount and currency from payment clause', async () => {
            model.paymentClause.amount = 500.0;
            model.paymentClause.currencyCode = 'EUR';

            const request: IPaymentRequest = {
                $class: 'org.accordproject.carrentaltr@0.1.0.PaymentRequest',
                $timestamp: new Date()
            };

            const result = await logic.trigger(model, request);

            expect(result.result.amount).toBe(500.0);
            expect(result.result.currencyCode).toBe('EUR');
        });
    });
});
