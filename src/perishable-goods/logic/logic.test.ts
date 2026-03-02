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

// Import AFTER mocks are set up
import PerishableGoodsLogic from "./logic";
import {
    ITemplateModel,
    IShipmentReceived,
    IPerishableGoodsState,
    ISensorReading,
} from "./generated/org.accordproject.perishablegoods@0.1.0";

const NS = "org.accordproject.perishablegoods@0.1.0";

// Use a far-future due date by default so shipments are not late
const FUTURE_DUE_DATE = new Date(Date.now() + 365 * 24 * 3600 * 1000);

function makeModel(overrides: Partial<ITemplateModel> = {}): ITemplateModel {
    return {
        $class: `${NS}.TemplateModel`,
        $identifier: "test-clause-id",
        clauseId: "test-clause-id",
        grower: "PETER",
        importer: "DAN",
        shipmentId: "SHIP_001",
        dueDate: FUTURE_DUE_DATE,
        unitPrice: 1.5,
        currencyCode: "USD",
        unit: "KG",
        minUnits: 3000,
        maxUnits: 3500,
        product: "Grade I, Size 4, Zutano Mexican Avocados",
        sensorReadingFrequency: 1,
        duration: "hours",
        minTemperature: 2.0,
        maxTemperature: 13.0,
        minHumidity: 70.0,
        maxHumidity: 90.0,
        penaltyFactor: 0.2,
        ...overrides,
    };
}

function makeState(overrides: Partial<IPerishableGoodsState> = {}): IPerishableGoodsState {
    return {
        $class: `${NS}.PerishableGoodsState`,
        $identifier: "test-clause-id",
        payoutMade: false,
        totalPaid: 0.0,
        ...overrides,
    };
}

function makeSensorReading(centigrade: number, humidity: number): ISensorReading {
    return {
        $class: `${NS}.SensorReading`,
        centigrade,
        humidity,
    };
}

function makeRequest(overrides: Partial<IShipmentReceived> = {}): IShipmentReceived {
    return {
        $class: `${NS}.ShipmentReceived`,
        $identifier: "req-1",
        shipmentId: "SHIP_001",
        unitCount: 3000,
        sensorReadings: [
            makeSensorReading(2, 80),
            makeSensorReading(5, 90),
            makeSensorReading(15, 65), // temp > 13 violation; humidity < 70 violation
        ],
        ...overrides,
    };
}

