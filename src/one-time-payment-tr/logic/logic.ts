import {
    ITemplateModel,
    IOneTimePaymentState,
    IPaymentReceived,
    IPaymentReceivedResponse,
    IPaymentObligationEvent,
} from './generated/org.accordproject.onetimepaymenttr@0.1.0';

// @ts-expect-error EngineResponse is injected by the runtime
interface OneTimePaymentEngineResponse extends EngineResponse<IOneTimePaymentState> {
    result: IPaymentReceivedResponse;
    state: object;
    events: object[];
}

// @ts-ignore TemplateLogic is injected by the runtime
class OneTimePaymentLogic extends TemplateLogic<ITemplateModel, IOneTimePaymentState> {

    // @ts-expect-error InitResponse is injected by the runtime
    async init(data: ITemplateModel): Promise<InitResponse<IOneTimePaymentState>> {
        const now = new Date();
        const event: IPaymentObligationEvent = {
            $class: 'org.accordproject.onetimepaymenttr@0.1.0.PaymentObligationEvent',
            $timestamp: now,
            amount: data.totalPurchasePrice,
            currencyCode: data.currencyCode,
            description: `${data.buyer} should pay total purchase price to ${data.seller}`,
        };
        return {
            state: {
                $class: 'org.accordproject.onetimepaymenttr@0.1.0.OneTimePaymentState',
                $identifier: data.$identifier,
                status: 'INITIALIZED',
            },
            events: [event],
        };
    }

    async trigger(
        data: ITemplateModel,
        request: IPaymentReceived,
        state: IOneTimePaymentState
    ): Promise<OneTimePaymentEngineResponse> {
        const now = new Date();
        if (state.status !== 'INITIALIZED') {
            throw new Error('Payment has already been received.');
        }
        return {
            result: { $class: 'org.accordproject.onetimepaymenttr@0.1.0.PaymentReceivedResponse', $timestamp: now },
            state: { $class: 'org.accordproject.onetimepaymenttr@0.1.0.OneTimePaymentState', $identifier: state.$identifier, status: 'COMPLETED' },
            events: [],
        };
    }
}

export default OneTimePaymentLogic;
