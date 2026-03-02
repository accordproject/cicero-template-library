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

import CopyrightLicenseLogic from './logic';
import { ITemplateModel, IPaymentRequest, IPaymentClause } from './generated/io.clause.copyrightlicense@0.1.0';

describe('CopyrightLicenseLogic', () => {
    let logic: CopyrightLicenseLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new CopyrightLicenseLogic();

        const paymentClause: IPaymentClause = {
            $class: 'io.clause.copyrightlicense@0.1.0.PaymentClause',
            $identifier: 'payment-test-id',
            clauseId: 'payment-test-id',
            amountText: 'one hundred US Dollars',
            amount: 100.0,
            currencyCode: 'USD',
            paymentProcedure: 'bank transfer'
        };

        model = {
            $class: 'io.clause.copyrightlicense@0.1.0.TemplateModel',
            $identifier: 'test-clause-id',
            clauseId: 'test-clause-id',
            effectiveDate: new Date('2018-01-01T00:00:00Z'),
            licensee: 'Me',
            licenseeState: 'NY',
            licenseeEntityType: 'Company',
            licenseeAddress: '1 Broadway',
            licensor: 'Myself',
            licensorState: 'NY',
            licensorEntityType: 'Company',
            licensorAddress: '2 Broadway',
            territory: 'United States',
            purposeDescription: 'stuff',
            workDescription: 'other stuff',
            paymentClause
        };
    });

    describe('trigger', () => {
        it('should return the payment amount and emit a payment obligation event', async () => {
            const request: IPaymentRequest = {
                $class: 'io.clause.copyrightlicense@0.1.0.PaymentRequest',
                $timestamp: new Date()
            };

            const result = await logic.trigger(model, request);

            expect(result.result).toBeDefined();
            expect(result.result.$class).toBe('io.clause.copyrightlicense@0.1.0.PayOut');
            expect(result.result.$timestamp).toBeDefined();
            expect(result.result.amount).toBe(100.0);
            expect(result.result.currencyCode).toBe('USD');
        });

        it('should emit a PaymentObligationEvent with correct description', async () => {
            const request: IPaymentRequest = {
                $class: 'io.clause.copyrightlicense@0.1.0.PaymentRequest',
                $timestamp: new Date()
            };

            const result = await logic.trigger(model, request);

            expect(Array.isArray(result.events)).toBe(true);
            expect(result.events).toHaveLength(1);

            const event = result.events[0] as any;
            expect(event.$class).toBe('io.clause.copyrightlicense@0.1.0.PaymentObligationEvent');
            expect(event.amount).toBe(100.0);
            expect(event.currencyCode).toBe('USD');
            expect(event.description).toBe('Me should pay contract amount to Myself');
        });

        it('should reflect different payment amounts correctly', async () => {
            model.paymentClause.amount = 250.0;
            model.paymentClause.currencyCode = 'GBP';

            const request: IPaymentRequest = {
                $class: 'io.clause.copyrightlicense@0.1.0.PaymentRequest',
                $timestamp: new Date()
            };

            const result = await logic.trigger(model, request);

            expect(result.result.amount).toBe(250.0);
            expect(result.result.currencyCode).toBe('GBP');
            expect((result.events[0] as any).amount).toBe(250.0);
        });
    });
});
