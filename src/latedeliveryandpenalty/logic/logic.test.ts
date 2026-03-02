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

import LateDeliveryAndPenaltyLogic from './logic';
import { ITemplateModel, ILateDeliveryAndPenaltyRequest } from './generated/org.accordproject.latedeliveryandpenalty@0.1.0';

describe('LateDeliveryAndPenaltyLogic', () => {
    let logic: LateDeliveryAndPenaltyLogic;
    let model: ITemplateModel;
    let pastDate: Date;

    beforeEach(() => {
        logic = new LateDeliveryAndPenaltyLogic();
        pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 14);
        model = {
            $class: 'org.accordproject.latedeliveryandpenalty@0.1.0.TemplateModel',
            $identifier: 'test-id',
            clauseId: 'test-id',
            buyer: 'Alice',
            seller: 'Bob',
            forceMajeure: true,
            penaltyDuration: { $class: 'org.accordproject.time@0.3.0.Duration', amount: 7, unit: 'days' },
            penaltyPercentage: 10.5,
            capPercentage: 55,
            termination: { $class: 'org.accordproject.time@0.3.0.Duration', amount: 60, unit: 'days' },
            fractionalPart: 'days',
        };
    });

    describe('trigger', () => {
        it('should return penalty=0 and buyerMayTerminate=true when force majeure applies to both', async () => {
            const request: ILateDeliveryAndPenaltyRequest = {
                $class: 'org.accordproject.latedeliveryandpenalty@0.1.0.LateDeliveryAndPenaltyRequest',
                $timestamp: new Date(),
                forceMajeure: true,
                agreedDelivery: pastDate,
                goodsValue: 1000,
            };
            const result = await logic.trigger(model, request);
            expect(result.result.penalty).toBe(0);
            expect(result.result.buyerMayTerminate).toBe(true);
        });

        it('should calculate penalty when no force majeure', async () => {
            const request: ILateDeliveryAndPenaltyRequest = {
                $class: 'org.accordproject.latedeliveryandpenalty@0.1.0.LateDeliveryAndPenaltyRequest',
                $timestamp: new Date(),
                forceMajeure: false,
                agreedDelivery: pastDate,
                goodsValue: 1000,
            };
            const result = await logic.trigger(model, request);
            expect(result.result.penalty).toBeGreaterThan(0);
            expect(result.events).toHaveLength(1);
        });

        it('should throw if agreed delivery is in the future', async () => {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);
            const request: ILateDeliveryAndPenaltyRequest = {
                $class: 'org.accordproject.latedeliveryandpenalty@0.1.0.LateDeliveryAndPenaltyRequest',
                $timestamp: new Date(),
                forceMajeure: false,
                agreedDelivery: futureDate,
                goodsValue: 1000,
            };
            await expect(logic.trigger(model, request)).rejects.toThrow();
        });
    });
});
