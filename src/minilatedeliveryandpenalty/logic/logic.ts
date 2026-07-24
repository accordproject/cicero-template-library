import type { ITemplateModel, ILateRequest, ILateResponse } from './generated/org.accordproject.minilatedeliveryandpenalty@0.2.0';
import type { IDuration } from './generated/org.accordproject.time@0.3.0';
import type { IMonetaryAmount, CurrencyCode } from './generated/org.accordproject.money@0.3.0';

type MiniLateDeliveryResponse = {
    result: ILateResponse;
};

type DurationUnit = IDuration['unit'];

const TemporalUnit = {
    seconds: 'seconds' as DurationUnit,
    minutes: 'minutes' as DurationUnit,
    hours: 'hours' as DurationUnit,
    days: 'days' as DurationUnit,
    weeks: 'weeks' as DurationUnit,
};

function durationToDays(duration: IDuration): number {
    switch (duration.unit) {
        case TemporalUnit.days: return duration.amount;
        case TemporalUnit.weeks: return duration.amount * 7;
        case TemporalUnit.hours: return duration.amount / 24;
        default: throw new Error(`Cannot convert ${duration.unit} to days`);
    }
}

function monetary(doubleValue: number, currencyCode: CurrencyCode): IMonetaryAmount {
    return {
        $class: 'org.accordproject.money@0.3.0.MonetaryAmount',
        doubleValue,
        currencyCode,
    };
}

// @ts-ignore TemplateLogic is injected by the runtime
class MiniLateDeliveryAndPenaltyLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: ILateRequest): Promise<MiniLateDeliveryResponse> {
        const agreed = new Date(request.agreedDelivery);
        const delivery = new Date(request.deliveredAt);

        if (delivery <= agreed) {
            throw new Error('Cannot exercise late delivery before delivery date');
        }

        const delayMs = delivery.getTime() - agreed.getTime();
        const delayDays = delayMs / (1000 * 60 * 60 * 24);
        const penaltyDurationDays = durationToDays(data.penaltyDuration);
        const penaltyValue = (delayDays / penaltyDurationDays) * (data.penaltyPercentage / 100.0) * request.goodsValue.doubleValue;
        const maxDays = durationToDays(data.maximumDelay);
        const buyerMayTerminate = delayDays >= maxDays;

        return {
            result: {
                $class: 'org.accordproject.minilatedeliveryandpenalty@0.2.0.LateResponse',
                $timestamp: new Date(),
                penalty: monetary(penaltyValue, request.goodsValue.currencyCode),
                buyerMayTerminate,
            },
        };
    }
}

export default MiniLateDeliveryAndPenaltyLogic;
