import {
    ICounterResponse,
    ICounterState,
    IPaymentObligationEvent,
    ITemplateModel,
    IContractSigned,
    ISingleButtonPress,
    IDoubleButtonPress,
    ILongButtonPress,
    IPaymentReceived,
    ContractLifecycleStatus,
} from "./generated/io.clause.paymentuponiot@0.1.0";
import { IRequest } from "./generated/org.accordproject.runtime@0.2.0";

const NS = "io.clause.paymentuponiot@0.1.0";

// Union of all possible request types for this contract
type IoTRequest =
    | IContractSigned
    | ISingleButtonPress
    | IDoubleButtonPress
    | ILongButtonPress
    | IPaymentReceived;

// @ts-expect-error EngineResponse is imported by the runtime
interface IoTResponse extends EngineResponse<ICounterState> {
    result: ICounterResponse;
    state: object;
    events: object[];
}

// @ts-ignore TemplateLogic is imported by the runtime
class PaymentUponIoTLogic extends TemplateLogic<ITemplateModel, ICounterState> {

    // @ts-expect-error InitResponse is imported by the runtime
    async init(data: ITemplateModel): Promise<InitResponse<ICounterState>> {
        return {
            state: {
                $class: `${NS}.CounterState`,
                $identifier: data.$identifier,
                status: "INITIALIZED" as ContractLifecycleStatus,
                counter: 0.0,
                paymentCount: 0.0,
            }
        };
    }

    private makeCounterResponse(state: ICounterState): ICounterResponse {
        return {
            $class: `${NS}.CounterResponse`,
            $identifier: new Date().toISOString(),
            $timestamp: new Date(),
            counter: state.counter,
            paymentCount: state.paymentCount,
        };
    }

    /**
     * Handle ContractSigned: transitions state from INITIALIZED to RUNNING.
     */
    private handleContractSigned(
        data: ITemplateModel,
        state: ICounterState
    ): IoTResponse {
        if (state.status !== "INITIALIZED") {
            throw new Error(`Contract state is invalid ${state.status}`);
        }
        const newState: ICounterState = {
            ...state,
            status: "RUNNING" as ContractLifecycleStatus,
        };
        return {
            result: this.makeCounterResponse(newState),
            state: newState,
            events: [],
        };
    }

    /**
     * Handle SingleButtonPress: increments the counter by 1.
     * Contract must be RUNNING.
     */
    private handleIncrement(
        data: ITemplateModel,
        state: ICounterState
    ): IoTResponse {
        if (state.status !== "RUNNING") {
            throw new Error("Contract is not running.");
        }
        const newState: ICounterState = {
            ...state,
            counter: state.counter + 1.0,
        };
        return {
            result: this.makeCounterResponse(newState),
            state: newState,
            events: [],
        };
    }

    /**
     * Handle DoubleButtonPress: decrements the counter (floored at 0).
     * Contract must be RUNNING.
     */
    private handleDecrement(
        data: ITemplateModel,
        state: ICounterState
    ): IoTResponse {
        if (state.status !== "RUNNING") {
            throw new Error("Contract is not running.");
        }
        const newState: ICounterState = {
            ...state,
            counter: Math.max(0.0, state.counter - 1.0),
        };
        return {
            result: this.makeCounterResponse(newState),
            state: newState,
            events: [],
        };
    }

    /**
     * Handle LongButtonPress: emits a PaymentObligationEvent for the outstanding balance.
     * Contract must be RUNNING.
     */
    private handleRequestForPayment(
        data: ITemplateModel,
        state: ICounterState
    ): IoTResponse {
        if (state.status !== "RUNNING") {
            throw new Error("Contract is not running.");
        }
        const amount = data.amountPerUnit * state.counter;
        const event: IPaymentObligationEvent = {
            $class: `${NS}.PaymentObligationEvent`,
            $timestamp: new Date(),
            amount,
            currencyCode: data.currencyCode,
            description: `${data.buyer} should pay outstanding balance to ${data.seller}`,
        };
        return {
            result: this.makeCounterResponse(state),
            state,
            events: [event],
        };
    }

    /**
     * Handle PaymentReceived: decrements the counter by units paid,
     * increments paymentCount, and transitions to COMPLETED if payment threshold is reached.
     * Contract must be RUNNING.
     */
    private handlePaymentReceived(
        data: ITemplateModel,
        request: IPaymentReceived,
        state: ICounterState
    ): IoTResponse {
        if (state.status !== "RUNNING") {
            throw new Error("Contract is not running.");
        }
        if (request.amount < 0.0) {
            throw new Error("Payment must be positive.");
        }
        if (request.currencyCode !== data.currencyCode) {
            throw new Error("Payments must be in the currency of the contract.");
        }

        const newPaymentCount = state.paymentCount + 1.0;
        const newStatus: ContractLifecycleStatus =
            newPaymentCount >= data.paymentCount ? "COMPLETED" : "RUNNING";

        const unitsPaid = Math.max(
            0,
            Math.floor(request.amount / data.amountPerUnit)
        );
        const newCounter = Math.max(0.0, state.counter - unitsPaid);

        const newState: ICounterState = {
            $class: `${NS}.CounterState`,
            $identifier: state.$identifier,
            status: newStatus,
            counter: newCounter,
            paymentCount: newPaymentCount,
        };

        return {
            result: this.makeCounterResponse(newState),
            state: newState,
            events: [],
        };
    }

    async trigger(
        data: ITemplateModel,
        request: IRequest,
        state: ICounterState
    ): Promise<IoTResponse> {
        const req = request as IoTRequest;

        switch (req.$class) {
            case `${NS}.ContractSigned`:
                return this.handleContractSigned(data, state);

            case `${NS}.SingleButtonPress`:
                return this.handleIncrement(data, state);

            case `${NS}.DoubleButtonPress`:
                return this.handleDecrement(data, state);

            case `${NS}.LongButtonPress`:
                return this.handleRequestForPayment(data, state);

            case `${NS}.PaymentReceived`:
                return this.handlePaymentReceived(data, req as IPaymentReceived, state);

            default:
                throw new Error(`Unsupported request type: ${req.$class}`);
        }
    }
}

export default PaymentUponIoTLogic;
