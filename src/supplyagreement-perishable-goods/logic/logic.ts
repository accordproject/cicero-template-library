import {
    ITemplateModel,
    IShipmentReceived,
    IPriceCalculation,
    ISensorReading,
    IPaymentObligationEvent,
} from './generated/io.clause.supplyagreementperishablegoods@0.1.0';

type PerishableGoodsResponse = {
    result: IPriceCalculation;
    events: object[];
};

/**
 * Calculate penalty factor from temperature readings.
 * Returns the absolute deviation beyond the allowed range multiplied by penaltyFactor.
 */
function calculateTempPenalty(
    minTemperature: number,
    maxTemperature: number,
    penaltyFactor: number,
    readings: ISensorReading[]
): number {
    const temps = readings.map(r => r.centigrade);
    const lowestReading = Math.min(...temps);
    const highestReading = Math.max(...temps);
    if (lowestReading < minTemperature) {
        return (minTemperature - lowestReading) * penaltyFactor;
    } else if (highestReading > maxTemperature) {
        return (highestReading - maxTemperature) * penaltyFactor;
    }
    return 0.0;
}

/**
 * Calculate penalty factor from humidity readings.
 */
function calculateHumPenalty(
    minHumidity: number,
    maxHumidity: number,
    penaltyFactor: number,
    readings: ISensorReading[]
): number {
    const humReadings = readings.map(r => r.humidity);
    const lowestReading = Math.min(...humReadings);
    const highestReading = Math.max(...humReadings);
    if (lowestReading < minHumidity) {
        return (minHumidity - lowestReading) * penaltyFactor;
    } else if (highestReading > maxHumidity) {
        return (highestReading - maxHumidity) * penaltyFactor;
    }
    return 0.0;
}

// @ts-ignore TemplateLogic is injected by the runtime
class SupplyAgreementPerishableGoodsLogic extends TemplateLogic<ITemplateModel> {

    async trigger(
        data: ITemplateModel,
        request: IShipmentReceived
    ): Promise<PerishableGoodsResponse> {
        const now = new Date();

        // Guard: unit count must be within contract bounds
        if (request.unitCount < data.minUnits || request.unitCount > data.maxUnits) {
            throw new Error('Units received out of range for the contract.');
        }

        // Guard: past the due date — return a zero price calculation
        if (now >= new Date(data.dueDate)) {
            const lateEvent: IPaymentObligationEvent = {
                $class: 'io.clause.supplyagreementperishablegoods@0.1.0.PaymentObligationEvent',
                $timestamp: now,
                grower: data.grower,
                importer: data.importer,
                totalPrice: 0.0,
                currencyCode: data.currencyCode,
                late: true,
            };
            return {
                result: {
                    $class: 'io.clause.supplyagreementperishablegoods@0.1.0.PriceCalculation',
                    $timestamp: now,
                    totalPrice: 0.0,
                    penalty: 0.0,
                    currencyCode: data.currencyCode,
                    late: true,
                },
                events: [lateEvent],
            };
        }

        // Guard: sensor readings must be present
        const readings = request.shipment.sensorReadings ?? [];
        if (readings.length === 0) {
            throw new Error('No temperature readings received.');
        }

        // Calculate payout
        const payOut = data.unitPrice * request.unitCount;

        // Calculate penalties
        const tempPenaltyPerUnit = calculateTempPenalty(
            data.minTemperature, data.maxTemperature, data.penaltyFactor, readings
        );
        const humPenaltyPerUnit = calculateHumPenalty(
            data.minHumidity, data.maxHumidity, data.penaltyFactor, readings
        );
        const penaltyPerUnit = tempPenaltyPerUnit + humPenaltyPerUnit;
        const totalPenalty = penaltyPerUnit * request.unitCount;
        const totalPrice = Math.max(payOut - totalPenalty, 0.0);

        const event: IPaymentObligationEvent = {
            $class: 'io.clause.supplyagreementperishablegoods@0.1.0.PaymentObligationEvent',
            $timestamp: now,
            grower: data.grower,
            importer: data.importer,
            totalPrice,
            currencyCode: data.currencyCode,
            late: false,
        };

        return {
            result: {
                $class: 'io.clause.supplyagreementperishablegoods@0.1.0.PriceCalculation',
                $timestamp: now,
                totalPrice,
                penalty: totalPenalty,
                currencyCode: data.currencyCode,
                late: false,
            },
            events: [event],
        };
    }
}

export default SupplyAgreementPerishableGoodsLogic;
