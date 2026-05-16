// @ts-nocheck - Suppress type checking for runtime mocks
declare global {
    var TemplateLogic: any;
    var EngineResponse: any;
    var InitResponse: any;
}

// Mock runtime globals BEFORE importing logic
(global as any).TemplateLogic = class TemplateLogic<T> {
    async trigger(data: T, request: any): Promise<any> { return {}; }
};
(global as any).EngineResponse = class EngineResponse {};
(global as any).InitResponse = class InitResponse {};

// Import AFTER mocks are set up
import FragileGoodsLogic from "./logic";
import {
    ITemplateModel,
    IDeliveryUpdate,
    IMonetaryAmount,
} from "./generated/org.accordproject.fragilegoods@0.1.0";

const NS = "org.accordproject.fragilegoods@0.1.0";

function makeModel(overrides: Partial<ITemplateModel> = {}): ITemplateModel {
    const deliveryPrice: IMonetaryAmount = {
        $class: `${NS}.MonetaryAmount`,
        doubleValue: 1000.0,
        currencyCode: "USD",
    };
    const accelerationBreachPenalty: IMonetaryAmount = {
        $class: `${NS}.MonetaryAmount`,
        doubleValue: 5.0,
        currencyCode: "USD",
    };
    const lateDeliveryPenalty: IMonetaryAmount = {
        $class: `${NS}.MonetaryAmount`,
        doubleValue: 200.0,
        currencyCode: "USD",
    };
    return {
        $class: `${NS}.TemplateModel`,
        $identifier: "test-clause-id",
        clauseId: "test-clause-id",
        seller: "Dan",
        buyer: "Steve",
        deliveryPrice,
        accelerationMin: -0.5,
        accelerationMax: 0.5,
        accelerationBreachPenalty,
        deliveryLimitDuration: {
            $class: "org.accordproject.time@0.3.0.Duration",
            amount: 10,
            unit: "seconds",
        } as any,
        lateDeliveryPenalty,
        ...overrides,
    };
}

function makeRequest(overrides: Partial<IDeliveryUpdate> = {}): IDeliveryUpdate {
    return {
        $class: `${NS}.DeliveryUpdate`,
        $identifier: "req-1",
        startTime: new Date("2018-01-01T16:34:00Z"),
        finishTime: new Date("2018-01-01T16:34:11Z"),
        status: "ARRIVED",
        accelerometerReadings: [0.2, 0.6, -0.3, -0.7, 0.1],
        ...overrides,
    };
}

