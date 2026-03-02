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

import OneTimePaymentLogic from './logic';
import {
    ITemplateModel,
    IOneTimePaymentState,
} from './generated/org.accordproject.onetimepaymenttr@0.1.0';

describe('OneTimePaymentLogic', () => {
    let logic: OneTimePaymentLogic;
    let model: ITemplateModel;
    let initializedState: IOneTimePaymentState;

    beforeEach(() => {
        logic = new OneTimePaymentLogic();
        model = {
            $class: 'org.accordproject.onetimepaymenttr@0.1.0.TemplateModel',
            $identifier: 'test-id',
            clauseId: 'test-id',
            buyer: 'Alice',
            seller: 'Bob',
            totalPurchasePrice: 3000,
            currencyCode: 'USD',
        };
        initializedState = {
            $class: 'org.accordproject.onetimepaymenttr@0.1.0.OneTimePaymentState',
            $identifier: 'test-id',
            status: 'INITIALIZED',
        };
    });

    describe('init', () => {
        it('should initialize with INITIALIZED status', async () => {
            const result = await logic.init(model);
            expect((result.state as any).status).toBe('INITIALIZED');
        });

        it('should emit a PaymentObligationEvent on init', async () => {
            const result = await logic.init(model);
            expect(result.events).toHaveLength(1);
            const event = result.events[0] as any;
            expect(event.$class).toBe('org.accordproject.onetimepaymenttr@0.1.0.PaymentObligationEvent');
            expect(event.amount).toBe(3000);
            expect(event.currencyCode).toBe('USD');
            expect(event.description).toContain('Alice');
            expect(event.description).toContain('Bob');
        });
    });

    describe('trigger - PaymentReceived', () => {
        it('should complete the contract when payment is received', async () => {
            const request = {
                $class: 'org.accordproject.onetimepaymenttr@0.1.0.PaymentReceived',
                $timestamp: new Date(),
            };
            const result = await logic.trigger(model, request, initializedState);
            expect((result.state as any).status).toBe('COMPLETED');
            expect(result.events).toHaveLength(0);
            expect(result.result.$class).toBe('org.accordproject.onetimepaymenttr@0.1.0.PaymentReceivedResponse');
        });

        it('should throw if payment already received', async () => {
            const request = {
                $class: 'org.accordproject.onetimepaymenttr@0.1.0.PaymentReceived',
                $timestamp: new Date(),
            };
            const state = { ...initializedState, status: 'COMPLETED' };
            await expect(logic.trigger(model, request, state)).rejects.toThrow();
        });
    });
});
