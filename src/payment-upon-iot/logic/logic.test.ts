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
import PaymentUponIoTLogic from "./logic";
import {
    ITemplateModel,
    ICounterState,
    ContractLifecycleStatus,
} from "./generated/io.clause.paymentuponiot@0.1.0";

const NS = "io.clause.paymentuponiot@0.1.0";

function makeModel(overrides: Partial<ITemplateModel> = {}): ITemplateModel {
    return {
        $class: `${NS}.TemplateModel`,
        $identifier: "test-clause-id",
        clauseId: "test-clause-id",
        buyer: "Dan",
        seller: "Grant",
        amountPerUnit: 10.0,
        currencyCode: "USD",
        paymentCount: 5,
        ...overrides,
    };
}

function makeState(overrides: Partial<ICounterState> = {}): ICounterState {
    return {
        $class: `${NS}.CounterState`,
        $identifier: "test-clause-id",
        status: "INITIALIZED" as ContractLifecycleStatus,
        counter: 0.0,
        paymentCount: 0.0,
        ...overrides,
    };
}

function runningState(overrides: Partial<ICounterState> = {}): ICounterState {
    return makeState({ status: "RUNNING" as ContractLifecycleStatus, ...overrides });
}

function makeRequest(className: string, extra: Record<string, any> = {}) {
    return { $class: `${NS}.${className}`, $identifier: "req-1", ...extra };
}

