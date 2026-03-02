// @ts-nocheck
declare global {
    var TemplateLogic: any;
    var EngineResponse: any;
    var InitResponse: any;
}
(global as any).TemplateLogic = class TemplateLogic<T, S = undefined> {
    async trigger(data: T, request: any, state?: S): Promise<any> { return {}; }
};
(global as any).EngineResponse = class EngineResponse<S> {};
(global as any).InitResponse = class InitResponse<S> {};

import LateDeliveryAndPenaltyCurrencyConversionLogic from './logic';
import { ITemplateModel, ILateDeliveryAndPenaltyRequest } from './generated/org.accordproject.latedeliveryandpenaltycurrencyconversion@0.1.0';

describe('LateDeliveryAndPenaltyCurrencyConversionLogic', () => {
    let logic: LateDeliveryAndPenaltyCurrencyConversionLogic;
    let model: ITemplateModel;
    let pastDate: Date;

    beforeEach(() => {
        logic = new LateDeliveryAndPenaltyCurrencyConversionLogic();
        pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 14);
        model = {
            $class: 'org.accordproject.latedeliveryandpenaltycurrencyconversion@0.1.0.TemplateModel',
            $identifier: 'test-id',
            clauseId: 'test-id',
            buyer: 'Alice',
            seller: 'Bob',
            forceMajeure: true,
            penaltyDuration: { $class: 'org.accordproject.time@0.3.0.Duration', amount: 7, unit: 'days' },
            penaltyPercentage: 10.5,
            capPercentage: 55,
            termination: { $class: 'org.accordproject.time@0.3.0.Duration', amount: 60, unit: 'days' },
            fractionalPart: 'days',
            conversionSource: 'ECB',
            fromCurrency: 'USD',
            toCurrency: 'EUR',
        };
    });

    describe('trigger', () => {
        it('should return penalty=0 and buyerMayTerminate=true when force majeure applies', async () => {
            const request: ILateDeliveryAndPenaltyRequest = {
                $class: 'org.accordproject.latedeliveryandpenaltycurrencyconversion@0.1.0.LateDeliveryAndPenaltyRequest',
                $timestamp: new Date(),
                forceMajeure: true,
                agreedDelivery: pastDate,
                goodsValue: 1000,
                currencyConversion: {
                    $class: 'org.accordproject.latedeliveryandpenaltycurrencyconversion@0.1.0.CurrencyConversion',
                    from: 'USD',
                    to: 'EUR',
                    rate: 1.1,
                },
            };
            const result = await logic.trigger(model, request);
            expect(result.result.penalty).toBe(0);
            expect(result.result.buyerMayTerminate).toBe(true);
            expect(result.events).toHaveLength(0);
        });

        it('should apply currency conversion when fromCurrency != toCurrency', async () => {
            const conversionRate = 1.1;
            const request: ILateDeliveryAndPenaltyRequest = {
                $class: 'org.accordproject.latedeliveryandpenaltycurrencyconversion@0.1.0.LateDeliveryAndPenaltyRequest',
                $timestamp: new Date(),
                forceMajeure: false,
                agreedDelivery: pastDate,
                goodsValue: 1000,
                currencyConversion: {
                    $class: 'org.accordproject.latedeliveryandpenaltycurrencyconversion@0.1.0.CurrencyConversion',
                    from: 'USD',
                    to: 'EUR',
                    rate: conversionRate,
                },
            };
            // model has fromCurrency='USD', toCurrency='EUR' (different)
            const result = await logic.trigger(model, request);
            expect(result.result.penalty).toBeGreaterThan(0);
            expect(result.events).toHaveLength(1);
            const event = result.events[0] as any;
            expect(event.currencyCode).toBe('EUR');
        });

        it('should not apply currency conversion when fromCurrency == toCurrency', async () => {
            const modelSameCurrency = { ...model, fromCurrency: 'USD', toCurrency: 'USD' };
            const request: ILateDeliveryAndPenaltyRequest = {
                $class: 'org.accordproject.latedeliveryandpenaltycurrencyconversion@0.1.0.LateDeliveryAndPenaltyRequest',
                $timestamp: new Date(),
                forceMajeure: false,
                agreedDelivery: pastDate,
                goodsValue: 1000,
                currencyConversion: {
                    $class: 'org.accordproject.latedeliveryandpenaltycurrencyconversion@0.1.0.CurrencyConversion',
                    from: 'USD',
                    to: 'USD',
                    rate: 1.5,
                },
            };
            const resultNoConversion = await logic.trigger(modelSameCurrency, request);
            // When same currency, rate is NOT applied; penalty should be less than when rate would multiply
            const modelDiffCurrency = { ...model, fromCurrency: 'USD', toCurrency: 'EUR' };
            const resultWithConversion = await logic.trigger(modelDiffCurrency, request);
            // With conversion rate of 1.5 the penalty is multiplied, so it should be larger
            expect(resultWithConversion.result.penalty).toBeGreaterThan(resultNoConversion.result.penalty);
        });

        it('should use toCurrency as the currencyCode in the emitted event', async () => {
            const modelGBP = { ...model, fromCurrency: 'USD', toCurrency: 'GBP' };
            const request: ILateDeliveryAndPenaltyRequest = {
                $class: 'org.accordproject.latedeliveryandpenaltycurrencyconversion@0.1.0.LateDeliveryAndPenaltyRequest',
                $timestamp: new Date(),
                forceMajeure: false,
                agreedDelivery: pastDate,
                goodsValue: 1000,
                currencyConversion: {
                    $class: 'org.accordproject.latedeliveryandpenaltycurrencyconversion@0.1.0.CurrencyConversion',
                    from: 'USD',
                    to: 'GBP',
                    rate: 0.79,
                },
            };
            const result = await logic.trigger(modelGBP, request);
            const event = result.events[0] as any;
            expect(event.currencyCode).toBe('GBP');
        });

        it('should cap penalty at capPercentage of goodsValue before conversion', async () => {
            const modelHighPenalty = {
                ...model,
                penaltyPercentage: 999,
                capPercentage: 55,
                fromCurrency: 'USD',
                toCurrency: 'USD',
            };
            const request: ILateDeliveryAndPenaltyRequest = {
                $class: 'org.accordproject.latedeliveryandpenaltycurrencyconversion@0.1.0.LateDeliveryAndPenaltyRequest',
                $timestamp: new Date(),
                forceMajeure: false,
                agreedDelivery: pastDate,
                goodsValue: 1000,
                currencyConversion: {
                    $class: 'org.accordproject.latedeliveryandpenaltycurrencyconversion@0.1.0.CurrencyConversion',
                    from: 'USD',
                    to: 'USD',
                    rate: 1.0,
                },
            };
            const result = await logic.trigger(modelHighPenalty, request);
            expect(result.result.penalty).toBeLessThanOrEqual(1000 * 0.55);
        });

        it('should set buyerMayTerminate=true when delay exceeds termination threshold', async () => {
            const veryPastDate = new Date();
            veryPastDate.setDate(veryPastDate.getDate() - 100);
            const modelShortTermination = { ...model, termination: { $class: 'org.accordproject.time@0.3.0.Duration', amount: 30, unit: 'days' } };
            const request: ILateDeliveryAndPenaltyRequest = {
                $class: 'org.accordproject.latedeliveryandpenaltycurrencyconversion@0.1.0.LateDeliveryAndPenaltyRequest',
                $timestamp: new Date(),
                forceMajeure: false,
                agreedDelivery: veryPastDate,
                goodsValue: 1000,
                currencyConversion: {
                    $class: 'org.accordproject.latedeliveryandpenaltycurrencyconversion@0.1.0.CurrencyConversion',
                    from: 'USD',
                    to: 'EUR',
                    rate: 1.1,
                },
            };
            const result = await logic.trigger(modelShortTermination, request);
            expect(result.result.buyerMayTerminate).toBe(true);
        });

        it('should throw if agreed delivery is in the future', async () => {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);
            const request: ILateDeliveryAndPenaltyRequest = {
                $class: 'org.accordproject.latedeliveryandpenaltycurrencyconversion@0.1.0.LateDeliveryAndPenaltyRequest',
                $timestamp: new Date(),
                forceMajeure: false,
                agreedDelivery: futureDate,
                goodsValue: 1000,
                currencyConversion: {
                    $class: 'org.accordproject.latedeliveryandpenaltycurrencyconversion@0.1.0.CurrencyConversion',
                    from: 'USD',
                    to: 'EUR',
                    rate: 1.1,
                },
            };
            await expect(logic.trigger(model, request)).rejects.toThrow('Cannot exercise late delivery before delivery date');
        });

        it('should emit a PaymentObligationEvent with seller and buyer in description', async () => {
            const request: ILateDeliveryAndPenaltyRequest = {
                $class: 'org.accordproject.latedeliveryandpenaltycurrencyconversion@0.1.0.LateDeliveryAndPenaltyRequest',
                $timestamp: new Date(),
                forceMajeure: false,
                agreedDelivery: pastDate,
                goodsValue: 1000,
                currencyConversion: {
                    $class: 'org.accordproject.latedeliveryandpenaltycurrencyconversion@0.1.0.CurrencyConversion',
                    from: 'USD',
                    to: 'EUR',
                    rate: 1.1,
                },
            };
            const result = await logic.trigger(model, request);
            expect(result.events).toHaveLength(1);
            const event = result.events[0] as any;
            expect(event.$class).toBe('org.accordproject.latedeliveryandpenaltycurrencyconversion@0.1.0.PaymentObligationEvent');
            expect(event.description).toContain('Bob');
            expect(event.description).toContain('Alice');
        });
    });
});
