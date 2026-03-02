import {
    ITemplateModel,
    IDeliveryAcceptedRequest,
    IDeliveryAcceptedResponse,
    IPaymentObligationEvent,
} from './generated/org.accordproject.paymentupondelivery@0.1.0';

type PaymentUponDeliveryResponse = {
    result: IDeliveryAcceptedResponse;
    events: object[];
};

// @ts-ignore TemplateLogic is injected by the runtime
class PaymentUponDeliveryLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: IDeliveryAcceptedRequest): Promise<PaymentUponDeliveryResponse> {
        const now = new Date();
        const totalAmount = data.costOfGoods + data.deliveryFee;
        const event: IPaymentObligationEvent = {
            $class: 'org.accordproject.paymentupondelivery@0.1.0.PaymentObligationEvent',
            $timestamp: now,
            amount: totalAmount,
            currencyCode: data.currencyCode,
            description: `${data.buyer} should pay cost of goods and delivery fee to ${data.seller}`,
        };
        return {
            result: {
                $class: 'org.accordproject.paymentupondelivery@0.1.0.DeliveryAcceptedResponse',
                $timestamp: now,
                totalAmount,
                currencyCode: data.currencyCode,
            },
            events: [event],
        };
    }
}

export default PaymentUponDeliveryLogic;
