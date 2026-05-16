// @ts-nocheck - Suppress type checking for runtime mocks
declare global {
    var TemplateLogic: any;
}

// Mock runtime globals BEFORE importing logic
(global as any).TemplateLogic = class TemplateLogic<T> {
    async trigger(data: T, request: any): Promise<any> { return {}; }
};

// Import AFTER mocks are set up
import FixedInterestsLogic from './logic';
import { ITemplateModel, IFixedInterestsRequest } from './generated/org.accordproject.fixedinterests@0.2.0';

function monetaryAmount(doubleValue: number, currencyCode = 'USD') {
    return {
        $class: 'org.accordproject.money@0.3.0.MonetaryAmount',
        doubleValue,
        currencyCode
    };
}

describe('FixedInterestsLogic', () => {
    let logic: FixedInterestsLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new FixedInterestsLogic();
        model = {
            $class: 'org.accordproject.fixedinterests@0.2.0.TemplateModel',
            $identifier: 'test-id',
            clauseId: 'test-id',
            loanAmount: monetaryAmount(100000.0),
            rate: 2.5,
            loanDuration: 15
        };
    });

    describe('trigger', () => {
        it('should return a response with output mentioning the loan amount', async () => {
            const request: IFixedInterestsRequest = {
                $class: 'org.accordproject.fixedinterests@0.2.0.FixedInterestsRequest',
                $timestamp: new Date(),
                input: 'test'
            };
            const result = await logic.trigger(model, request);

            expect(result.result).toHaveProperty('$class', 'org.accordproject.fixedinterests@0.2.0.FixedInterestsResponse');
            expect(result.result).toHaveProperty('$timestamp');
            expect(result.result.output).toContain('100000');
        });

        it('should handle different loan amounts', async () => {
            model.loanAmount = monetaryAmount(200000.0);
            model.rate = 6.5;
            model.loanDuration = 30;
            const request: IFixedInterestsRequest = {
                $class: 'org.accordproject.fixedinterests@0.2.0.FixedInterestsRequest',
                $timestamp: new Date(),
                input: 'test'
            };
            const result = await logic.trigger(model, request);

            expect(result.result.output).toContain('200000');
        });
    });
});
