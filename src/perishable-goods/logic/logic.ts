import type {
    ContractStatus,
    ILateShipmentNotification,
    IShipmentReceived,
    ISensorReadingsReceived,
    ISensorReadingsRecorded,
    IPriceCalculation,
    IPerishableGoodsPaymentEvent,
    IPerishableGoodsState,
    ITemplateModel,
    ISensorReading,
} from "./generated/org.accordproject.perishablegoods@0.2.0";

const NS = "org.accordproject.perishablegoods@0.2.0";

// The runtime loads this file on its own, so only type imports from ./generated
// are allowed. Use the enum's string values directly.
const IN_PROGRESS = "IN_PROGRESS" as unknown as ContractStatus;
const COMPLETED = "COMPLETED" as unknown as ContractStatus;

// @ts-expect-error EngineResponse is imported by the runtime
interface PerishableGoodsResponse extends EngineResponse<IPerishableGoodsState> {
    result: IPriceCalculation | ISensorReadingsRecorded;
    state: object;
    events: object[];
}

/**
 * Stateful perishable goods contract.
 *
 * Sensor readings can be sent one at a time (or in small batches) with
 * `SensorReadingsReceived`; the min/max temperature and humidity seen so far are
 * kept in the contract state. When the shipment arrives (`ShipmentReceived`) the
 * penalty is calculated from the recorded min/max values, a payment obligation is
 * emitted and the contract is set to COMPLETED. Readings received after the due
 * date emit a `LateShipmentNotification`.
 */
// @ts-ignore TemplateLogic is imported by the runtime
class PerishableGoodsLogic extends TemplateLogic<ITemplateModel, IPerishableGoodsState> {

    // @ts-expect-error InitResponse is imported by the runtime
    async init(data: ITemplateModel): Promise<InitResponse<IPerishableGoodsState>> {
        return {
            state: {
                $class: `${NS}.PerishableGoodsState`,
                $identifier: data.$identifier,
                status: IN_PROGRESS,
                readingCount: 0,
                payoutMade: false,
                totalPaid: 0.0,
            }
        };
    }

    async trigger(
        data: ITemplateModel,
        request: ISensorReadingsReceived | IShipmentReceived,
        state: IPerishableGoodsState
    ): Promise<PerishableGoodsResponse> {
        if (state.status === COMPLETED) {
            throw new Error("Contract is already completed");
        }
        if (request.shipmentId !== data.shipmentId) {
            throw new Error(`Unknown shipment: ${request.shipmentId}`);
        }

        if (request.$class === `${NS}.SensorReadingsReceived`) {
            return this.sensorReadingsReceived(data, request as ISensorReadingsReceived, state);
        } else if (request.$class === `${NS}.ShipmentReceived`) {
            return this.shipmentReceived(data, request as IShipmentReceived, state);
        }
        throw new Error(`Unknown request type: ${request.$class}`);
    }

    private isLate(data: ITemplateModel): boolean {
        return new Date() >= new Date(data.dueDate);
    }

    /**
     * Fold new readings into the min/max values kept in state.
     */
    private recordReadings(state: IPerishableGoodsState, readings: ISensorReading[]): IPerishableGoodsState {
        if (readings.length === 0) return state;

        const temps = readings.map((r) => r.centigrade);
        const humidities = readings.map((r) => r.humidity);
        const lowest = (values: number[], previous?: number) =>
            Math.min(...values, ...(previous === undefined ? [] : [previous]));
        const highest = (values: number[], previous?: number) =>
            Math.max(...values, ...(previous === undefined ? [] : [previous]));

        return {
            ...state,
            readingCount: state.readingCount + readings.length,
            minTemperatureRecorded: lowest(temps, state.minTemperatureRecorded),
            maxTemperatureRecorded: highest(temps, state.maxTemperatureRecorded),
            minHumidityRecorded: lowest(humidities, state.minHumidityRecorded),
            maxHumidityRecorded: highest(humidities, state.maxHumidityRecorded),
        };
    }

    /**
     * Penalty per unit for a value that went outside [min, max].
     * A reading below the minimum takes precedence over one above the maximum.
     */
    private rangePenalty(min: number, max: number, lowest: number, highest: number, penaltyFactor: number): number {
        if (lowest < min) {
            return (min - lowest) * penaltyFactor;
        } else if (highest > max) {
            return (highest - max) * penaltyFactor;
        }
        return 0.0;
    }

