// @ts-nocheck - Suppress type checking for runtime mocks
declare global {
    var TemplateLogic: any;
    var EngineResponse: any;
    var InitResponse: any;
}

// Mock runtime globals BEFORE importing logic
(global as any).TemplateLogic = class TemplateLogic<T, S = undefined> {
    async init(data: T): Promise<any> { return { state: {} }; }
    async trigger(data: T, request: any, state: S): Promise<any> { return {}; }
};
(global as any).EngineResponse = class EngineResponse<S> {};
(global as any).InitResponse = class InitResponse<S> {};

import DocuSignConnectLogic from './logic';
import { ITemplateModel, IDocuSignEnvelopeCounterState } from './generated/io.clause.docusignconnect@0.1.0';

const makeEnvelopeRequest = (status: string) => ({
    $class: 'com.docusign.connect.DocuSignEnvelopeInformation',
    envelopeStatus: {
        $class: 'com.docusign.connect.EnvelopeStatus',
        status
    }
});

describe('DocuSignConnectLogic', () => {
    let logic: DocuSignConnectLogic;
    let model: ITemplateModel;
    let initialState: IDocuSignEnvelopeCounterState;

    beforeEach(() => {
        logic = new DocuSignConnectLogic();

        model = {
            $class: 'io.clause.docusignconnect@0.1.0.TemplateModel',
            $identifier: 'test-clause-id',
            clauseId: 'test-clause-id',
            status: 'Completed' as any
        };

        initialState = {
            $class: 'io.clause.docusignconnect@0.1.0.DocuSignEnvelopeCounterState',
            $identifier: 'test-clause-id',
            counter: 0
        };
    });

    describe('init', () => {
        it('should initialize state with counter = 0', async () => {
            const result = await logic.init(model);
            expect(result.state).toMatchObject({
                $class: 'io.clause.docusignconnect@0.1.0.DocuSignEnvelopeCounterState',
                $identifier: 'test-clause-id',
                counter: 0
            });
        });
    });

    describe('trigger', () => {
        it('should not count an envelope with non-matching status', async () => {
            const request = makeEnvelopeRequest('Voided');
            const result = await logic.trigger(model, request, initialState);

            expect(result.result.counter).toBe(0);
            expect(result.result.output).toBe('Have received 0 contracts with status Completed');
            expect(result.events).toHaveLength(0);
            expect((result.state as any).counter).toBe(0);
        });

        it('should count an envelope with matching status', async () => {
            const request = makeEnvelopeRequest('Completed');
            const result = await logic.trigger(model, request, initialState);

            expect(result.result.counter).toBe(1);
            expect(result.result.output).toBe('Have received 1 contracts with status Completed');
            expect(result.events).toHaveLength(1);
            expect((result.state as any).counter).toBe(1);
        });

        it('should emit a notification event on matching status', async () => {
            const request = makeEnvelopeRequest('Completed');
            const result = await logic.trigger(model, request, initialState);

            const event = result.events[0] as any;
            expect(event.$class).toBe('io.clause.docusignconnect@0.1.0.DocuSignNotificationEvent');
            expect(event.title).toBe('Contracts with status Completed');
            expect(event.message).toBe('Have received 1 contracts with status Completed');
        });

        it('should accumulate count across multiple matching triggers', async () => {
            const request = makeEnvelopeRequest('Completed');

            const result1 = await logic.trigger(model, request, initialState);
            expect(result1.result.counter).toBe(1);

            const result2 = await logic.trigger(model, request, result1.state as IDocuSignEnvelopeCounterState);
            expect(result2.result.counter).toBe(2);
            expect(result2.result.output).toBe('Have received 2 contracts with status Completed');
        });

        it('should count multiple completed envelopes starting from non-zero state', async () => {
            const stateWithOne: IDocuSignEnvelopeCounterState = {
                ...initialState,
                counter: 1
            };
            const request = makeEnvelopeRequest('Completed');
            const result = await logic.trigger(model, request, stateWithOne);

            expect(result.result.counter).toBe(2);
            expect(result.result.output).toBe('Have received 2 contracts with status Completed');
        });
    });
});
