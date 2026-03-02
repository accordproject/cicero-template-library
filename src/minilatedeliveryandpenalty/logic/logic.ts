import { ITemplateModel, ILateRequest, ILateResponse } from './generated/org.accordproject.minilatedeliveryandpenalty@0.1.0';
import { IDuration, TemporalUnit } from './generated/org.accordproject.time@0.3.0';

type MiniLateDeliveryResponse = {
    result: ILateResponse;
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
        const penalty = (delayDays / penaltyDurationDays) * (data.penaltyPercentage / 100.0) * request.goodsValue;
        const maxDays = durationToDays(data.maximumDelay);
        const buyerMayTerminate = delayDays > maxDays;

        return {
            result: {
                $class: 'org.accordproject.minilatedeliveryandpenalty@0.1.0.LateResponse',
                $timestamp: new Date(),
                penalty,
                buyerMayTerminate,
            },
        };
    }
}

export default MiniLateDeliveryAndPenaltyLogic;
