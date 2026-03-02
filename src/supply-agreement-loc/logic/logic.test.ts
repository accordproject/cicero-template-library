// @ts-nocheck - Suppress type checking for runtime mocks
// Mock runtime globals BEFORE importing logic
(global as any).TemplateLogic = class TemplateLogic<T, S> {
    async init(data: T): Promise<any> { return { state: {} }; }
    async trigger(data: T, request: any, state: S): Promise<any> { return {}; }
};
(global as any).EngineResponse = class EngineResponse<S> {};
(global as any).InitResponse = class InitResponse<S> {};

import SupplyAgreementLocLogic from './logic';
import {
    ITemplateModel,
    ISupplyAgreementState,
    ISensorReading,
    ISensorReadingData,
    ICheckContract,
} from './generated/org.accordproject.supplyagreementloc@0.1.0';

describe('SupplyAgreementLocLogic', () => {
    let logic: SupplyAgreementLocLogic;
    let model: ITemplateModel;
    let initialState: ISupplyAgreementState;

    beforeEach(() => {
        logic = new SupplyAgreementLocLogic();
        model = {
            $class: 'org.accordproject.supplyagreementloc@0.1.0.TemplateModel',
            $identifier: 'test-clause-id',
            clauseId: 'test-clause-id',
            executionDate: new Date('2024-01-01T00:00:00Z'),
            exporter: 'Exporter Corp',
            importer: 'Importer Ltd',
            product: 'Electronics',
            importerCreditworthiness: 'AAA',
            issueDate: new Date('2024-01-01T00:00:00Z'),
            importerLOCBank: 'First National Bank',
            importerLOCNumber: 12345,
            importerLOCAmount: 100000.0,
            importerLOCCurrency: 'USD',
            orderBillOfLading: 'BOL-001',
            packingList: 'PL-001',
            renewalTerms: 2,
            termRenewal: '1 year',
            termTerminationNotice: '30 days',
            invoice: 'INV-001',
            bookingId: 'BK-001',
            purchaseOrder: 'PO-001',
            exporterAddress: '123 Main St, CA',
            turnaroundTime: 5,
            amountOfEachProduct: 100,
            unitPriceOfEachProduct: 50.0,
            unitPriceCurrency: 'USD',
            locationForDelivery: 'Stockholm, SE',
            deliveryDate: new Date('2024-06-01T00:00:00Z'),
            exporterBankAccount: 987654,
            modifiedPurchaseOrder: 'MPO-001',
            cancellationDeadline: {
                $class: 'org.accordproject.time@0.3.0.Duration',
                amount: 10,
                unit: 'days',
            },
            shipper: 'Shipping Co',
            importPort: 'Stockholm',
            exportPort: 'Los Angeles',
            productDescription: 'Consumer electronics',
            productWeight: 500,
            productMeasurement: 'kg',
            freightCharges: 2000.0,
            freightCurrency: 'USD',
            evaluationTime: {
                $class: 'org.accordproject.time@0.3.0.Duration',
                amount: 5,
                unit: 'days',
            },
            acceptanceCriteria: 'Product functions as expected',
            termBeginDate: new Date('2024-01-01T00:00:00Z'),
            termPeriod: '2 years',
            currentTerm: 'Initial Term',
            shipment: 'SHIP-001',
            unitPrice: 500.0,
            unitCurrency: 'USD',
            unit: 100,
            sensorReadingFrequency: 10,
            duration: 'hours',
            countPeriod: '30 days',
        };
        initialState = {
            $class: 'org.accordproject.supplyagreementloc@0.1.0.SupplyAgreementState',
            $identifier: 'test-clause-id',
            sensorReadings: [],
        };
    });

    describe('init', () => {
        it('should initialise state with empty sensor readings', async () => {
            const result = await logic.init(model);
            expect(result.state).toMatchObject({
                $class: 'org.accordproject.supplyagreementloc@0.1.0.SupplyAgreementState',
                $identifier: 'test-clause-id',
                sensorReadings: [],
            });
        });
    });

    describe('trigger - sensorReading', () => {
        it('should append sensor reading to state', async () => {
            const reading: ISensorReading = {
                $class: 'org.accordproject.supplyagreementloc@0.1.0.SensorReading',
                $identifier: 'reading-1',
                $timestamp: new Date(),
                temperature: 25,
                humidity: 50,
            };
            const result = await logic.trigger(model, reading, initialState);

            expect(result.result.$class).toBe('org.accordproject.supplyagreementloc@0.1.0.DeliveryResponse');
            expect(result.result.inGoodOrder).toBe(true);
            expect(result.result.message).toBe('Sensor reading received');
            expect(result.state.sensorReadings).toHaveLength(1);
        });

        it('should accumulate multiple sensor readings', async () => {
            const reading: ISensorReading = {
                $class: 'org.accordproject.supplyagreementloc@0.1.0.SensorReading',
                $identifier: 'reading-1',
                $timestamp: new Date(),
                temperature: 25,
                humidity: 50,
            };
            const result1 = await logic.trigger(model, reading, initialState);
            const result2 = await logic.trigger(model, { ...reading, $identifier: 'reading-2' }, result1.state as ISupplyAgreementState);

            expect(result2.state.sensorReadings).toHaveLength(2);
        });
    });

    describe('trigger - checkContract', () => {
        it('should report in good order when sufficient readings are available', async () => {
            // Use execution date far in the past so readings are required
            // With executionDate = 2024-01-01 and now much later, many readings needed
            // We'll set executionDate close to now so very few readings are required
            const recentModel = {
                ...model,
                executionDate: new Date(Date.now() - 1000), // 1 second ago → negligible readings needed
                sensorReadingFrequency: 1,
            };
            const checkRequest: ICheckContract = {
                $class: 'org.accordproject.supplyagreementloc@0.1.0.CheckContract',
                $identifier: 'check-1',
                $timestamp: new Date(),
            };
            // No readings needed for 1 second, frequency 1/day = ~0 required
            const result = await logic.trigger(recentModel, checkRequest, initialState);
            expect(result.result.$class).toBe('org.accordproject.supplyagreementloc@0.1.0.DeliveryResponse');
            expect(result.result.inGoodOrder).toBe(true);
        });

        it('should report insufficient readings when not enough have been received', async () => {
            // Set execution date 10 days ago, frequency 10/day → 100 readings required, we have 0
            const pastModel = {
                ...model,
                executionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                sensorReadingFrequency: 10,
            };
            const checkRequest: ICheckContract = {
                $class: 'org.accordproject.supplyagreementloc@0.1.0.CheckContract',
                $identifier: 'check-1',
                $timestamp: new Date(),
            };
            const result = await logic.trigger(pastModel, checkRequest, initialState);
            expect(result.result.inGoodOrder).toBe(false);
            expect(result.result.message).toContain('Insufficient sensor readings');
        });
    });
});
