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
import { ITemplateModel, IPaymentRequest } from './generated/poc.accordproject.copyrightlicense@0.1.0';

describe('CopyrightLicenseLogic', () => {
    let logic: CopyrightLicenseLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new CopyrightLicenseLogic();

        // Raw sample data, mirroring what template-engine hands to
        // logic.trigger(): relationships and Map-typed fields are still
        // their serialized JSON shape (see logic.ts comments), not
        // resolved Concerto resources.
        model = {
            $class: 'poc.accordproject.copyrightlicense@0.1.0.TemplateModel',
            documentId: 'test-document-id',
            parties: [
                { $class: 'poc.accordproject.party@0.1.0.Party', partyId: 'me', name: 'Me' },
                { $class: 'poc.accordproject.party@0.1.0.Party', partyId: 'myself', name: 'Myself' },
            ],
            data: {
                $class: 'poc.accordproject.copyrightlicense@0.1.0.CopyrightLicenseData',
                effectiveDate: new Date('2018-01-01T00:00:00Z'),
                licensee: 'resource:poc.accordproject.party@0.1.0.Party#me',
                licensor: 'resource:poc.accordproject.party@0.1.0.Party#myself',
                territory: 'United States',
                purposeDescription: 'stuff',
                workDescription: 'other stuff',
                paymentTerms: {
                    $class: 'poc.accordproject.copyrightlicense@0.1.0.PaymentTerms',
                    amountText: 'one hundred US Dollars',
                    amount: { $class: 'org.accordproject.money@0.3.0.MonetaryAmount', doubleValue: 100.0, currencyCode: 'USD' },
                    paymentProcedure: 'bank transfer',
                },
            },
            clauses: {
                paymentTerms: {
                    $class: 'poc.accordproject.agreement@0.1.0.Clause',
                    path: 'data.paymentTerms',
                    data: {
                        $class: 'poc.accordproject.copyrightlicense@0.1.0.PaymentTerms',
                        amountText: 'one hundred US Dollars',
                        amount: { $class: 'org.accordproject.money@0.3.0.MonetaryAmount', doubleValue: 100.0, currencyCode: 'USD' },
                        paymentProcedure: 'bank transfer',
                    },
                },
            },
        } as unknown as ITemplateModel;
    });

    describe('trigger', () => {
        it('should return the payment amount and emit a payment obligation event', async () => {
            const request: IPaymentRequest = {
                $class: 'poc.accordproject.copyrightlicense@0.1.0.PaymentRequest',
                $timestamp: new Date()
            };

            const result = await logic.trigger(model, request);

            expect(result.result).toBeDefined();
            expect(result.result.$class).toBe('poc.accordproject.copyrightlicense@0.1.0.PayOut');
            expect(result.result.$timestamp).toBeDefined();
            expect(result.result.amount.doubleValue).toBe(100.0);
            expect(result.result.amount.currencyCode).toBe('USD');
        });

        it('should emit a PaymentObligationEvent naming the parties resolved from the unified Party list', async () => {
            const request: IPaymentRequest = {
                $class: 'poc.accordproject.copyrightlicense@0.1.0.PaymentRequest',
                $timestamp: new Date()
            };

            const result = await logic.trigger(model, request);

            expect(Array.isArray(result.events)).toBe(true);
            expect(result.events).toHaveLength(1);

            const event = result.events[0] as any;
            expect(event.$class).toBe('poc.accordproject.copyrightlicense@0.1.0.PaymentObligationEvent');
            expect(event.amount.doubleValue).toBe(100.0);
            expect(event.amount.currencyCode).toBe('USD');
            expect(event.description).toBe('Me should pay contract amount to Myself');
        });

        it('should read the payment amount from the path-addressed clauses map, not the embedded fallback', async () => {
            (model as any).clauses.paymentTerms.data.amount = { $class: 'org.accordproject.money@0.3.0.MonetaryAmount', doubleValue: 250.0, currencyCode: 'GBP' };

            const request: IPaymentRequest = {
                $class: 'poc.accordproject.copyrightlicense@0.1.0.PaymentRequest',
                $timestamp: new Date()
            };

            const result = await logic.trigger(model, request);

            expect(result.result.amount.doubleValue).toBe(250.0);
            expect(result.result.amount.currencyCode).toBe('GBP');
            expect((result.events[0] as any).amount.doubleValue).toBe(250.0);
        });
    });
});
