// @ts-nocheck - Suppress type checking for runtime mocks
declare global {
    var TemplateLogic: any;
}

// Mock runtime globals BEFORE importing logic
(global as any).TemplateLogic = class TemplateLogic<T> {
    async trigger(data: T, request: any): Promise<any> { return {}; }
};

// Import AFTER mocks are set up
import FixedInterestsStaticLogic from './logic';
import { ITemplateModel, IFixedInterestsStaticRequest } from './generated/io.clause.fixedinterestsstatic@0.1.0';

describe('FixedInterestsStaticLogic', () => {
    let logic: FixedInterestsStaticLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new FixedInterestsStaticLogic();
        model = {
            $class: 'io.clause.fixedinterestsstatic@0.1.0.TemplateModel',
            $identifier: 'test-id',
            clauseId: 'test-id',
            loanAmount: 100000.0,
            currencyCode: 'USD',
            rate: 2.5,
            loanDuration: 15,
            monthlyPayment: 667.0
        };
    });

    describe('trigger', () => {
        it('should return a response with output mentioning the loan amount', async () => {
            const request: IFixedInterestsStaticRequest = {
                $class: 'io.clause.fixedinterestsstatic@0.1.0.FixedInterestsStaticRequest',
                $timestamp: new Date(),
                input: 'test'
            };
            const result = await logic.trigger(model, request);

            expect(result.result).toHaveProperty('$class', 'io.clause.fixedinterestsstatic@0.1.0.FixedInterestsStaticResponse');
            expect(result.result).toHaveProperty('$timestamp');
            expect(result.result.output).toContain('100000');
        });
    });
});
