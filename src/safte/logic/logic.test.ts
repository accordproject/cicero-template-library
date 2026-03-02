
// @ts-nocheck - Suppress type checking for runtime mocks
// Mock runtime globals BEFORE importing logic
(global as any).TemplateLogic = class TemplateLogic<T> {
    async trigger(data: T, request: any): Promise<any> { return {}; }
};

// Import AFTER mocks are set up
import SafteLogic from './logic';
import { ITemplateModel, ITokenSale, IEquityFinancing, IDissolutionEvent } from './generated/io.clause.safte@0.1.0';

describe('SafteLogic', () => {
    let logic: SafteLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new SafteLogic();
        model = {
            $class: 'io.clause.safte@0.1.0.TemplateModel',
            $identifier: 'test-id',
            clauseId: 'test-id',
            companyName: 'ACME',
            companyRegistrationNumber: 555,
            purchaser: 'Dan',
            jurisdiction: 'NY',
            purchaseAmount: 25.0,
            discount: 7.0,
            projectName: 'Umbrella',
            projectDescription: 'manages umbrella tokens',
            months: 12,
            monthsText: 'twelve',
            amount: 1000.0,
            amountText: 'one thousand'
        };
    });

    describe('trigger - tokenSale', () => {
        it('should compute token share on token sale', async () => {
            const request: ITokenSale = {
                $class: 'io.clause.safte@0.1.0.TokenSale',
                $timestamp: new Date(),
                tokenPrice: 1.23
            };

            const result = await logic.trigger(model, request);

            expect(result.result).toHaveProperty('$class', 'io.clause.safte@0.1.0.TokenShare');
            expect(result.result).toHaveProperty('$timestamp');
            // discountRate = (100 - 7) / 100 = 0.93
            // discountPrice = 1.23 * 0.93 = 1.1439
            // tokenAmount = 25 / 1.1439 ≈ 21.855
            const tokenShare = result.result as any;
            expect(tokenShare.tokenAmount).toBeCloseTo(21.855057260250017, 5);
        });
    });

    describe('trigger - equityFinancing', () => {
        it('should compute equity share on equity financing', async () => {
            const request: IEquityFinancing = {
                $class: 'io.clause.safte@0.1.0.EquityFinancing',
                $timestamp: new Date(),
                sharePrice: 3.00
            };

            const result = await logic.trigger(model, request);

            expect(result.result).toHaveProperty('$class', 'io.clause.safte@0.1.0.EquityShare');
            expect(result.result).toHaveProperty('$timestamp');
            // discountRate = (100 - 7) / 100 = 0.93
            // discountPrice = 3.00 * 0.93 = 2.79
            // equityAmount = 25 / 2.79 ≈ 8.961
            const equityShare = result.result as any;
            expect(equityShare.equityAmount).toBeCloseTo(8.960573476702509, 5);
        });
    });

    describe('trigger - dissolutionEvent', () => {
        it('should refund the purchase amount on dissolution', async () => {
            const request: IDissolutionEvent = {
                $class: 'io.clause.safte@0.1.0.DissolutionEvent',
                $timestamp: new Date(),
                cause: 'Went Shopping'
            };

            const result = await logic.trigger(model, request);

            expect(result.result).toHaveProperty('$class', 'io.clause.safte@0.1.0.PayOut');
            expect(result.result).toHaveProperty('$timestamp');
            const payout = result.result as any;
            expect(payout.amount).toBe(25.0);
        });
    });

    describe('trigger - unknown request', () => {
        it('should throw for unknown request type', async () => {
            const request = {
                $class: 'io.clause.safte@0.1.0.Unknown',
                $timestamp: new Date()
            };

            await expect(logic.trigger(model, request as any)).rejects.toThrow('Unknown request type');
        });
    });
});