describe("FragileGoodsLogic", () => {
    let logic: FragileGoodsLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new FragileGoodsLogic();
        model = makeModel();
    });

    describe("trigger — no accelerometer violations, on time", () => {
        it("should return full delivery price when all readings are within bounds", async () => {
            // all readings within [-0.5, 0.5]
            const request = makeRequest({
                accelerometerReadings: [0.2, -0.3, 0.1],
                startTime: new Date("2018-01-01T16:34:00Z"),
                finishTime: new Date("2018-01-01T16:34:05Z"), // 5s < 10s limit
            });
            const response = await logic.trigger(model, request);
            expect(response.result.paymentAmount).toBe(1000.0);
            expect(response.result.currencyCode).toBe("USD");
            expect(response.result.$class).toBe(`${NS}.PayOut`);
            expect(response.result.$timestamp).toBeInstanceOf(Date);
            expect(Array.isArray(response.events)).toBe(true);
            expect(response.events).toHaveLength(1);
        });
    });

    describe("trigger — accelerometer violations", () => {
        it("should subtract penalty for each reading outside bounds", async () => {
            // readings: 0.2 (ok), 0.6 (>0.5 violation), -0.3 (ok), -0.7 (<-0.5 violation), 0.1 (ok)
            // 2 violations x $5 = $10 penalty => $1000 - $10 = $990
            const request = makeRequest({
                accelerometerReadings: [0.2, 0.6, -0.3, -0.7, 0.1],
                startTime: new Date("2018-01-01T16:34:00Z"),
                finishTime: new Date("2018-01-01T16:34:05Z"), // on time
            });
            const response = await logic.trigger(model, request);
            expect(response.result.paymentAmount).toBe(990.0);
        });

        it("should handle an empty accelerometer readings array", async () => {
            const request = makeRequest({
                accelerometerReadings: [],
                startTime: new Date("2018-01-01T16:34:00Z"),
                finishTime: new Date("2018-01-01T16:34:05Z"),
            });
            const response = await logic.trigger(model, request);
            expect(response.result.paymentAmount).toBe(1000.0);
        });
    });

    describe("trigger — late delivery", () => {
        it("should subtract lateDeliveryPenalty when delivery exceeds limit duration", async () => {
            // delivery duration = 601s > 10s limit → late penalty of $200
            // 2 violations x $5 = $10
            // total = $1000 - $10 - $200 = $790
            const request = makeRequest({
                accelerometerReadings: [0.2, 0.6, -0.3, -0.7, 0.1],
                startTime: new Date("2018-01-01T16:34:30Z"),
                finishTime: new Date("2018-01-01T16:44:31Z"), // 601 seconds later
            });
            const response = await logic.trigger(model, request);
            expect(response.result.paymentAmount).toBe(790.0);
            expect(response.events).toHaveLength(1);
            const event: any = response.events[0];
            expect(event.$class).toBe(`${NS}.FragileGoodsEvent`);
            expect(event.paymentAmount).toBe(790.0);
            expect(event.currencyCode).toBe("USD");
        });

        it("should not apply late penalty when delivery is within the limit", async () => {
            // 5 seconds delivery, 10 second limit → no late penalty
            const request = makeRequest({
                accelerometerReadings: [],
                startTime: new Date("2018-01-01T16:34:00Z"),
                finishTime: new Date("2018-01-01T16:34:05Z"),
            });
            const response = await logic.trigger(model, request);
            expect(response.result.paymentAmount).toBe(1000.0);
        });

        it("should apply late penalty when delivery equals the limit duration exactly + 1ms", async () => {
            // limit is 10 seconds; finish is 10001ms after start → late
            const start = new Date("2018-01-01T16:34:00.000Z");
            const finish = new Date(start.getTime() + 10001);
            const request = makeRequest({
                accelerometerReadings: [],
                startTime: start,
                finishTime: finish,
            });
            const response = await logic.trigger(model, request);
            expect(response.result.paymentAmount).toBe(800.0); // 1000 - 200 late penalty
        });
    });

    describe("trigger — not ARRIVED status", () => {
        it("should return early without late penalty when status is IN_TRANSIT", async () => {
            const request = makeRequest({
                status: "IN_TRANSIT",
                accelerometerReadings: [0.6, -0.7], // 2 violations
            });
            const response = await logic.trigger(model, request);
            // 2 violations x $5 = $10 penalty; no late penalty because not ARRIVED
            expect(response.result.paymentAmount).toBe(990.0);
            expect(response.events).toHaveLength(0);
        });

        it("should return early without late penalty when status is CREATED", async () => {
            const request = makeRequest({
                status: "CREATED",
                accelerometerReadings: [],
            });
            const response = await logic.trigger(model, request);
            expect(response.result.paymentAmount).toBe(1000.0);
            expect(response.events).toHaveLength(0);
        });
    });

    describe("trigger — ARRIVED but no finishTime", () => {
        it("should return early without late penalty when finishTime is absent", async () => {
            const request = makeRequest({
                status: "ARRIVED",
                finishTime: undefined,
                accelerometerReadings: [0.6], // 1 violation
            });
            const response = await logic.trigger(model, request);
            // 1 violation x $5 = $5 penalty; no late delivery check
            expect(response.result.paymentAmount).toBe(995.0);
            expect(response.events).toHaveLength(0);
        });
    });

    describe("trigger — currency code is preserved", () => {
        it("should use the currency code from deliveryPrice", async () => {
            const customModel = makeModel({
                deliveryPrice: {
                    $class: `${NS}.MonetaryAmount`,
                    doubleValue: 500.0,
                    currencyCode: "EUR",
                },
                lateDeliveryPenalty: {
                    $class: `${NS}.MonetaryAmount`,
                    doubleValue: 50.0,
                    currencyCode: "EUR",
                },
                accelerationBreachPenalty: {
                    $class: `${NS}.MonetaryAmount`,
                    doubleValue: 10.0,
                    currencyCode: "EUR",
                },
            });
            const request = makeRequest({ accelerometerReadings: [] });
            const response = await logic.trigger(customModel, request);
            expect(response.result.currencyCode).toBe("EUR");
        });
    });
});
