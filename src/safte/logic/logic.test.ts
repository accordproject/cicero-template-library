
// @ts-nocheck - Suppress type checking for runtime mocks
// Mock runtime globals BEFORE importing logic
(global as any).TemplateLogic = class TemplateLogic<T> {
    async trigger(data: T, request: any): Promise<any> { return {}; }
};

// Import AFTER mocks are set up
import SafteLogic from './logic';
import { ITemplateModel, ITokenSale, IEquityFinancing, IDissolutionEvent } from './generated/org.accordproject.safte@0.2.0';

function monetaryAmount(doubleValue: number, currencyCode = 'USD') {
    return {
        $class: 'org.accordproject.money@0.3.0.MonetaryAmount',
        doubleValue,
        currencyCode
    };
}

describe('SafteLogic', () => {
    let logic: SafteLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new SafteLogic();
        model = {
            $class: 'org.accordproject.safte@0.2.0.TemplateModel',
            $identifier: 'test-id',
            clauseId: 'test-id',
            companyName: 'ACME',
            companyRegistrationNumber: 555,
            purchaser: 'Dan',
            jurisdiction: 'NY',
            purchaseAmount: monetaryAmount(25.0),
            discount: 7.0,
            projectName: 'Umbrella',
            projectDescription: 'manages umbrella tokens',
            months: 12,
            monthsText: 'twelve',
            amount: monetaryAmount(1000.0),
            amountText: 'one thousand'
        };
    });

    describe('trigger - tokenSale', () => {
        it('should compute token share on token sale', async () => {
            const request: ITokenSale = {
                $class: 'org.accordproject.safte@0.2.0.TokenSale',
                $timestamp: new Date(),
                tokenPrice: monetaryAmount(1.23)
            };

            const result = await logic.trigger(model, request);

            expect(result.result).toHaveProperty('$class', 'org.accordproject.safte@0.2.0.TokenShare');
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
                $class: 'org.accordproject.safte@0.2.0.EquityFinancing',
                $timestamp: new Date(),
                sharePrice: monetaryAmount(3.00)
            };

            const result = await logic.trigger(model, request);

            expect(result.result).toHaveProperty('$class', 'org.accordproject.safte@0.2.0.EquityShare');
            expect(result.result).toHaveProperty('$timestamp');
            // discountRate = (100 - 7) / 100 = 0.93
            // discountPrice = 3.00 * 0.93 = 2.79
            // equityAmount = 25 / 2.79 ≈ 8.961
            const equityShare = result.result as any;
            expect(equityShare.equityAmount.doubleValue).toBeCloseTo(8.960573476702509, 5);
        });
    });

    describe('trigger - dissolutionEvent', () => {
        it('should refund the purchase amount on dissolution', async () => {
            const request: IDissolutionEvent = {
                $class: 'org.accordproject.safte@0.2.0.DissolutionEvent',
                $timestamp: new Date(),
                cause: 'Went Shopping'
            };

            const result = await logic.trigger(model, request);

            expect(result.result).toHaveProperty('$class', 'org.accordproject.safte@0.2.0.PayOut');
            expect(result.result).toHaveProperty('$timestamp');
            const payout = result.result as any;
            expect(payout.amount.doubleValue).toBe(25.0);
        });
    });

    describe('trigger - unknown request', () => {
        it('should throw for unknown request type', async () => {
            const request = {
                $class: 'org.accordproject.safte@0.2.0.Unknown',
                $timestamp: new Date()
            };

            await expect(logic.trigger(model, request as any)).rejects.toThrow('Unknown request type');
        });
    });
});
