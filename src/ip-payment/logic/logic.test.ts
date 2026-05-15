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

import IPPaymentLogic from './logic';
import { ITemplateModel, IPaymentRequest } from './generated/org.accordproject.ippayment@0.1.0';

describe('IPPaymentLogic', () => {
    let logic: IPPaymentLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new IPPaymentLogic();
        model = {
            $class: 'org.accordproject.ippayment@0.1.0.TemplateModel',
            $identifier: 'test-id',
            clauseId: 'test-id',
            royaltyText: 'ten percent',
            royaltyRate: 10,
            sublicensingRoyaltyText: 'five percent',
            sublicensingRoyaltyRate: 5,
            paymentPeriod: {
                $class: 'org.accordproject.time@0.3.0.Duration',
                amount: 30,
                unit: 'days',
            },
            paymentPeriodWithPermission: {
                $class: 'org.accordproject.time@0.3.0.Duration',
                amount: 14,
                unit: 'days',
            },
        };
    });

    describe('trigger', () => {
        it('should calculate total royalties correctly', async () => {
            const request: IPaymentRequest = {
                $class: 'org.accordproject.ippayment@0.1.0.PaymentRequest',
                $timestamp: new Date(),
                netSaleRevenue: 1000,
                sublicensingRevenue: 200,
            };
            const result = await logic.trigger(model, request);
            // 10% of 1000 + 5% of 200 = 100 + 10 = 110
            expect(result.result.totalAmount).toBe(110);
        });

        it('should use paymentPeriod when no permission date', async () => {
            const request: IPaymentRequest = {
                $class: 'org.accordproject.ippayment@0.1.0.PaymentRequest',
                $timestamp: new Date(),
                netSaleRevenue: 1000,
                sublicensingRevenue: 0,
            };
            const result = await logic.trigger(model, request);
            expect(result.result.dueBy).toBeInstanceOf(Date);
            expect(result.result.$class).toBe('org.accordproject.ippayment@0.1.0.PayOut');
        });

        it('should use paymentPeriodWithPermission when permission date is given', async () => {
            const permissionDate = new Date('2025-01-01T00:00:00Z');
            const request: IPaymentRequest = {
                $class: 'org.accordproject.ippayment@0.1.0.PaymentRequest',
                $timestamp: new Date(),
                netSaleRevenue: 500,
                sublicensingRevenue: 100,
                permissionGrantedBy: permissionDate,
            };
            const result = await logic.trigger(model, request);
            const expectedDue = new Date(permissionDate);
            expectedDue.setDate(expectedDue.getDate() + 14);
            expect(result.result.dueBy.toISOString()).toBe(expectedDue.toISOString());
        });
    });
});
