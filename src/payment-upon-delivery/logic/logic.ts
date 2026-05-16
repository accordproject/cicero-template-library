import {
    ITemplateModel,
    IDeliveryAcceptedRequest,
    IDeliveryAcceptedResponse,
    IPaymentObligationEvent,
} from './generated/org.accordproject.paymentupondelivery@0.2.0';
import { IMonetaryAmount, CurrencyCode } from './generated/org.accordproject.money@0.3.0';

type PaymentUponDeliveryResponse = {
    result: IDeliveryAcceptedResponse;
    events: object[];
};

function monetary(doubleValue: number, currencyCode: CurrencyCode): IMonetaryAmount {
    return {
        $class: 'org.accordproject.money@0.3.0.MonetaryAmount',
        doubleValue,
        currencyCode,
    };
}

// @ts-ignore TemplateLogic is injected by the runtime
class PaymentUponDeliveryLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: IDeliveryAcceptedRequest): Promise<PaymentUponDeliveryResponse> {
        const now = new Date();
        const totalAmountValue = data.costOfGoods.doubleValue + data.deliveryFee.doubleValue;
        const event: IPaymentObligationEvent = {
            $class: 'org.accordproject.paymentupondelivery@0.2.0.PaymentObligationEvent',
            $timestamp: now,
            amount: monetary(totalAmountValue, data.costOfGoods.currencyCode),
            description: `${data.buyer} should pay cost of goods and delivery fee to ${data.seller}`,
        };
        return {
            result: {
                $class: 'org.accordproject.paymentupondelivery@0.2.0.DeliveryAcceptedResponse',
                $timestamp: now,
                totalAmount: monetary(totalAmountValue, data.costOfGoods.currencyCode),
            },
            events: [event],
        };
    }
}

export default PaymentUponDeliveryLogic;
