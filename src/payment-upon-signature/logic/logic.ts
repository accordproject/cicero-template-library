import {
    ITemplateModel,
    IPaymentUponSignatureState,
    IContractSigned,
    IContractSignedResponse,
    IPaymentReceived,
    IPaymentReceivedResponse,
    IPaymentObligationEvent,
} from './generated/org.accordproject.paymentuponssignature@0.1.0';

// @ts-expect-error EngineResponse is injected by the runtime
interface PaymentUponSignatureEngineResponse extends EngineResponse<IPaymentUponSignatureState> {
    result: IContractSignedResponse | IPaymentReceivedResponse;
    state: object;
    events: object[];
}

// @ts-ignore TemplateLogic is injected by the runtime
class PaymentUponSignatureLogic extends TemplateLogic<ITemplateModel, IPaymentUponSignatureState> {

    // @ts-expect-error InitResponse is injected by the runtime
    async init(data: ITemplateModel): Promise<InitResponse<IPaymentUponSignatureState>> {
        return {
            state: {
                $class: 'org.accordproject.paymentuponssignature@0.1.0.PaymentUponSignatureState',
                $identifier: data.$identifier,
                status: 'INITIALIZED',
            }
        };
    }

    async trigger(
        data: ITemplateModel,
        request: IContractSigned | IPaymentReceived,
        state: IPaymentUponSignatureState
    ): Promise<PaymentUponSignatureEngineResponse> {
        const now = new Date();
        const requestClass = (request as any).$class;

        if (requestClass.endsWith('.ContractSigned')) {
            if (state.status !== 'INITIALIZED') {
                throw new Error('Contract has already been signed.');
            }
            const event: IPaymentObligationEvent = {
                $class: 'org.accordproject.paymentuponssignature@0.1.0.PaymentObligationEvent',
                $timestamp: now,
                amount: data.amount,
                currencyCode: data.currencyCode,
                description: `${data.buyer} should pay contract amount to ${data.seller}`,
            };
            return {
                result: { $class: 'org.accordproject.paymentuponssignature@0.1.0.ContractSignedResponse', $timestamp: now },
                state: { $class: 'org.accordproject.paymentuponssignature@0.1.0.PaymentUponSignatureState', $identifier: state.$identifier, status: 'OBLIGATION_EMITTED' },
                events: [event],
            };
        } else if (requestClass.endsWith('.PaymentReceived')) {
            if (state.status !== 'OBLIGATION_EMITTED') {
                throw new Error("Either a payment obligation hasn't yet been emitted or payment has already been received.");
            }
            return {
                result: { $class: 'org.accordproject.paymentuponssignature@0.1.0.PaymentReceivedResponse', $timestamp: now },
                state: { $class: 'org.accordproject.paymentuponssignature@0.1.0.PaymentUponSignatureState', $identifier: state.$identifier, status: 'COMPLETED' },
                events: [],
            };
        } else {
            throw new Error(`Unknown request type: ${requestClass}`);
        }
    }
}

export default PaymentUponSignatureLogic;
