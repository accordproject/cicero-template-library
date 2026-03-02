import {
    ITemplateModel,
    IFullPaymentUponDemandState,
    IPaymentDemand,
    IPaymentDemandResponse,
    IPaymentReceived,
    IPaymentReceivedResponse,
    IPaymentObligationEvent,
} from './generated/org.accordproject.fullpaymentupondemand@0.1.0';

// @ts-expect-error EngineResponse is injected by the runtime
interface FullPaymentUponDemandEngineResponse extends EngineResponse<IFullPaymentUponDemandState> {
    result: IPaymentDemandResponse | IPaymentReceivedResponse;
    state: object;
    events: object[];
}

// @ts-ignore TemplateLogic is injected by the runtime
class FullPaymentUponDemandLogic extends TemplateLogic<ITemplateModel, IFullPaymentUponDemandState> {

    // @ts-expect-error InitResponse is injected by the runtime
    async init(data: ITemplateModel): Promise<InitResponse<IFullPaymentUponDemandState>> {
        return {
            state: {
                $class: 'org.accordproject.fullpaymentupondemand@0.1.0.FullPaymentUponDemandState',
                $identifier: data.$identifier,
                status: 'INITIALIZED',
            }
        };
    }

    async trigger(
        data: ITemplateModel,
        request: IPaymentDemand | IPaymentReceived,
        state: IFullPaymentUponDemandState
    ): Promise<FullPaymentUponDemandEngineResponse> {
        const now = new Date();
        const requestClass = (request as any).$class;

        if (requestClass.endsWith('.PaymentDemand')) {
            if (state.status !== 'INITIALIZED') {
                throw new Error('Payment has already been demanded.');
            }
            const event: IPaymentObligationEvent = {
                $class: 'org.accordproject.fullpaymentupondemand@0.1.0.PaymentObligationEvent',
                $timestamp: now,
                amount: data.amount,
                currencyCode: data.currencyCode,
                description: `${data.buyer} should pay contract amount to ${data.seller}`,
            };
            return {
                result: { $class: 'org.accordproject.fullpaymentupondemand@0.1.0.PaymentDemandResponse', $timestamp: now },
                state: { $class: 'org.accordproject.fullpaymentupondemand@0.1.0.FullPaymentUponDemandState', $identifier: state.$identifier, status: 'OBLIGATION_EMITTED' },
                events: [event],
            };
        } else if (requestClass.endsWith('.PaymentReceived')) {
            if (state.status !== 'OBLIGATION_EMITTED') {
                throw new Error("Either a payment obligation hasn't yet been emitted by the contract or payment notification has already been received");
            }
            return {
                result: { $class: 'org.accordproject.fullpaymentupondemand@0.1.0.PaymentReceivedResponse', $timestamp: now },
                state: { $class: 'org.accordproject.fullpaymentupondemand@0.1.0.FullPaymentUponDemandState', $identifier: state.$identifier, status: 'COMPLETED' },
                events: [],
            };
        } else {
            throw new Error(`Unknown request type: ${requestClass}`);
        }
    }
}

export default FullPaymentUponDemandLogic;
