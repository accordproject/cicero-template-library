// @ts-nocheck
declare global {
    var TemplateLogic: any;
    var EngineResponse: any;
    var InitResponse: any;
}
(global as any).TemplateLogic = class TemplateLogic<T, S = undefined> {
    async trigger(data: T, request: any, state?: S): Promise<any> { return {}; }
};
(global as any).EngineResponse = class EngineResponse<S> {};
(global as any).InitResponse = class InitResponse<S> {};

import MiniLateDeliveryAndPenaltyCappedLogic from './logic';
import { ITemplateModel, ILateRequest } from './generated/io.clause.minilatedeliveryandpenaltycapped@0.1.0';

describe('MiniLateDeliveryAndPenaltyCappedLogic', () => {
    let logic: MiniLateDeliveryAndPenaltyCappedLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new MiniLateDeliveryAndPenaltyCappedLogic();
        model = {
            $class: 'io.clause.minilatedeliveryandpenaltycapped@0.1.0.TemplateModel',
            $identifier: 'test-id',
            clauseId: 'test-id',
            buyer: 'Alice',
            seller: 'Bob',
            penaltyDuration: { $class: 'org.accordproject.time@0.3.0.Duration', amount: 7, unit: 'days' },
            penaltyPercentage: 10.5,
            capPercentage: 55,
            maximumDelay: { $class: 'org.accordproject.time@0.3.0.Duration', amount: 14, unit: 'days' },
        };
    });

    describe('trigger', () => {
        it('should calculate capped penalty', async () => {
            const agreed = new Date('2020-01-01T00:00:00Z');
            const delivered = new Date('2020-01-15T00:00:00Z'); // 14 days late
            const request: ILateRequest = {
                $class: 'io.clause.minilatedeliveryandpenaltycapped@0.1.0.LateRequest',
                $timestamp: new Date(),
                agreedDelivery: agreed,
                deliveredAt: delivered,
                goodsValue: 1000,
            };
            const result = await logic.trigger(model, request);
            // penalty = 14/7 * 10.5% * 1000 = 21, cap = 55% * 1000 = 550
            expect(result.result.penalty).toBeCloseTo(21, 5);
        });

        it('should cap the penalty when it exceeds the cap', async () => {
            model.capPercentage = 1; // 1% cap = 10
            const agreed = new Date('2020-01-01T00:00:00Z');
            const delivered = new Date('2020-01-15T00:00:00Z'); // 14 days late
            const request: ILateRequest = {
                $class: 'io.clause.minilatedeliveryandpenaltycapped@0.1.0.LateRequest',
                $timestamp: new Date(),
                agreedDelivery: agreed,
                deliveredAt: delivered,
                goodsValue: 1000,
            };
            const result = await logic.trigger(model, request);
            expect(result.result.penalty).toBeCloseTo(10, 5); // capped at 1% of 1000
        });
    });
});
