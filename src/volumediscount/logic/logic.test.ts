// @ts-nocheck
// Mock runtime globals BEFORE importing logic
(global as any).TemplateLogic = class TemplateLogic<T, S = undefined> {
    async trigger(data: T, request: any, state?: S): Promise<any> { return {}; }
};
(global as any).EngineResponse = class EngineResponse<S> {};
(global as any).InitResponse = class InitResponse<S> {};

import VolumeDiscountLogic from './logic';
import { ITemplateModel, IVolumeDiscountRequest } from './generated/org.accordproject.volumediscount@0.1.0';

describe('VolumeDiscountLogic', () => {
    let logic: VolumeDiscountLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new VolumeDiscountLogic();
        model = {
            $class: 'org.accordproject.volumediscount@0.1.0.TemplateModel',
            $identifier: 'test-id',
            clauseId: 'test-id',
            firstVolume: 1000000,
            secondVolume: 10000000,
            firstRate: 3.0,
            secondRate: 2.9,
            thirdRate: 2.8,
        };
    });

    describe('trigger', () => {
        it('should return firstRate for volume below firstVolume', async () => {
            const request: IVolumeDiscountRequest = {
                $class: 'org.accordproject.volumediscount@0.1.0.VolumeDiscountRequest',
                $timestamp: new Date(),
                netAnnualChargeVolume: 100000,
            };
            const result = await logic.trigger(model, request);
            expect(result.result.discountRate).toBe(3.0);
        });

        it('should return secondRate for volume in middle tier', async () => {
            const request: IVolumeDiscountRequest = {
                $class: 'org.accordproject.volumediscount@0.1.0.VolumeDiscountRequest',
                $timestamp: new Date(),
                netAnnualChargeVolume: 5000000,
            };
            const result = await logic.trigger(model, request);
            expect(result.result.discountRate).toBe(2.9);
        });

        it('should return thirdRate for volume above secondVolume', async () => {
            const request: IVolumeDiscountRequest = {
                $class: 'org.accordproject.volumediscount@0.1.0.VolumeDiscountRequest',
                $timestamp: new Date(),
                netAnnualChargeVolume: 50000000,
            };
            const result = await logic.trigger(model, request);
            expect(result.result.discountRate).toBe(2.8);
        });
    });
});
