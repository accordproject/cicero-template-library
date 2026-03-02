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

import PaymentUponSignatureLogic from './logic';
import {
    ITemplateModel,
    IPaymentUponSignatureState,
} from './generated/org.accordproject.paymentuponssignature@0.1.0';

describe('PaymentUponSignatureLogic', () => {
    let logic: PaymentUponSignatureLogic;
    let model: ITemplateModel;
    let initializedState: IPaymentUponSignatureState;

    beforeEach(() => {
        logic = new PaymentUponSignatureLogic();
        model = {
            $class: 'org.accordproject.paymentuponssignature@0.1.0.TemplateModel',
            $identifier: 'test-id',
            clauseId: 'test-id',
            buyer: 'Alice',
            seller: 'Bob',
            amount: 2500,
            currencyCode: 'GBP',
        };
        initializedState = {
            $class: 'org.accordproject.paymentuponssignature@0.1.0.PaymentUponSignatureState',
            $identifier: 'test-id',
            status: 'INITIALIZED',
        };
    });

    describe('init', () => {
        it('should initialize with INITIALIZED status', async () => {
            const result = await logic.init(model);
            expect((result.state as any).status).toBe('INITIALIZED');
            expect((result.state as any).$class).toBe('org.accordproject.paymentuponssignature@0.1.0.PaymentUponSignatureState');
        });
    });

    describe('trigger - ContractSigned', () => {
        it('should emit payment obligation and move to OBLIGATION_EMITTED', async () => {
            const request = {
                $class: 'org.accordproject.paymentuponssignature@0.1.0.ContractSigned',
                $timestamp: new Date(),
            };
            const result = await logic.trigger(model, request, initializedState);
            expect((result.state as any).status).toBe('OBLIGATION_EMITTED');
            expect(result.events).toHaveLength(1);
            const event = result.events[0] as any;
            expect(event.$class).toBe('org.accordproject.paymentuponssignature@0.1.0.PaymentObligationEvent');
            expect(event.amount).toBe(2500);
            expect(event.currencyCode).toBe('GBP');
        });

        it('should throw if contract already signed', async () => {
            const request = {
                $class: 'org.accordproject.paymentuponssignature@0.1.0.ContractSigned',
                $timestamp: new Date(),
            };
            const state = { ...initializedState, status: 'OBLIGATION_EMITTED' };
            await expect(logic.trigger(model, request, state)).rejects.toThrow();
        });
    });

    describe('trigger - PaymentReceived', () => {
        it('should complete the contract when payment is received', async () => {
            const request = {
                $class: 'org.accordproject.paymentuponssignature@0.1.0.PaymentReceived',
                $timestamp: new Date(),
            };
            const state = { ...initializedState, status: 'OBLIGATION_EMITTED' };
            const result = await logic.trigger(model, request, state);
            expect((result.state as any).status).toBe('COMPLETED');
            expect(result.events).toHaveLength(0);
        });

        it('should throw if payment received before signing', async () => {
            const request = {
                $class: 'org.accordproject.paymentuponssignature@0.1.0.PaymentReceived',
                $timestamp: new Date(),
            };
            await expect(logic.trigger(model, request, initializedState)).rejects.toThrow();
        });
    });
});
