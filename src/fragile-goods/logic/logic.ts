import {
    IDeliveryUpdate,
    IPayOut,
    IFragileGoodsEvent,
    ITemplateModel,
} from "./generated/io.clause.fragilegoods@0.1.0";

// Inline types from org.accordproject.time@0.3.0 — generated files may not be available at runtime
enum TemporalUnit {
    seconds = "seconds",
    minutes = "minutes",
    hours = "hours",
    days = "days",
    weeks = "weeks",
}

interface IDuration {
    amount: number;
    unit: TemporalUnit;
}

type FragileGoodsResponse = {
    result: IPayOut;
    events: object[];
};

// @ts-ignore TemplateLogic is imported by the runtime
class FragileGoodsLogic extends TemplateLogic<ITemplateModel> {

    private durationToMs(d: IDuration): number {
        const MS: Record<string, number> = {
            seconds: 1000,
            minutes: 60000,
            hours: 3600000,
            days: 86400000,
            weeks: 604800000,
        };
        return d.amount * MS[d.unit];
    }

    async trigger(
        data: ITemplateModel,
        request: IDeliveryUpdate
    ): Promise<FragileGoodsResponse> {
        // Start with the delivery price
        let amount = data.deliveryPrice.doubleValue;
        const currency = data.deliveryPrice.currencyCode;

        // Count accelerometer violations (readings outside [min, max])
        const violations = request.accelerometerReadings.filter(
            (r) => r > data.accelerationMax || r < data.accelerationMin
        );
        const shockCount = violations.length;

        // Subtract breach penalty per violation
        amount = amount - shockCount * data.accelerationBreachPenalty.doubleValue;

        // If not ARRIVED or no finish time, return early with the adjusted amount
        if (request.status !== "ARRIVED" || !request.finishTime) {
            const result: IPayOut = {
                $class: "io.clause.fragilegoods@0.1.0.PayOut",
                $identifier: new Date().toISOString(),
                $timestamp: new Date(),
                paymentAmount: amount,
                currencyCode: currency,
            };
            return { result, events: [] };
        }

        // Calculate late delivery penalty
        const finishTime = new Date(request.finishTime);
        const startTime = new Date(request.startTime);
        const deliveryDurationMs = finishTime.getTime() - startTime.getTime();
        const limitDurationMs = this.durationToMs(data.deliveryLimitDuration as unknown as IDuration);

        if (deliveryDurationMs > limitDurationMs) {
            amount = amount - data.lateDeliveryPenalty.doubleValue;
        }

        const event: IFragileGoodsEvent = {
            $class: "io.clause.fragilegoods@0.1.0.FragileGoodsEvent",
            $timestamp: new Date(),
            paymentAmount: amount,
            currencyCode: currency,
        };

        const result: IPayOut = {
            $class: "io.clause.fragilegoods@0.1.0.PayOut",
            $identifier: new Date().toISOString(),
            $timestamp: new Date(),
            paymentAmount: amount,
            currencyCode: currency,
        };

        return { result, events: [event] };
    }
}

export default FragileGoodsLogic;
