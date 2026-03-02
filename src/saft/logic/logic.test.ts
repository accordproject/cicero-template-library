// @ts-nocheck - Suppress type checking for runtime mocks
declare global {
    var TemplateLogic: any;
}

// Mock runtime globals BEFORE importing logic
(global as any).TemplateLogic = class TemplateLogic<T> {
    async trigger(data: T, request: any): Promise<any> { return {}; }
};

// Import AFTER mocks are set up
import SaftLogic from './logic';
import { ITemplateModel, ILaunch, ITerminate } from './generated/io.clause.saft@0.1.0';

describe('SaftLogic', () => {
    let logic: SaftLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new SaftLogic();
        model = {
            $class: 'io.clause.saft@0.1.0.TemplateModel',
            $identifier: 'test-id',
            clauseId: 'test-id',
            token: 'TestToken',
            company: 'Test Company',
            companyType: 'Corporation',
            state: 'NY',
            amendmentProvision: false,
            purchaseAmount: 1000.0,
            currency: 'USD',
            netProceedLimit: 5000.0,
            date: '2018-01-01T00:00:00.000Z',
            deadlineDate: '2019-01-01T00:00:00.000Z',
            discountRatePercentage: 10.0,
            network: 'TestNet',
            coin: 'BTC',
            exchanges: 'Coinbase',
            companyRepresentative: 'Jane Doe',
            purchaser: 'Daniel Charles Selman',
            description: 'A test token network'
        };
    });

    describe('trigger - onLaunch', () => {
        it('should pay out 100 tokens to purchaser on network launch', async () => {
            const request: ILaunch = {
                $class: 'io.clause.saft@0.1.0.Launch',
                $timestamp: new Date(),
                exchangeRate: 123
            };

            const result = await logic.trigger(model, request);

            expect(result.result).toHaveProperty('$class', 'io.clause.saft@0.1.0.Payout');
            expect(result.result).toHaveProperty('$timestamp');
            expect(result.result.tokenAmount).toBe(100.0);
            expect(result.result.tokenAddress).toBe('Daniel Charles Selman');
        });
    });

    describe('trigger - onTerminate', () => {
        it('should pay out 9 tokens to purchaser on network termination', async () => {
            const request: ITerminate = {
                $class: 'io.clause.saft@0.1.0.Terminate',
                $timestamp: new Date(),
                remainingFunds: 246.609,
                totalInvested: 129.934
            };

            const result = await logic.trigger(model, request);

            expect(result.result).toHaveProperty('$class', 'io.clause.saft@0.1.0.Payout');
            expect(result.result).toHaveProperty('$timestamp');
            expect(result.result.tokenAmount).toBe(9.0);
            expect(result.result.tokenAddress).toBe('Daniel Charles Selman');
        });
    });

    describe('trigger - unknown request', () => {
        it('should throw for unknown request type', async () => {
            const request = {
                $class: 'io.clause.saft@0.1.0.Unknown',
                $timestamp: new Date()
            };

            await expect(logic.trigger(model, request as any)).rejects.toThrow('Unknown request type');
        });
    });
});
