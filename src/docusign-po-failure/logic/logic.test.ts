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

import PurchaseOrderFailureLogic from './logic';
import { ITemplateModel, IPurchaseOrderFailureState } from './generated/org.accordproject.docusignpofailure@0.1.0';

const makeDuration = (amount: number, unit: string) => ({
    $class: 'org.accordproject.time@0.3.0.Duration',
    amount,
    unit
});

const makeEnvelopeRequest = (deliveryDateISO: string, actualPrice: number, currencyCode: string) => ({
    $class: 'com.docusign.connect.DocuSignEnvelopeInformation',
    envelopeStatus: {
        $class: 'com.docusign.connect.EnvelopeStatus',
        status: 'Completed'
    },
    recipients: [
        {
            $class: 'com.docusign.connect.Recipient',
            status: 'Completed',
            email: 'test@example.com',
            userName: 'testUser',
            tabStatuses: [
                {
                    $class: 'com.docusign.connect.TextTabStatus',
                    tabType: 'Custom',
                    status: 'Signed',
                    tabLabel: 'currencyCode',
                    tabName: '',
                    customTabType: 'Text',
                    tabValue: currencyCode,
                    originalValue: ''
                },
                {
                    $class: 'com.docusign.connect.NumberTabStatus',
                    tabType: 'Custom',
                    status: 'Signed',
                    tabLabel: 'actualPrice',
                    tabName: '',
                    customTabType: 'Number',
                    tabValue: actualPrice,
                    originalValue: ''
                },
                {
                    $class: 'com.docusign.connect.DateTabStatus',
                    tabType: 'Custom',
                    status: 'Signed',
                    tabLabel: 'deliveryDate',
                    tabName: '',
                    customTabType: 'Date',
                    tabValue: deliveryDateISO,
                    originalValue: ''
                }
            ]
        }
    ]
});

