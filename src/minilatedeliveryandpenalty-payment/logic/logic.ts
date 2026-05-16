import { ITemplateModel, ILateRequest, ILateResponse, IPaymentObligationEvent } from './generated/org.accordproject.minilatedeliveryandpenaltypayment@0.2.0';
import { IDuration, TemporalUnit } from './generated/org.accordproject.time@0.3.0';
import { IMonetaryAmount } from './generated/org.accordproject.money@0.3.0';

type MiniLateDeliveryPaymentResponse = {
    result: ILateResponse;
    events: object[];
};

function durationToDays(duration: IDuration): number {
    switch (duration.unit) {
        case TemporalUnit.days: return duration.amount;
        case TemporalUnit.weeks: return duration.amount * 7;
        case TemporalUnit.hours: return duration.amount / 24;
        default: throw new Error(`Cannot convert ${duration.unit} to days`);
    }
}

function monetary(doubleValue: number, currencyCode: string): IMonetaryAmount {
    return {
        $class: 'org.accordproject.money@0.3.0.MonetaryAmount',
        doubleValue,
        currencyCode,
    };
}

// @ts-ignore TemplateLogic is injected by the runtime
class MiniLateDeliveryAndPenaltyPaymentLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: ILateRequest): Promise<MiniLateDeliveryPaymentResponse> {
        const agreed = new Date(request.agreedDelivery);
        const delivery = new Date(request.deliveredAt);
        const now = new Date();

        if (delivery <= agreed) {
            throw new Error('Cannot exercise late delivery before delivery date');
        }

        const delayMs = delivery.getTime() - agreed.getTime();
        const delayDays = delayMs / (1000 * 60 * 60 * 24);
        const penaltyDurationDays = durationToDays(data.penaltyDuration);
        const goodsValue = request.goodsValue.doubleValue;
        const penalty = (delayDays / penaltyDurationDays) * (data.penaltyPercentage / 100.0) * goodsValue;
        const cap = (data.capPercentage / 100.0) * goodsValue;
        const cappedPenalty = Math.min(penalty, cap);
        const cappedPenaltyAmount = monetary(cappedPenalty, request.goodsValue.currencyCode);
        const maxDays = durationToDays(data.maximumDelay);
        const buyerMayTerminate = delayDays >= maxDays;

        const event: IPaymentObligationEvent = {
            $class: 'org.accordproject.minilatedeliveryandpenaltypayment@0.2.0.PaymentObligationEvent',
            $timestamp: now,
            amount: cappedPenaltyAmount,
            description: `${data.seller} should pay penalty amount to ${data.buyer}`,
        };

        return {
            result: {
                $class: 'org.accordproject.minilatedeliveryandpenaltypayment@0.2.0.LateResponse',
                $timestamp: now,
                penalty: cappedPenaltyAmount,
                buyerMayTerminate,
            },
            events: [event],
        };
    }
}

export default MiniLateDeliveryAndPenaltyPaymentLogic;
