import { ITemplateModel, ILateRequest, ILateResponse } from './generated/io.clause.minilatedeliveryandpenaltycapped@0.1.0';
import { IDuration, TemporalUnit } from './generated/org.accordproject.time@0.3.0';

type MiniLateDeliveryCappedResponse = {
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
class MiniLateDeliveryAndPenaltyCappedLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: ILateRequest): Promise<MiniLateDeliveryCappedResponse> {
        const agreed = new Date(request.agreedDelivery);
        const delivery = new Date(request.deliveredAt);

        if (delivery <= agreed) {
            throw new Error('Cannot exercise late delivery before delivery date');
        }

        const delayMs = delivery.getTime() - agreed.getTime();
        const delayDays = delayMs / (1000 * 60 * 60 * 24);
        const penaltyDurationDays = durationToDays(data.penaltyDuration);
        const penalty = (delayDays / penaltyDurationDays) * (data.penaltyPercentage / 100.0) * request.goodsValue;
        const cap = (data.capPercentage / 100.0) * request.goodsValue;
        const cappedPenalty = Math.min(penalty, cap);
        const maxDays = durationToDays(data.maximumDelay);
        const buyerMayTerminate = delayDays > maxDays;

        return {
            result: {
                $class: 'io.clause.minilatedeliveryandpenaltycapped@0.1.0.LateResponse',
                $timestamp: new Date(),
                penalty: cappedPenalty,
                buyerMayTerminate,
            },
        };
    }
}

export default MiniLateDeliveryAndPenaltyCappedLogic;
