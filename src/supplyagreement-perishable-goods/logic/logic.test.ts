// @ts-nocheck - Suppress type checking for runtime mocks
// Mock runtime globals BEFORE importing logic
(global as any).TemplateLogic = class TemplateLogic<T, S> {
    async init(data: T): Promise<any> { return { state: {} }; }
    async trigger(data: T, request: any, state?: S): Promise<any> { return {}; }
};
(global as any).EngineResponse = class EngineResponse<S> {};
(global as any).InitResponse = class InitResponse<S> {};

import SupplyAgreementPerishableGoodsLogic from './logic';
import {
    ITemplateModel,
    IShipmentReceived,
} from './generated/io.clause.supplyagreementperishablegoods@0.1.0';

describe('SupplyAgreementPerishableGoodsLogic', () => {
    let logic: SupplyAgreementPerishableGoodsLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new SupplyAgreementPerishableGoodsLogic();
        model = {
            $class: 'io.clause.supplyagreementperishablegoods@0.1.0.TemplateModel',
            $identifier: 'test-clause-id',
            clauseId: 'test-clause-id',
            dueDate: new Date('2099-12-31T23:59:59Z'), // far future — not late
            grower: 'Grower Farm LLC',
            importer: 'Import Co Ltd',
            shipment: 'SHIP_001',
            unitPrice: 1.5,
            currencyCode: 'USD',
            unit: 'KG',
            minUnits: 3000,
            maxUnits: 5000,
            product: 'Apples',
            sensorReadingFrequency: 10,
            duration: 'HOUR',
            minTemperature: 2.0,
            maxTemperature: 10.0,
            minHumidity: 60.0,
            maxHumidity: 90.0,
            penaltyFactor: 0.2,
        };
    });

    const makeRequest = (unitCount: number, centigrade: number, humidity: number): IShipmentReceived => ({
        $class: 'io.clause.supplyagreementperishablegoods@0.1.0.ShipmentReceived',
        $identifier: 'req-1',
        $timestamp: new Date(),
        unitCount,
        shipment: {
            $class: 'io.clause.supplyagreementperishablegoods@0.1.0.Shipment',
            shipmentId: 'SHIP_001',
            status: 'IN_TRANSIT',
            sensorReadings: [
                {
                    $class: 'io.clause.supplyagreementperishablegoods@0.1.0.SensorReading',
                    centigrade,
                    humidity,
                }
            ],
        },
    });

    describe('trigger - normal case (within temperature and humidity range)', () => {
        it('should return full payout with no penalty', async () => {
            const request = makeRequest(3002, 5.0, 75.0); // temp and humidity in range
            const result = await logic.trigger(model, request);

            expect(result.result.$class).toBe('io.clause.supplyagreementperishablegoods@0.1.0.PriceCalculation');
            expect(result.result.late).toBe(false);
            expect(result.result.penalty).toBe(0.0);
            expect(result.result.totalPrice).toBeCloseTo(3002 * 1.5);
            expect(result.result.currencyCode).toBe('USD');
            expect(result.events).toHaveLength(1);
            expect(result.events[0].$class).toBe('io.clause.supplyagreementperishablegoods@0.1.0.PaymentObligationEvent');
        });
    });

    describe('trigger - temperature breach', () => {
        it('should apply a penalty for temperature below minimum', async () => {
            const request = makeRequest(3002, 0.0, 75.0); // 2 degrees below min
            const result = await logic.trigger(model, request);

            expect(result.result.late).toBe(false);
            // penalty per unit = (2.0 - 0.0) * 0.2 = 0.4 per reading
            // total penalty = 0.4 * 3002 = 1200.8
            expect(result.result.penalty).toBeCloseTo(0.4 * 3002);
            const expectedTotal = Math.max(3002 * 1.5 - 0.4 * 3002, 0);
            expect(result.result.totalPrice).toBeCloseTo(expectedTotal);
        });
    });

    describe('trigger - past due date', () => {
        it('should return zero price when past due date', async () => {
            const pastModel = { ...model, dueDate: new Date('2000-01-01T00:00:00Z') };
            const request = makeRequest(3002, 5.0, 75.0);
            const result = await logic.trigger(pastModel, request);

            expect(result.result.late).toBe(true);
            expect(result.result.totalPrice).toBe(0.0);
            expect(result.result.penalty).toBe(0.0);
        });
    });

    describe('trigger - unit count out of range', () => {
        it('should throw when unit count is below minimum', async () => {
            const request = makeRequest(100, 5.0, 75.0); // below minUnits=3000
            await expect(logic.trigger(model, request))
                .rejects.toThrow('Units received out of range for the contract.');
        });

        it('should throw when unit count is above maximum', async () => {
            const request = makeRequest(9999, 5.0, 75.0); // above maxUnits=5000
            await expect(logic.trigger(model, request))
                .rejects.toThrow('Units received out of range for the contract.');
        });
    });

    describe('trigger - no sensor readings', () => {
        it('should throw when shipment has no sensor readings', async () => {
            const request: IShipmentReceived = {
                $class: 'io.clause.supplyagreementperishablegoods@0.1.0.ShipmentReceived',
                $identifier: 'req-1',
                $timestamp: new Date(),
                unitCount: 3002,
                shipment: {
                    $class: 'io.clause.supplyagreementperishablegoods@0.1.0.Shipment',
                    shipmentId: 'SHIP_001',
                    status: 'IN_TRANSIT',
                    sensorReadings: [],
                },
            };
            await expect(logic.trigger(model, request))
                .rejects.toThrow('No temperature readings received.');
        });
    });

    describe('trigger - humidity breach', () => {
        it('should apply a penalty for humidity above maximum', async () => {
            const request = makeRequest(3002, 5.0, 95.0); // humidity above max=90
            const result = await logic.trigger(model, request);

            expect(result.result.late).toBe(false);
            // penalty per unit = (95.0 - 90.0) * 0.2 = 1.0 per reading
            // total penalty = 1.0 * 3002 = 3002
            expect(result.result.penalty).toBeCloseTo(1.0 * 3002);
        });
    });
});
