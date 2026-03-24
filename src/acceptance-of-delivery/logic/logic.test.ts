// @ts-nocheck - Suppress type checking for runtime mocks
declare global {
    var TemplateLogic: any;
    var EngineResponse: any;
    var InitResponse: any;
}

// Mock runtime globals BEFORE importing logic
(global as any).TemplateLogic = class TemplateLogic<T, S> {
    async init(data: T): Promise<any> { return { state: {} }; }
    async trigger(data: T, request: any, state: S): Promise<any> { return {}; }
};
(global as any).EngineResponse = class EngineResponse<S> {};
(global as any).InitResponse = class InitResponse<S> {};

import AcceptanceOfDeliveryLogic from './logic';
import { ITemplateModel, IInspectDeliverable } from './generated/io.clause.acceptanceofdelivery@0.1.0';

describe('AcceptanceOfDeliveryLogic', () => {
    let logic: AcceptanceOfDeliveryLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new AcceptanceOfDeliveryLogic();
        model = {
            $class: 'io.clause.acceptanceofdelivery@0.1.0.TemplateModel',
            $identifier: 'test-id',
            clauseId: 'test-id',
            shipper: 'Party A',
            receiver: 'Party B',
            deliverable: 'Widgets',
            businessDays: 10,
            attachment: 'Attachment X'
        };
    });

    describe('trigger', () => {
        it('should pass if inspection passed within time limit', async () => {
            const request: IInspectDeliverable = {
                $class: 'io.clause.acceptanceofdelivery@0.1.0.InspectDeliverable',
                deliverableReceivedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
                inspectionPassed: true
            };
            const result = await logic.trigger(model, request);

            expect(result.result).toHaveProperty('$class');
            expect(result.result.status).toBe('PASSED_TESTING');
        });

        it('should fail if inspection failed within time limit', async () => {
            const request: IInspectDeliverable = {
                $class: 'io.clause.acceptanceofdelivery@0.1.0.InspectDeliverable',
                deliverableReceivedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
                inspectionPassed: false
            };
            const result = await logic.trigger(model, request);

            expect(result.result.status).toBe('FAILED_TESTING');
        });

        it('should be outside inspection period if deadline missed', async () => {
            const request: IInspectDeliverable = {
                $class: 'io.clause.acceptanceofdelivery@0.1.0.InspectDeliverable',
                deliverableReceivedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
                inspectionPassed: true
            };
            const result = await logic.trigger(model, request);

            expect(result.result.status).toBe('OUTSIDE_INSPECTION_PERIOD');
        });

        it('should throw an error if received date is in the future', async () => {
            const request: IInspectDeliverable = {
                $class: 'io.clause.acceptanceofdelivery@0.1.0.InspectDeliverable',
                deliverableReceivedAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days in future
                inspectionPassed: true
            };
            await expect(logic.trigger(model, request)).rejects.toThrow('Transaction time is before the deliverable date.');
        });
    });
});