describe("PaymentUponIoTLogic", () => {
    let logic: PaymentUponIoTLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new PaymentUponIoTLogic();
        model = makeModel();
    });

    // -----------------------------------------------------------------------
    describe("init", () => {
        it("should initialise state with INITIALIZED status and zero counters", async () => {
            const result = await logic.init(model);
            expect(result.state).toMatchObject({
                $class: `${NS}.CounterState`,
                $identifier: "test-clause-id",
                status: "INITIALIZED",
                counter: 0.0,
                paymentCount: 0.0,
            });
        });

        it("should propagate $identifier from data", async () => {
            const customModel = makeModel({ $identifier: "my-contract", clauseId: "my-contract" });
            const result = await logic.init(customModel);
            expect(result.state.$identifier).toBe("my-contract");
        });
    });

    // -----------------------------------------------------------------------
    describe("trigger — ContractSigned", () => {
        it("should transition INITIALIZED -> RUNNING", async () => {
            const state = makeState();
            const request = makeRequest("ContractSigned", { contractId: "c1" });
            const result = await logic.trigger(model, request, state);
            expect(result.state.status).toBe("RUNNING");
            expect(result.events).toHaveLength(0);
        });

        it("should throw if not in INITIALIZED state", async () => {
            const state = runningState();
            const request = makeRequest("ContractSigned", { contractId: "c1" });
            await expect(logic.trigger(model, request, state))
                .rejects.toThrow(/Contract state is invalid/);
        });
    });

    // -----------------------------------------------------------------------
    describe("trigger — SingleButtonPress (increment)", () => {
        it("should increment the counter by 1", async () => {
            const state = runningState({ counter: 3.0 });
            const request = makeRequest("SingleButtonPress");
            const result = await logic.trigger(model, request, state);
            expect(result.state.counter).toBe(4.0);
            expect(result.result.counter).toBe(4.0);
        });

        it("should throw if contract is not RUNNING", async () => {
            const state = makeState({ status: "INITIALIZED" as ContractLifecycleStatus });
            const request = makeRequest("SingleButtonPress");
            await expect(logic.trigger(model, request, state))
                .rejects.toThrow("Contract is not running.");
        });

        it("should increment from 0 to 1", async () => {
            const state = runningState({ counter: 0.0 });
            const request = makeRequest("SingleButtonPress");
            const result = await logic.trigger(model, request, state);
            expect(result.state.counter).toBe(1.0);
        });
    });

    // -----------------------------------------------------------------------
    describe("trigger — DoubleButtonPress (decrement)", () => {
        it("should decrement the counter by 1", async () => {
            const state = runningState({ counter: 3.0 });
            const request = makeRequest("DoubleButtonPress");
            const result = await logic.trigger(model, request, state);
            expect(result.state.counter).toBe(2.0);
        });

        it("should floor the counter at 0 (not go negative)", async () => {
            const state = runningState({ counter: 0.0 });
            const request = makeRequest("DoubleButtonPress");
            const result = await logic.trigger(model, request, state);
            expect(result.state.counter).toBe(0.0);
        });

        it("should throw if contract is not RUNNING", async () => {
            const state = makeState({ status: "COMPLETED" as ContractLifecycleStatus });
            const request = makeRequest("DoubleButtonPress");
            await expect(logic.trigger(model, request, state))
                .rejects.toThrow("Contract is not running.");
        });
    });

    // -----------------------------------------------------------------------
    describe("trigger — LongButtonPress (requestForPayment)", () => {
        it("should emit a PaymentObligationEvent with correct amount", async () => {
            // counter=3, amountPerUnit=$10 => amount=$30
            const state = runningState({ counter: 3.0 });
            const request = makeRequest("LongButtonPress");
            const result = await logic.trigger(model, request, state);
            expect(result.events).toHaveLength(1);
            const event: any = result.events[0];
            expect(event.$class).toBe(`${NS}.PaymentObligationEvent`);
            expect(event.amount).toBe(30.0);
            expect(event.currencyCode).toBe("USD");
            expect(event.description).toContain("Dan");
            expect(event.description).toContain("Grant");
        });

        it("should not change the state counter", async () => {
            const state = runningState({ counter: 5.0 });
            const request = makeRequest("LongButtonPress");
            const result = await logic.trigger(model, request, state);
            expect(result.state.counter).toBe(5.0);
        });

        it("should throw if contract is not RUNNING", async () => {
            const state = makeState();
            const request = makeRequest("LongButtonPress");
            await expect(logic.trigger(model, request, state))
                .rejects.toThrow("Contract is not running.");
        });
    });

    // -----------------------------------------------------------------------
    describe("trigger — PaymentReceived", () => {
        it("should decrement counter by units paid and increment paymentCount", async () => {
            // counter=5, pay $30 = 3 units, counter -> 2
            const state = runningState({ counter: 5.0, paymentCount: 0.0 });
            const request = makeRequest("PaymentReceived", {
                amount: 30.0,
                currencyCode: "USD",
            });
            const result = await logic.trigger(model, request, state);
            expect(result.state.counter).toBe(2.0);
            expect(result.state.paymentCount).toBe(1.0);
            expect(result.state.status).toBe("RUNNING");
        });

        it("should transition to COMPLETED when paymentCount threshold is reached", async () => {
            // model.paymentCount = 5, state.paymentCount = 4 (one more = 5 >= 5 → COMPLETED)
            const state = runningState({ counter: 2.0, paymentCount: 4.0 });
            const request = makeRequest("PaymentReceived", {
                amount: 20.0,
                currencyCode: "USD",
            });
            const result = await logic.trigger(model, request, state);
            expect(result.state.status).toBe("COMPLETED");
            expect(result.state.paymentCount).toBe(5.0);
        });

        it("should floor the counter at 0 (overpayment)", async () => {
            const state = runningState({ counter: 1.0, paymentCount: 0.0 });
            const request = makeRequest("PaymentReceived", {
                amount: 1000.0, // way more than outstanding
                currencyCode: "USD",
            });
            const result = await logic.trigger(model, request, state);
            expect(result.state.counter).toBe(0.0);
        });

        it("should throw for negative payment amount", async () => {
            const state = runningState();
            const request = makeRequest("PaymentReceived", {
                amount: -10.0,
                currencyCode: "USD",
            });
            await expect(logic.trigger(model, request, state))
                .rejects.toThrow("Payment must be positive.");
        });

        it("should throw for wrong currency", async () => {
            const state = runningState();
            const request = makeRequest("PaymentReceived", {
                amount: 10.0,
                currencyCode: "EUR",
            });
            await expect(logic.trigger(model, request, state))
                .rejects.toThrow("Payments must be in the currency of the contract.");
        });

        it("should throw if contract is not RUNNING", async () => {
            const state = makeState({ status: "COMPLETED" as ContractLifecycleStatus });
            const request = makeRequest("PaymentReceived", {
                amount: 10.0,
                currencyCode: "USD",
            });
            await expect(logic.trigger(model, request, state))
                .rejects.toThrow("Contract is not running.");
        });
    });

    // -----------------------------------------------------------------------
    describe("trigger — unsupported request type", () => {
        it("should throw for an unknown $class", async () => {
            const state = runningState();
            const request = { $class: "io.clause.paymentuponiot@0.1.0.UnknownRequest", $identifier: "x" };
            await expect(logic.trigger(model, request, state))
                .rejects.toThrow("Unsupported request type");
        });
    });

    // -----------------------------------------------------------------------
    describe("trigger — full lifecycle simulation", () => {
        it("should track a complete press-and-pay cycle", async () => {
            // 1. init
            const initResult = await logic.init(model);
            let state = initResult.state as ICounterState;
            expect(state.status).toBe("INITIALIZED");

            // 2. contractSigned
            let result = await logic.trigger(
                model,
                makeRequest("ContractSigned", { contractId: "c1" }),
                state
            );
            state = result.state as ICounterState;
            expect(state.status).toBe("RUNNING");

            // 3. press 3 times
            for (let i = 0; i < 3; i++) {
                result = await logic.trigger(model, makeRequest("SingleButtonPress"), state);
                state = result.state as ICounterState;
            }
            expect(state.counter).toBe(3.0);

            // 4. undo one press
            result = await logic.trigger(model, makeRequest("DoubleButtonPress"), state);
            state = result.state as ICounterState;
            expect(state.counter).toBe(2.0);

            // 5. request payment (counter=2, amount=$20 expected in event)
            result = await logic.trigger(model, makeRequest("LongButtonPress"), state);
            expect((result.events[0] as any).amount).toBe(20.0);
            state = result.state as ICounterState;

            // 6. pay $20 = 2 units
            result = await logic.trigger(
                model,
                makeRequest("PaymentReceived", { amount: 20.0, currencyCode: "USD" }),
                state
            );
            state = result.state as ICounterState;
            expect(state.counter).toBe(0.0);
            expect(state.paymentCount).toBe(1.0);
            expect(state.status).toBe("RUNNING"); // only 1 of 5 payments made
        });
    });

    // -----------------------------------------------------------------------
    describe("trigger — result shape", () => {
        it("should include $class and $timestamp on CounterResponse", async () => {
            const state = runningState({ counter: 1.0 });
            const result = await logic.trigger(model, makeRequest("SingleButtonPress"), state);
            expect(result.result.$class).toBe(`${NS}.CounterResponse`);
            expect(result.result.$timestamp).toBeInstanceOf(Date);
        });
    });
});
