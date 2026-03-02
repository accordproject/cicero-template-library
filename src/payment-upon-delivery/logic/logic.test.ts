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

import PaymentUponDeliveryLogic from './logic';
import { ITemplateModel, IDeliveryAcceptedRequest } from './generated/org.accordproject.paymentupondelivery@0.1.0';

describe('PaymentUponDeliveryLogic', () => {
    let logic: PaymentUponDeliveryLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new PaymentUponDeliveryLogic();
        model = {
            $class: 'org.accordproject.paymentupondelivery@0.1.0.TemplateModel',
            $identifier: 'test-id',
            clauseId: 'test-id',
            buyer: 'Alice',
            seller: 'Bob',
            costOfGoods: 500,
            deliveryFee: 50,
            currencyCode: 'USD',
        };
    });

    describe('trigger', () => {
        it('should return total amount as sum of costOfGoods and deliveryFee', async () => {
            const request: IDeliveryAcceptedRequest = {
                $class: 'org.accordproject.paymentupondelivery@0.1.0.DeliveryAcceptedRequest',
                $timestamp: new Date(),
            };
            const result = await logic.trigger(model, request);
            expect(result.result.totalAmount).toBe(550);
            expect(result.result.currencyCode).toBe('USD');
            expect(result.result.$class).toBe('org.accordproject.paymentupondelivery@0.1.0.DeliveryAcceptedResponse');
        });

        it('should emit a PaymentObligationEvent', async () => {
            const request: IDeliveryAcceptedRequest = {
                $class: 'org.accordproject.paymentupondelivery@0.1.0.DeliveryAcceptedRequest',
                $timestamp: new Date(),
            };
            const result = await logic.trigger(model, request);
            expect(result.events).toHaveLength(1);
            const event = result.events[0] as any;
            expect(event.$class).toBe('org.accordproject.paymentupondelivery@0.1.0.PaymentObligationEvent');
            expect(event.amount).toBe(550);
            expect(event.currencyCode).toBe('USD');
        });

        it('should include buyer and seller names in the event description', async () => {
            const request: IDeliveryAcceptedRequest = {
                $class: 'org.accordproject.paymentupondelivery@0.1.0.DeliveryAcceptedRequest',
                $timestamp: new Date(),
            };
            const result = await logic.trigger(model, request);
            const event = result.events[0] as any;
            expect(event.description).toContain('Alice');
            expect(event.description).toContain('Bob');
        });
    });
});
