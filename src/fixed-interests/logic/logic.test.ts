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
import { ITemplateModel, IFixedInterestsRequest } from './generated/io.clause.fixedinterests@0.1.0';

describe('FixedInterestsLogic', () => {
    let logic: FixedInterestsLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new FixedInterestsLogic();
        model = {
            $class: 'io.clause.fixedinterests@0.1.0.TemplateModel',
            $identifier: 'test-id',
            clauseId: 'test-id',
            loanAmount: 100000.0,
            currencyCode: 'USD',
            rate: 2.5,
            loanDuration: 15
        };
    });

    describe('trigger', () => {
        it('should return a response with output mentioning the loan amount', async () => {
            const request: IFixedInterestsRequest = {
                $class: 'io.clause.fixedinterests@0.1.0.FixedInterestsRequest',
                $timestamp: new Date(),
                input: 'test'
            };
            const result = await logic.trigger(model, request);

            expect(result.result).toHaveProperty('$class', 'io.clause.fixedinterests@0.1.0.FixedInterestsResponse');
            expect(result.result).toHaveProperty('$timestamp');
            expect(result.result.output).toContain('100000');
        });

        it('should handle different loan amounts', async () => {
            model.loanAmount = 200000.0;
            model.rate = 6.5;
            model.loanDuration = 30;
            const request: IFixedInterestsRequest = {
                $class: 'io.clause.fixedinterests@0.1.0.FixedInterestsRequest',
                $timestamp: new Date(),
                input: 'test'
            };
            const result = await logic.trigger(model, request);

            expect(result.result.output).toContain('200000');
        });
    });
});
