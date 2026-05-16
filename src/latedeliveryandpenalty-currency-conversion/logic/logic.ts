import { ITemplateModel, ILateDeliveryAndPenaltyRequest, ILateDeliveryAndPenaltyResponse, IPaymentObligationEvent } from './generated/org.accordproject.latedeliveryandpenaltycurrencyconversion@0.2.0';
import { IDuration, TemporalUnit } from './generated/org.accordproject.time@0.3.0';
import { IMonetaryAmount } from './generated/org.accordproject.money@0.3.0';

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

function monetary(doubleValue: number, currencyCode: string): IMonetaryAmount {
    return {
        $class: 'org.accordproject.money@0.3.0.MonetaryAmount',
        doubleValue,
        currencyCode,
    };
}

// @ts-ignore TemplateLogic is injected by the runtime
class LateDeliveryAndPenaltyCurrencyConversionLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: ILateDeliveryAndPenaltyRequest): Promise<LateDeliveryAndPenaltyResult> {
        const now = new Date();
        const agreed = new Date(request.agreedDelivery);

        if (agreed >= now) {
            throw new Error('Cannot exercise late delivery before delivery date');
        }

        // Cross-currency by design: the contract is denominated in
        // data.fromCurrency but pays out in data.toCurrency, applying an
        // exchange rate when the two differ.
        if (request.goodsValue.currencyCode !== data.fromCurrency) {
            throw new Error(`Goods value must be in ${data.fromCurrency} but is in ${request.goodsValue.currencyCode}`);
        }

        if (data.forceMajeure && request.forceMajeure) {
            return {
                result: {
                    $class: 'org.accordproject.latedeliveryandpenaltycurrencyconversion@0.2.0.LateDeliveryAndPenaltyResponse',
                    $timestamp: now,
                    penalty: monetary(0, data.toCurrency),
                    buyerMayTerminate: true,
                },
                events: [],
            };
        }

        const diffMs = now.getTime() - agreed.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        const penaltyDurationDays = durationToDays(data.penaltyDuration);
        const diffRatio = diffDays / penaltyDurationDays;
        const goodsValue = request.goodsValue.doubleValue;
        const penalty = diffRatio * (data.penaltyPercentage / 100.0) * goodsValue;
        const cap = (data.capPercentage / 100.0) * goodsValue;
        let capped = Math.min(penalty, cap);

        if (data.fromCurrency !== data.toCurrency) {
            capped = capped * request.currencyConversion.rate;
        }

        const cappedAmount = monetary(capped, data.toCurrency);
        const terminationDays = durationToDays(data.termination);
        const buyerMayTerminate = diffDays > terminationDays;

        const event: IPaymentObligationEvent = {
            $class: 'org.accordproject.latedeliveryandpenaltycurrencyconversion@0.2.0.PaymentObligationEvent',
            $timestamp: now,
            amount: cappedAmount,
            description: `${data.seller} should pay penalty amount to ${data.buyer}`,
        };

        return {
            result: {
                $class: 'org.accordproject.latedeliveryandpenaltycurrencyconversion@0.2.0.LateDeliveryAndPenaltyResponse',
                $timestamp: now,
                penalty: cappedAmount,
                buyerMayTerminate,
            },
            events: [event],
        };
    }
}

export default LateDeliveryAndPenaltyCurrencyConversionLogic;
