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
import { ICopyrightLicenseData, IPaymentRequest } from './generated/poc.accordproject.copyrightlicense@0.1.0';

describe('CopyrightLicenseLogic', () => {
    let logic: CopyrightLicenseLogic;
    let data: ICopyrightLicenseData;

    beforeEach(() => {
        logic = new CopyrightLicenseLogic();

        // Raw sample data, mirroring what template-engine hands to
        // logic.trigger(): `data` IS the template model directly (no
        // envelope to unwrap, and no `clauses` map -- see logic.ts
        // comments). `licensee`/`licensor` are portable PartyRef values,
        // not relationships, so there is nothing to resolve.
        data = {
            $class: 'poc.accordproject.copyrightlicense@0.1.0.CopyrightLicenseData',
            effectiveDate: new Date('2018-01-01T00:00:00Z'),
            licensee: { $class: 'poc.accordproject.party@0.1.0.PartyRef', id: 'me', scheme: 'poc.accordproject.party@0.1.0.Party', label: 'Me' },
            licensor: { $class: 'poc.accordproject.party@0.1.0.PartyRef', id: 'myself', scheme: 'poc.accordproject.party@0.1.0.Party', label: 'Myself' },
            territory: 'United States',
            purposeDescription: 'stuff',
            workDescription: 'other stuff',
            paymentTerms: {
                $class: 'poc.accordproject.copyrightlicense@0.1.0.PaymentTerms',
                amountText: 'one hundred US Dollars',
                amount: { $class: 'org.accordproject.money@0.3.0.MonetaryAmount', doubleValue: 100.0, currencyCode: 'USD' },
                paymentProcedure: 'bank transfer',
            },
        } as unknown as ICopyrightLicenseData;
    });

    describe('trigger', () => {
        it('should return the payment amount and emit a payment obligation event', async () => {
            const request: IPaymentRequest = {
                $class: 'poc.accordproject.copyrightlicense@0.1.0.PaymentRequest',
                $timestamp: new Date()
            };

            const result = await logic.trigger(data, request);

            expect(result.result).toBeDefined();
            expect(result.result.$class).toBe('poc.accordproject.copyrightlicense@0.1.0.PayOut');
            expect(result.result.$timestamp).toBeDefined();
            expect(result.result.amount.doubleValue).toBe(100.0);
            expect(result.result.amount.currencyCode).toBe('USD');
        });

        it('should emit a PaymentObligationEvent naming the parties from their embedded PartyRef labels', async () => {
            const request: IPaymentRequest = {
                $class: 'poc.accordproject.copyrightlicense@0.1.0.PaymentRequest',
                $timestamp: new Date()
            };

            const result = await logic.trigger(data, request);

            expect(Array.isArray(result.events)).toBe(true);
            expect(result.events).toHaveLength(1);

            const event = result.events[0] as any;
            expect(event.$class).toBe('poc.accordproject.copyrightlicense@0.1.0.PaymentObligationEvent');
            expect(event.amount.doubleValue).toBe(100.0);
            expect(event.amount.currencyCode).toBe('USD');
            expect(event.description).toBe('Me should pay contract amount to Myself');
        });

        it('should read the payment amount from the nested paymentTerms field', async () => {
            (data as any).paymentTerms.amount = { $class: 'org.accordproject.money@0.3.0.MonetaryAmount', doubleValue: 250.0, currencyCode: 'GBP' };

            const request: IPaymentRequest = {
                $class: 'poc.accordproject.copyrightlicense@0.1.0.PaymentRequest',
                $timestamp: new Date()
            };

            const result = await logic.trigger(data, request);

            expect(result.result.amount.doubleValue).toBe(250.0);
            expect(result.result.amount.currencyCode).toBe('GBP');
            expect((result.events[0] as any).amount.doubleValue).toBe(250.0);
        });
    });
});