    private async sensorReadingsReceived(
        data: ITemplateModel,
        request: ISensorReadingsReceived,
        state: IPerishableGoodsState
    ): Promise<PerishableGoodsResponse> {
        const readings = request.sensorReadings ?? [];
        if (readings.length === 0) {
            throw new Error("No sensor readings received");
        }

        const newState = this.recordReadings(state, readings);
        const late = this.isLate(data);

        const result: ISensorReadingsRecorded = {
            $class: `${NS}.SensorReadingsRecorded`,
            $timestamp: new Date(),
            readingCount: newState.readingCount,
            minTemperatureRecorded: newState.minTemperatureRecorded,
            maxTemperatureRecorded: newState.maxTemperatureRecorded,
            minHumidityRecorded: newState.minHumidityRecorded,
            maxHumidityRecorded: newState.maxHumidityRecorded,
            late,
        };

        const events: object[] = [];
        if (late) {
            const notification: ILateShipmentNotification = {
                $class: `${NS}.LateShipmentNotification`,
                $timestamp: new Date(),
                shipmentId: data.shipmentId,
                dueDate: new Date(data.dueDate),
                description: `Shipment ${data.shipmentId} from ${data.grower} to ${data.importer} is late`,
            };
            events.push(notification);
        }

        return { result, state: newState, events };
    }

    private async shipmentReceived(
        data: ITemplateModel,
        request: IShipmentReceived,
        state: IPerishableGoodsState
    ): Promise<PerishableGoodsResponse> {
        // Guard: unit count must be within the contract-specified bounds
        if (request.unitCount < data.minUnits || request.unitCount > data.maxUnits) {
            throw new Error("Units received out of range for the contract");
        }

        const currency = data.unitPrice.currencyCode;

        // Guard: shipment is late (past dueDate) - zero price, contract completed
        if (this.isLate(data)) {
            const lateResult: IPriceCalculation = {
                $class: `${NS}.PriceCalculation`,
                $timestamp: new Date(),
                totalPrice: 0.0,
                penalty: 0.0,
                currencyCode: currency,
                late: true,
            };
            const lateState: IPerishableGoodsState = {
                ...this.recordReadings(state, request.sensorReadings ?? []),
                status: COMPLETED,
                payoutMade: true,
            };
            return { result: lateResult, state: lateState, events: [] };
        }

        // Readings sent with the shipment are combined with those already in state
        const recorded = this.recordReadings(state, request.sensorReadings ?? []);
        if (recorded.readingCount === 0) {
            throw new Error("No temperature readings received");
        }

        const payOut = data.unitPrice.doubleValue * request.unitCount;

        const tempPenalty = this.rangePenalty(
            data.minTemperature,
            data.maxTemperature,
            recorded.minTemperatureRecorded as number,
            recorded.maxTemperatureRecorded as number,
            data.penaltyFactor
        );
        const humPenalty = this.rangePenalty(
            data.minHumidity,
            data.maxHumidity,
            recorded.minHumidityRecorded as number,
            recorded.maxHumidityRecorded as number,
            data.penaltyFactor
        );

        const totalPenalty = (tempPenalty + humPenalty) * request.unitCount;
        const totalPrice = Math.max(payOut - totalPenalty, 0.0);

        const event: IPerishableGoodsPaymentEvent = {
            $class: `${NS}.PerishableGoodsPaymentEvent`,
            $timestamp: new Date(),
            totalPrice,
            currencyCode: currency,
            description: `${data.importer} should pay shipment amount to ${data.grower}`,
        };

        const result: IPriceCalculation = {
            $class: `${NS}.PriceCalculation`,
            $timestamp: new Date(),
            totalPrice,
            penalty: totalPenalty,
            currencyCode: currency,
            late: false,
        };

        const newState: IPerishableGoodsState = {
            ...recorded,
            status: COMPLETED,
            payoutMade: true,
            totalPaid: state.totalPaid + totalPrice,
        };

        return { result, state: newState, events: [event] };
    }
}

export default PerishableGoodsLogic;
