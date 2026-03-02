// @ts-nocheck - Suppress type checking for runtime mocks
declare global {
    var TemplateLogic: any;
    var EngineResponse: any;
    var InitResponse: any;
}

// Mock runtime globals BEFORE importing logic
(global as any).TemplateLogic = class TemplateLogic<T, S> {
    async init(data: T): Promise<any> { return { state: {} }; }
    async trigger(data: T, request: any, state?: S): Promise<any> { return {}; }
};
(global as any).EngineResponse = class EngineResponse<S> {};
(global as any).InitResponse = class InitResponse<S> {};

import AcceptanceOfDeliveryLogic from './logic';
import {
    ITemplateModel,
    IInspectDeliverable,
} from './generated/org.accordproject.acceptanceofdelivery@0.1.0';

describe('AcceptanceOfDeliveryLogic', () => {
    let logic: AcceptanceOfDeliveryLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new AcceptanceOfDeliveryLogic();
        model = {
            $class: 'org.accordproject.acceptanceofdelivery@0.1.0.TemplateModel',
            $identifier: 'test-clause-id',
            clauseId: 'test-clause-id',
            shipper: 'Fast Freight Co',
            receiver: 'Goods Recipient Inc',
            deliverable: 'Computer Equipment',
            businessDays: 10,
            attachment: 'Annex A',
        };
    });

    const makeRequest = (receivedAt: Date, passed: boolean): IInspectDeliverable => ({
        $class: 'org.accordproject.acceptanceofdelivery@0.1.0.InspectDeliverable',
        $identifier: 'req-1',
        $timestamp: new Date(),
        deliverableReceivedAt: receivedAt,
        inspectionPassed: passed,
    });

    describe('trigger - inspection passed', () => {
        it('should return PASSED_TESTING within inspection window', async () => {
            // Received 2 days ago, businessDays=10 → still within inspection window
            const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
            const request = makeRequest(twoDaysAgo, true);
            const result = await logic.trigger(model, request);

            expect(result.result.$class).toBe('org.accordproject.acceptanceofdelivery@0.1.0.InspectionResponse');
            expect(result.result.status).toBe('PASSED_TESTING');
            expect(result.result.shipper).toBe('Fast Freight Co');
            expect(result.result.receiver).toBe('Goods Recipient Inc');
        });
    });

    describe('trigger - inspection failed', () => {
        it('should return FAILED_TESTING when inspection does not pass', async () => {
            const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
            const request = makeRequest(twoDaysAgo, false);
            const result = await logic.trigger(model, request);

            expect(result.result.status).toBe('FAILED_TESTING');
        });
    });

    describe('trigger - outside inspection period', () => {
        it('should return OUTSIDE_INSPECTION_PERIOD when beyond businessDays', async () => {
            // Received 15 days ago, businessDays=10 → outside inspection window
            const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
            const request = makeRequest(fifteenDaysAgo, true);
            const result = await logic.trigger(model, request);

            expect(result.result.status).toBe('OUTSIDE_INSPECTION_PERIOD');
        });
    });

    describe('trigger - future delivery date', () => {
        it('should throw when deliverableReceivedAt is in the future', async () => {
            const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const request = makeRequest(tomorrow, true);
            await expect(logic.trigger(model, request))
                .rejects.toThrow('Transaction time is before the deliverable date.');
        });
    });

    describe('trigger - response structure', () => {
        it('should include $timestamp in result', async () => {
            const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
            const request = makeRequest(oneDayAgo, true);
            const result = await logic.trigger(model, request);

            expect(result.result).toHaveProperty('$timestamp');
            expect(result.result.$timestamp).toBeInstanceOf(Date);
        });
    });
});