describe('PurchaseOrderFailureLogic', () => {
    let logic: PurchaseOrderFailureLogic;
    let model: ITemplateModel;
    let initialState: IPurchaseOrderFailureState;

    beforeEach(() => {
        logic = new PurchaseOrderFailureLogic();

        model = {
            $class: 'org.accordproject.docusignpofailure@0.1.0.TemplateModel',
            $identifier: 'test-clause-id',
            clauseId: 'test-clause-id',
            buyerName: 'Buyer Corp',
            lateOne: makeDuration(2, 'days') as any,
            lateTwo: makeDuration(7, 'days') as any,
            lateThree: makeDuration(14, 'days') as any,
            lateOnePercent: 5.0,
            lateTwoPercent: 10.0,
            lateThreePercent: 50.0,
            article: 'Article 3',
            thisSection: 'Section 3.1',
            maxFailures: 3,
            failureRange: makeDuration(90, 'days') as any,
            repeatedFailureCompensationAmount: 99.99,
            repeatedFailureCompensationCurrency: 'USD'
        };

        initialState = {
            $class: 'org.accordproject.docusignpofailure@0.1.0.PurchaseOrderFailureState',
            $identifier: 'test-clause-id',
            pastFailures: [],
            nbPastFailures: 0
        };
    });

    describe('init', () => {
        it('should initialize state with empty pastFailures and zero count', async () => {
            const result = await logic.init(model);
            expect(result.state).toMatchObject({
                $class: 'org.accordproject.docusignpofailure@0.1.0.PurchaseOrderFailureState',
                $identifier: 'test-clause-id',
                pastFailures: [],
                nbPastFailures: 0
            });
        });
    });

    describe('trigger', () => {
        it('should return zero penalty when delivery is not late', async () => {
            // Use a delivery date far in the future
            const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            const request = makeEnvelopeRequest(futureDate, 2000, 'USD');

            const result = await logic.trigger(model, request, initialState);

            expect(result.result.penaltyAmount).toBe(0.0);
            expect(result.result.currencyCode).toBe('USD');
            expect(result.events).toHaveLength(0);
        });

        it('should throw if deliveryDate tab is missing', async () => {
            const request = {
                $class: 'com.docusign.connect.DocuSignEnvelopeInformation',
                envelopeStatus: { $class: 'com.docusign.connect.EnvelopeStatus', status: 'Completed' },
                recipients: [
                    {
                        $class: 'com.docusign.connect.Recipient',
                        status: 'Completed',
                        email: 'test@example.com',
                        userName: 'testUser',
                        tabStatuses: []
                    }
                ]
            };

            await expect(logic.trigger(model, request, initialState))
                .rejects.toThrow('Could not find a deliveryDate tab');
        });

        it('should throw if actualPrice tab is missing', async () => {
            const request = {
                $class: 'com.docusign.connect.DocuSignEnvelopeInformation',
                envelopeStatus: { $class: 'com.docusign.connect.EnvelopeStatus', status: 'Completed' },
                recipients: [
                    {
                        $class: 'com.docusign.connect.Recipient',
                        status: 'Completed',
                        email: 'test@example.com',
                        userName: 'testUser',
                        tabStatuses: [
                            {
                                $class: 'com.docusign.connect.DateTabStatus',
                                tabType: 'Custom',
                                status: 'Signed',
                                tabLabel: 'deliveryDate',
                                tabValue: '2019-01-01T00:00:00Z',
                                originalValue: ''
                            }
                        ]
                    }
                ]
            };

            await expect(logic.trigger(model, request, initialState))
                .rejects.toThrow('Could not find an actualPrice tab');
        });

        it('should calculate penalty at tier 1 (just past lateOne threshold)', async () => {
            // delivery was 3 days ago (past lateOne=2 days, before lateTwo=7 days)
            const deliveryDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
            const request = makeEnvelopeRequest(deliveryDate, 2000, 'USD');

            const result = await logic.trigger(model, request, initialState);

            // 5% of 2000 = 100
            expect(result.result.penaltyAmount).toBeCloseTo(100, 1);
            expect(result.result.currencyCode).toBe('USD');
            expect(result.events).toHaveLength(1);
            expect((result.events[0] as any).description).toBe('Buyer Corp should be paid a penalty');
        });

        it('should calculate penalty at tier 2 (past lateTwo threshold)', async () => {
            // delivery was 10 days ago (past lateTwo=7 days, before lateThree=14 days)
            const deliveryDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
            const request = makeEnvelopeRequest(deliveryDate, 2000, 'USD');

            const result = await logic.trigger(model, request, initialState);

            // 10% of 2000 = 200
            expect(result.result.penaltyAmount).toBeCloseTo(200, 1);
        });

        it('should calculate penalty at tier 3 (past lateThree threshold)', async () => {
            // delivery was 20 days ago (past lateThree=14 days)
            const deliveryDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
            const request = makeEnvelopeRequest(deliveryDate, 2000, 'USD');

            const result = await logic.trigger(model, request, initialState);

            // 50% of 2000 = 1000
            expect(result.result.penaltyAmount).toBeCloseTo(1000, 1);
        });

        it('should add repeated failure compensation when nbPastFailures >= maxFailures', async () => {
            const stateWithFailures: IPurchaseOrderFailureState = {
                ...initialState,
                nbPastFailures: 3,
                pastFailures: [] as any
            };

            // delivery was 20 days ago
            const deliveryDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
            const request = makeEnvelopeRequest(deliveryDate, 2000, 'USD');

            const result = await logic.trigger(model, request, stateWithFailures);

            // 50% of 2000 + 99.99 = 1099.99
            expect(result.result.penaltyAmount).toBeCloseTo(1099.99, 1);
        });

        it('should update state with new failure record', async () => {
            const deliveryDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
            const request = makeEnvelopeRequest(deliveryDate, 2000, 'USD');

            const result = await logic.trigger(model, request, initialState);
            const newState = result.state as IPurchaseOrderFailureState;

            expect(newState.nbPastFailures).toBe(1);
            expect((newState.pastFailures as any[]).length).toBe(1);
        });
    });
});
