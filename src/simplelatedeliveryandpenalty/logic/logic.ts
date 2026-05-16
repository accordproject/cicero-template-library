import { ITemplateModel, ISimpleLateDeliveryAndPenaltyRequest, ISimpleLateDeliveryAndPenaltyResponse, IPaymentObligationEvent } from './generated/org.accordproject.simplelatedeliveryandpenalty@0.1.0';
import { IDuration, TemporalUnit } from './generated/org.accordproject.time@0.3.0';

type SimpleLateDeliveryResponse = {
    result: ISimpleLateDeliveryAndPenaltyResponse;
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

// @ts-ignore TemplateLogic is injected by the runtime
class SimpleLateDeliveryAndPenaltyLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: ISimpleLateDeliveryAndPenaltyRequest): Promise<SimpleLateDeliveryResponse> {
        const now = new Date();
        const agreed = new Date(request.agreedDelivery);

        if (agreed >= now) {
            throw new Error('Cannot exercise late delivery before delivery date');
        }

        const diffMs = now.getTime() - agreed.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        const penaltyDurationDays = durationToDays(data.penaltyDuration);
        const diffRatio = diffDays / penaltyDurationDays;
        const penalty = diffRatio * (data.penaltyPercentage / 100.0) * request.goodsValue;
        const cap = (data.capPercentage / 100.0) * request.goodsValue;
        const capped = Math.min(penalty, cap);
        const maxDays = durationToDays(data.maximumDelay);
        const buyerMayTerminate = diffDays > maxDays;

        const event: IPaymentObligationEvent = {
            $class: 'org.accordproject.simplelatedeliveryandpenalty@0.1.0.PaymentObligationEvent',
            $timestamp: now,
            amount: capped,
            currencyCode: 'USD',
            description: `${data.seller} should pay penalty amount to ${data.buyer}`,
        };

        return {
            result: {
                $class: 'org.accordproject.simplelatedeliveryandpenalty@0.1.0.SimpleLateDeliveryAndPenaltyResponse',
                $timestamp: now,
                penalty: capped,
                buyerMayTerminate,
            },
            events: [event],
        };
    }
}

export default SimpleLateDeliveryAndPenaltyLogic;
