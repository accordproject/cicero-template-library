// @ts-nocheck
declare global {
    var TemplateLogic: any;
    var EngineResponse: any;
    var InitResponse: any;
}
(global as any).TemplateLogic = class TemplateLogic<T, S> {
    async trigger(data: T, request: any, state?: S): Promise<any> { return {}; }
};
(global as any).EngineResponse = class EngineResponse<S> {};
(global as any).InitResponse = class InitResponse<S> {};

import EatApplesLogic from './logic';
import { ITemplateModel, IFood } from './generated/io.clause.eatapples@0.1.0';

describe('EatApplesLogic', () => {
    let logic: EatApplesLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new EatApplesLogic();
        model = {
            $class: 'io.clause.eatapples@0.1.0.TemplateModel',
            $identifier: 'test-id',
            clauseId: 'test-id',
            employee: 'John',
            company: 'Acme',
            tax: 10.0,
        };
    });

    describe('trigger', () => {
        it('should approve eating an apple and bill correctly', async () => {
            const request: IFood = {
                $class: 'io.clause.eatapples@0.1.0.Food',
                $timestamp: new Date(),
                produce: 'apple',
                price: 1.49,
            };
            const response = await logic.trigger(model, request);
            expect(response.result.notice).toBe('Very healthy!');
            expect(response.events).toHaveLength(1);
            const bill = response.events[0] as any;
            expect(bill.billTo).toBe('John');
            expect(bill.amount).toBeCloseTo(1.49 * 1.1);
        });

        it('should fire employee for eating non-apple produce', async () => {
            const request: IFood = {
                $class: 'io.clause.eatapples@0.1.0.Food',
                $timestamp: new Date(),
                produce: 'banana',
                price: 0.99,
            };
            const response = await logic.trigger(model, request);
            expect(response.result.notice).toBe("You're fired!");
            expect(response.events).toHaveLength(0);
        });
    });
});
