// @ts-nocheck
// Mock runtime globals BEFORE importing logic
(global as any).TemplateLogic = class TemplateLogic<T, S = undefined> {
    async trigger(data: T, request: any, state?: S): Promise<any> { return {}; }
};
(global as any).EngineResponse = class EngineResponse<S> {};
(global as any).InitResponse = class InitResponse<S> {};

import SimpleLateDeliveryAndPenaltyLogic from './logic';
import { ITemplateModel, ISimpleLateDeliveryAndPenaltyRequest } from './generated/io.clause.simplelatedeliveryandpenalty@0.1.0';

describe('SimpleLateDeliveryAndPenaltyLogic', () => {
    let logic: SimpleLateDeliveryAndPenaltyLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new SimpleLateDeliveryAndPenaltyLogic();
        model = {
            $class: 'io.clause.simplelatedeliveryandpenalty@0.1.0.TemplateModel',
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
        it('should calculate penalty based on current time', async () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 14); // 14 days ago
            const request: ISimpleLateDeliveryAndPenaltyRequest = {
                $class: 'io.clause.simplelatedeliveryandpenalty@0.1.0.SimpleLateDeliveryAndPenaltyRequest',
                $timestamp: new Date(),
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
            const request: ISimpleLateDeliveryAndPenaltyRequest = {
                $class: 'io.clause.simplelatedeliveryandpenalty@0.1.0.SimpleLateDeliveryAndPenaltyRequest',
                $timestamp: new Date(),
                agreedDelivery: futureDate,
                goodsValue: 1000,
            };
            await expect(logic.trigger(model, request)).rejects.toThrow();
        });
    });
});
