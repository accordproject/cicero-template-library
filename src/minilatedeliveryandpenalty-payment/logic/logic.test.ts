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

import MiniLateDeliveryAndPenaltyPaymentLogic from './logic';
import { ITemplateModel, ILateRequest } from './generated/io.clause.minilatedeliveryandpenaltypayment@0.1.0';

describe('MiniLateDeliveryAndPenaltyPaymentLogic', () => {
    let logic: MiniLateDeliveryAndPenaltyPaymentLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new MiniLateDeliveryAndPenaltyPaymentLogic();
        model = {
            $class: 'io.clause.minilatedeliveryandpenaltypayment@0.1.0.TemplateModel',
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
        it('should emit a PaymentObligationEvent', async () => {
            const agreed = new Date('2020-01-01T00:00:00Z');
            const delivered = new Date('2020-01-15T00:00:00Z');
            const request: ILateRequest = {
                $class: 'io.clause.minilatedeliveryandpenaltypayment@0.1.0.LateRequest',
                $timestamp: new Date(),
                agreedDelivery: agreed,
                deliveredAt: delivered,
                goodsValue: 1000,
            };
            const result = await logic.trigger(model, request);
            expect(result.events).toHaveLength(1);
            const event = result.events[0] as any;
            expect(event.$class).toBe('io.clause.minilatedeliveryandpenaltypayment@0.1.0.PaymentObligationEvent');
            expect(event.amount).toBeCloseTo(21, 5);
        });
    });
});
