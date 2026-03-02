import {
    IShipmentReceived,
    IPriceCalculation,
    IPerishableGoodsPaymentEvent,
    IPerishableGoodsState,
    ITemplateModel,
    ISensorReading,
} from "./generated/io.clause.perishablegoods@0.1.0";

// @ts-expect-error EngineResponse is imported by the runtime
interface PerishableGoodsResponse extends EngineResponse<IPerishableGoodsState> {
    result: IPriceCalculation;
    state: object;
    events: object[];
}

// @ts-ignore TemplateLogic is imported by the runtime
class PerishableGoodsLogic extends TemplateLogic<ITemplateModel, IPerishableGoodsState> {

    // @ts-expect-error InitResponse is imported by the runtime
    async init(data: ITemplateModel): Promise<InitResponse<IPerishableGoodsState>> {
        return {
            state: {
                $class: "io.clause.perishablegoods@0.1.0.PerishableGoodsState",
                $identifier: data.$identifier,
                payoutMade: false,
                totalPaid: 0.0,
            }
        };
    }

    /**
     * Calculate the temperature-based penalty from sensor readings.
     * If any reading falls below minTemperature, apply penalty based on the deviation.
     * If any reading exceeds maxTemperature, apply penalty based on the deviation.
     */
    private calculateTempPenalty(
        minTemp: number,
        maxTemp: number,
        penaltyFactor: number,
        readings: ISensorReading[]
    ): number {
        const temps = readings.map((r) => r.centigrade);
        const lowestReading = Math.min(...temps);
        const highestReading = Math.max(...temps);

        if (lowestReading < minTemp) {
            return (minTemp - lowestReading) * penaltyFactor;
        } else if (highestReading > maxTemp) {
            return (highestReading - maxTemp) * penaltyFactor;
        }
        return 0.0;
    }

    /**
     * Calculate the humidity-based penalty from sensor readings.
     */
    private calculateHumPenalty(
        minHumidity: number,
        maxHumidity: number,
        penaltyFactor: number,
        readings: ISensorReading[]
    ): number {
        const humidities = readings.map((r) => r.humidity);
        const lowestReading = Math.min(...humidities);
        const highestReading = Math.max(...humidities);

        if (lowestReading < minHumidity) {
            return (minHumidity - lowestReading) * penaltyFactor;
        } else if (highestReading > maxHumidity) {
            return (highestReading - maxHumidity) * penaltyFactor;
        }
        return 0.0;
    }

    async trigger(
        data: ITemplateModel,
        request: IShipmentReceived,
        state: IPerishableGoodsState
    ): Promise<PerishableGoodsResponse> {
        // Guard: unit count must be within the contract-specified bounds
        if (request.unitCount < data.minUnits || request.unitCount > data.maxUnits) {
            throw new Error("Units received out of range for the contract");
        }

        const currency = data.currencyCode;

        // Guard: check if shipment is late (past dueDate)
        const now = new Date();
        const dueDate = new Date(data.dueDate);

        if (now >= dueDate) {
            // Shipment is late — return zero price
            const lateResult: IPriceCalculation = {
                $class: "io.clause.perishablegoods@0.1.0.PriceCalculation",
                $identifier: new Date().toISOString(),
                $timestamp: new Date(),
                totalPrice: 0.0,
                penalty: 0.0,
                currencyCode: currency,
                late: true,
            };
            const newState: IPerishableGoodsState = {
                ...state,
                payoutMade: true,
                totalPaid: state.totalPaid,
            };
            return { result: lateResult, state: newState, events: [] };
        }

        // Guard: must have sensor readings
        const readings = request.sensorReadings ?? [];
        if (readings.length === 0) {
            throw new Error("No temperature readings received");
        }

        // Calculate base payout
        const payOut = data.unitPrice * request.unitCount;

        // Calculate penalties
        const tempPenalty = this.calculateTempPenalty(
            data.minTemperature,
            data.maxTemperature,
            data.penaltyFactor,
            readings
        );
        const humPenalty = this.calculateHumPenalty(
            data.minHumidity,
            data.maxHumidity,
            data.penaltyFactor,
            readings
        );

        const totalPenaltyPerUnit = tempPenalty + humPenalty;
        const totalPenalty = totalPenaltyPerUnit * request.unitCount;
        const totalPrice = Math.max(payOut - totalPenalty, 0.0);

        const event: IPerishableGoodsPaymentEvent = {
            $class: "io.clause.perishablegoods@0.1.0.PerishableGoodsPaymentEvent",
            $timestamp: new Date(),
            totalPrice,
            currencyCode: currency,
            description: `${data.importer} should pay shipment amount to ${data.grower}`,
        };

        const result: IPriceCalculation = {
            $class: "io.clause.perishablegoods@0.1.0.PriceCalculation",
            $identifier: new Date().toISOString(),
            $timestamp: new Date(),
            totalPrice,
            penalty: totalPenalty,
            currencyCode: currency,
            late: false,
        };

        const newState: IPerishableGoodsState = {
            $class: "io.clause.perishablegoods@0.1.0.PerishableGoodsState",
            $identifier: state.$identifier,
            payoutMade: true,
            totalPaid: state.totalPaid + totalPrice,
        };

        return { result, state: newState, events: [event] };
    }
}

export default PerishableGoodsLogic;
