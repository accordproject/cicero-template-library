// @ts-nocheck
// Mock runtime globals BEFORE importing logic
(global as any).TemplateLogic = class TemplateLogic<T, S = undefined> {
    async trigger(data: T, request: any, state?: S): Promise<any> { return {}; }
};
(global as any).EngineResponse = class EngineResponse<S> {};
(global as any).InitResponse = class InitResponse<S> {};

import VolumeDiscountUListLogic from './logic';
import { ITemplateModel, IVolumeDiscountRequest } from './generated/org.accordproject.volumediscountulist@0.1.0';

describe('VolumeDiscountUListLogic', () => {
    let logic: VolumeDiscountUListLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new VolumeDiscountUListLogic();
        model = {
            $class: 'org.accordproject.volumediscountulist@0.1.0.TemplateModel',
            $identifier: 'test-id',
            clauseId: 'test-id',
            rates: [
                { $class: 'org.accordproject.volumediscountulist@0.1.0.RateRange', volumeAbove: 0, volumeUpTo: 1000000, rate: 3.0 },
                { $class: 'org.accordproject.volumediscountulist@0.1.0.RateRange', volumeAbove: 1000000, volumeUpTo: 10000000, rate: 2.9 },
                { $class: 'org.accordproject.volumediscountulist@0.1.0.RateRange', volumeAbove: 10000000, volumeUpTo: Infinity, rate: 2.8 },
            ],
        };
    });

    describe('trigger', () => {
        it('should return the correct rate for a given volume', async () => {
            const request: IVolumeDiscountRequest = {
                $class: 'org.accordproject.volumediscountulist@0.1.0.VolumeDiscountRequest',
                $timestamp: new Date(),
                netAnnualChargeVolume: 500000,
            };
            const result = await logic.trigger(model, request);
            expect(result.result.discountRate).toBe(3.0);
        });
    });
});
