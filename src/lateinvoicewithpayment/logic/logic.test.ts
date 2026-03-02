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

import LateInvoiceWithPaymentLogic from './logic';
import { ITemplateModel, ILateInvoiceRequest } from './generated/io.clause.lateinvoicewithpayment@0.1.0';

describe('LateInvoiceWithPaymentLogic', () => {
    let logic: LateInvoiceWithPaymentLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new LateInvoiceWithPaymentLogic();
        model = {
            $class: 'io.clause.lateinvoicewithpayment@0.1.0.TemplateModel',
            $identifier: 'test-id',
            clauseId: 'test-id',
            purchaser: 'Alice',
            supplier: 'Bob',
            maximumDelay: {
                $class: 'org.accordproject.time@0.3.0.Duration',
                amount: 30,
                unit: 'days',
            },
        };
    });

    describe('trigger', () => {
        it('should require payment when invoice is not late', async () => {
            // Invoice due far in the future (not late)
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);
            const request: ILateInvoiceRequest = {
                $class: 'io.clause.lateinvoicewithpayment@0.1.0.LateInvoiceRequest',
                $timestamp: new Date(),
                invoiceDue: futureDate,
                amountDue: 1000,
                currencyCode: 'USD',
            };
            const result = await logic.trigger(model, request);
            expect(result.result.paymentRequired).toBe(true);
            expect(result.events).toHaveLength(1);
            const event = result.events[0] as any;
            expect(event.$class).toBe('io.clause.lateinvoicewithpayment@0.1.0.PaymentObligationEvent');
            expect(event.amount).toBe(1000);
            expect(event.currencyCode).toBe('USD');
        });

        it('should not require payment when invoice is past the maximum delay', async () => {
            // Invoice was due 60 days ago (past the 30-day maximum delay)
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 60);
            const request: ILateInvoiceRequest = {
                $class: 'io.clause.lateinvoicewithpayment@0.1.0.LateInvoiceRequest',
                $timestamp: new Date(),
                invoiceDue: pastDate,
                amountDue: 1000,
                currencyCode: 'USD',
            };
            const result = await logic.trigger(model, request);
            expect(result.result.paymentRequired).toBe(false);
            expect(result.events).toHaveLength(0);
        });

        it('should include purchaser and supplier in event description', async () => {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);
            const request: ILateInvoiceRequest = {
                $class: 'io.clause.lateinvoicewithpayment@0.1.0.LateInvoiceRequest',
                $timestamp: new Date(),
                invoiceDue: futureDate,
                amountDue: 500,
                currencyCode: 'EUR',
            };
            const result = await logic.trigger(model, request);
            const event = result.events[0] as any;
            expect(event.description).toContain('Alice');
            expect(event.description).toContain('Bob');
        });
    });
});
