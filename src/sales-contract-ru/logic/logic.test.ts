
// @ts-nocheck - Suppress type checking for runtime mocks
// Mock runtime globals BEFORE importing logic
(global as any).TemplateLogic = class TemplateLogic<T> {
    async trigger(data: T, request: any): Promise<any> { return {}; }
};

// Import AFTER mocks are set up
import SalesContractRuLogic from './logic';
import { ITemplateModel, IMyRequest } from './generated/org.accordproject.salescontractru@0.1.0';

describe('SalesContractRuLogic', () => {
    let logic: SalesContractRuLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new SalesContractRuLogic();
        model = {
            $class: 'org.accordproject.salescontractru@0.1.0.TemplateModel',
            $identifier: 'test-id',
            clauseId: 'test-id',
            buyer: 'Ivan Ivanov',
            seller: 'Petr Petrov',
            refundPeriod: '6',
            counterparty: 'партиями',
            currencyType: 'в рублях',
            appealPeriod: '30',
            countryLegislation: 'законодательством Российской Федерации'
        };
    });

    describe('trigger', () => {
        it('should echo the input as output', async () => {
            const request: IMyRequest = {
                $class: 'org.accordproject.salescontractru@0.1.0.MyRequest',
                $timestamp: new Date(),
                input: 'Contract Valid'
            };

            const result = await logic.trigger(model, request);

            expect(result.result).toHaveProperty('$class', 'org.accordproject.salescontractru@0.1.0.MyResponse');
            expect(result.result).toHaveProperty('$timestamp');
            expect(result.result.output).toBe('Contract Valid');
        });

        it('should echo different input values', async () => {
            const request: IMyRequest = {
                $class: 'org.accordproject.salescontractru@0.1.0.MyRequest',
                $timestamp: new Date(),
                input: 'Договор действителен'
            };

            const result = await logic.trigger(model, request);
            expect(result.result.output).toBe('Договор действителен');
        });
    });
});