describe("PerishableGoodsLogic", () => {
    let logic: PerishableGoodsLogic;
    let model: ITemplateModel;
    let initialState: IPerishableGoodsState;

    beforeEach(() => {
        logic = new PerishableGoodsLogic();
        model = makeModel();
        initialState = makeState();
    });

    describe("init", () => {
        it("should initialise state with default values", async () => {
            const result = await logic.init(model);
            expect(result.state).toMatchObject({
                $class: `${NS}.PerishableGoodsState`,
                $identifier: "test-clause-id",
                payoutMade: false,
                totalPaid: 0.0,
            });
        });

        it("should propagate $identifier from data", async () => {
            const customModel = makeModel({ $identifier: "custom-id", clauseId: "custom-id" });
            const result = await logic.init(customModel);
            expect(result.state.$identifier).toBe("custom-id");
        });
    });

    describe("trigger — guard: unit count out of range", () => {
        it("should throw when unitCount is below minUnits", async () => {
            const request = makeRequest({ unitCount: 2999 });
            await expect(logic.trigger(model, request, initialState))
                .rejects.toThrow("Units received out of range for the contract");
        });

        it("should throw when unitCount is above maxUnits", async () => {
            const request = makeRequest({ unitCount: 3501 });
            await expect(logic.trigger(model, request, initialState))
                .rejects.toThrow("Units received out of range for the contract");
        });

        it("should succeed at the boundary (exactly minUnits)", async () => {
            const request = makeRequest({
                unitCount: 3000,
                sensorReadings: [makeSensorReading(5, 80)], // within bounds
            });
            const result = await logic.trigger(model, request, initialState);
            expect(result.result.late).toBe(false);
        });
    });

    describe("trigger — guard: late shipment", () => {
        it("should return zero price and late=true when now() >= dueDate", async () => {
            const pastDueModel = makeModel({
                dueDate: new Date("2000-01-01T00:00:00Z"),
            });
            const request = makeRequest({ sensorReadings: [makeSensorReading(5, 80)] });
            const result = await logic.trigger(pastDueModel, request, initialState);
            expect(result.result.late).toBe(true);
            expect(result.result.totalPrice).toBe(0.0);
            expect(result.events).toHaveLength(0);
        });
    });

    describe("trigger — guard: no sensor readings", () => {
        it("should throw when sensorReadings array is empty", async () => {
            const request = makeRequest({ sensorReadings: [] });
            await expect(logic.trigger(model, request, initialState))
                .rejects.toThrow("No temperature readings received");
        });
    });

    describe("trigger — no violations (all readings within bounds)", () => {
        it("should return full payout with zero penalty", async () => {
            const request = makeRequest({
                unitCount: 3000,
                sensorReadings: [
                    makeSensorReading(5, 80),   // temp: 5 in [2,13], humidity: 80 in [70,90]
                    makeSensorReading(10, 85),  // both in range
                ],
            });
            const result = await logic.trigger(model, request, initialState);
            // payout = 1.5 * 3000 = 4500, penalty = 0
            expect(result.result.totalPrice).toBe(4500.0);
            expect(result.result.penalty).toBe(0.0);
            expect(result.result.late).toBe(false);
            expect(result.result.currencyCode).toBe("USD");
        });
    });

    describe("trigger — temperature violation", () => {
        it("should apply penalty for temperature above max", async () => {
            // maxTemp=13, reading=15 → tempPenalty = (15-13) * 0.2 = 0.4 per unit
            // totalPenalty = 0.4 * 3000 = 1200
            // payOut = 1.5 * 3000 = 4500
            // totalPrice = 4500 - 1200 = 3300
            const request = makeRequest({
                unitCount: 3000,
                sensorReadings: [makeSensorReading(15, 80)], // temp > 13
            });
            const result = await logic.trigger(model, request, initialState);
            expect(result.result.totalPrice).toBeCloseTo(3300.0);
            expect(result.result.penalty).toBeCloseTo(1200.0);
        });

        it("should apply penalty for temperature below min", async () => {
            // minTemp=2, reading=0 → tempPenalty = (2-0) * 0.2 = 0.4 per unit
            // totalPenalty = 0.4 * 3000 = 1200
            const request = makeRequest({
                unitCount: 3000,
                sensorReadings: [makeSensorReading(0, 80)], // temp < 2
            });
            const result = await logic.trigger(model, request, initialState);
            expect(result.result.penalty).toBeCloseTo(1200.0);
        });
    });

    describe("trigger — humidity violation", () => {
        it("should apply penalty for humidity below min", async () => {
            // minHumidity=70, reading=65 → humPenalty = (70-65)*0.2 = 1.0 per unit
            // totalPenalty = 1.0 * 3000 = 3000
            // payOut = 4500, totalPrice = max(4500-3000, 0) = 1500
            const request = makeRequest({
                unitCount: 3000,
                sensorReadings: [makeSensorReading(5, 65)], // humidity < 70
            });
            const result = await logic.trigger(model, request, initialState);
            expect(result.result.penalty).toBeCloseTo(3000.0);
            expect(result.result.totalPrice).toBeCloseTo(1500.0);
        });
    });

    describe("trigger — total price floored at zero", () => {
        it("should not return a negative totalPrice", async () => {
            // Extreme readings that would cause penalty > payOut
            const request = makeRequest({
                unitCount: 3000,
                sensorReadings: [makeSensorReading(100, 10)], // both far outside bounds
            });
            const result = await logic.trigger(model, request, initialState);
            expect(result.result.totalPrice).toBeGreaterThanOrEqual(0);
        });
    });

    describe("trigger — state accumulation", () => {
        it("should accumulate totalPaid across multiple triggers", async () => {
            const request = makeRequest({
                unitCount: 3000,
                sensorReadings: [makeSensorReading(5, 80)],
            });
            const result1 = await logic.trigger(model, request, initialState);
            expect(result1.state.payoutMade).toBe(true);
            expect(result1.state.totalPaid).toBeCloseTo(4500.0);

            const result2 = await logic.trigger(model, request, result1.state as IPerishableGoodsState);
            expect(result2.state.totalPaid).toBeCloseTo(9000.0);
        });
    });

    describe("trigger — events", () => {
        it("should emit one PerishableGoodsPaymentEvent on successful payout", async () => {
            const request = makeRequest({
                unitCount: 3000,
                sensorReadings: [makeSensorReading(5, 80)],
            });
            const result = await logic.trigger(model, request, initialState);
            expect(result.events).toHaveLength(1);
            const event: any = result.events[0];
            expect(event.$class).toBe(`${NS}.PerishableGoodsPaymentEvent`);
            expect(event.totalPrice).toBeCloseTo(4500.0);
            expect(event.currencyCode).toBe("USD");
            expect(event.description).toContain("DAN");
            expect(event.description).toContain("PETER");
        });

        it("should emit no events for a late shipment", async () => {
            const pastDueModel = makeModel({ dueDate: new Date("2000-01-01T00:00:00Z") });
            const request = makeRequest({ sensorReadings: [makeSensorReading(5, 80)] });
            const result = await logic.trigger(pastDueModel, request, initialState);
            expect(result.events).toHaveLength(0);
        });
    });

    describe("trigger — result shape", () => {
        it("should include $class and $timestamp on result", async () => {
            const request = makeRequest({
                sensorReadings: [makeSensorReading(5, 80)],
            });
            const result = await logic.trigger(model, request, initialState);
            expect(result.result.$class).toBe(`${NS}.PriceCalculation`);
            expect(result.result.$timestamp).toBeInstanceOf(Date);
        });
    });
});
