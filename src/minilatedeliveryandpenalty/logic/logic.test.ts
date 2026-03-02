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

import MiniLateDeliveryAndPenaltyLogic from './logic';
import { ITemplateModel, ILateRequest } from './generated/org.accordproject.minilatedeliveryandpenalty@0.1.0';

describe('MiniLateDeliveryAndPenaltyLogic', () => {
    let logic: MiniLateDeliveryAndPenaltyLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new MiniLateDeliveryAndPenaltyLogic();
        model = {
            $class: 'org.accordproject.minilatedeliveryandpenalty@0.1.0.TemplateModel',
            $identifier: 'test-id',
            clauseId: 'test-id',
            buyer: 'Alice',
            seller: 'Bob',
            penaltyDuration: { $class: 'org.accordproject.time@0.3.0.Duration', amount: 7, unit: 'days' },
            penaltyPercentage: 10.5,
            maximumDelay: { $class: 'org.accordproject.time@0.3.0.Duration', amount: 14, unit: 'days' },
        };
    });

    describe('trigger', () => {
        it('should calculate penalty for late delivery', async () => {
            const agreed = new Date('2020-01-01T00:00:00Z');
            const delivered = new Date('2020-01-15T00:00:00Z'); // 14 days late
            const request: ILateRequest = {
                $class: 'org.accordproject.minilatedeliveryandpenalty@0.1.0.LateRequest',
                $timestamp: new Date(),
                agreedDelivery: agreed,
                deliveredAt: delivered,
                goodsValue: 1000,
            };
            const result = await logic.trigger(model, request);
            // 14 days / 7 days * 10.5% * 1000 = 21
            expect(result.result.penalty).toBeCloseTo(21, 5);
            expect(result.result.buyerMayTerminate).toBe(true);
        });

        it('should throw if delivery is not late', async () => {
            const agreed = new Date('2020-01-15T00:00:00Z');
            const delivered = new Date('2020-01-01T00:00:00Z');
            const request: ILateRequest = {
                $class: 'org.accordproject.minilatedeliveryandpenalty@0.1.0.LateRequest',
                $timestamp: new Date(),
                agreedDelivery: agreed,
                deliveredAt: delivered,
                goodsValue: 1000,
            };
            await expect(logic.trigger(model, request)).rejects.toThrow();
        });
    });
});
