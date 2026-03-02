import { ITemplateModel, ILateDeliveryAndPenaltyRequest, ILateDeliveryAndPenaltyResponse, IPaymentObligationEvent } from './generated/org.accordproject.latedeliveryandpenaltyelse@0.1.0';
import { IDuration, TemporalUnit } from './generated/org.accordproject.time@0.3.0';

type LateDeliveryAndPenaltyResult = {
    result: ILateDeliveryAndPenaltyResponse;
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
class LateDeliveryAndPenaltyElseLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: ILateDeliveryAndPenaltyRequest): Promise<LateDeliveryAndPenaltyResult> {
        const now = new Date();
        const agreed = new Date(request.agreedDelivery);

        if (agreed >= now) {
            throw new Error('Cannot exercise late delivery before delivery date');
        }

        if (data.forceMajeure && request.forceMajeure) {
            return {
                result: {
                    $class: 'org.accordproject.latedeliveryandpenaltyelse@0.1.0.LateDeliveryAndPenaltyResponse',
                    $timestamp: now,
                    penalty: 0,
                    buyerMayTerminate: true,
                },
                events: [],
            };
        }

        const diffMs = now.getTime() - agreed.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        const penaltyDurationDays = durationToDays(data.penaltyDuration);
        const diffRatio = diffDays / penaltyDurationDays;
        const penalty = diffRatio * (data.penaltyPercentage / 100.0) * request.goodsValue;
        const cap = (data.capPercentage / 100.0) * request.goodsValue;
        const capped = Math.min(penalty, cap);
        const terminationDays = durationToDays(data.termination);
        const buyerMayTerminate = diffDays > terminationDays;

        const event: IPaymentObligationEvent = {
            $class: 'org.accordproject.latedeliveryandpenaltyelse@0.1.0.PaymentObligationEvent',
            $timestamp: now,
            amount: capped,
            currencyCode: 'USD',
            description: `${data.seller} should pay penalty amount to ${data.buyer}`,
        };

        return {
            result: {
                $class: 'org.accordproject.latedeliveryandpenaltyelse@0.1.0.LateDeliveryAndPenaltyResponse',
                $timestamp: now,
                penalty: capped,
                buyerMayTerminate,
            },
            events: [event],
        };
    }
}

export default LateDeliveryAndPenaltyElseLogic;
