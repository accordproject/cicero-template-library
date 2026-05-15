// @ts-nocheck - Suppress type checking for runtime mocks
declare global {
    var TemplateLogic: any;
}

// Mock runtime globals BEFORE importing logic
(global as any).TemplateLogic = class TemplateLogic<T> {
    async trigger(data: T, request: any): Promise<any> { return {}; }
};

// Import AFTER mocks are set up
import DemandForecastLogic from './logic';
import { ITemplateModel, IForecastRequest } from './generated/org.accordproject.demandforecast@0.1.0';

describe('DemandForecastLogic', () => {
    let logic: DemandForecastLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new DemandForecastLogic();
        model = {
            $class: 'org.accordproject.demandforecast@0.1.0.TemplateModel',
            $identifier: 'test-id',
            clauseId: 'test-id',
            purchaser: 'ACME Corp',
            supplier: 'Widget Co',
            effectiveDate: new Date('2023-01-01T00:00:00Z'),
            minimumPercentage: 75.0
        };
    });

    describe('trigger', () => {
        it('should compute requiredPurchase as minimumPercentage of supplyForecast', async () => {
            const request: IForecastRequest = {
                $class: 'org.accordproject.demandforecast@0.1.0.ForecastRequest',
                $timestamp: new Date(),
                supplyForecast: 1200.0
            };
            const result = await logic.trigger(model, request);

            expect(result.result).toHaveProperty('$class', 'org.accordproject.demandforecast@0.1.0.BindingResponse');
            expect(result.result).toHaveProperty('$timestamp');
            expect(result.result.requiredPurchase).toBeCloseTo(900.0, 5);
        });

        it('should compute correct quarter from current date', async () => {
            const request: IForecastRequest = {
                $class: 'org.accordproject.demandforecast@0.1.0.ForecastRequest',
                $timestamp: new Date(),
                supplyForecast: 1000.0
            };
            const result = await logic.trigger(model, request);

            expect(result.result.quarter).toBeGreaterThanOrEqual(1);
            expect(result.result.quarter).toBeLessThanOrEqual(4);
            expect(result.result.year).toBe(new Date().getFullYear());
        });

        it('should handle zero supplyForecast', async () => {
            const request: IForecastRequest = {
                $class: 'org.accordproject.demandforecast@0.1.0.ForecastRequest',
                $timestamp: new Date(),
                supplyForecast: 0.0
            };
            const result = await logic.trigger(model, request);

            expect(result.result.requiredPurchase).toBe(0.0);
        });

        it('should handle 100% minimumPercentage', async () => {
            model.minimumPercentage = 100.0;
            const request: IForecastRequest = {
                $class: 'org.accordproject.demandforecast@0.1.0.ForecastRequest',
                $timestamp: new Date(),
                supplyForecast: 500.0
            };
            const result = await logic.trigger(model, request);

            expect(result.result.requiredPurchase).toBeCloseTo(500.0, 5);
        });
    });
});
