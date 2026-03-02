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

import LateDeliveryAndPenaltyOptionalThisLogic from './logic';
import { ITemplateModel, ILateDeliveryAndPenaltyRequest } from './generated/io.clause.latedeliveryandpenaltyoptionalthis@0.1.0';

describe('LateDeliveryAndPenaltyOptionalThisLogic', () => {
    let logic: LateDeliveryAndPenaltyOptionalThisLogic;
    let model: ITemplateModel;
    let pastDate: Date;

    beforeEach(() => {
        logic = new LateDeliveryAndPenaltyOptionalThisLogic();
        pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 14);
        model = {
            $class: 'io.clause.latedeliveryandpenaltyoptionalthis@0.1.0.TemplateModel',
            $identifier: 'test-id',
            clauseId: 'test-id',
            buyer: 'Alice',
            seller: 'Bob',
            forceMajeure: 42.0,
            penaltyDuration: { $class: 'org.accordproject.time@0.3.0.Duration', amount: 7, unit: 'days' },
            penaltyPercentage: 10.5,
            capPercentage: 55,
            termination: { $class: 'org.accordproject.time@0.3.0.Duration', amount: 60, unit: 'days' },
            fractionalPart: 'days',
        };
    });

    describe('trigger', () => {
        it('should return penalty=0 and buyerMayTerminate=true when both contract and request have force majeure set', async () => {
            const request: ILateDeliveryAndPenaltyRequest = {
                $class: 'io.clause.latedeliveryandpenaltyoptionalthis@0.1.0.LateDeliveryAndPenaltyRequest',
                $timestamp: new Date(),
                forceMajeure: 99.0,
                agreedDelivery: pastDate,
                goodsValue: 1000,
            };
            const result = await logic.trigger(model, request);
            expect(result.result.penalty).toBe(0);
            expect(result.result.buyerMayTerminate).toBe(true);
            expect(result.events).toHaveLength(0);
        });

        it('should calculate penalty when contract has no force majeure', async () => {
            const modelNoFM = { ...model, forceMajeure: null };
            const request: ILateDeliveryAndPenaltyRequest = {
                $class: 'io.clause.latedeliveryandpenaltyoptionalthis@0.1.0.LateDeliveryAndPenaltyRequest',
                $timestamp: new Date(),
                forceMajeure: 99.0,
                agreedDelivery: pastDate,
                goodsValue: 1000,
            };
            const result = await logic.trigger(modelNoFM, request);
            expect(result.result.penalty).toBeGreaterThan(0);
            expect(result.events).toHaveLength(1);
        });

        it('should calculate penalty when request has no force majeure', async () => {
            const request: ILateDeliveryAndPenaltyRequest = {
                $class: 'io.clause.latedeliveryandpenaltyoptionalthis@0.1.0.LateDeliveryAndPenaltyRequest',
                $timestamp: new Date(),
                forceMajeure: null,
                agreedDelivery: pastDate,
                goodsValue: 1000,
            };
            const result = await logic.trigger(model, request);
            expect(result.result.penalty).toBeGreaterThan(0);
            expect(result.events).toHaveLength(1);
        });

        it('should calculate penalty when neither has force majeure', async () => {
            const modelNoFM = { ...model, forceMajeure: null };
            const request: ILateDeliveryAndPenaltyRequest = {
                $class: 'io.clause.latedeliveryandpenaltyoptionalthis@0.1.0.LateDeliveryAndPenaltyRequest',
                $timestamp: new Date(),
                forceMajeure: null,
                agreedDelivery: pastDate,
                goodsValue: 1000,
            };
            const result = await logic.trigger(modelNoFM, request);
            expect(result.result.penalty).toBeGreaterThan(0);
            expect(result.events).toHaveLength(1);
        });

        it('should cap penalty at capPercentage of goodsValue', async () => {
            const modelHighPenalty = {
                ...model,
                forceMajeure: null,
                penaltyPercentage: 999,
                capPercentage: 55,
            };
            const request: ILateDeliveryAndPenaltyRequest = {
                $class: 'io.clause.latedeliveryandpenaltyoptionalthis@0.1.0.LateDeliveryAndPenaltyRequest',
                $timestamp: new Date(),
                forceMajeure: null,
                agreedDelivery: pastDate,
                goodsValue: 1000,
            };
            const result = await logic.trigger(modelHighPenalty, request);
            expect(result.result.penalty).toBeLessThanOrEqual(1000 * 0.55);
        });

        it('should set buyerMayTerminate=true when delay exceeds termination threshold', async () => {
            const veryPastDate = new Date();
            veryPastDate.setDate(veryPastDate.getDate() - 100);
            const modelShortTermination = { ...model, forceMajeure: null, termination: { $class: 'org.accordproject.time@0.3.0.Duration', amount: 30, unit: 'days' } };
            const request: ILateDeliveryAndPenaltyRequest = {
                $class: 'io.clause.latedeliveryandpenaltyoptionalthis@0.1.0.LateDeliveryAndPenaltyRequest',
                $timestamp: new Date(),
                forceMajeure: null,
                agreedDelivery: veryPastDate,
                goodsValue: 1000,
            };
            const result = await logic.trigger(modelShortTermination, request);
            expect(result.result.buyerMayTerminate).toBe(true);
        });

        it('should throw if agreed delivery is in the future', async () => {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);
            const request: ILateDeliveryAndPenaltyRequest = {
                $class: 'io.clause.latedeliveryandpenaltyoptionalthis@0.1.0.LateDeliveryAndPenaltyRequest',
                $timestamp: new Date(),
                forceMajeure: null,
                agreedDelivery: futureDate,
                goodsValue: 1000,
            };
            await expect(logic.trigger(model, request)).rejects.toThrow('Cannot exercise late delivery before delivery date');
        });

        it('should emit a PaymentObligationEvent with correct fields', async () => {
            const modelNoFM = { ...model, forceMajeure: null };
            const request: ILateDeliveryAndPenaltyRequest = {
                $class: 'io.clause.latedeliveryandpenaltyoptionalthis@0.1.0.LateDeliveryAndPenaltyRequest',
                $timestamp: new Date(),
                forceMajeure: null,
                agreedDelivery: pastDate,
                goodsValue: 1000,
            };
            const result = await logic.trigger(modelNoFM, request);
            expect(result.events).toHaveLength(1);
            const event = result.events[0] as any;
            expect(event.$class).toBe('io.clause.latedeliveryandpenaltyoptionalthis@0.1.0.PaymentObligationEvent');
            expect(event.amount).toBe(result.result.penalty);
            expect(event.currencyCode).toBe('USD');
            expect(event.description).toContain('Bob');
            expect(event.description).toContain('Alice');
        });
    });
});
