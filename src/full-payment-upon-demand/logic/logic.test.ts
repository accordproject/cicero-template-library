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

import FullPaymentUponDemandLogic from './logic';
import {
    ITemplateModel,
    IFullPaymentUponDemandState,
} from './generated/io.clause.fullpaymentupondemand@0.1.0';

describe('FullPaymentUponDemandLogic', () => {
    let logic: FullPaymentUponDemandLogic;
    let model: ITemplateModel;
    let initializedState: IFullPaymentUponDemandState;

    beforeEach(() => {
        logic = new FullPaymentUponDemandLogic();
        model = {
            $class: 'io.clause.fullpaymentupondemand@0.1.0.TemplateModel',
            $identifier: 'test-id',
            clauseId: 'test-id',
            buyer: 'Alice',
            seller: 'Bob',
            amount: 1000,
            currencyCode: 'USD',
        };
        initializedState = {
            $class: 'io.clause.fullpaymentupondemand@0.1.0.FullPaymentUponDemandState',
            $identifier: 'test-id',
            status: 'INITIALIZED',
        };
    });

    describe('init', () => {
        it('should initialize with INITIALIZED status', async () => {
            const result = await logic.init(model);
            expect((result.state as any).status).toBe('INITIALIZED');
            expect((result.state as any).$class).toBe('io.clause.fullpaymentupondemand@0.1.0.FullPaymentUponDemandState');
        });
    });

    describe('trigger - PaymentDemand', () => {
        it('should emit a payment obligation event and move to OBLIGATION_EMITTED', async () => {
            const request = {
                $class: 'io.clause.fullpaymentupondemand@0.1.0.PaymentDemand',
                $timestamp: new Date(),
            };
            const result = await logic.trigger(model, request, initializedState);
            expect((result.state as any).status).toBe('OBLIGATION_EMITTED');
            expect(result.events).toHaveLength(1);
            const event = result.events[0] as any;
            expect(event.$class).toBe('io.clause.fullpaymentupondemand@0.1.0.PaymentObligationEvent');
            expect(event.amount).toBe(1000);
            expect(event.currencyCode).toBe('USD');
        });

        it('should throw if payment already demanded', async () => {
            const request = {
                $class: 'io.clause.fullpaymentupondemand@0.1.0.PaymentDemand',
                $timestamp: new Date(),
            };
            const state = { ...initializedState, status: 'OBLIGATION_EMITTED' };
            await expect(logic.trigger(model, request, state)).rejects.toThrow();
        });
    });

    describe('trigger - PaymentReceived', () => {
        it('should complete the contract when payment is received', async () => {
            const request = {
                $class: 'io.clause.fullpaymentupondemand@0.1.0.PaymentReceived',
                $timestamp: new Date(),
            };
            const state = { ...initializedState, status: 'OBLIGATION_EMITTED' };
            const result = await logic.trigger(model, request, state);
            expect((result.state as any).status).toBe('COMPLETED');
            expect(result.events).toHaveLength(0);
        });

        it('should throw if no obligation has been emitted', async () => {
            const request = {
                $class: 'io.clause.fullpaymentupondemand@0.1.0.PaymentReceived',
                $timestamp: new Date(),
            };
            await expect(logic.trigger(model, request, initializedState)).rejects.toThrow();
        });
    });
});
