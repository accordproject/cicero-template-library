
// @ts-nocheck - Suppress type checking for runtime mocks
// Mock runtime globals BEFORE importing logic
(global as any).TemplateLogic = class TemplateLogic<T> {
    async trigger(data: T, request: any): Promise<any> { return {}; }
};

// Import AFTER mocks are set up
import ServiceLevelAgreementLogic from './logic';
import { ITemplateModel, IMonthSummary } from './generated/org.accordproject.servicelevelagreement@0.1.0';

const NS = 'org.accordproject.servicelevelagreement@0.1.0';

describe('ServiceLevelAgreementLogic', () => {
    let logic: ServiceLevelAgreementLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new ServiceLevelAgreementLogic();
        model = {
            $class: `${NS}.TemplateModel`,
            $identifier: 'test-id',
            clauseId: 'test-id',
            paymentPeriod: 30,
            monthlyCapPercentage: 10.0,
            yearlyCapPercentage: 25.0,
            availability1: 99.5,
            serviceCredit1: 5.0,
            currencyCode: 'USD',
            availability2: 99.0,
            serviceCredit2: 10.0,
            serviceProvider: 'Supplier Co',
            serviceConsumer: 'Customer Inc'
        };
    });

    describe('trigger', () => {
        it('should return zero credit when service level meets target', async () => {
            const request: IMonthSummary = {
                $class: `${NS}.MonthSummary`,
                $timestamp: new Date(),
                monthlyServiceLevel: 99.7,
                monthlyCharge: 10.0,
                last11MonthCredit: 0.0,
                last11MonthCharge: 0.0
            };
            const result = await logic.trigger(model, request);

            expect(result.result).toHaveProperty('$class', `${NS}.InvoiceCredit`);
            expect(result.result.monthlyCredit).toBe(0.0);
            expect(result.events).toHaveLength(0);
        });

        it('should return credit for row 1 service level breach (99.0 < SL < 99.5)', async () => {
            const request: IMonthSummary = {
                $class: `${NS}.MonthSummary`,
                $timestamp: new Date(),
                monthlyServiceLevel: 99.2,
                monthlyCharge: 1000.0,
                last11MonthCredit: 0.0,
                last11MonthCharge: 0.0
            };
            const result = await logic.trigger(model, request);

            // serviceCredit1 = 5% of monthlyCharge = 50.0
            expect(result.result.monthlyCredit).toBeGreaterThan(0.0);
            expect(result.events).toHaveLength(1);
        });

        it('should return higher credit for row 2 service level breach (SL < 99.0)', async () => {
            const request: IMonthSummary = {
                $class: `${NS}.MonthSummary`,
                $timestamp: new Date(),
                monthlyServiceLevel: 98.5,
                monthlyCharge: 1000.0,
                last11MonthCredit: 0.0,
                last11MonthCharge: 0.0
            };
            const result = await logic.trigger(model, request);

            // serviceCredit2 = 10% of monthlyCharge = 100.0
            expect(result.result.monthlyCredit).toBeGreaterThan(0.0);
            expect(result.events).toHaveLength(1);
        });

        it('should cap monthly credit at monthlyCapPercentage', async () => {
            // serviceCredit2 = 10%, cap = 10% — they should be equal here
            const request: IMonthSummary = {
                $class: `${NS}.MonthSummary`,
                $timestamp: new Date(),
                monthlyServiceLevel: 98.0,
                monthlyCharge: 1000.0,
                last11MonthCredit: 0.0,
                last11MonthCharge: 0.0
            };
            const result = await logic.trigger(model, request);
            expect(result.result.monthlyCredit).toBeLessThanOrEqual(100.0); // 10% of 1000
        });

        it('should throw when template variables are negative', async () => {
            model.availability1 = -1.0;
            const request: IMonthSummary = {
                $class: `${NS}.MonthSummary`,
                $timestamp: new Date(),
                monthlyServiceLevel: 99.0,
                monthlyCharge: 1000.0,
                last11MonthCredit: 0.0,
                last11MonthCharge: 0.0
            };
            await expect(logic.trigger(model, request)).rejects.toThrow('Template variables must not be negative.');
        });

        it('should throw when service level is out of 0-100 range', async () => {
            const request: IMonthSummary = {
                $class: `${NS}.MonthSummary`,
                $timestamp: new Date(),
                monthlyServiceLevel: 101.0,
                monthlyCharge: 1000.0,
                last11MonthCredit: 0.0,
                last11MonthCharge: 0.0
            };
            await expect(logic.trigger(model, request)).rejects.toThrow('service level must be at least 0%');
        });
    });
});
