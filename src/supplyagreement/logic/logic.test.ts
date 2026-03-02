// @ts-nocheck - Suppress type checking for runtime mocks
// Mock runtime globals BEFORE importing logic
(global as any).TemplateLogic = class TemplateLogic<T, S> {
    async init(data: T): Promise<any> { return { state: {} }; }
    async trigger(data: T, request: any, state: S): Promise<any> { return {}; }
};
(global as any).EngineResponse = class EngineResponse<S> {};
(global as any).InitResponse = class InitResponse<S> {};

import SupplyAgreementLogic from './logic';
import {
    ITemplateModel,
    IAgreementState,
    IForecastRequest,
    IPurchaseRequest,
    IDeliveryRequest,
} from './generated/io.clause.supplyagreement@0.1.0';

describe('SupplyAgreementLogic', () => {
    let logic: SupplyAgreementLogic;
    let model: ITemplateModel;
    let initialState: IAgreementState;

    beforeEach(() => {
        logic = new SupplyAgreementLogic();
        model = {
            $class: 'io.clause.supplyagreement@0.1.0.TemplateModel',
            $identifier: 'test-clause-id',
            clauseId: 'test-clause-id',
            effectiveDate: new Date('2010-01-01T00:00:00Z'),
            supplier: 'Acme Corp',
            buyer: 'Buyer Inc',
            shortDescriptionOfTheProducts: 'Widgets',
            noticeWindow: 2,
            cancellationWindow: 10,
            minimumPercentage: 80.0,
            deliverables: 'Widgets',
            deliveryWindow: 14,
            deliveryAttachment: 'Annex A',
            inspectionWindow: 5,
            acceptanceAttachment: 'Annex B',
            priceUpdateWindow: 15,
            accountNumber: '123456789',
            routingNumnber: '987654321',
            termYears: 2,
            renewalYears: 1,
            renewalWindow: 30,
            governingState: 'California',
            venueState: 'California',
        };
        initialState = {
            $class: 'io.clause.supplyagreement@0.1.0.AgreementState',
            $identifier: 'test-clause-id',
            purchaseObligation: undefined,
            deliveryObligation: undefined,
            paymentObligation: undefined,
        };
    });

    describe('init', () => {
        it('should initialise state with no obligations', async () => {
            const result = await logic.init(model);
            expect(result.state).toMatchObject({
                $class: 'io.clause.supplyagreement@0.1.0.AgreementState',
                $identifier: 'test-clause-id',
            });
            expect(result.state.purchaseObligation).toBeUndefined();
            expect(result.state.deliveryObligation).toBeUndefined();
            expect(result.state.paymentObligation).toBeUndefined();
        });
    });

    describe('trigger - demandForecast', () => {
        it('should set a purchase obligation based on forecast', async () => {
            const request: IForecastRequest = {
                $class: 'io.clause.supplyagreement@0.1.0.ForecastRequest',
                $identifier: 'req-1',
                $timestamp: new Date(),
                supplyForecast: 1000,
            };
            const result = await logic.trigger(model, request, initialState);

            expect(result.result.$class).toBe('io.clause.supplyagreement@0.1.0.ForecastResponse');
            expect(result.state.purchaseObligation).toBeDefined();
            expect(result.state.purchaseObligation.requiredPurchase).toBe(800);
            expect(result.state.purchaseObligation.party).toBe('Buyer Inc');
            expect(result.state.deliveryObligation).toBeUndefined();
            expect(result.events).toHaveLength(1);
            expect(result.events[0].$class).toBe('io.clause.supplyagreement@0.1.0.PurchaseObligationEvent');
        });

        it('should throw if effectiveDate is in the future', async () => {
            const futureModel = { ...model, effectiveDate: new Date('2099-01-01T00:00:00Z') };
            const request: IForecastRequest = {
                $class: 'io.clause.supplyagreement@0.1.0.ForecastRequest',
                $identifier: 'req-1',
                $timestamp: new Date(),
                supplyForecast: 1000,
            };
            await expect(logic.trigger(futureModel, request, initialState))
                .rejects.toThrow('Forecast was received before the effective date');
        });
    });

    describe('trigger - purchase', () => {
        it('should set a delivery obligation from purchase order', async () => {
            const stateWithPurchase: IAgreementState = {
                ...initialState,
                purchaseObligation: {
                    $class: 'io.clause.supplyagreement@0.1.0.PurchaseObligationData',
                    party: 'Buyer Inc',
                    requiredPurchase: 800,
                    year: 2024,
                    quarter: 1,
                },
            };

            const request: IPurchaseRequest = {
                $class: 'io.clause.supplyagreement@0.1.0.PurchaseRequest',
                $identifier: 'req-2',
                $timestamp: new Date(),
                purchaseOrder: {
                    $class: 'io.clause.supplyagreement@0.1.0.PurchaseOrder',
                    products: [
                        {
                            $class: 'io.clause.supplyagreement@0.1.0.Product',
                            partNumber: 'P001',
                            name: 'Widget A',
                            quantity: 100,
                            unitPrice: 10.0,
                        }
                    ],
                    deliveryLocation: 'Warehouse 1',
                    deliveryDate: new Date('2024-06-01T00:00:00Z'),
                },
            };

            const result = await logic.trigger(model, request, stateWithPurchase);
            expect(result.result.$class).toBe('io.clause.supplyagreement@0.1.0.PurchaseResponse');
            expect(result.state.deliveryObligation).toBeDefined();
            expect(result.state.purchaseObligation).toBeUndefined();
            expect(result.events).toHaveLength(1);
            expect(result.events[0].$class).toBe('io.clause.supplyagreement@0.1.0.DeliveryObligationEvent');
        });

        it('should throw if no purchase obligation exists', async () => {
            const request: IPurchaseRequest = {
                $class: 'io.clause.supplyagreement@0.1.0.PurchaseRequest',
                $identifier: 'req-2',
                $timestamp: new Date(),
                purchaseOrder: {
                    $class: 'io.clause.supplyagreement@0.1.0.PurchaseOrder',
                    products: [],
                    deliveryLocation: 'Warehouse 1',
                    deliveryDate: new Date('2024-06-01T00:00:00Z'),
                },
            };
            await expect(logic.trigger(model, request, initialState))
                .rejects.toThrow('Cannot purchase without having submitted a demand forecast');
        });
    });

    describe('trigger - delivery', () => {
        it('should set a payment obligation from delivery', async () => {
            const stateWithDelivery: IAgreementState = {
                ...initialState,
                deliveryObligation: {
                    $class: 'io.clause.supplyagreement@0.1.0.DeliveryObligationData',
                    party: 'Acme Corp',
                    expectedDelivery: new Date('2024-06-01T00:00:00Z'),
                    deliverables: [
                        { $class: 'io.clause.supplyagreement@0.1.0.OrderItem', partNumber: 'Widget A', quantity: 100 }
                    ],
                },
            };

            const request: IDeliveryRequest = {
                $class: 'io.clause.supplyagreement@0.1.0.DeliveryRequest',
                $identifier: 'req-3',
                $timestamp: new Date(),
                products: [
                    {
                        $class: 'io.clause.supplyagreement@0.1.0.Product',
                        partNumber: 'P001',
                        name: 'Widget A',
                        quantity: 100,
                        unitPrice: 10.0,
                    }
                ],
            };

            const result = await logic.trigger(model, request, stateWithDelivery);
            expect(result.result.$class).toBe('io.clause.supplyagreement@0.1.0.DeliveryResponse');
            expect(result.state.paymentObligation).toBeDefined();
            expect(result.state.paymentObligation.amount).toBe(1000);
            expect(result.state.deliveryObligation).toBeUndefined();
            expect(result.events).toHaveLength(1);
            expect(result.events[0].$class).toBe('io.clause.supplyagreement@0.1.0.PaymentObligationEvent');
        });

        it('should throw if no delivery obligation exists', async () => {
            const request: IDeliveryRequest = {
                $class: 'io.clause.supplyagreement@0.1.0.DeliveryRequest',
                $identifier: 'req-3',
                $timestamp: new Date(),
                products: [],
            };
            await expect(logic.trigger(model, request, initialState))
                .rejects.toThrow('Cannot deliver without having submitted a purchase order');
        });
    });
});
