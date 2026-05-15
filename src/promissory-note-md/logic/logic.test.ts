// @ts-nocheck - Suppress type checking for runtime mocks
declare global {
    var TemplateLogic: any;
}

// Mock runtime globals BEFORE importing logic
(global as any).TemplateLogic = class TemplateLogic<T> {
    async trigger(data: T, request: any): Promise<any> { return {}; }
};

// Import AFTER mocks are set up
import PromissoryNoteMdLogic from './logic';
import { ITemplateModel, IPayment } from './generated/org.accordproject.promissorynotemd@0.1.0';

describe('PromissoryNoteMdLogic', () => {
    let logic: PromissoryNoteMdLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new PromissoryNoteMdLogic();
        model = {
            $class: 'org.accordproject.promissorynotemd@0.1.0.TemplateModel',
            $identifier: 'test-id',
            clauseId: 'test-id',
            amount: 1000.0,
            date: '2017-03-12T00:00:00.000Z',
            maker: 'John Smith',
            interestRate: 0.03,
            individual: true,
            makerAddress: '123 Main St',
            lender: 'Acme Corp',
            legalEntity: 'Corporation',
            lenderAddress: '456 Elm St',
            maturityDate: '2019-01-01T00:00:00.000Z',
            defaultDays: 30,
            insolvencyDays: 90,
            jurisdiction: 'New York'
        };
    });

    describe('trigger', () => {
        it('should compute outstanding balance with compound interest', async () => {
            const request: IPayment = {
                $class: 'org.accordproject.promissorynotemd@0.1.0.Payment',
                $timestamp: new Date(),
                amountPaid: 100.0
            };

            const result = await logic.trigger(model, request);

            expect(result.result).toHaveProperty('$class', 'org.accordproject.promissorynotemd@0.1.0.Result');
            expect(result.result).toHaveProperty('$timestamp');
            expect(result.result.outstandingBalance).toBeGreaterThan(0);
        });

        it('should throw when interest rate is negative', async () => {
            const badModel = { ...model, interestRate: -0.01 };
            const request: IPayment = {
                $class: 'org.accordproject.promissorynotemd@0.1.0.Payment',
                $timestamp: new Date(),
                amountPaid: 0
            };

            await expect(logic.trigger(badModel, request)).rejects.toThrow('Interest rate must be non-negative');
        });

        it('should throw when amount is negative', async () => {
            const badModel = { ...model, amount: -1.0 };
            const request: IPayment = {
                $class: 'org.accordproject.promissorynotemd@0.1.0.Payment',
                $timestamp: new Date(),
                amountPaid: 0
            };

            await expect(logic.trigger(badModel, request)).rejects.toThrow('Amount must be non-negative');
        });

        it('should throw when amount paid exceeds outstanding balance', async () => {
            const request: IPayment = {
                $class: 'org.accordproject.promissorynotemd@0.1.0.Payment',
                $timestamp: new Date(),
                amountPaid: 2000.0
            };

            await expect(logic.trigger(model, request)).rejects.toThrow('Amount paid exceeds outstanding balance');
        });

        it('should return zero outstanding when fully paid', async () => {
            const request: IPayment = {
                $class: 'org.accordproject.promissorynotemd@0.1.0.Payment',
                $timestamp: new Date(),
                amountPaid: 1000.0
            };

            const result = await logic.trigger(model, request);
            expect(result.result.outstandingBalance).toBeCloseTo(0, 5);
        });
    });
});
